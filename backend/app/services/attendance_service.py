import json
import uuid
from datetime import date, datetime
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.attendance_record import AttendanceRecord
from app.models.base import BiometricType
from app.models.enrollment import Enrollment
from app.models.student_profile import StudentProfile
from app.repositories.attendance_repo import AttendanceRepository
from app.repositories.session_repo import SessionRepository
from app.repositories.student_repo import StudentRepository
from app.schemas.attendance import (
    AttendanceDateMatrix,
    AttendanceHistoryItem,
    AttendanceRecordRead,
)
from app.schemas.student import AttendanceSummary, SubjectAttendanceSummary
from app.services.presence_service import PresenceService
from app.services.redis_client import get_redis
from app.services.session_service import SessionService
from app.services.websocket_manager import ws_manager


class AttendanceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.attendance_repo = AttendanceRepository(db)
        self.session_repo = SessionRepository(db)
        self.session_service = SessionService(db)
        self.presence_service = PresenceService(db)
        self.student_repo = StudentRepository(db)

    async def mark_attendance(
        self,
        student_id: uuid.UUID,
        session_id: uuid.UUID,
        biometric_verified: bool = False,
        biometric_type: BiometricType | None = None,
        device_id: str | None = None,
        ip_address: str | None = None,
        notes: str | None = None,
    ) -> AttendanceRecord:
        """Perform server-side verified attendance check-in."""
        # 1. Validate session is active
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found",
            )

        is_active = await self.session_service.is_session_active(session_id, session)
        if not is_active:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Attendance session is closed or expired",
            )

        # 2. Validate student enrollment in this subject and section
        enroll_stmt = select(Enrollment).where(
            Enrollment.student_id == student_id,
            Enrollment.subject_id == session.subject_id,
            Enrollment.section_id == session.section_id,
            Enrollment.is_active == True,
        )
        enroll_res = await self.db.execute(enroll_stmt)
        enrollment = enroll_res.scalar_one_or_none()
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Student is not enrolled in this subject and section",
            )

        # 3. Prevent duplicate attendance marking
        already_marked = await self.attendance_repo.check_duplicate(session_id, student_id)
        if already_marked:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Attendance has already been recorded for this session",
            )

        # 4. Validate continuous physical presence window (15 minutes required)
        is_presence_eligible = await self.presence_service.is_eligible_for_session(
            student_id, session_id
        )
        if not is_presence_eligible:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Continuous presence requirement not met. "
                    f"Must maintain BLE presence for at least {settings.PRESENCE_WINDOW_REQUIRED_SECONDS // 60} minutes."
                ),
            )

        # 5. Record verified attendance in database
        record = await self.attendance_repo.mark_attendance(
            session_id=session_id,
            student_id=student_id,
            biometric_verified=biometric_verified,
            biometric_type=biometric_type,
            device_id=device_id,
            ip_address=ip_address,
            notes=notes,
        )

        # Fetch student details for real-time WebSocket broadcast
        prof_stmt = (
            select(StudentProfile)
            .where(StudentProfile.id == student_id)
            .options(selectinload(StudentProfile.user))
        )
        prof_res = await self.db.execute(prof_stmt)
        student_prof = prof_res.scalar_one_or_none()

        # 6. Publish real-time WebSocket update to connected teachers / dashboards
        event_data = {
            "type": "attendance_marked",
            "session_id": str(session_id),
            "record_id": str(record.id),
            "student_id": str(student_id),
            "roll_number": student_prof.roll_number if student_prof else "",
            "full_name": student_prof.user.full_name if (student_prof and student_prof.user) else "",
            "marked_at": record.marked_at.isoformat(),
            "reference_id": str(record.reference_id),
            "total_present": session.total_present,
            "total_enrolled": session.total_enrolled,
        }
        await ws_manager.broadcast(session_id, event_data)

        # Also publish to Redis pub/sub channel for horizontal scaling
        try:
            redis = await get_redis()
            await redis.publish(f"ws_session:{session_id}", json.dumps(event_data))
        except Exception:
            pass

        return record

    async def get_student_history(
        self,
        student_id: uuid.UUID,
        subject_id: uuid.UUID | None = None,
        start_date: datetime | date | None = None,
        end_date: datetime | date | None = None,
    ) -> list[AttendanceHistoryItem]:
        """Retrieve student's attendance history."""
        records = await self.attendance_repo.get_history(
            student_id=student_id,
            subject_id=subject_id,
            start_date=start_date,
            end_date=end_date,
        )
        return [AttendanceHistoryItem(**r) for r in records]

    async def get_date_matrix(
        self,
        student_id: uuid.UUID,
        subject_id: uuid.UUID,
        month: int,
        year: int,
    ) -> AttendanceDateMatrix:
        """Fetch monthly attendance date matrix."""
        matrix = await self.attendance_repo.get_date_matrix(
            student_id=student_id,
            subject_id=subject_id,
            month=month,
            year=year,
        )
        return AttendanceDateMatrix(**matrix)

    async def get_attendance_summary(self, student_id: uuid.UUID) -> AttendanceSummary:
        """Fetch comprehensive aggregated attendance summary."""
        raw = await self.student_repo.get_attendance_summary(student_id)
        subjects = [SubjectAttendanceSummary(**s) for s in raw["subjects"]]
        return AttendanceSummary(
            total_classes=raw["total_classes"],
            attended_classes=raw["attended_classes"],
            overall_percentage=raw["overall_percentage"],
            subjects=subjects,
        )

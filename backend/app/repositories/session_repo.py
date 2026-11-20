import uuid
from datetime import datetime
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attendance_record import AttendanceRecord
from app.models.attendance_session import AttendanceSession
from app.models.base import AttendanceStatus, ProximityMode, SessionStatus
from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.section import Section
from app.models.student_profile import StudentProfile
from app.models.subject import Subject
from app.models.user import User
from app.repositories.base import BaseRepository
from app.utils.datetime_utils import utcnow


class SessionRepository(BaseRepository[AttendanceSession]):
    def __init__(self, db: AsyncSession):
        super().__init__(AttendanceSession, db)

    async def get_with_details(self, session_id: uuid.UUID) -> AttendanceSession | None:
        """Fetch session with teacher, subject, section, and classroom loaded."""
        stmt = (
            select(AttendanceSession)
            .where(AttendanceSession.id == session_id)
            .options(
                selectinload(AttendanceSession.teacher),
                selectinload(AttendanceSession.subject),
                selectinload(AttendanceSession.section),
                selectinload(AttendanceSession.classroom),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_session(
        self,
        teacher_id: uuid.UUID,
        subject_id: uuid.UUID,
        section_id: uuid.UUID,
        classroom_id: uuid.UUID,
        proximity_mode: ProximityMode,
        session_challenge: str,
        duration_seconds: int = 120,
    ) -> AttendanceSession:
        """Create and start a new attendance session."""
        now = utcnow()
        from datetime import timedelta
        expires_at = now + timedelta(seconds=duration_seconds)

        # Count total active enrolled students for subject and section
        enrolled_stmt = select(func.count(Enrollment.id)).where(
            Enrollment.subject_id == subject_id,
            Enrollment.section_id == section_id,
            Enrollment.is_active == True,
        )
        enrolled_res = await self.db.execute(enrolled_stmt)
        total_enrolled = enrolled_res.scalar_one() or 0

        session = AttendanceSession(
            teacher_id=teacher_id,
            subject_id=subject_id,
            section_id=section_id,
            classroom_id=classroom_id,
            status=SessionStatus.ACTIVE,
            proximity_mode=proximity_mode,
            session_challenge=session_challenge,
            started_at=now,
            expires_at=expires_at,
            total_enrolled=total_enrolled,
            total_present=0,
            total_absent=total_enrolled,
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_active_session(self, session_id: uuid.UUID) -> AttendanceSession | None:
        """Fetch session if currently active and unexpired."""
        session = await self.get_by_id(session_id)
        if not session:
            return None
        now = utcnow()
        if session.status == SessionStatus.ACTIVE and session.expires_at <= now:
            await self.expire_session(session_id)
            session.status = SessionStatus.EXPIRED
        return session

    async def expire_session(self, session_id: uuid.UUID) -> AttendanceSession | None:
        """Mark session expired and record ended_at."""
        session = await self.get_by_id(session_id)
        if session and session.status == SessionStatus.ACTIVE:
            session.status = SessionStatus.EXPIRED
            session.ended_at = utcnow()
            # calculate absent count = total_enrolled - total_present
            session.total_absent = max(0, session.total_enrolled - session.total_present)
            self.db.add(session)
            await self.db.commit()
            await self.db.refresh(session)
        return session

    async def get_live_status(self, session_id: uuid.UUID) -> dict | None:
        """Fetch live attendance metrics and recent attendees."""
        session = await self.get_by_id(session_id)
        if not session:
            return None

        now = utcnow()
        if session.status == SessionStatus.ACTIVE and session.expires_at <= now:
            await self.expire_session(session_id)
            session.status = SessionStatus.EXPIRED

        remaining_sec = max(0, int((session.expires_at - now).total_seconds())) if session.status == SessionStatus.ACTIVE else 0

        # Fetch recent attendees
        recent_stmt = (
            select(AttendanceRecord)
            .where(
                AttendanceRecord.session_id == session_id,
                AttendanceRecord.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.LATE]),
            )
            .options(
                selectinload(AttendanceRecord.student).selectinload(StudentProfile.user)
            )
            .order_by(AttendanceRecord.marked_at.desc())
            .limit(20)
        )
        recent_res = await self.db.execute(recent_stmt)
        records = recent_res.scalars().all()

        recent_attendees = [
            {
                "student_id": rec.student_id,
                "roll_number": rec.student.roll_number,
                "full_name": rec.student.user.full_name,
                "marked_at": rec.marked_at,
                "reference_id": rec.reference_id,
            }
            for rec in records
        ]

        rate = round((session.total_present / session.total_enrolled * 100.0), 2) if session.total_enrolled > 0 else 0.0

        return {
            "session_id": session.id,
            "status": session.status,
            "proximity_mode": session.proximity_mode,
            "started_at": session.started_at,
            "expires_at": session.expires_at,
            "remaining_seconds": remaining_sec,
            "total_enrolled": session.total_enrolled,
            "total_present": session.total_present,
            "total_absent": max(0, session.total_enrolled - session.total_present),
            "attendance_rate": rate,
            "recent_attendees": recent_attendees,
        }

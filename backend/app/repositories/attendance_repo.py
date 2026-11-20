import calendar
import uuid
from datetime import date, datetime, timezone
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attendance_record import AttendanceRecord
from app.models.attendance_session import AttendanceSession
from app.models.base import AttendanceStatus, BiometricType
from app.models.student_profile import StudentProfile
from app.models.subject import Subject
from app.models.teacher_profile import TeacherProfile
from app.models.user import User
from app.repositories.base import BaseRepository
from app.utils.datetime_utils import utcnow


class AttendanceRepository(BaseRepository[AttendanceRecord]):
    def __init__(self, db: AsyncSession):
        super().__init__(AttendanceRecord, db)

    async def check_duplicate(self, session_id: uuid.UUID, student_id: uuid.UUID) -> bool:
        """Check if an attendance record already exists for this session and student."""
        stmt = (
            select(func.count(AttendanceRecord.id))
            .where(
                AttendanceRecord.session_id == session_id,
                AttendanceRecord.student_id == student_id,
            )
        )
        res = await self.db.execute(stmt)
        return (res.scalar_one() or 0) > 0

    async def mark_attendance(
        self,
        session_id: uuid.UUID,
        student_id: uuid.UUID,
        biometric_verified: bool = False,
        biometric_type: BiometricType | None = None,
        device_id: str | None = None,
        ip_address: str | None = None,
        notes: str | None = None,
    ) -> AttendanceRecord:
        """Create attendance record and increment session present count."""
        now = utcnow()
        record = AttendanceRecord(
            session_id=session_id,
            student_id=student_id,
            status=AttendanceStatus.PRESENT,
            marked_at=now,
            biometric_verified=biometric_verified,
            biometric_type=biometric_type,
            device_id=device_id,
            ip_address=ip_address,
            reference_id=uuid.uuid4(),
            notes=notes,
        )
        self.db.add(record)

        # Update session totals
        sess_stmt = select(AttendanceSession).where(AttendanceSession.id == session_id)
        sess_res = await self.db.execute(sess_stmt)
        session = sess_res.scalar_one_or_none()
        if session:
            session.total_present += 1
            session.total_absent = max(0, session.total_enrolled - session.total_present)
            self.db.add(session)

        await self.db.commit()
        await self.db.refresh(record)
        return record

    async def get_history(
        self,
        student_id: uuid.UUID,
        subject_id: uuid.UUID | None = None,
        start_date: datetime | date | None = None,
        end_date: datetime | date | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[dict]:
        """Fetch chronological attendance records for student with subject and teacher info."""
        stmt = (
            select(AttendanceRecord, AttendanceSession, Subject, User.full_name)
            .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
            .join(Subject, AttendanceSession.subject_id == Subject.id)
            .join(TeacherProfile, AttendanceSession.teacher_id == TeacherProfile.id)
            .join(User, TeacherProfile.user_id == User.id)
            .where(AttendanceRecord.student_id == student_id)
        )

        if subject_id:
            stmt = stmt.where(AttendanceSession.subject_id == subject_id)
        if start_date:
            stmt = stmt.where(AttendanceRecord.marked_at >= start_date)
        if end_date:
            stmt = stmt.where(AttendanceRecord.marked_at <= end_date)

        stmt = stmt.order_by(AttendanceRecord.marked_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)

        items = []
        for rec, session, subject, teacher_name in result.all():
            items.append({
                "record_id": rec.id,
                "session_id": session.id,
                "subject_id": subject.id,
                "subject_name": subject.name,
                "subject_code": subject.code,
                "teacher_name": teacher_name,
                "status": rec.status,
                "marked_at": rec.marked_at,
                "biometric_verified": rec.biometric_verified,
                "reference_id": rec.reference_id,
            })
        return items

    async def get_date_matrix(
        self,
        student_id: uuid.UUID,
        subject_id: uuid.UUID,
        month: int,
        year: int,
    ) -> dict:
        """Generate monthly attendance matrix (date -> status) for a student and subject."""
        # Query all records for this student and subject in the given month and year
        stmt = (
            select(AttendanceRecord)
            .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
            .where(
                AttendanceRecord.student_id == student_id,
                AttendanceSession.subject_id == subject_id,
                extract("month", AttendanceRecord.marked_at) == month,
                extract("year", AttendanceRecord.marked_at) == year,
            )
        )
        res = await self.db.execute(stmt)
        records = res.scalars().all()

        date_map: dict[str, str] = {}
        present_count = 0
        for rec in records:
            d_str = rec.marked_at.strftime("%Y-%m-%d")
            status_val = rec.status.value if hasattr(rec.status, "value") else str(rec.status)
            date_map[d_str] = status_val
            if status_val in ("present", "late"):
                present_count += 1

        total_sessions = len(records)
        absent_count = total_sessions - present_count
        pct = round((present_count / total_sessions * 100.0), 2) if total_sessions > 0 else 0.0

        return {
            "student_id": student_id,
            "subject_id": subject_id,
            "month": month,
            "year": year,
            "dates": date_map,
            "total_sessions": total_sessions,
            "present_count": present_count,
            "absent_count": absent_count,
            "attendance_percentage": pct,
        }

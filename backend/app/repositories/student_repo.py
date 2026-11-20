import datetime
import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attendance_record import AttendanceRecord
from app.models.attendance_session import AttendanceSession
from app.models.base import AttendanceStatus, SessionStatus
from app.models.enrollment import Enrollment
from app.models.student_profile import StudentProfile
from app.models.subject import Subject
from app.models.teacher_subject import TeacherSubjectAssignment
from app.models.timetable import TimetableSlot
from app.repositories.base import BaseRepository
from app.utils.datetime_utils import utcnow


class StudentRepository(BaseRepository[StudentProfile]):
    def __init__(self, db: AsyncSession):
        super().__init__(StudentProfile, db)

    async def get_by_user_id(self, user_id: uuid.UUID) -> StudentProfile | None:
        """Fetch student profile by associated user ID."""
        stmt = (
            select(StudentProfile)
            .where(StudentProfile.user_id == user_id)
            .options(
                selectinload(StudentProfile.user),
                selectinload(StudentProfile.department),
                selectinload(StudentProfile.college),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_attendance_summary(self, student_id: uuid.UUID) -> dict:
        """Compute aggregated attendance metrics per enrolled subject and overall."""
        # 1. Fetch all subjects student is enrolled in
        enrolled_stmt = (
            select(Subject)
            .join(Enrollment, Enrollment.subject_id == Subject.id)
            .where(Enrollment.student_id == student_id, Enrollment.is_active == True)
        )
        enrolled_res = await self.db.execute(enrolled_stmt)
        subjects = enrolled_res.scalars().all()

        total_classes_all = 0
        attended_classes_all = 0
        subject_metrics = []

        for sub in subjects:
            # Count records for this subject
            total_stmt = (
                select(func.count(AttendanceRecord.id))
                .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
                .where(
                    AttendanceRecord.student_id == student_id,
                    AttendanceSession.subject_id == sub.id,
                )
            )
            total_res = await self.db.execute(total_stmt)
            sub_total = total_res.scalar_one() or 0

            present_stmt = (
                select(func.count(AttendanceRecord.id))
                .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
                .where(
                    AttendanceRecord.student_id == student_id,
                    AttendanceSession.subject_id == sub.id,
                    AttendanceRecord.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.LATE]),
                )
            )
            present_res = await self.db.execute(present_stmt)
            sub_present = present_res.scalar_one() or 0

            sub_pct = round((sub_present / sub_total * 100.0), 2) if sub_total > 0 else 0.0

            total_classes_all += sub_total
            attended_classes_all += sub_present

            subject_metrics.append({
                "subject_id": sub.id,
                "subject_name": sub.name,
                "subject_code": sub.code,
                "total_classes": sub_total,
                "attended_classes": sub_present,
                "percentage": sub_pct,
            })

        overall_pct = (
            round((attended_classes_all / total_classes_all * 100.0), 2)
            if total_classes_all > 0
            else 0.0
        )

        return {
            "total_classes": total_classes_all,
            "attended_classes": attended_classes_all,
            "overall_percentage": overall_pct,
            "subjects": subject_metrics,
        }

    async def get_dashboard_data(self, student_id: uuid.UUID) -> dict:
        """Fetch dashboard summary for student."""
        profile_stmt = (
            select(StudentProfile)
            .where(StudentProfile.id == student_id)
            .options(selectinload(StudentProfile.user))
        )
        prof_res = await self.db.execute(profile_stmt)
        profile = prof_res.scalar_one_or_none()
        if not profile:
            raise ValueError("Student profile not found")

        summary = await self.get_attendance_summary(student_id)

        # Count today's scheduled classes
        today_dow = utcnow().weekday()
        today_sched_stmt = (
            select(func.count(TimetableSlot.id))
            .join(TeacherSubjectAssignment, TimetableSlot.teacher_subject_id == TeacherSubjectAssignment.id)
            .join(
                Enrollment,
                (Enrollment.subject_id == TeacherSubjectAssignment.subject_id)
                & (Enrollment.section_id == TeacherSubjectAssignment.section_id),
            )
            .where(
                Enrollment.student_id == student_id,
                Enrollment.is_active == True,
                TimetableSlot.day_of_week == today_dow,
            )
        )
        today_res = await self.db.execute(today_sched_stmt)
        today_count = today_res.scalar_one() or 0

        # Check for active session available for student
        active_sess_stmt = (
            select(AttendanceSession.id)
            .join(
                Enrollment,
                (Enrollment.subject_id == AttendanceSession.subject_id)
                & (Enrollment.section_id == AttendanceSession.section_id),
            )
            .where(
                Enrollment.student_id == student_id,
                AttendanceSession.status == SessionStatus.ACTIVE,
                AttendanceSession.expires_at > utcnow(),
            )
            .limit(1)
        )
        active_sess_res = await self.db.execute(active_sess_stmt)
        active_session_id = active_sess_res.scalar_one_or_none()

        return {
            "student_id": profile.id,
            "roll_number": profile.roll_number,
            "full_name": profile.user.full_name,
            "semester": profile.semester,
            "section_name": profile.section_name,
            "overall_attendance_percentage": summary["overall_percentage"],
            "total_classes": summary["total_classes"],
            "attended_classes": summary["attended_classes"],
            "today_schedule_count": today_count,
            "active_session_available": active_session_id is not None,
            "active_session_id": active_session_id,
        }

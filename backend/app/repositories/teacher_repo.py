import uuid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attendance_session import AttendanceSession
from app.models.base import SessionStatus
from app.models.classroom import Classroom
from app.models.section import Section
from app.models.subject import Subject
from app.models.teacher_profile import TeacherProfile
from app.models.teacher_subject import TeacherSubjectAssignment
from app.models.timetable import TimetableSlot
from app.repositories.base import BaseRepository
from app.utils.datetime_utils import utcnow


class TeacherRepository(BaseRepository[TeacherProfile]):
    def __init__(self, db: AsyncSession):
        super().__init__(TeacherProfile, db)

    async def get_by_user_id(self, user_id: uuid.UUID) -> TeacherProfile | None:
        """Fetch teacher profile with user, department, and college."""
        stmt = (
            select(TeacherProfile)
            .where(TeacherProfile.user_id == user_id)
            .options(
                selectinload(TeacherProfile.user),
                selectinload(TeacherProfile.department),
                selectinload(TeacherProfile.college),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_assigned_subjects(self, teacher_id: uuid.UUID) -> list[TeacherSubjectAssignment]:
        """Fetch all active subject assignments for the teacher."""
        stmt = (
            select(TeacherSubjectAssignment)
            .where(
                TeacherSubjectAssignment.teacher_id == teacher_id,
                TeacherSubjectAssignment.is_active == True,
            )
            .options(
                selectinload(TeacherSubjectAssignment.subject),
                selectinload(TeacherSubjectAssignment.section),
                selectinload(TeacherSubjectAssignment.classroom),
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_dashboard_data(self, teacher_id: uuid.UUID) -> dict:
        """Fetch teacher dashboard metrics."""
        profile_stmt = (
            select(TeacherProfile)
            .where(TeacherProfile.id == teacher_id)
            .options(selectinload(TeacherProfile.user))
        )
        prof_res = await self.db.execute(profile_stmt)
        profile = prof_res.scalar_one_or_none()
        if not profile:
            raise ValueError("Teacher profile not found")

        # Assigned subjects count
        sub_count_stmt = select(func.count(TeacherSubjectAssignment.id)).where(
            TeacherSubjectAssignment.teacher_id == teacher_id,
            TeacherSubjectAssignment.is_active == True,
        )
        sub_count_res = await self.db.execute(sub_count_stmt)
        assigned_count = sub_count_res.scalar_one() or 0

        # Today's schedule count
        today_dow = utcnow().weekday()
        sched_stmt = (
            select(func.count(TimetableSlot.id))
            .join(TeacherSubjectAssignment, TimetableSlot.teacher_subject_id == TeacherSubjectAssignment.id)
            .where(
                TeacherSubjectAssignment.teacher_id == teacher_id,
                TimetableSlot.day_of_week == today_dow,
            )
        )
        sched_res = await self.db.execute(sched_stmt)
        today_sched_count = sched_res.scalar_one() or 0

        # Check for active session initiated by teacher
        active_sess_stmt = (
            select(AttendanceSession.id)
            .where(
                AttendanceSession.teacher_id == teacher_id,
                AttendanceSession.status == SessionStatus.ACTIVE,
                AttendanceSession.expires_at > utcnow(),
            )
            .order_by(AttendanceSession.created_at.desc())
            .limit(1)
        )
        active_res = await self.db.execute(active_sess_stmt)
        active_session_id = active_res.scalar_one_or_none()

        return {
            "teacher_id": profile.id,
            "employee_id": profile.employee_id,
            "full_name": profile.user.full_name,
            "designation": profile.designation,
            "is_hod": profile.is_hod,
            "assigned_subjects_count": assigned_count,
            "today_schedule_count": today_sched_count,
            "active_session_id": active_session_id,
        }

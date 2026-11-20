import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.classroom import Classroom
from app.models.enrollment import Enrollment
from app.models.section import Section
from app.models.student_profile import StudentProfile
from app.models.subject import Subject
from app.models.teacher_profile import TeacherProfile
from app.models.teacher_subject import TeacherSubjectAssignment
from app.models.timetable import TimetableSlot
from app.models.user import User
from app.repositories.base import BaseRepository
from app.utils.datetime_utils import utcnow


class TimetableRepository(BaseRepository[TimetableSlot]):
    def __init__(self, db: AsyncSession):
        super().__init__(TimetableSlot, db)

    async def get_by_teacher(self, teacher_id: uuid.UUID) -> list[TimetableSlot]:
        """Fetch all timetable slots for a teacher."""
        stmt = (
            select(TimetableSlot)
            .join(TeacherSubjectAssignment, TimetableSlot.teacher_subject_id == TeacherSubjectAssignment.id)
            .where(
                TeacherSubjectAssignment.teacher_id == teacher_id,
                TeacherSubjectAssignment.is_active == True,
            )
            .options(
                selectinload(TimetableSlot.teacher_subject).selectinload(TeacherSubjectAssignment.subject),
                selectinload(TimetableSlot.teacher_subject).selectinload(TeacherSubjectAssignment.section),
                selectinload(TimetableSlot.teacher_subject).selectinload(TeacherSubjectAssignment.classroom),
            )
            .order_by(TimetableSlot.day_of_week, TimetableSlot.start_time)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_today_schedule_for_teacher(
        self,
        teacher_id: uuid.UUID,
        day_of_week: int | None = None,
    ) -> list[dict]:
        """Fetch today's schedule for teacher."""
        if day_of_week is None:
            day_of_week = utcnow().weekday()

        stmt = (
            select(
                TimetableSlot,
                Subject,
                Section,
                Classroom,
            )
            .join(TeacherSubjectAssignment, TimetableSlot.teacher_subject_id == TeacherSubjectAssignment.id)
            .join(Subject, TeacherSubjectAssignment.subject_id == Subject.id)
            .join(Section, TeacherSubjectAssignment.section_id == Section.id)
            .outerjoin(Classroom, TeacherSubjectAssignment.classroom_id == Classroom.id)
            .where(
                TeacherSubjectAssignment.teacher_id == teacher_id,
                TeacherSubjectAssignment.is_active == True,
                TimetableSlot.day_of_week == day_of_week,
            )
            .order_by(TimetableSlot.start_time)
        )
        result = await self.db.execute(stmt)

        schedule = []
        for slot, subj, sec, cls in result.all():
            schedule.append({
                "slot_id": slot.id,
                "subject_id": subj.id,
                "subject_name": subj.name,
                "subject_code": subj.code,
                "section_name": sec.name,
                "classroom_name": cls.name if cls else None,
                "classroom_id": cls.id if cls else None,
                "teacher_name": None,
                "start_time": slot.start_time.strftime("%H:%M"),
                "end_time": slot.end_time.strftime("%H:%M"),
                "day_of_week": slot.day_of_week,
            })
        return schedule

    async def get_today_schedule_for_student(
        self,
        student_id: uuid.UUID,
        day_of_week: int | None = None,
    ) -> list[dict]:
        """Fetch today's schedule for student based on active enrollments."""
        if day_of_week is None:
            day_of_week = utcnow().weekday()

        stmt = (
            select(
                TimetableSlot,
                Subject,
                Section,
                Classroom,
                User.full_name,
            )
            .join(TeacherSubjectAssignment, TimetableSlot.teacher_subject_id == TeacherSubjectAssignment.id)
            .join(Subject, TeacherSubjectAssignment.subject_id == Subject.id)
            .join(Section, TeacherSubjectAssignment.section_id == Section.id)
            .outerjoin(Classroom, TeacherSubjectAssignment.classroom_id == Classroom.id)
            .join(TeacherProfile, TeacherSubjectAssignment.teacher_id == TeacherProfile.id)
            .join(User, TeacherProfile.user_id == User.id)
            .join(
                Enrollment,
                (Enrollment.subject_id == Subject.id) & (Enrollment.section_id == Section.id),
            )
            .where(
                Enrollment.student_id == student_id,
                Enrollment.is_active == True,
                TimetableSlot.day_of_week == day_of_week,
            )
            .order_by(TimetableSlot.start_time)
        )
        result = await self.db.execute(stmt)

        schedule = []
        for slot, subj, sec, cls, teacher_name in result.all():
            schedule.append({
                "slot_id": slot.id,
                "subject_id": subj.id,
                "subject_name": subj.name,
                "subject_code": subj.code,
                "section_name": sec.name,
                "classroom_name": cls.name if cls else None,
                "classroom_id": cls.id if cls else None,
                "teacher_name": teacher_name,
                "start_time": slot.start_time.strftime("%H:%M"),
                "end_time": slot.end_time.strftime("%H:%M"),
                "day_of_week": slot.day_of_week,
            })
        return schedule

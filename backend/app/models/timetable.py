from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedBase

if TYPE_CHECKING:
    from app.models.teacher_subject import TeacherSubjectAssignment


class TimetableSlot(TimestampedBase):
    __tablename__ = "timetable_slots"

    teacher_subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teacher_subject_assignments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Mon ... 6=Sun
    start_time: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    end_time: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    academic_year: Mapped[str] = mapped_column(String(32), nullable=False)

    # Relationships
    teacher_subject: Mapped[TeacherSubjectAssignment] = relationship(
        "TeacherSubjectAssignment",
        back_populates="timetable_slots",
    )

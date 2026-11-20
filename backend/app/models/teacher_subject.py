from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedBase

if TYPE_CHECKING:
    from app.models.teacher_profile import TeacherProfile
    from app.models.subject import Subject
    from app.models.section import Section
    from app.models.classroom import Classroom
    from app.models.timetable import TimetableSlot


class TeacherSubjectAssignment(TimestampedBase):
    __tablename__ = "teacher_subject_assignments"

    teacher_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("teacher_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    section_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    classroom_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("classrooms.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    academic_year: Mapped[str] = mapped_column(String(32), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    teacher: Mapped[TeacherProfile] = relationship("TeacherProfile", back_populates="assignments")
    subject: Mapped[Subject] = relationship("Subject", back_populates="teacher_assignments")
    section: Mapped[Section] = relationship("Section", back_populates="teacher_assignments")
    classroom: Mapped[Optional[Classroom]] = relationship("Classroom", back_populates="teacher_subjects")
    timetable_slots: Mapped[list[TimetableSlot]] = relationship(
        "TimetableSlot",
        back_populates="teacher_subject",
        cascade="all, delete-orphan",
    )

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedBase

if TYPE_CHECKING:
    from app.models.college import College
    from app.models.subject import Subject
    from app.models.section import Section
    from app.models.student_profile import StudentProfile
    from app.models.teacher_profile import TeacherProfile


class Department(TimestampedBase):
    __tablename__ = "departments"
    __table_args__ = (
        UniqueConstraint("college_id", "code", name="uq_department_college_code"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    college_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    college: Mapped[College] = relationship("College", back_populates="departments")
    subjects: Mapped[list[Subject]] = relationship(
        "Subject",
        back_populates="department",
        cascade="all, delete-orphan",
    )
    sections: Mapped[list[Section]] = relationship(
        "Section",
        back_populates="department",
        cascade="all, delete-orphan",
    )
    student_profiles: Mapped[list[StudentProfile]] = relationship(
        "StudentProfile",
        back_populates="department",
        cascade="all, delete-orphan",
    )
    teacher_profiles: Mapped[list[TeacherProfile]] = relationship(
        "TeacherProfile",
        back_populates="department",
        cascade="all, delete-orphan",
    )

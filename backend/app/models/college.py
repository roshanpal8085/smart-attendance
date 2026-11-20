from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedBase

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.classroom import Classroom
    from app.models.subject import Subject
    from app.models.student_profile import StudentProfile
    from app.models.teacher_profile import TeacherProfile


class College(TimestampedBase):
    __tablename__ = "colleges"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), default="India", nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    departments: Mapped[list[Department]] = relationship(
        "Department",
        back_populates="college",
        cascade="all, delete-orphan",
    )
    classrooms: Mapped[list[Classroom]] = relationship(
        "Classroom",
        back_populates="college",
        cascade="all, delete-orphan",
    )
    subjects: Mapped[list[Subject]] = relationship(
        "Subject",
        back_populates="college",
        cascade="all, delete-orphan",
    )
    student_profiles: Mapped[list[StudentProfile]] = relationship(
        "StudentProfile",
        back_populates="college",
        cascade="all, delete-orphan",
    )
    teacher_profiles: Mapped[list[TeacherProfile]] = relationship(
        "TeacherProfile",
        back_populates="college",
        cascade="all, delete-orphan",
    )

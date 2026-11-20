from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedBase

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.enrollment import Enrollment
    from app.models.teacher_subject import TeacherSubjectAssignment
    from app.models.attendance_session import AttendanceSession


class Section(TimestampedBase):
    __tablename__ = "sections"

    name: Mapped[str] = mapped_column(String(32), nullable=False)
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    max_students: Mapped[int] = mapped_column(Integer, default=60, nullable=False)

    # Relationships
    department: Mapped[Department] = relationship("Department", back_populates="sections")
    enrollments: Mapped[list[Enrollment]] = relationship(
        "Enrollment",
        back_populates="section",
        cascade="all, delete-orphan",
    )
    teacher_assignments: Mapped[list[TeacherSubjectAssignment]] = relationship(
        "TeacherSubjectAssignment",
        back_populates="section",
        cascade="all, delete-orphan",
    )
    sessions: Mapped[list[AttendanceSession]] = relationship(
        "AttendanceSession",
        back_populates="section",
        cascade="all, delete-orphan",
    )

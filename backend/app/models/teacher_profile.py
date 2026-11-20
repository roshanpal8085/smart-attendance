from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedBase

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.college import College
    from app.models.department import Department
    from app.models.teacher_subject import TeacherSubjectAssignment
    from app.models.attendance_session import AttendanceSession


class TeacherProfile(TimestampedBase):
    __tablename__ = "teacher_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    college_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    employee_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    designation: Mapped[str] = mapped_column(String(100), nullable=False)
    is_hod: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="teacher_profile")
    college: Mapped[College] = relationship("College", back_populates="teacher_profiles")
    department: Mapped[Department] = relationship("Department", back_populates="teacher_profiles")
    assignments: Mapped[list[TeacherSubjectAssignment]] = relationship(
        "TeacherSubjectAssignment",
        back_populates="teacher",
        cascade="all, delete-orphan",
    )
    sessions: Mapped[list[AttendanceSession]] = relationship(
        "AttendanceSession",
        back_populates="teacher",
        cascade="all, delete-orphan",
    )

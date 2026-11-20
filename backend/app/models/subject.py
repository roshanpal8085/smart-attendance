from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SQLEnum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import SubjectType, TimestampedBase

if TYPE_CHECKING:
    from app.models.college import College
    from app.models.department import Department
    from app.models.enrollment import Enrollment
    from app.models.teacher_subject import TeacherSubjectAssignment
    from app.models.attendance_session import AttendanceSession


class Subject(TimestampedBase):
    __tablename__ = "subjects"
    __table_args__ = (
        UniqueConstraint("department_id", "code", name="uq_subject_dept_code"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    college_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    credits: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    type: Mapped[SubjectType] = mapped_column(
        SQLEnum(SubjectType, name="subject_type_enum", native_enum=False),
        default=SubjectType.THEORY,
        nullable=False,
    )
    semester: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    department: Mapped[Department] = relationship("Department", back_populates="subjects")
    college: Mapped[College] = relationship("College", back_populates="subjects")
    enrollments: Mapped[list[Enrollment]] = relationship(
        "Enrollment",
        back_populates="subject",
        cascade="all, delete-orphan",
    )
    teacher_assignments: Mapped[list[TeacherSubjectAssignment]] = relationship(
        "TeacherSubjectAssignment",
        back_populates="subject",
        cascade="all, delete-orphan",
    )
    sessions: Mapped[list[AttendanceSession]] = relationship(
        "AttendanceSession",
        back_populates="subject",
        cascade="all, delete-orphan",
    )

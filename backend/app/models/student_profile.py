from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedBase

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.college import College
    from app.models.department import Department
    from app.models.enrollment import Enrollment
    from app.models.attendance_record import AttendanceRecord
    from app.models.presence_evidence import PresenceEvidence


class StudentProfile(TimestampedBase):
    __tablename__ = "student_profiles"

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
    roll_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    enrollment_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    section_name: Mapped[str] = mapped_column(String(32), nullable=False)
    year_of_admission: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="student_profile")
    college: Mapped[College] = relationship("College", back_populates="student_profiles")
    department: Mapped[Department] = relationship("Department", back_populates="student_profiles")
    enrollments: Mapped[list[Enrollment]] = relationship(
        "Enrollment",
        back_populates="student",
        cascade="all, delete-orphan",
    )
    attendance_records: Mapped[list[AttendanceRecord]] = relationship(
        "AttendanceRecord",
        back_populates="student",
        cascade="all, delete-orphan",
    )
    presence_evidences: Mapped[list[PresenceEvidence]] = relationship(
        "PresenceEvidence",
        back_populates="student",
        cascade="all, delete-orphan",
    )

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Enum as SQLEnum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ProximityMode, TimestampedBase

if TYPE_CHECKING:
    from app.models.college import College
    from app.models.beacon import Beacon
    from app.models.attendance_session import AttendanceSession
    from app.models.teacher_subject import TeacherSubjectAssignment


class Classroom(TimestampedBase):
    __tablename__ = "classrooms"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    building: Mapped[str] = mapped_column(String(100), nullable=False)
    floor: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    college_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    proximity_mode: Mapped[ProximityMode] = mapped_column(
        SQLEnum(ProximityMode, name="proximity_mode_enum", native_enum=False),
        default=ProximityMode.BEACON,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    college: Mapped[College] = relationship("College", back_populates="classrooms")
    beacon: Mapped[Optional[Beacon]] = relationship(
        "Beacon",
        back_populates="classroom",
        uselist=False,
        cascade="all, delete-orphan",
    )
    sessions: Mapped[list[AttendanceSession]] = relationship(
        "AttendanceSession",
        back_populates="classroom",
        cascade="all, delete-orphan",
    )
    teacher_subjects: Mapped[list[TeacherSubjectAssignment]] = relationship(
        "TeacherSubjectAssignment",
        back_populates="classroom",
    )

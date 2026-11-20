from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import AttendanceStatus, BiometricType, TimestampedBase

if TYPE_CHECKING:
    from app.models.attendance_session import AttendanceSession
    from app.models.student_profile import StudentProfile


class AttendanceRecord(TimestampedBase):
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("session_id", "student_id", name="uq_session_student_attendance"),
    )

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("attendance_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[AttendanceStatus] = mapped_column(
        SQLEnum(AttendanceStatus, name="attendance_status_enum", native_enum=False),
        default=AttendanceStatus.PRESENT,
        nullable=False,
        index=True,
    )
    marked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    biometric_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    biometric_type: Mapped[Optional[BiometricType]] = mapped_column(
        SQLEnum(BiometricType, name="biometric_type_enum", native_enum=False),
        nullable=True,
    )
    device_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    reference_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        unique=True,
        index=True,
        default=uuid.uuid4,
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    session: Mapped[AttendanceSession] = relationship("AttendanceSession", back_populates="records")
    student: Mapped[StudentProfile] = relationship("StudentProfile", back_populates="attendance_records")

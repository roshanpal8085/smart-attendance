from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import EvidenceType, TimestampedBase

if TYPE_CHECKING:
    from app.models.student_profile import StudentProfile
    from app.models.attendance_session import AttendanceSession
    from app.models.classroom import Classroom


class PresenceEvidence(TimestampedBase):
    __tablename__ = "presence_evidences"

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("attendance_sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    classroom_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    evidence_type: Mapped[EvidenceType] = mapped_column(
        SQLEnum(EvidenceType, name="evidence_type_enum", native_enum=False),
        default=EvidenceType.BEACON_SCAN,
        nullable=False,
    )
    beacon_uuid: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    rssi: Mapped[int] = mapped_column(Integer, nullable=False)
    tx_power: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    sequence_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    window_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    student: Mapped[StudentProfile] = relationship("StudentProfile", back_populates="presence_evidences")
    session: Mapped[Optional[AttendanceSession]] = relationship("AttendanceSession", back_populates="presence_evidences")
    classroom: Mapped[Classroom] = relationship("Classroom")

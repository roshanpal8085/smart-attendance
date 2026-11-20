from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ProximityMode, SessionStatus, TimestampedBase

if TYPE_CHECKING:
    from app.models.teacher_profile import TeacherProfile
    from app.models.subject import Subject
    from app.models.section import Section
    from app.models.classroom import Classroom
    from app.models.attendance_record import AttendanceRecord
    from app.models.presence_evidence import PresenceEvidence


class AttendanceSession(TimestampedBase):
    __tablename__ = "attendance_sessions"

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
    classroom_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[SessionStatus] = mapped_column(
        SQLEnum(SessionStatus, name="session_status_enum", native_enum=False),
        default=SessionStatus.PENDING,
        nullable=False,
        index=True,
    )
    proximity_mode: Mapped[ProximityMode] = mapped_column(
        SQLEnum(ProximityMode, name="session_proximity_mode_enum", native_enum=False),
        default=ProximityMode.BEACON,
        nullable=False,
    )
    session_challenge: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    total_enrolled: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_present: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_absent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    teacher: Mapped[TeacherProfile] = relationship("TeacherProfile", back_populates="sessions")
    subject: Mapped[Subject] = relationship("Subject", back_populates="sessions")
    section: Mapped[Section] = relationship("Section", back_populates="sessions")
    classroom: Mapped[Classroom] = relationship("Classroom", back_populates="sessions")
    records: Mapped[list[AttendanceRecord]] = relationship(
        "AttendanceRecord",
        back_populates="session",
        cascade="all, delete-orphan",
    )
    presence_evidences: Mapped[list[PresenceEvidence]] = relationship(
        "PresenceEvidence",
        back_populates="session",
    )

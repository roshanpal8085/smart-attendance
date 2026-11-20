from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.utils.datetime_utils import utcnow


class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class ProximityMode(str, Enum):
    BEACON = "beacon"
    TEACHER_PHONE = "teacher_phone"


class SubjectType(str, Enum):
    THEORY = "theory"
    LAB = "lab"
    ELECTIVE = "elective"


class SessionStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class EvidenceType(str, Enum):
    BEACON_SCAN = "beacon_scan"
    TEACHER_BLE = "teacher_ble"


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"
    PENDING = "pending"


class BiometricType(str, Enum):
    FINGERPRINT = "fingerprint"
    FACE_ID = "face_id"
    TOUCH_ID = "touch_id"
    FACE_AUTH = "face_auth"


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy declarative models."""
    pass


class TimestampedBase(Base):
    """Abstract model adding UUID primary key and timestamp tracking."""

    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

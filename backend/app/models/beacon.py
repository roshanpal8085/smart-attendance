from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedBase
from app.utils.datetime_utils import utcnow

if TYPE_CHECKING:
    from app.models.classroom import Classroom


class Beacon(TimestampedBase):
    __tablename__ = "beacons"

    uuid: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    major: Mapped[int] = mapped_column(Integer, nullable=False)
    minor: Mapped[int] = mapped_column(Integer, nullable=False)
    classroom_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    installed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )

    # Relationships
    classroom: Mapped[Classroom] = relationship("Classroom", back_populates="beacon")

    @property
    def beacon_uuid(self) -> str:
        return self.uuid

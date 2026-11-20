from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BeaconBase(BaseModel):
    uuid: str
    major: int
    minor: int
    classroom_id: UUID
    label: str
    is_active: bool = True


class BeaconCreate(BeaconBase):
    installed_at: datetime | None = None


class BeaconUpdate(BaseModel):
    uuid: str | None = None
    major: int | None = None
    minor: int | None = None
    classroom_id: UUID | None = None
    label: str | None = None
    is_active: bool | None = None


class BeaconRead(BeaconBase):
    id: UUID
    installed_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


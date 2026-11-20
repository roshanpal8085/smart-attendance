import uuid as _uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class BeaconBase(BaseModel):
    uuid: str
    major: int = 100
    minor: int = 10
    classroom_id: Optional[_uuid.UUID] = None
    label: Optional[str] = None
    mac_address: Optional[str] = None
    battery_level: Optional[int] = 100
    status: Optional[str] = None
    is_active: bool = True


class BeaconCreate(BeaconBase):
    installed_at: Optional[datetime] = None


class BeaconUpdate(BaseModel):
    uuid: Optional[str] = None
    major: Optional[int] = None
    minor: Optional[int] = None
    classroom_id: Optional[_uuid.UUID] = None
    label: Optional[str] = None
    mac_address: Optional[str] = None
    battery_level: Optional[int] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


class BeaconRead(BaseModel):
    id: _uuid.UUID
    uuid: str
    major: int
    minor: int
    classroom_id: Optional[_uuid.UUID] = None
    label: Optional[str] = None
    is_active: bool
    installed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

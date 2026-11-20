import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.models.base import ProximityMode


class ClassroomBase(BaseModel):
    name: str
    code: str | None = None
    building: str = "Main Block"
    floor: int | str | None = 0
    capacity: int = 60
    college_id: uuid.UUID | str | None = None
    proximity_mode: ProximityMode | str = ProximityMode.BEACON
    mode: str | None = None
    beacon_id: str | None = None
    beacon_uuid: str | None = None
    is_active: bool = True


class ClassroomCreate(ClassroomBase):
    pass


class ClassroomUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    building: str | None = None
    floor: int | str | None = None
    capacity: int | None = None
    proximity_mode: ProximityMode | str | None = None
    mode: str | None = None
    is_active: bool | None = None


class ClassroomRead(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    building: str
    floor: int
    capacity: int
    college_id: uuid.UUID
    proximity_mode: ProximityMode | str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.models.base import ProximityMode


class ClassroomBase(BaseModel):
    name: str
    code: str
    building: str
    floor: int = 0
    capacity: int = 60
    college_id: uuid.UUID
    proximity_mode: ProximityMode = ProximityMode.BEACON
    is_active: bool = True


class ClassroomCreate(ClassroomBase):
    pass


class ClassroomUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    building: str | None = None
    floor: int | None = None
    capacity: int | None = None
    proximity_mode: ProximityMode | None = None
    is_active: bool | None = None


class ClassroomRead(ClassroomBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

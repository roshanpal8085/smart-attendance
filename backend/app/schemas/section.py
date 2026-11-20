import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SectionBase(BaseModel):
    name: str
    department_id: uuid.UUID
    semester: int
    year: int
    max_students: int = 60


class SectionCreate(SectionBase):
    pass


class SectionUpdate(BaseModel):
    name: str | None = None
    semester: int | None = None
    year: int | None = None
    max_students: int | None = None


class SectionRead(SectionBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

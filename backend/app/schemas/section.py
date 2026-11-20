import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SectionBase(BaseModel):
    name: str
    department_id: uuid.UUID | str | None = None
    semester: int = 1
    year: int | None = None
    academic_year: str | None = None
    max_students: int | None = None
    capacity: int | None = None
    is_active: bool = True


class SectionCreate(SectionBase):
    pass


class SectionUpdate(BaseModel):
    name: str | None = None
    department_id: uuid.UUID | str | None = None
    semester: int | None = None
    year: int | None = None
    max_students: int | None = None
    capacity: int | None = None
    is_active: bool | None = None


class SectionRead(BaseModel):
    id: uuid.UUID
    name: str
    department_id: uuid.UUID
    semester: int
    year: int
    max_students: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

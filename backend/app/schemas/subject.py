import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.models.base import SubjectType


class SubjectBase(BaseModel):
    name: str
    code: str | None = None
    department_id: uuid.UUID | str | None = None
    college_id: uuid.UUID | str | None = None
    credits: int = 4
    type: SubjectType | str = SubjectType.THEORY
    semester: int = 1
    is_active: bool = True


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    department_id: uuid.UUID | str | None = None
    college_id: uuid.UUID | str | None = None
    credits: int | None = None
    type: SubjectType | str | None = None
    semester: int | None = None
    is_active: bool | None = None


class SubjectRead(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    department_id: uuid.UUID
    college_id: uuid.UUID
    credits: int
    type: SubjectType | str
    semester: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

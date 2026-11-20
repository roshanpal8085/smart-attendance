import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.models.base import SubjectType


class SubjectBase(BaseModel):
    name: str
    code: str
    department_id: uuid.UUID
    college_id: uuid.UUID
    credits: int = 3
    type: SubjectType = SubjectType.THEORY
    semester: int


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    credits: int | None = None
    type: SubjectType | None = None
    semester: int | None = None


class SubjectRead(SubjectBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

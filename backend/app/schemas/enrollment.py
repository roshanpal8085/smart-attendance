import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class EnrollmentBase(BaseModel):
    student_id: uuid.UUID
    subject_id: uuid.UUID
    section_id: uuid.UUID
    academic_year: str
    is_active: bool = True


class EnrollmentCreate(EnrollmentBase):
    pass


class BulkEnrollmentRequest(BaseModel):
    student_ids: list[uuid.UUID]
    subject_id: uuid.UUID
    section_id: uuid.UUID
    academic_year: str


class EnrollmentRead(EnrollmentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

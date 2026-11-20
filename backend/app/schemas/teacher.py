import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserRead


class TeacherProfileBase(BaseModel):
    college_id: uuid.UUID
    department_id: uuid.UUID
    employee_id: str
    designation: str
    is_hod: bool = False


class TeacherProfileCreate(TeacherProfileBase):
    user_id: uuid.UUID


class TeacherProfileRead(TeacherProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    user: UserRead | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TeacherSubjectItem(BaseModel):
    assignment_id: uuid.UUID
    subject_id: uuid.UUID
    subject_name: str
    subject_code: str
    section_id: uuid.UUID
    section_name: str
    classroom_id: uuid.UUID | None = None
    classroom_name: str | None = None
    academic_year: str


class TeacherDashboard(BaseModel):
    teacher_id: uuid.UUID
    employee_id: str
    full_name: str
    designation: str
    is_hod: bool
    assigned_subjects_count: int
    today_schedule_count: int
    active_session_id: uuid.UUID | None = None

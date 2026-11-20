import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserRead


class StudentProfileBase(BaseModel):
    college_id: uuid.UUID
    department_id: uuid.UUID
    roll_number: str
    enrollment_number: str
    semester: int
    section_name: str
    year_of_admission: int


class StudentProfileCreate(StudentProfileBase):
    user_id: uuid.UUID


class StudentProfileRead(StudentProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    user: UserRead | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SubjectAttendanceSummary(BaseModel):
    subject_id: uuid.UUID
    subject_name: str
    subject_code: str
    total_classes: int
    attended_classes: int
    percentage: float


class AttendanceSummary(BaseModel):
    total_classes: int
    attended_classes: int
    overall_percentage: float
    subjects: list[SubjectAttendanceSummary]


class StudentDashboard(BaseModel):
    student_id: uuid.UUID
    roll_number: str
    full_name: str
    semester: int
    section_name: str
    overall_attendance_percentage: float
    total_classes: int
    attended_classes: int
    today_schedule_count: int
    active_session_available: bool = False
    active_session_id: uuid.UUID | None = None

import datetime
import uuid
from pydantic import BaseModel, ConfigDict, Field


class TeacherSubjectAssignmentCreate(BaseModel):
    teacher_id: uuid.UUID
    subject_id: uuid.UUID
    section_id: uuid.UUID
    classroom_id: uuid.UUID | None = None
    academic_year: str
    is_active: bool = True


class TeacherSubjectAssignmentRead(TeacherSubjectAssignmentCreate):
    id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class TimetableSlotBase(BaseModel):
    teacher_subject_id: uuid.UUID
    day_of_week: int = Field(..., ge=0, le=6, description="0=Mon, 6=Sun")
    start_time: datetime.time
    end_time: datetime.time
    academic_year: str


class TimetableSlotCreate(TimetableSlotBase):
    pass


class TimetableSlotRead(TimetableSlotBase):
    id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class DayTimetableItem(BaseModel):
    slot_id: uuid.UUID
    subject_id: uuid.UUID
    subject_name: str
    subject_code: str
    section_name: str
    classroom_name: str | None = None
    classroom_id: uuid.UUID | None = None
    teacher_name: str | None = None
    start_time: str
    end_time: str
    day_of_week: int


class DayTimetable(BaseModel):
    day_of_week: int
    academic_year: str
    items: list[DayTimetableItem]

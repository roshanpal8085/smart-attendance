import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.base import ProximityMode, SessionStatus


class SessionCreate(BaseModel):
    subject_id: uuid.UUID
    section_id: uuid.UUID
    classroom_id: uuid.UUID
    proximity_mode: ProximityMode = ProximityMode.BEACON


class SessionUpdate(BaseModel):
    status: SessionStatus | None = None
    ended_at: datetime | None = None


class SessionRead(BaseModel):
    id: uuid.UUID
    teacher_id: uuid.UUID
    subject_id: uuid.UUID
    section_id: uuid.UUID
    classroom_id: uuid.UUID
    status: SessionStatus
    proximity_mode: ProximityMode
    session_challenge: str
    started_at: datetime
    expires_at: datetime
    ended_at: datetime | None = None
    total_enrolled: int = 0
    total_present: int = 0
    total_absent: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LiveAttendee(BaseModel):
    student_id: uuid.UUID
    roll_number: str
    full_name: str
    marked_at: datetime
    reference_id: uuid.UUID


class LiveSessionStatus(BaseModel):
    session_id: uuid.UUID
    status: SessionStatus
    proximity_mode: ProximityMode
    started_at: datetime
    expires_at: datetime
    remaining_seconds: int
    total_enrolled: int
    total_present: int
    total_absent: int
    attendance_rate: float
    recent_attendees: list[LiveAttendee] = Field(default_factory=list)

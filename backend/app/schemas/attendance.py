import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.models.base import AttendanceStatus, BiometricType


class MarkAttendanceRequest(BaseModel):
    session_id: uuid.UUID
    session_challenge: str | None = None
    biometric_verified: bool = False
    biometric_type: BiometricType | None = None
    device_id: str | None = None


class AttendanceRecordRead(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    student_id: uuid.UUID
    status: AttendanceStatus
    marked_at: datetime
    biometric_verified: bool
    biometric_type: BiometricType | None = None
    device_id: str | None = None
    ip_address: str | None = None
    reference_id: uuid.UUID
    notes: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AttendanceHistoryItem(BaseModel):
    record_id: uuid.UUID
    session_id: uuid.UUID
    subject_id: uuid.UUID
    subject_name: str
    subject_code: str
    teacher_name: str
    status: AttendanceStatus
    marked_at: datetime
    biometric_verified: bool
    reference_id: uuid.UUID


class AttendanceDateMatrix(BaseModel):
    student_id: uuid.UUID
    subject_id: uuid.UUID
    month: int
    year: int
    dates: dict[str, str]  # YYYY-MM-DD -> status string
    total_sessions: int
    present_count: int
    absent_count: int
    attendance_percentage: float

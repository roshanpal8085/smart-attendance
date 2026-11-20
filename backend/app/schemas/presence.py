import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.base import EvidenceType


class PresenceEvidenceSubmit(BaseModel):
    classroom_id: uuid.UUID
    session_id: uuid.UUID | None = None
    evidence_type: EvidenceType = EvidenceType.BEACON_SCAN
    beacon_uuid: str
    rssi: int = Field(..., ge=-120, le=0, description="RSSI in dBm, e.g. -75")
    tx_power: int | None = None
    recorded_at: datetime | None = None


class PresenceEvidenceRead(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    session_id: uuid.UUID | None = None
    classroom_id: uuid.UUID
    evidence_type: EvidenceType
    beacon_uuid: str
    rssi: int
    tx_power: int | None = None
    recorded_at: datetime
    sequence_start: datetime
    window_seconds: int
    is_valid: bool

    model_config = ConfigDict(from_attributes=True)


class PresenceWindowStatus(BaseModel):
    student_id: uuid.UUID
    classroom_id: uuid.UUID
    continuous_seconds: int
    required_seconds: int
    is_eligible: bool
    last_detected_at: datetime | None = None
    sequence_start: datetime | None = None

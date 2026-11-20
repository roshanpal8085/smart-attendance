import uuid
from datetime import datetime, timedelta
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.base import EvidenceType
from app.models.presence_evidence import PresenceEvidence
from app.repositories.base import BaseRepository
from app.utils.datetime_utils import utcnow


class PresenceRepository(BaseRepository[PresenceEvidence]):
    def __init__(self, db: AsyncSession):
        super().__init__(PresenceEvidence, db)

    async def submit_evidence(
        self,
        student_id: uuid.UUID,
        classroom_id: uuid.UUID,
        evidence_type: EvidenceType,
        beacon_uuid: str,
        rssi: int,
        tx_power: int | None,
        recorded_at: datetime,
        sequence_start: datetime,
        window_seconds: int,
        is_valid: bool = True,
        session_id: uuid.UUID | None = None,
    ) -> PresenceEvidence:
        """Persist verified presence evidence for audit and compliance."""
        evidence = PresenceEvidence(
            student_id=student_id,
            session_id=session_id,
            classroom_id=classroom_id,
            evidence_type=evidence_type,
            beacon_uuid=beacon_uuid,
            rssi=rssi,
            tx_power=tx_power,
            recorded_at=recorded_at,
            sequence_start=sequence_start,
            window_seconds=window_seconds,
            is_valid=is_valid,
        )
        self.db.add(evidence)
        await self.db.commit()
        await self.db.refresh(evidence)
        return evidence

    async def get_latest_evidence(
        self,
        student_id: uuid.UUID,
        classroom_id: uuid.UUID,
    ) -> PresenceEvidence | None:
        """Fetch the most recent valid presence evidence for student in classroom."""
        stmt = (
            select(PresenceEvidence)
            .where(
                PresenceEvidence.student_id == student_id,
                PresenceEvidence.classroom_id == classroom_id,
                PresenceEvidence.is_valid == True,
            )
            .order_by(desc(PresenceEvidence.recorded_at))
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_window_duration(
        self,
        student_id: uuid.UUID,
        classroom_id: uuid.UUID,
    ) -> tuple[datetime | None, int]:
        """Return (sequence_start, window_seconds) from the latest active window."""
        latest = await self.get_latest_evidence(student_id, classroom_id)
        if not latest:
            return None, 0
        now = utcnow()
        # If last recorded evidence was more than 60 seconds ago, window has expired
        if (now - latest.recorded_at).total_seconds() > 60:
            return None, 0
        return latest.sequence_start, latest.window_seconds

    async def is_eligible(
        self,
        student_id: uuid.UUID,
        classroom_id: uuid.UUID,
        required_seconds: int | None = None,
    ) -> bool:
        """Check if student has maintained continuous presence for the required window."""
        if required_seconds is None:
            required_seconds = settings.PRESENCE_WINDOW_REQUIRED_SECONDS

        _, duration = await self.get_window_duration(student_id, classroom_id)
        return duration >= required_seconds

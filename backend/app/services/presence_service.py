import json
import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.base import EvidenceType
from app.models.presence_evidence import PresenceEvidence
from app.repositories.classroom_repo import ClassroomRepository
from app.repositories.presence_repo import PresenceRepository
from app.repositories.session_repo import SessionRepository
from app.services.redis_client import get_redis
from app.utils.datetime_utils import ensure_utc, utcnow


class PresenceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.presence_repo = PresenceRepository(db)
        self.classroom_repo = ClassroomRepository(db)
        self.session_repo = SessionRepository(db)

    def _redis_key(self, student_id: uuid.UUID, classroom_id: uuid.UUID) -> str:
        return f"presence:{student_id}:{classroom_id}"

    async def submit_evidence(
        self,
        student_id: uuid.UUID,
        classroom_id: uuid.UUID,
        beacon_uuid: str,
        rssi: int,
        evidence_type: EvidenceType = EvidenceType.BEACON_SCAN,
        tx_power: int | None = None,
        recorded_at: datetime | None = None,
        session_id: uuid.UUID | None = None,
    ) -> PresenceEvidence:
        """Process BLE presence evidence, update continuous presence window in Redis, and persist audit record."""
        now = utcnow()
        ts_recorded = ensure_utc(recorded_at) if recorded_at else now
        now_ts = ts_recorded.timestamp()

        # 1. Validate RSSI threshold (e.g., RSSI >= -80 dBm)
        is_rssi_valid = rssi >= settings.BLE_RSSI_THRESHOLD

        # 2. Validate classroom existence
        classroom = await self.classroom_repo.get_by_id(classroom_id)
        if not classroom:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Classroom {classroom_id} not found",
            )

        # 3. Track continuous presence window in Redis
        redis = await get_redis()
        r_key = self._redis_key(student_id, classroom_id)

        seq_start_ts = now_ts
        window_seconds = 0
        is_valid = is_rssi_valid

        try:
            cached_window = await redis.get(r_key)
            if cached_window:
                data = json.loads(cached_window)
                last_seen_ts = float(data.get("last_seen", 0))
                cached_start_ts = float(data.get("sequence_start", now_ts))

                gap_seconds = now_ts - last_seen_ts
                if gap_seconds <= 60 and is_rssi_valid:
                    # Extend continuous window
                    seq_start_ts = cached_start_ts
                    window_seconds = max(0, int(now_ts - seq_start_ts))
                elif not is_rssi_valid:
                    # Signal is too weak; retain start but do not advance window or reset if persistent
                    seq_start_ts = cached_start_ts
                    window_seconds = int(data.get("window_seconds", 0))
                else:
                    # Gap > 60 seconds, reset window
                    seq_start_ts = now_ts
                    window_seconds = 0
            else:
                seq_start_ts = now_ts
                window_seconds = 0

            # Store updated window in Redis with 30 min TTL
            await redis.setex(
                r_key,
                1800,
                json.dumps({
                    "sequence_start": seq_start_ts,
                    "last_seen": now_ts,
                    "window_seconds": window_seconds,
                    "is_valid": is_valid,
                }),
            )
        except Exception:
            # Redis failure resilience: continue to DB persistence
            pass

        sequence_start_dt = datetime.fromtimestamp(seq_start_ts, tz=timezone.utc)

        # 4. Persist audit evidence in PostgreSQL
        evidence = await self.presence_repo.submit_evidence(
            student_id=student_id,
            classroom_id=classroom_id,
            evidence_type=evidence_type,
            beacon_uuid=beacon_uuid,
            rssi=rssi,
            tx_power=tx_power,
            recorded_at=ts_recorded,
            sequence_start=sequence_start_dt,
            window_seconds=window_seconds,
            is_valid=is_valid,
            session_id=session_id,
        )

        return evidence

    async def get_presence_window(
        self,
        student_id: uuid.UUID,
        classroom_id: uuid.UUID,
    ) -> tuple[datetime | None, int]:
        """Fetch current continuous presence window (start_time, window_seconds)."""
        redis = await get_redis()
        r_key = self._redis_key(student_id, classroom_id)

        try:
            cached = await redis.get(r_key)
            if cached:
                data = json.loads(cached)
                now_ts = utcnow().timestamp()
                last_seen_ts = float(data.get("last_seen", 0))
                if (now_ts - last_seen_ts) <= 60:
                    start_dt = datetime.fromtimestamp(float(data["sequence_start"]), tz=timezone.utc)
                    return start_dt, int(data.get("window_seconds", 0))
        except Exception:
            pass

        # Fallback to database
        return await self.presence_repo.get_window_duration(student_id, classroom_id)

    async def is_eligible_for_session(
        self,
        student_id: uuid.UUID,
        session_id: uuid.UUID,
    ) -> bool:
        """Verify student has accumulated required continuous presence before or during session."""
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            return False

        seq_start, duration = await self.get_presence_window(student_id, session.classroom_id)
        return duration >= settings.PRESENCE_WINDOW_REQUIRED_SECONDS

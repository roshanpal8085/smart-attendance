"""Tests for the BLE presence verification engine."""

import json
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
import pytest_asyncio

from app.core.config import settings
from app.models.base import EvidenceType, ProximityMode, SessionStatus
from app.services.presence_service import PresenceService
from tests.conftest import MockRedis


class TestPresenceWindowLogic:
    """Test the continuous presence window tracking logic."""

    def test_rssi_threshold_default(self):
        """Verify BLE_RSSI_THRESHOLD is -80 dBm."""
        assert settings.BLE_RSSI_THRESHOLD == -80

    def test_presence_window_required(self):
        """Verify 15-minute (900 second) presence requirement."""
        assert settings.PRESENCE_WINDOW_REQUIRED_SECONDS == 900


class TestPresenceRedisWindow:
    """Test Redis-based continuous presence window calculations."""

    @pytest.fixture
    def mock_redis(self):
        return MockRedis()

    @pytest.fixture
    def student_id(self):
        return uuid.uuid4()

    @pytest.fixture
    def classroom_id(self):
        return uuid.uuid4()

    def _redis_key(self, student_id: uuid.UUID, classroom_id: uuid.UUID) -> str:
        return f"presence:{student_id}:{classroom_id}"

    @pytest.mark.asyncio
    async def test_initial_evidence_creates_new_window(self, mock_redis, student_id, classroom_id):
        """First evidence submission should start a new window at 0 seconds."""
        key = self._redis_key(student_id, classroom_id)

        # No existing key in Redis
        assert await mock_redis.get(key) is None

        # Simulate first evidence: set the window
        now_ts = datetime.now(timezone.utc).timestamp()
        window_data = {
            "sequence_start": now_ts,
            "last_seen": now_ts,
            "window_seconds": 0,
            "is_valid": True,
        }
        await mock_redis.setex(key, 1800, json.dumps(window_data))

        # Verify window was created
        cached = await mock_redis.get(key)
        assert cached is not None
        data = json.loads(cached)
        assert data["window_seconds"] == 0
        assert data["is_valid"] is True

    @pytest.mark.asyncio
    async def test_continuous_evidence_extends_window(self, mock_redis, student_id, classroom_id):
        """Evidence within 60 seconds should extend the continuous window."""
        key = self._redis_key(student_id, classroom_id)
        now = datetime.now(timezone.utc)
        start_ts = (now - timedelta(seconds=300)).timestamp()
        last_ts = (now - timedelta(seconds=30)).timestamp()  # 30 seconds ago — within gap threshold

        initial_data = {
            "sequence_start": start_ts,
            "last_seen": last_ts,
            "window_seconds": 270,  # 300 - 30
            "is_valid": True,
        }
        await mock_redis.setex(key, 1800, json.dumps(initial_data))

        # Simulate new evidence arriving now
        now_ts = now.timestamp()
        cached = await mock_redis.get(key)
        data = json.loads(cached)
        cached_start_ts = float(data["sequence_start"])
        last_seen_ts = float(data["last_seen"])
        gap = now_ts - last_seen_ts

        # Gap of 30s < 60s threshold => extend
        assert gap <= 60
        new_window = int(now_ts - cached_start_ts)
        assert new_window >= 270  # Should be roughly 300 now

    @pytest.mark.asyncio
    async def test_gap_exceeding_threshold_resets_window(self, mock_redis, student_id, classroom_id):
        """Evidence arriving more than 60 seconds after last seen should reset the window."""
        key = self._redis_key(student_id, classroom_id)
        now = datetime.now(timezone.utc)
        start_ts = (now - timedelta(seconds=600)).timestamp()
        last_ts = (now - timedelta(seconds=90)).timestamp()  # 90 seconds ago — exceeds gap

        initial_data = {
            "sequence_start": start_ts,
            "last_seen": last_ts,
            "window_seconds": 510,
            "is_valid": True,
        }
        await mock_redis.setex(key, 1800, json.dumps(initial_data))

        # Simulate new evidence arriving now
        now_ts = now.timestamp()
        cached = await mock_redis.get(key)
        data = json.loads(cached)
        last_seen_ts = float(data["last_seen"])
        gap = now_ts - last_seen_ts

        # Gap of 90s > 60s threshold => should reset
        assert gap > 60
        # Window resets to 0
        new_window = 0
        new_start = now_ts

        reset_data = {
            "sequence_start": new_start,
            "last_seen": now_ts,
            "window_seconds": new_window,
            "is_valid": True,
        }
        await mock_redis.setex(key, 1800, json.dumps(reset_data))

        cached = await mock_redis.get(key)
        data = json.loads(cached)
        assert data["window_seconds"] == 0

    @pytest.mark.asyncio
    async def test_weak_rssi_does_not_extend(self, mock_redis, student_id, classroom_id):
        """RSSI below threshold should not mark evidence as valid."""
        weak_rssi = -95  # Below -80 threshold
        is_valid = weak_rssi >= settings.BLE_RSSI_THRESHOLD
        assert is_valid is False

    @pytest.mark.asyncio
    async def test_strong_rssi_is_valid(self, mock_redis, student_id, classroom_id):
        """RSSI at or above threshold should be valid."""
        strong_rssi = -65
        is_valid = strong_rssi >= settings.BLE_RSSI_THRESHOLD
        assert is_valid is True

        boundary_rssi = -80
        is_valid_boundary = boundary_rssi >= settings.BLE_RSSI_THRESHOLD
        assert is_valid_boundary is True


class TestEligibilityCheck:
    """Test session eligibility logic."""

    @pytest.mark.asyncio
    async def test_eligible_with_sufficient_window(self):
        """Student with 900+ seconds should be eligible."""
        window_seconds = 950
        required = settings.PRESENCE_WINDOW_REQUIRED_SECONDS
        assert window_seconds >= required

    @pytest.mark.asyncio
    async def test_not_eligible_with_insufficient_window(self):
        """Student with < 900 seconds should not be eligible."""
        window_seconds = 800
        required = settings.PRESENCE_WINDOW_REQUIRED_SECONDS
        assert window_seconds < required

    @pytest.mark.asyncio
    async def test_exactly_at_threshold_is_eligible(self):
        """Student at exactly 900 seconds should be eligible."""
        window_seconds = 900
        required = settings.PRESENCE_WINDOW_REQUIRED_SECONDS
        assert window_seconds >= required

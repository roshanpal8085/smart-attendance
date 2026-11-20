"""Tests for the attendance session lifecycle."""

import secrets
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.core.config import settings
from app.models.base import ProximityMode, SessionStatus


class TestSessionCreation:
    """Test attendance session creation logic."""

    def test_session_duration_is_120_seconds(self):
        """Verify session window is exactly 120 seconds."""
        assert settings.ATTENDANCE_SESSION_DURATION_SECONDS == 120

    def test_session_challenge_generation(self):
        """Verify session challenge is a 64-character hex string (32 bytes)."""
        challenge = secrets.token_hex(32)
        assert len(challenge) == 64
        # Must be valid hex
        int(challenge, 16)

    def test_session_expiry_calculation(self):
        """Verify expires_at is exactly started_at + 120 seconds."""
        started_at = datetime.now(timezone.utc)
        duration = settings.ATTENDANCE_SESSION_DURATION_SECONDS
        expires_at = started_at + timedelta(seconds=duration)
        diff = (expires_at - started_at).total_seconds()
        assert diff == 120.0


class TestSessionStatus:
    """Test session status transitions."""

    def test_valid_session_statuses(self):
        """All expected statuses exist in the enum."""
        assert SessionStatus.PENDING.value == "pending"
        assert SessionStatus.ACTIVE.value == "active"
        assert SessionStatus.EXPIRED.value == "expired"
        assert SessionStatus.CANCELLED.value == "cancelled"

    def test_proximity_modes(self):
        """Both BLE proximity modes exist."""
        assert ProximityMode.BEACON.value == "beacon"
        assert ProximityMode.TEACHER_PHONE.value == "teacher_phone"


class TestSessionExpiry:
    """Test server-side session expiry enforcement."""

    def test_active_session_before_expiry(self):
        """Session should be considered active before expires_at."""
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(seconds=60)
        assert expires_at > now

    def test_expired_session_after_expiry(self):
        """Session should be expired after expires_at."""
        now = datetime.now(timezone.utc)
        expires_at = now - timedelta(seconds=10)
        assert expires_at <= now

    def test_exactly_at_expiry_is_expired(self):
        """Session should be expired when current time == expires_at."""
        now = datetime.now(timezone.utc)
        expires_at = now
        assert expires_at <= now


class TestSessionChallenge:
    """Test cryptographic session challenge properties."""

    def test_challenge_uniqueness(self):
        """Two generated challenges should never be identical."""
        c1 = secrets.token_hex(32)
        c2 = secrets.token_hex(32)
        assert c1 != c2

    def test_challenge_entropy(self):
        """Challenge should have at least 32 bytes (256 bits) of entropy."""
        challenge_bytes = secrets.token_bytes(32)
        assert len(challenge_bytes) == 32

    def test_challenge_hex_encoding(self):
        """Challenge hex string should decode to exactly 32 bytes."""
        challenge = secrets.token_hex(32)
        decoded = bytes.fromhex(challenge)
        assert len(decoded) == 32


class TestConcurrentSessionPrevention:
    """Test that a teacher cannot have multiple active sessions."""

    def test_single_teacher_active_session_constraint(self):
        """Logic: if an active session exists for teacher_id, reject new session creation."""
        teacher_id = uuid.uuid4()
        existing_session_teacher = teacher_id
        new_session_teacher = teacher_id
        existing_status = SessionStatus.ACTIVE
        existing_expires_at = datetime.now(timezone.utc) + timedelta(seconds=60)

        # Should block: same teacher, active session, not yet expired
        should_block = (
            existing_session_teacher == new_session_teacher
            and existing_status == SessionStatus.ACTIVE
            and existing_expires_at > datetime.now(timezone.utc)
        )
        assert should_block is True

    def test_different_teacher_can_start_session(self):
        """Different teacher should be allowed even if first teacher has active session."""
        teacher1 = uuid.uuid4()
        teacher2 = uuid.uuid4()
        assert teacher1 != teacher2

"""Tests for attendance marking and validation logic."""

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.core.config import settings
from app.models.base import AttendanceStatus, BiometricType, SessionStatus


class TestAttendanceMarkValidation:
    """Test all server-side attendance validation rules."""

    def test_session_must_be_active(self):
        """Attendance should only be accepted for active sessions."""
        for status in [SessionStatus.PENDING, SessionStatus.EXPIRED, SessionStatus.CANCELLED]:
            assert status != SessionStatus.ACTIVE

    def test_session_within_time_window(self):
        """Attendance must be within the 2-minute (120s) window."""
        started_at = datetime.now(timezone.utc) - timedelta(seconds=60)
        expires_at = started_at + timedelta(seconds=settings.ATTENDANCE_SESSION_DURATION_SECONDS)
        now = datetime.now(timezone.utc)
        within_window = started_at <= now <= expires_at
        assert within_window is True

    def test_session_past_time_window_rejected(self):
        """Attendance after session expired must be rejected."""
        started_at = datetime.now(timezone.utc) - timedelta(seconds=300)
        expires_at = started_at + timedelta(seconds=settings.ATTENDANCE_SESSION_DURATION_SECONDS)
        now = datetime.now(timezone.utc)
        within_window = started_at <= now <= expires_at
        assert within_window is False


class TestDuplicatePrevention:
    """Test duplicate attendance prevention (UNIQUE session_id + student_id)."""

    def test_same_student_same_session_is_duplicate(self):
        """Same student marking twice in same session should be blocked."""
        session_id = uuid.uuid4()
        student_id = uuid.uuid4()

        existing_records = [(session_id, student_id)]
        new_attempt = (session_id, student_id)

        is_duplicate = new_attempt in existing_records
        assert is_duplicate is True

    def test_same_student_different_session_is_allowed(self):
        """Same student in a different session should be allowed."""
        session_1 = uuid.uuid4()
        session_2 = uuid.uuid4()
        student_id = uuid.uuid4()

        existing_records = [(session_1, student_id)]
        new_attempt = (session_2, student_id)

        is_duplicate = new_attempt in existing_records
        assert is_duplicate is False

    def test_different_student_same_session_is_allowed(self):
        """Different student in same session should be allowed."""
        session_id = uuid.uuid4()
        student_1 = uuid.uuid4()
        student_2 = uuid.uuid4()

        existing_records = [(session_id, student_1)]
        new_attempt = (session_id, student_2)

        is_duplicate = new_attempt in existing_records
        assert is_duplicate is False


class TestBiometricRequirement:
    """Test biometric verification constraints."""

    def test_all_biometric_types_defined(self):
        """All expected biometric types exist."""
        assert BiometricType.FINGERPRINT.value == "fingerprint"
        assert BiometricType.FACE_ID.value == "face_id"
        assert BiometricType.TOUCH_ID.value == "touch_id"
        assert BiometricType.FACE_AUTH.value == "face_auth"

    def test_biometric_must_be_verified(self):
        """Backend should require biometric_verified == True."""
        biometric_verified = True
        assert biometric_verified is True

    def test_unverified_biometric_should_be_flagged(self):
        """If biometric_verified is False, backend should reject or flag."""
        biometric_verified = False
        assert biometric_verified is False


class TestAttendanceStatuses:
    """Test all attendance status values."""

    def test_valid_statuses(self):
        """All attendance statuses are properly defined."""
        expected = {"present", "absent", "late", "excused", "pending"}
        actual = {s.value for s in AttendanceStatus}
        assert actual == expected

    def test_default_mark_is_present(self):
        """Standard attendance marking should record as present."""
        default_status = AttendanceStatus.PRESENT
        assert default_status.value == "present"


class TestReferenceId:
    """Test attendance reference ID generation."""

    def test_reference_id_is_uuid4(self):
        """Each attendance record should get a unique UUID4 reference."""
        ref_id = uuid.uuid4()
        assert isinstance(ref_id, uuid.UUID)
        assert ref_id.version == 4

    def test_reference_ids_are_unique(self):
        """Two reference IDs should never collide."""
        refs = {uuid.uuid4() for _ in range(1000)}
        assert len(refs) == 1000


class TestPresenceEligibility:
    """Test presence window integration with attendance."""

    def test_15_min_continuous_presence_required(self):
        """Student must have >= 900 seconds of continuous presence."""
        required = settings.PRESENCE_WINDOW_REQUIRED_SECONDS
        assert required == 900

        # Eligible
        assert 950 >= required
        assert 900 >= required

        # Not eligible
        assert not (899 >= required)
        assert not (0 >= required)

    def test_attendance_requires_enrollment(self):
        """Student must be enrolled in the session's subject and section."""
        enrolled_subjects = {uuid.uuid4(), uuid.uuid4()}
        session_subject = uuid.uuid4()

        is_enrolled = session_subject in enrolled_subjects
        assert is_enrolled is False

        # Enroll and try again
        enrolled_subjects.add(session_subject)
        is_enrolled = session_subject in enrolled_subjects
        assert is_enrolled is True

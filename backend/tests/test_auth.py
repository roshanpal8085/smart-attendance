import uuid
import pytest
from app.models.base import UserRole
from app.security.hashing import hash_password, verify_password
from app.security.jwt import create_access_token, create_refresh_token, decode_token


def test_password_hashing():
    raw = "SecurePassword123!"
    hashed = hash_password(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_tokens():
    user_id = uuid.uuid4()
    access = create_access_token(user_id=user_id, role=UserRole.STUDENT.value)
    payload = decode_token(access)
    assert payload["sub"] == str(user_id)
    assert payload["role"] == "student"
    assert payload["type"] == "access"

    refresh = create_refresh_token(user_id=user_id)
    r_payload = decode_token(refresh)
    assert r_payload["sub"] == str(user_id)
    assert r_payload["type"] == "refresh"

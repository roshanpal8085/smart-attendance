import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.base import UserRole
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import TokenResponse
from app.security.hashing import hash_password, verify_password
from app.security.jwt import create_access_token, create_refresh_token, decode_token
from app.services.redis_client import get_redis
from app.utils.datetime_utils import utcnow


def _hash_token(token: str) -> str:
    """Compute SHA-256 hash of a token string for safe DB indexing."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def login(
        self,
        email: str,
        password: str,
        device_id: str | None = None,
    ) -> TokenResponse:
        """Authenticate user by email and password, returning JWT key pair."""
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )

        # Update last login timestamp
        user.last_login_at = utcnow()
        self.db.add(user)

        # Retrieve college_id if associated with profile
        user_with_profile = await self.user_repo.get_with_profile(user.id)
        college_id: uuid.UUID | None = None
        if user_with_profile:
            if user_with_profile.student_profile:
                college_id = user_with_profile.student_profile.college_id
            elif user_with_profile.teacher_profile:
                college_id = user_with_profile.teacher_profile.college_id

        role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
        access_token = create_access_token(user.id, role_str, college_id=college_id)
        refresh_token = create_refresh_token(user.id)

        # Store hashed refresh token in database
        refresh_expires = utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_DAYS)
        db_refresh = RefreshToken(
            user_id=user.id,
            token_hash=_hash_token(refresh_token),
            device_id=device_id,
            expires_at=refresh_expires,
            is_revoked=False,
        )
        self.db.add(db_refresh)
        await self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_MINUTES * 60,
            role=role_str,
            user_id=str(user.id),
        )

    async def refresh(
        self,
        refresh_token_str: str,
        device_id: str | None = None,
    ) -> TokenResponse:
        """Rotate refresh token: revoke existing token and issue a fresh pair."""
        try:
            payload = decode_token(refresh_token_str)
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type",
                )
            user_id = uuid.UUID(payload.get("sub"))
        except (JWTError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

        token_hash = _hash_token(refresh_token_str)
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        res = await self.db.execute(stmt)
        stored_token = res.scalar_one_or_none()

        if not stored_token or stored_token.is_revoked or stored_token.expires_at < utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Revoked or expired refresh token",
            )

        # Revoke old refresh token (rotation)
        stored_token.is_revoked = True
        stored_token.revoked_at = utcnow()
        self.db.add(stored_token)

        user = await self.user_repo.get_with_profile(user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User inactive or not found",
            )

        college_id: uuid.UUID | None = None
        if user.student_profile:
            college_id = user.student_profile.college_id
        elif user.teacher_profile:
            college_id = user.teacher_profile.college_id

        role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
        new_access_token = create_access_token(user.id, role_str, college_id=college_id)
        new_refresh_token = create_refresh_token(user.id)

        # Store new refresh token
        new_refresh_expires = utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_DAYS)
        new_db_refresh = RefreshToken(
            user_id=user.id,
            token_hash=_hash_token(new_refresh_token),
            device_id=device_id or stored_token.device_id,
            expires_at=new_refresh_expires,
            is_revoked=False,
        )
        self.db.add(new_db_refresh)
        await self.db.commit()

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_MINUTES * 60,
            role=role_str,
            user_id=str(user.id),
        )

    async def logout(self, user_id: uuid.UUID, refresh_token_str: str | None = None) -> None:
        """Revoke user refresh tokens."""
        if refresh_token_str:
            token_hash = _hash_token(refresh_token_str)
            stmt = select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.user_id == user_id,
            )
            res = await self.db.execute(stmt)
            token = res.scalar_one_or_none()
            if token and not token.is_revoked:
                token.is_revoked = True
                token.revoked_at = utcnow()
                self.db.add(token)
                await self.db.commit()
        else:
            # Revoke all active tokens for this user
            stmt = select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked == False,
            )
            res = await self.db.execute(stmt)
            tokens = res.scalars().all()
            now = utcnow()
            for t in tokens:
                t.is_revoked = True
                t.revoked_at = now
                self.db.add(t)
            await self.db.commit()

    async def request_password_reset(self, email: str) -> str:
        """Generate a short-lived password reset token and store in Redis."""
        user = await self.user_repo.get_by_email(email)
        if not user:
            # Silent return to avoid email enumeration
            return "reset-requested"

        reset_token = str(uuid.uuid4())
        redis = await get_redis()
        # Store in redis with 15 min TTL
        key = f"pwd_reset:{reset_token}"
        await redis.setex(key, 900, str(user.id))
        return reset_token

    async def reset_password(self, token: str, new_password: str) -> bool:
        """Verify password reset token and update user password."""
        redis = await get_redis()
        key = f"pwd_reset:{token}"
        user_id_str = await redis.get(key)
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        user_id = uuid.UUID(user_id_str)
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        user.password_hash = hash_password(new_password)
        self.db.add(user)
        # Invalidate the token
        await redis.delete(key)
        # Revoke all refresh tokens
        await self.logout(user_id)
        await self.db.commit()
        return True

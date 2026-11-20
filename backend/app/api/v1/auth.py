from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserRead
from app.security.dependencies import get_current_user, get_db
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate with email and password, returning JWT access and refresh tokens."""
    auth_service = AuthService(db)
    return await auth_service.login(
        email=payload.email,
        password=payload.password,
        device_id=payload.device_id,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Exchange a valid refresh token for a new access/refresh token pair (token rotation)."""
    auth_service = AuthService(db)
    return await auth_service.refresh(
        refresh_token_str=payload.refresh_token,
        device_id=payload.device_id,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    payload: LogoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Revoke user refresh tokens."""
    auth_service = AuthService(db)
    await auth_service.logout(
        user_id=current_user.id,
        refresh_token_str=payload.refresh_token,
    )
    return MessageResponse(message="Successfully logged out")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Initiate password reset flow for provided email address."""
    auth_service = AuthService(db)
    token = await auth_service.request_password_reset(payload.email)
    return MessageResponse(
        message="If this email is registered, a password reset token has been issued",
        detail=f"Reset token (dev): {token}",
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Reset account password using valid reset token."""
    auth_service = AuthService(db)
    await auth_service.reset_password(
        token=payload.token,
        new_password=payload.new_password,
    )
    return MessageResponse(message="Password successfully reset. You may now log in.")


@router.get("/me", response_model=UserRead)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> User:
    """Return profile data of currently authenticated user."""
    return current_user

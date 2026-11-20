from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import TimestampedBase, UserRole

if TYPE_CHECKING:
    from app.models.student_profile import StudentProfile
    from app.models.teacher_profile import TeacherProfile
    from app.models.refresh_token import RefreshToken


class User(TimestampedBase):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name="user_role_enum", native_enum=False),
        nullable=False,
        default=UserRole.STUDENT,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    student_profile: Mapped[Optional[StudentProfile]] = relationship(
        "StudentProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    teacher_profile: Mapped[Optional[TeacherProfile]] = relationship(
        "TeacherProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    @property
    def roll_number(self) -> Optional[str]:
        if self.student_profile:
            return self.student_profile.roll_number
        return None

    @property
    def employee_id(self) -> Optional[str]:
        if self.teacher_profile:
            return self.teacher_profile.employee_id
        return None

    @property
    def designation(self) -> Optional[str]:
        if self.teacher_profile:
            return self.teacher_profile.designation
        return None

    @property
    def section_name(self) -> Optional[str]:
        if self.student_profile:
            return self.student_profile.section_name
        return None

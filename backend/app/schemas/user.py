import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.base import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str | None = None
    phone_number: str | None = None
    role: UserRole | str = UserRole.STUDENT
    avatar_url: str | None = None


class UserCreate(UserBase):
    password: str | None = None
    is_active: bool = True
    is_verified: bool = False
    roll_number: str | None = None
    employee_id: str | None = None
    department_name: str | None = None
    section_name: str | None = None
    designation: str | None = None
    enrollment_year: int | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    phone_number: str | None = None
    avatar_url: str | None = None
    is_active: bool | None = None
    is_verified: bool | None = None
    password: str | None = None
    role: UserRole | str | None = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    phone: str | None = None
    role: UserRole | str
    avatar_url: str | None = None
    is_active: bool
    is_verified: bool
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

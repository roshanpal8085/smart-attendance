import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CollegeBase(BaseModel):
    name: str
    code: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = "India"
    logo_url: str | None = None
    website: str | None = None
    is_active: bool = True


class CollegeCreate(CollegeBase):
    pass


class CollegeUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    logo_url: str | None = None
    website: str | None = None
    is_active: bool | None = None


class CollegeRead(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = "India"
    logo_url: str | None = None
    website: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

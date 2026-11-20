import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, HttpUrl


class CollegeBase(BaseModel):
    name: str
    code: str
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = "India"
    logo_url: str | None = None
    website: str | None = None


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


class CollegeRead(CollegeBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

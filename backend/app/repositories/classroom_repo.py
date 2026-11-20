import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.beacon import Beacon
from app.models.classroom import Classroom
from app.repositories.base import BaseRepository


class ClassroomRepository(BaseRepository[Classroom]):
    def __init__(self, db: AsyncSession):
        super().__init__(Classroom, db)

    async def get_with_beacon(self, classroom_id: uuid.UUID) -> Classroom | None:
        """Fetch classroom with attached BLE beacon loaded."""
        stmt = (
            select(Classroom)
            .where(Classroom.id == classroom_id)
            .options(selectinload(Classroom.beacon))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_college(
        self,
        college_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Classroom]:
        """Fetch all classrooms belonging to a specific college."""
        stmt = (
            select(Classroom)
            .where(Classroom.college_id == college_id)
            .options(selectinload(Classroom.beacon))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_beacon_uuid(self, beacon_uuid: str) -> Classroom | None:
        """Find classroom associated with a beacon BLE UUID."""
        stmt = (
            select(Classroom)
            .join(Beacon, Beacon.classroom_id == Classroom.id)
            .where(Beacon.uuid == beacon_uuid, Beacon.is_active == True)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

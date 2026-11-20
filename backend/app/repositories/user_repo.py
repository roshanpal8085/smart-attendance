import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        """Fetch user by exact email address."""
        stmt = select(User).where(User.email == email.lower().strip())
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_with_profile(self, user_id: uuid.UUID) -> User | None:
        """Fetch user with student and teacher profiles loaded."""
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.student_profile),
                selectinload(User.teacher_profile),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

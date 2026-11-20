import asyncio
import uuid
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.main import app
from app.security.dependencies import get_db, get_redis


class MockRedis:
    """In-memory Redis mock for unit & integration testing."""

    def __init__(self) -> None:
        self.store: dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self.store.get(key)

    async def setex(self, key: str, time: int, value: str) -> bool:
        self.store[key] = str(value)
        return True

    async def delete(self, key: str) -> int:
        if key in self.store:
            del self.store[key]
            return 1
        return 0

    async def ping(self) -> bool:
        return True

    async def aclose(self) -> None:
        pass

    async def publish(self, channel: str, message: str) -> int:
        return 1


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def mock_redis():
    return MockRedis()


@pytest_asyncio.fixture
async def client(mock_redis) -> AsyncGenerator[AsyncClient, None]:
    """Test client using AsyncClient and mock Redis."""
    app.dependency_overrides[get_redis] = lambda: mock_redis

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()

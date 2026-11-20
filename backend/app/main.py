import asyncio
import logging
import sys
from contextlib import asynccontextmanager

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text, select
import uuid

from app.api.v1.router import api_v1_router
from app.api.v1.sessions_ws import router as ws_router
from app.core.config import settings
from app.db.session import engine, AsyncSessionLocal
from app.models.user import User
from app.models.base import UserRole
from app.models.college import College
from app.models.department import Department
from app.security.hashing import hash_password
from app.middleware.cors import setup_cors
from app.middleware.exception_handler import setup_exception_handlers
from app.middleware.logging import setup_logging_middleware
from app.services.redis_client import close_redis, get_redis
from app.workers.session_expiry_worker import run_session_expiry_worker

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)

logger = logging.getLogger(__name__)


async def auto_seed_essentials():
    try:
        async with AsyncSessionLocal() as db:
            stmt = select(User).where(User.email == "admin@demo.edu")
            admin = (await db.execute(stmt)).scalar_one_or_none()
            if not admin:
                logger.info("Auto-seeding default admin: admin@demo.edu")
                admin = User(
                    id=uuid.uuid4(),
                    email="admin@demo.edu",
                    password_hash=hash_password("Admin@1234"),
                    full_name="System Administrator",
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_verified=True,
                )
                db.add(admin)
                await db.commit()

            c_stmt = select(College)
            college = (await db.execute(c_stmt)).scalars().first()
            if not college:
                logger.info("Auto-seeding default college")
                college = College(
                    id=uuid.uuid4(),
                    name="Demo University / College of Engineering",
                    code="COE-01",
                    city="Main Campus",
                    country="India",
                )
                db.add(college)
                await db.commit()
                await db.refresh(college)

            d_stmt = select(Department)
            dept = (await db.execute(d_stmt)).scalars().first()
            if not dept:
                logger.info("Auto-seeding default department")
                dept = Department(
                    id=uuid.uuid4(),
                    college_id=college.id,
                    name="Computer Science & Engineering",
                    code="CSE",
                )
                db.add(dept)
                await db.commit()
    except Exception as e:
        logger.warning("Auto-seed error (non-fatal): %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Starting %s v%s [env=%s]",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.APP_ENV,
    )

    await auto_seed_essentials()

    # Launch background worker for automated session expiry
    stop_event = asyncio.Event()
    worker_task = asyncio.create_task(
        run_session_expiry_worker(interval_seconds=10, stop_event=stop_event)
    )

    yield

    # Clean shutdown
    stop_event.set()
    worker_task.cancel()
    try:
        await worker_task
    except (asyncio.CancelledError, Exception):
        pass

    await close_redis()
    await engine.dispose()

    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend for a BLE-assisted continuous presence smart college attendance system.",
    lifespan=lifespan,
)

# Register Middleware and Handlers
setup_cors(app)
setup_logging_middleware(app)
setup_exception_handlers(app)

# Register API Routers
app.include_router(api_v1_router, prefix="/api/v1")
app.include_router(ws_router)  # root /ws/sessions/{session_id}


@app.get("/", tags=["General"])
async def root():
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "service": "smart-attendance-api",
        "version": settings.APP_VERSION,
    }


@app.get("/health/ready", tags=["Health"])
async def readiness():
    checks = {
        "postgresql": "unknown",
        "redis": "unknown",
    }

    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        checks["postgresql"] = "ok"
    except Exception:
        logger.exception("PostgreSQL readiness check failed")
        checks["postgresql"] = "error"

    try:
        redis = await get_redis()
        await redis.ping()
        checks["redis"] = "ok"
    except Exception:
        logger.exception("Redis readiness check failed")
        checks["redis"] = "error"

    is_ready = all(value == "ok" for value in checks.values())

    return JSONResponse(
        status_code=200 if is_ready else 503,
        content={
            "status": "ready" if is_ready else "not_ready",
            "checks": checks,
        },
    )
import asyncio
import logging
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.attendance_session import AttendanceSession
from app.models.base import SessionStatus
from app.services.redis_client import get_redis
from app.services.websocket_manager import ws_manager
from app.utils.datetime_utils import utcnow

logger = logging.getLogger(__name__)


async def check_expired_sessions() -> int:
    """Find and expire all attendance sessions that have exceeded their time window."""
    now = utcnow()
    expired_count = 0

    async with AsyncSessionLocal() as db:
        try:
            stmt = select(AttendanceSession).where(
                AttendanceSession.status == SessionStatus.ACTIVE,
                AttendanceSession.expires_at <= now,
            )
            res = await db.execute(stmt)
            sessions = res.scalars().all()

            if not sessions:
                return 0

            redis = None
            try:
                redis = await get_redis()
            except Exception:
                pass

            for s in sessions:
                s.status = SessionStatus.EXPIRED
                s.ended_at = now
                s.total_absent = max(0, s.total_enrolled - s.total_present)
                db.add(s)
                expired_count += 1

                # Clean up Redis cache
                if redis:
                    try:
                        await redis.delete(f"session:{s.id}")
                    except Exception:
                        pass

                # Notify connected WebSocket listeners
                await ws_manager.broadcast(
                    s.id,
                    {
                        "type": "session_expired",
                        "session_id": str(s.id),
                        "total_present": s.total_present,
                        "total_absent": s.total_absent,
                        "total_enrolled": s.total_enrolled,
                    },
                )

            await db.commit()
            logger.info("Session expiry worker expired %d sessions", expired_count)
        except Exception:
            logger.exception("Error during expired sessions sweep")
            await db.rollback()

    return expired_count


async def run_session_expiry_worker(
    interval_seconds: int = 10,
    stop_event: asyncio.Event | None = None,
) -> None:
    """Continuous background loop checking for expired sessions every interval_seconds."""
    logger.info("Session expiry worker started (interval=%ds)", interval_seconds)
    while True:
        if stop_event and stop_event.is_set():
            break
        try:
            await check_expired_sessions()
        except asyncio.CancelledError:
            logger.info("Session expiry worker cancelled")
            break
        except Exception as e:
            logger.error("Session expiry loop encountered error: %s", e)

        try:
            await asyncio.sleep(interval_seconds)
        except asyncio.CancelledError:
            break
    logger.info("Session expiry worker stopped")

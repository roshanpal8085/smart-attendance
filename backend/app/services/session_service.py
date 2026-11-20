import json
import secrets
import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.attendance_session import AttendanceSession
from app.models.base import ProximityMode, SessionStatus
from app.models.teacher_subject import TeacherSubjectAssignment
from app.repositories.session_repo import SessionRepository
from app.schemas.session import LiveAttendee, LiveSessionStatus
from app.services.redis_client import get_redis
from app.utils.datetime_utils import utcnow


class SessionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.session_repo = SessionRepository(db)

    def _redis_session_key(self, session_id: uuid.UUID) -> str:
        return f"session:{session_id}"

    async def create_session(
        self,
        teacher_id: uuid.UUID,
        subject_id: uuid.UUID,
        section_id: uuid.UUID,
        classroom_id: uuid.UUID,
        proximity_mode: ProximityMode = ProximityMode.BEACON,
    ) -> AttendanceSession:
        """Validate teacher assignment, generate cryptographic challenge, and start attendance session."""
        # 1. Validate that teacher is assigned to this subject and section
        stmt = select(TeacherSubjectAssignment).where(
            TeacherSubjectAssignment.teacher_id == teacher_id,
            TeacherSubjectAssignment.subject_id == subject_id,
            TeacherSubjectAssignment.section_id == section_id,
            TeacherSubjectAssignment.is_active == True,
        )
        res = await self.db.execute(stmt)
        assignment = res.scalar_one_or_none()
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Teacher is not assigned to this subject and section",
            )

        # 2. Check if there is already an active session for this teacher or subject/section
        existing_stmt = select(AttendanceSession).where(
            AttendanceSession.teacher_id == teacher_id,
            AttendanceSession.status == SessionStatus.ACTIVE,
            AttendanceSession.expires_at > utcnow(),
        )
        existing_res = await self.db.execute(existing_stmt)
        if existing_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An active attendance session is already in progress for this teacher",
            )

        # 3. Generate 32-byte cryptographic hex token
        session_challenge = secrets.token_hex(32)

        # 4. Create session in DB
        duration_seconds = settings.ATTENDANCE_SESSION_DURATION_SECONDS
        session = await self.session_repo.create_session(
            teacher_id=teacher_id,
            subject_id=subject_id,
            section_id=section_id,
            classroom_id=classroom_id,
            proximity_mode=proximity_mode,
            session_challenge=session_challenge,
            duration_seconds=duration_seconds,
        )

        # 5. Store session metadata in Redis with TTL
        try:
            redis = await get_redis()
            payload = {
                "session_id": str(session.id),
                "teacher_id": str(teacher_id),
                "subject_id": str(subject_id),
                "section_id": str(section_id),
                "classroom_id": str(classroom_id),
                "challenge": session_challenge,
                "expires_at": session.expires_at.isoformat(),
                "status": session.status.value,
            }
            # Give Redis TTL slightly longer than session window for smooth transition
            await redis.setex(
                self._redis_session_key(session.id),
                duration_seconds + 60,
                json.dumps(payload),
            )
        except Exception:
            pass

        return session

    async def get_active_session(self, session_id: uuid.UUID) -> AttendanceSession:
        """Fetch active session or raise 404 / 410 if expired."""
        session = await self.session_repo.get_by_id(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found",
            )

        if not await self.is_session_active(session_id, session):
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Attendance session has expired",
            )

        return session

    async def is_session_active(
        self,
        session_id: uuid.UUID,
        session: AttendanceSession | None = None,
    ) -> bool:
        """Check server-side clock whether session is currently active."""
        if session is None:
            session = await self.session_repo.get_by_id(session_id)
        if not session:
            return False

        if session.status != SessionStatus.ACTIVE:
            return False

        now = utcnow()
        if session.expires_at <= now:
            await self.expire_session(session_id)
            return False

        return True

    async def expire_session(self, session_id: uuid.UUID) -> None:
        """Transition session to EXPIRED status and update Redis."""
        await self.session_repo.expire_session(session_id)
        try:
            redis = await get_redis()
            await redis.delete(self._redis_session_key(session_id))
        except Exception:
            pass

    async def get_live_status(self, session_id: uuid.UUID) -> LiveSessionStatus:
        """Fetch real-time session progress and attendees."""
        data = await self.session_repo.get_live_status(session_id)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found",
            )

        recent = [
            LiveAttendee(
                student_id=a["student_id"],
                roll_number=a["roll_number"],
                full_name=a["full_name"],
                marked_at=a["marked_at"],
                reference_id=a["reference_id"],
            )
            for a in data["recent_attendees"]
        ]

        return LiveSessionStatus(
            session_id=data["session_id"],
            status=data["status"],
            proximity_mode=data["proximity_mode"],
            started_at=data["started_at"],
            expires_at=data["expires_at"],
            remaining_seconds=data["remaining_seconds"],
            total_enrolled=data["total_enrolled"],
            total_present=data["total_present"],
            total_absent=data["total_absent"],
            attendance_rate=data["attendance_rate"],
            recent_attendees=recent,
        )

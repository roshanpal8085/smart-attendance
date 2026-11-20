import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attendance_record import AttendanceRecord
from app.models.attendance_session import AttendanceSession
from app.models.base import SessionStatus, UserRole
from app.models.teacher_profile import TeacherProfile
from app.models.user import User
from app.repositories.session_repo import SessionRepository
from app.repositories.teacher_repo import TeacherRepository
from app.repositories.timetable_repo import TimetableRepository
from app.schemas.attendance import AttendanceRecordRead
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.session import (
    LiveSessionStatus,
    SessionCreate,
    SessionRead,
)
from app.schemas.teacher import (
    TeacherDashboard,
    TeacherProfileRead,
    TeacherSubjectItem,
)
from app.schemas.timetable import DayTimetable, DayTimetableItem
from app.security.dependencies import get_db, require_role
from app.services.session_service import SessionService
from app.utils.datetime_utils import utcnow

router = APIRouter(
    prefix="/teachers",
    tags=["Teachers"],
    dependencies=[Depends(require_role(UserRole.TEACHER, UserRole.ADMIN))],
)


async def get_current_teacher_profile(
    current_user: User = Depends(require_role(UserRole.TEACHER, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> TeacherProfile:
    """Resolve teacher profile entity for authenticated user."""
    teacher_repo = TeacherRepository(db)
    profile = await teacher_repo.get_by_user_id(current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher profile not found for this user account",
        )
    return profile


@router.get("/me/profile", response_model=TeacherProfileRead)
async def get_my_profile(
    profile: TeacherProfile = Depends(get_current_teacher_profile),
) -> TeacherProfile:
    """Fetch current teacher's faculty profile."""
    return profile


@router.get("/me/dashboard", response_model=TeacherDashboard)
async def get_my_dashboard(
    profile: TeacherProfile = Depends(get_current_teacher_profile),
    db: AsyncSession = Depends(get_db),
) -> TeacherDashboard:
    """Fetch teacher dashboard metrics and schedule counts."""
    teacher_repo = TeacherRepository(db)
    data = await teacher_repo.get_dashboard_data(profile.id)
    return TeacherDashboard(**data)


@router.get("/me/timetable/today", response_model=DayTimetable)
async def get_my_today_timetable(
    profile: TeacherProfile = Depends(get_current_teacher_profile),
    db: AsyncSession = Depends(get_db),
) -> DayTimetable:
    """Fetch today's teaching slots for current teacher."""
    timetable_repo = TimetableRepository(db)
    today_dow = utcnow().weekday()
    items = await timetable_repo.get_today_schedule_for_teacher(profile.id, today_dow)
    return DayTimetable(
        day_of_week=today_dow,
        academic_year="2026-2027",
        items=[DayTimetableItem(**item) for item in items],
    )


@router.get("/me/subjects", response_model=list[TeacherSubjectItem])
async def get_my_assigned_subjects(
    profile: TeacherProfile = Depends(get_current_teacher_profile),
    db: AsyncSession = Depends(get_db),
) -> list[TeacherSubjectItem]:
    """List all subjects and sections assigned to teacher."""
    teacher_repo = TeacherRepository(db)
    assignments = await teacher_repo.get_assigned_subjects(profile.id)
    return [
        TeacherSubjectItem(
            assignment_id=a.id,
            subject_id=a.subject_id,
            subject_name=a.subject.name,
            subject_code=a.subject.code,
            section_id=a.section_id,
            section_name=a.section.name,
            classroom_id=a.classroom_id,
            classroom_name=a.classroom.name if a.classroom else None,
            academic_year=a.academic_year,
        )
        for a in assignments
    ]


@router.post("/sessions", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
async def create_attendance_session(
    payload: SessionCreate,
    profile: TeacherProfile = Depends(get_current_teacher_profile),
    db: AsyncSession = Depends(get_db),
) -> AttendanceSession:
    """Initiate a 120-second live BLE attendance session."""
    session_service = SessionService(db)
    session = await session_service.create_session(
        teacher_id=profile.id,
        subject_id=payload.subject_id,
        section_id=payload.section_id,
        classroom_id=payload.classroom_id,
        proximity_mode=payload.proximity_mode,
    )
    return session


@router.get("/sessions/{session_id}", response_model=SessionRead)
async def get_session_details(
    session_id: uuid.UUID,
    profile: TeacherProfile = Depends(get_current_teacher_profile),
    db: AsyncSession = Depends(get_db),
) -> AttendanceSession:
    """Get details of a specific attendance session."""
    session_repo = SessionRepository(db)
    session = await session_repo.get_by_id(session_id)
    if not session or session.teacher_id != profile.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found",
        )
    return session


@router.get("/sessions/{session_id}/live", response_model=LiveSessionStatus)
async def get_live_session_status(
    session_id: uuid.UUID,
    profile: TeacherProfile = Depends(get_current_teacher_profile),
    db: AsyncSession = Depends(get_db),
) -> LiveSessionStatus:
    """Get real-time live attendance status and attendees count."""
    session_service = SessionService(db)
    # verify ownership
    session = await session_service.session_repo.get_by_id(session_id)
    if not session or session.teacher_id != profile.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found",
        )
    return await session_service.get_live_status(session_id)


@router.delete("/sessions/{session_id}", response_model=MessageResponse)
async def end_attendance_session(
    session_id: uuid.UUID,
    profile: TeacherProfile = Depends(get_current_teacher_profile),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """End or cancel an ongoing attendance session."""
    session_service = SessionService(db)
    session = await session_service.session_repo.get_by_id(session_id)
    if not session or session.teacher_id != profile.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found",
        )
    await session_service.expire_session(session_id)
    return MessageResponse(message="Attendance session successfully concluded")


@router.get("/sessions/{session_id}/attendance", response_model=list[AttendanceRecordRead])
async def get_session_attendance(
    session_id: uuid.UUID,
    profile: TeacherProfile = Depends(get_current_teacher_profile),
    db: AsyncSession = Depends(get_db),
) -> list[AttendanceRecord]:
    """Retrieve full list of attendance records for a session."""
    session_repo = SessionRepository(db)
    session = await session_repo.get_by_id(session_id)
    if not session or session.teacher_id != profile.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found",
        )

    stmt = (
        select(AttendanceRecord)
        .where(AttendanceRecord.session_id == session_id)
        .order_by(AttendanceRecord.marked_at.asc())
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())


@router.get("/sessions", response_model=PaginatedResponse[SessionRead])
async def list_teacher_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[SessionStatus] = Query(None, alias="status"),
    profile: TeacherProfile = Depends(get_current_teacher_profile),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[SessionRead]:
    """List teacher's historical attendance sessions with pagination."""
    session_repo = SessionRepository(db)
    skip = (page - 1) * page_size
    filters = {"teacher_id": profile.id}
    if status_filter:
        filters["status"] = status_filter

    items = await session_repo.list(skip=skip, limit=page_size, **filters)
    total = await session_repo.count(**filters)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0

    return PaginatedResponse(
        items=[SessionRead.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )

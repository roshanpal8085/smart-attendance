import uuid
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.base import UserRole
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.repositories.student_repo import StudentRepository
from app.repositories.timetable_repo import TimetableRepository
from app.schemas.attendance import (
    AttendanceDateMatrix,
    AttendanceHistoryItem,
    AttendanceRecordRead,
    MarkAttendanceRequest,
)
from app.schemas.presence import (
    PresenceEvidenceRead,
    PresenceEvidenceSubmit,
    PresenceWindowStatus,
)
from app.schemas.student import (
    AttendanceSummary,
    StudentDashboard,
    StudentProfileRead,
)
from app.schemas.timetable import DayTimetable, DayTimetableItem
from app.security.dependencies import get_db, require_role
from app.services.attendance_service import AttendanceService
from app.services.presence_service import PresenceService
from app.utils.datetime_utils import utcnow

router = APIRouter(
    prefix="/students",
    tags=["Students"],
    dependencies=[Depends(require_role(UserRole.STUDENT, UserRole.ADMIN))],
)


async def get_current_student_profile(
    current_user: User = Depends(require_role(UserRole.STUDENT, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> StudentProfile:
    """Resolve student profile entity for authenticated user."""
    student_repo = StudentRepository(db)
    profile = await student_repo.get_by_user_id(current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found for this user account",
        )
    return profile


@router.get("/me/profile", response_model=StudentProfileRead)
async def get_my_profile(
    profile: StudentProfile = Depends(get_current_student_profile),
) -> StudentProfile:
    """Fetch current student's academic profile."""
    return profile


@router.get("/me/dashboard", response_model=StudentDashboard)
async def get_my_dashboard(
    profile: StudentProfile = Depends(get_current_student_profile),
    db: AsyncSession = Depends(get_db),
) -> StudentDashboard:
    """Fetch current student's main dashboard metrics."""
    student_repo = StudentRepository(db)
    data = await student_repo.get_dashboard_data(profile.id)
    return StudentDashboard(**data)


@router.get("/me/timetable/today", response_model=DayTimetable)
async def get_my_today_timetable(
    profile: StudentProfile = Depends(get_current_student_profile),
    db: AsyncSession = Depends(get_db),
) -> DayTimetable:
    """Fetch today's scheduled classes for current student."""
    timetable_repo = TimetableRepository(db)
    today_dow = utcnow().weekday()
    items = await timetable_repo.get_today_schedule_for_student(profile.id, today_dow)
    return DayTimetable(
        day_of_week=today_dow,
        academic_year="2026-2027",
        items=[DayTimetableItem(**item) for item in items],
    )


@router.get("/me/attendance/summary", response_model=AttendanceSummary)
async def get_my_attendance_summary(
    profile: StudentProfile = Depends(get_current_student_profile),
    db: AsyncSession = Depends(get_db),
) -> AttendanceSummary:
    """Fetch aggregated attendance statistics across all subjects."""
    attendance_service = AttendanceService(db)
    return await attendance_service.get_attendance_summary(profile.id)


@router.get("/me/attendance/history", response_model=list[AttendanceHistoryItem])
async def get_my_attendance_history(
    subject_id: Optional[uuid.UUID] = Query(None, description="Filter by subject UUID"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    profile: StudentProfile = Depends(get_current_student_profile),
    db: AsyncSession = Depends(get_db),
) -> list[AttendanceHistoryItem]:
    """Retrieve chronological attendance history for student."""
    attendance_service = AttendanceService(db)
    return await attendance_service.get_student_history(
        student_id=profile.id,
        subject_id=subject_id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/me/attendance/matrix", response_model=AttendanceDateMatrix)
async def get_my_attendance_matrix(
    subject_id: uuid.UUID = Query(..., description="Subject UUID to inspect"),
    month: int = Query(..., ge=1, le=12, description="Month number 1-12"),
    year: int = Query(..., ge=2020, le=2050, description="Year, e.g. 2026"),
    profile: StudentProfile = Depends(get_current_student_profile),
    db: AsyncSession = Depends(get_db),
) -> AttendanceDateMatrix:
    """Fetch calendar-matrix attendance for a given subject, month, and year."""
    attendance_service = AttendanceService(db)
    return await attendance_service.get_date_matrix(
        student_id=profile.id,
        subject_id=subject_id,
        month=month,
        year=year,
    )


@router.post("/me/presence/evidence", response_model=PresenceEvidenceRead)
async def submit_presence_evidence(
    payload: PresenceEvidenceSubmit,
    profile: StudentProfile = Depends(get_current_student_profile),
    db: AsyncSession = Depends(get_db),
) -> PresenceEvidenceRead:
    """Submit background BLE beacon scan evidence to establish physical presence."""
    presence_service = PresenceService(db)
    evidence = await presence_service.submit_evidence(
        student_id=profile.id,
        classroom_id=payload.classroom_id,
        evidence_type=payload.evidence_type,
        beacon_uuid=payload.beacon_uuid,
        rssi=payload.rssi,
        tx_power=payload.tx_power,
        recorded_at=payload.recorded_at,
        session_id=payload.session_id,
    )
    return PresenceEvidenceRead.model_validate(evidence)


@router.get("/me/presence/status", response_model=PresenceWindowStatus)
async def get_presence_status(
    classroom_id: uuid.UUID = Query(..., description="Classroom UUID to check"),
    profile: StudentProfile = Depends(get_current_student_profile),
    db: AsyncSession = Depends(get_db),
) -> PresenceWindowStatus:
    """Check continuous presence status and eligibility in a specific classroom."""
    presence_service = PresenceService(db)
    seq_start, duration = await presence_service.get_presence_window(profile.id, classroom_id)
    is_eligible = duration >= settings.PRESENCE_WINDOW_REQUIRED_SECONDS

    return PresenceWindowStatus(
        student_id=profile.id,
        classroom_id=classroom_id,
        continuous_seconds=duration,
        required_seconds=settings.PRESENCE_WINDOW_REQUIRED_SECONDS,
        is_eligible=is_eligible,
        sequence_start=seq_start,
        last_detected_at=utcnow() if duration > 0 else None,
    )


@router.post("/me/attendance/mark", response_model=AttendanceRecordRead)
async def mark_attendance(
    payload: MarkAttendanceRequest,
    request: Request,
    profile: StudentProfile = Depends(get_current_student_profile),
    db: AsyncSession = Depends(get_db),
) -> AttendanceRecordRead:
    """Mark attendance for an active session with full server-side presence validation."""
    attendance_service = AttendanceService(db)
    client_ip = request.client.host if request.client else None

    record = await attendance_service.mark_attendance(
        student_id=profile.id,
        session_id=payload.session_id,
        biometric_verified=payload.biometric_verified,
        biometric_type=payload.biometric_type,
        device_id=payload.device_id,
        ip_address=client_ip,
    )
    return AttendanceRecordRead.model_validate(record)

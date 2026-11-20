import uuid
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attendance_record import AttendanceRecord
from app.models.attendance_session import AttendanceSession
from app.models.base import AttendanceStatus, SessionStatus, UserRole
from app.models.beacon import Beacon
from app.models.classroom import Classroom
from app.models.college import College
from app.models.department import Department
from app.models.enrollment import Enrollment
from app.models.section import Section
from app.models.student_profile import StudentProfile
from app.models.subject import Subject
from app.models.teacher_profile import TeacherProfile
from app.models.teacher_subject import TeacherSubjectAssignment
from app.models.timetable import TimetableSlot
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.beacon import BeaconCreate, BeaconRead, BeaconUpdate
from app.schemas.classroom import ClassroomCreate, ClassroomRead, ClassroomUpdate
from app.schemas.college import CollegeCreate, CollegeRead, CollegeUpdate
from app.schemas.common import MessageResponse, PaginatedResponse
from app.schemas.department import DepartmentCreate, DepartmentRead
from app.schemas.enrollment import BulkEnrollmentRequest, EnrollmentRead
from app.schemas.section import SectionCreate, SectionRead, SectionUpdate
from app.schemas.subject import SubjectCreate, SubjectRead, SubjectUpdate
from app.schemas.timetable import (
    TeacherSubjectAssignmentCreate,
    TeacherSubjectAssignmentRead,
    TimetableSlotCreate,
    TimetableSlotRead,
)
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.security.dependencies import get_db, require_role
from app.security.hashing import hash_password

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)


# ==========================================
# 1. COLLEGE CRUD
# ==========================================

@router.post("/colleges", response_model=CollegeRead, status_code=status.HTTP_201_CREATED)
async def create_college(payload: CollegeCreate, db: AsyncSession = Depends(get_db)) -> College:
    repo = BaseRepository(College, db)
    return await repo.create(payload)


@router.get("/colleges", response_model=list[CollegeRead])
async def list_colleges(db: AsyncSession = Depends(get_db)) -> list[College]:
    repo = BaseRepository(College, db)
    return list(await repo.list(limit=500))


@router.get("/colleges/{college_id}", response_model=CollegeRead)
async def get_college(college_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> College:
    repo = BaseRepository(College, db)
    college = await repo.get_by_id(college_id)
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    return college


@router.put("/colleges/{college_id}", response_model=CollegeRead)
async def update_college(
    college_id: uuid.UUID,
    payload: CollegeUpdate,
    db: AsyncSession = Depends(get_db),
) -> College:
    repo = BaseRepository(College, db)
    college = await repo.get_by_id(college_id)
    if not college:
        raise HTTPException(status_code=404, detail="College not found")
    return await repo.update(college, payload)


@router.delete("/colleges/{college_id}", response_model=MessageResponse)
async def delete_college(college_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    repo = BaseRepository(College, db)
    if not await repo.delete(college_id):
        raise HTTPException(status_code=404, detail="College not found")
    return MessageResponse(message="College successfully deleted")


# ==========================================
# 2. DEPARTMENT CRUD
# ==========================================

@router.post("/departments", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
async def create_department(payload: DepartmentCreate, db: AsyncSession = Depends(get_db)) -> Department:
    repo = BaseRepository(Department, db)
    return await repo.create(payload)


@router.get("/departments", response_model=list[DepartmentRead])
async def list_departments(
    college_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
) -> list[Department]:
    repo = BaseRepository(Department, db)
    filters = {"college_id": college_id} if college_id else {}
    return list(await repo.list(limit=500, **filters))


@router.get("/departments/{department_id}", response_model=DepartmentRead)
async def get_department(department_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Department:
    repo = BaseRepository(Department, db)
    dept = await repo.get_by_id(department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.delete("/departments/{department_id}", response_model=MessageResponse)
async def delete_department(department_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    repo = BaseRepository(Department, db)
    if not await repo.delete(department_id):
        raise HTTPException(status_code=404, detail="Department not found")
    return MessageResponse(message="Department successfully deleted")


# ==========================================
# 3. CLASSROOM CRUD
# ==========================================

@router.post("/classrooms", response_model=ClassroomRead, status_code=status.HTTP_201_CREATED)
async def create_classroom(payload: ClassroomCreate, db: AsyncSession = Depends(get_db)) -> Classroom:
    repo = BaseRepository(Classroom, db)
    return await repo.create(payload)


@router.get("/classrooms", response_model=list[ClassroomRead])
async def list_classrooms(
    college_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
) -> list[Classroom]:
    repo = BaseRepository(Classroom, db)
    filters = {"college_id": college_id} if college_id else {}
    return list(await repo.list(limit=500, **filters))


@router.get("/classrooms/{classroom_id}", response_model=ClassroomRead)
async def get_classroom(classroom_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Classroom:
    repo = BaseRepository(Classroom, db)
    room = await repo.get_by_id(classroom_id)
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return room


@router.put("/classrooms/{classroom_id}", response_model=ClassroomRead)
async def update_classroom(
    classroom_id: uuid.UUID,
    payload: ClassroomUpdate,
    db: AsyncSession = Depends(get_db),
) -> Classroom:
    repo = BaseRepository(Classroom, db)
    room = await repo.get_by_id(classroom_id)
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return await repo.update(room, payload)


@router.delete("/classrooms/{classroom_id}", response_model=MessageResponse)
async def delete_classroom(classroom_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    repo = BaseRepository(Classroom, db)
    if not await repo.delete(classroom_id):
        raise HTTPException(status_code=404, detail="Classroom not found")
    return MessageResponse(message="Classroom successfully deleted")


# ==========================================
# 4. BEACON CRUD
# ==========================================

@router.post("/beacons", response_model=BeaconRead, status_code=status.HTTP_201_CREATED)
async def create_beacon(payload: BeaconCreate, db: AsyncSession = Depends(get_db)) -> Beacon:
    repo = BaseRepository(Beacon, db)
    return await repo.create(payload)


@router.get("/beacons", response_model=list[BeaconRead])
async def list_beacons(db: AsyncSession = Depends(get_db)) -> list[Beacon]:
    repo = BaseRepository(Beacon, db)
    return list(await repo.list(limit=500))


@router.get("/beacons/{beacon_id}", response_model=BeaconRead)
async def get_beacon(beacon_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Beacon:
    repo = BaseRepository(Beacon, db)
    beacon = await repo.get_by_id(beacon_id)
    if not beacon:
        raise HTTPException(status_code=404, detail="Beacon not found")
    return beacon


@router.put("/beacons/{beacon_id}", response_model=BeaconRead)
async def update_beacon(
    beacon_id: uuid.UUID,
    payload: BeaconUpdate,
    db: AsyncSession = Depends(get_db),
) -> Beacon:
    repo = BaseRepository(Beacon, db)
    beacon = await repo.get_by_id(beacon_id)
    if not beacon:
        raise HTTPException(status_code=404, detail="Beacon not found")
    return await repo.update(beacon, payload)


@router.delete("/beacons/{beacon_id}", response_model=MessageResponse)
async def delete_beacon(beacon_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    repo = BaseRepository(Beacon, db)
    if not await repo.delete(beacon_id):
        raise HTTPException(status_code=404, detail="Beacon not found")
    return MessageResponse(message="Beacon successfully deleted")


# ==========================================
# 5. SUBJECT CRUD
# ==========================================

@router.post("/subjects", response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
async def create_subject(payload: SubjectCreate, db: AsyncSession = Depends(get_db)) -> Subject:
    repo = BaseRepository(Subject, db)
    return await repo.create(payload)


@router.get("/subjects", response_model=list[SubjectRead])
async def list_subjects(
    department_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
) -> list[Subject]:
    repo = BaseRepository(Subject, db)
    filters = {"department_id": department_id} if department_id else {}
    return list(await repo.list(limit=500, **filters))


@router.get("/subjects/{subject_id}", response_model=SubjectRead)
async def get_subject(subject_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Subject:
    repo = BaseRepository(Subject, db)
    subj = await repo.get_by_id(subject_id)
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subj


@router.put("/subjects/{subject_id}", response_model=SubjectRead)
async def update_subject(
    subject_id: uuid.UUID,
    payload: SubjectUpdate,
    db: AsyncSession = Depends(get_db),
) -> Subject:
    repo = BaseRepository(Subject, db)
    subj = await repo.get_by_id(subject_id)
    if not subj:
        raise HTTPException(status_code=404, detail="Subject not found")
    return await repo.update(subj, payload)


@router.delete("/subjects/{subject_id}", response_model=MessageResponse)
async def delete_subject(subject_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    repo = BaseRepository(Subject, db)
    if not await repo.delete(subject_id):
        raise HTTPException(status_code=404, detail="Subject not found")
    return MessageResponse(message="Subject successfully deleted")


# ==========================================
# 6. SECTION CRUD
# ==========================================

@router.post("/sections", response_model=SectionRead, status_code=status.HTTP_201_CREATED)
async def create_section(payload: SectionCreate, db: AsyncSession = Depends(get_db)) -> Section:
    repo = BaseRepository(Section, db)
    return await repo.create(payload)


@router.get("/sections", response_model=list[SectionRead])
async def list_sections(
    department_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
) -> list[Section]:
    repo = BaseRepository(Section, db)
    filters = {"department_id": department_id} if department_id else {}
    return list(await repo.list(limit=500, **filters))


@router.get("/sections/{section_id}", response_model=SectionRead)
async def get_section(section_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Section:
    repo = BaseRepository(Section, db)
    sec = await repo.get_by_id(section_id)
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")
    return sec


@router.put("/sections/{section_id}", response_model=SectionRead)
async def update_section(
    section_id: uuid.UUID,
    payload: SectionUpdate,
    db: AsyncSession = Depends(get_db),
) -> Section:
    repo = BaseRepository(Section, db)
    sec = await repo.get_by_id(section_id)
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")
    return await repo.update(sec, payload)


@router.delete("/sections/{section_id}", response_model=MessageResponse)
async def delete_section(section_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    repo = BaseRepository(Section, db)
    if not await repo.delete(section_id):
        raise HTTPException(status_code=404, detail="Section not found")
    return MessageResponse(message="Section successfully deleted")


# ==========================================
# 7. USER MANAGEMENT CRUD
# ==========================================

@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> User:
    """Create a new user with hashed Argon2id password."""
    repo = BaseRepository(User, db)
    existing_stmt = select(User).where(User.email == payload.email.lower().strip())
    existing = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="User email already registered")

    user_dict = payload.model_dump()
    user_dict["email"] = payload.email.lower().strip()
    user_dict["password_hash"] = hash_password(user_dict.pop("password"))
    user = User(**user_dict)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/users", response_model=PaginatedResponse[UserRead])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[UserRead]:
    user_role = None
    if role:
        try:
            user_role = UserRole(role.lower())
        except ValueError:
            pass
    repo = BaseRepository(User, db)
    skip = (page - 1) * page_size
    filters = {"role": user_role} if user_role else {}
    users = await repo.list(skip=skip, limit=page_size, **filters)
    total = await repo.count(**filters)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0

    return PaginatedResponse(
        items=[UserRead.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/users/{user_id}", response_model=UserRead)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> User:
    repo = BaseRepository(User, db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
) -> User:
    repo = BaseRepository(User, db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await repo.update(user, payload)


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    repo = BaseRepository(User, db)
    if not await repo.delete(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return MessageResponse(message="User successfully deleted")


# ==========================================
# 8. ENROLLMENTS & ASSIGNMENTS
# ==========================================

@router.post("/enrollments", response_model=list[EnrollmentRead], status_code=status.HTTP_201_CREATED)
async def bulk_enroll_students(
    payload: BulkEnrollmentRequest,
    db: AsyncSession = Depends(get_db),
) -> list[Enrollment]:
    """Bulk enroll students into a subject and section."""
    created = []
    for sid in payload.student_ids:
        # Check duplicate
        stmt = select(Enrollment).where(
            Enrollment.student_id == sid,
            Enrollment.subject_id == payload.subject_id,
            Enrollment.section_id == payload.section_id,
        )
        existing = (await db.execute(stmt)).scalar_one_or_none()
        if not existing:
            enroll = Enrollment(
                student_id=sid,
                subject_id=payload.subject_id,
                section_id=payload.section_id,
                academic_year=payload.academic_year,
                is_active=True,
            )
            db.add(enroll)
            created.append(enroll)

    await db.commit()
    for e in created:
        await db.refresh(e)
    return created


@router.post("/teacher-assignments", response_model=TeacherSubjectAssignmentRead, status_code=status.HTTP_201_CREATED)
async def create_teacher_assignment(
    payload: TeacherSubjectAssignmentCreate,
    db: AsyncSession = Depends(get_db),
) -> TeacherSubjectAssignment:
    """Assign a teacher to teach a subject and section."""
    repo = BaseRepository(TeacherSubjectAssignment, db)
    return await repo.create(payload)


@router.post("/timetable", response_model=TimetableSlotRead, status_code=status.HTTP_201_CREATED)
async def create_timetable_slot(
    payload: TimetableSlotCreate,
    db: AsyncSession = Depends(get_db),
) -> TimetableSlot:
    """Create a weekly schedule slot."""
    repo = BaseRepository(TimetableSlot, db)
    return await repo.create(payload)


# ==========================================
# 9. REPORTS & DASHBOARD
# ==========================================

@router.get("/reports/attendance")
async def get_attendance_report(
    section_id: Optional[uuid.UUID] = None,
    subject_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Generate attendance statistics and records for reporting."""
    stmt = (
        select(AttendanceRecord, StudentProfile.roll_number, User.full_name)
        .join(StudentProfile, AttendanceRecord.student_id == StudentProfile.id)
        .join(User, StudentProfile.user_id == User.id)
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
    )
    if section_id:
        stmt = stmt.where(AttendanceSession.section_id == section_id)
    if subject_id:
        stmt = stmt.where(AttendanceSession.subject_id == subject_id)
    if start_date:
        stmt = stmt.where(AttendanceRecord.marked_at >= start_date)
    if end_date:
        stmt = stmt.where(AttendanceRecord.marked_at <= end_date)

    res = await db.execute(stmt)
    rows = res.all()

    total_records = len(rows)
    present_count = sum(1 for r, _, _ in rows if r.status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE))

    return {
        "total_records": total_records,
        "present_count": present_count,
        "absent_count": total_records - present_count,
        "average_attendance_percentage": round((present_count / total_records * 100), 2) if total_records > 0 else 0.0,
        "records": [
            {
                "record_id": r.id,
                "roll_number": roll,
                "student_name": name,
                "marked_at": r.marked_at,
                "status": r.status.value if hasattr(r.status, "value") else str(r.status),
                "biometric_verified": r.biometric_verified,
            }
            for r, roll, name in rows
        ],
    }


@router.get("/reports/sessions")
async def get_sessions_report(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Generate session completion reports with attendance rates."""
    skip = (page - 1) * page_size
    stmt = (
        select(AttendanceSession, Subject.name, Section.name)
        .join(Subject, AttendanceSession.subject_id == Subject.id)
        .join(Section, AttendanceSession.section_id == Section.id)
        .order_by(AttendanceSession.started_at.desc())
        .offset(skip)
        .limit(page_size)
    )
    res = await db.execute(stmt)

    sessions_data = []
    for sess, subj_name, sec_name in res.all():
        pct = round((sess.total_present / sess.total_enrolled * 100), 2) if sess.total_enrolled > 0 else 0.0
        sessions_data.append({
            "session_id": sess.id,
            "subject_name": subj_name,
            "section_name": sec_name,
            "started_at": sess.started_at,
            "ended_at": sess.ended_at,
            "status": sess.status.value if hasattr(sess.status, "value") else str(sess.status),
            "total_enrolled": sess.total_enrolled,
            "total_present": sess.total_present,
            "total_absent": sess.total_absent,
            "attendance_rate": pct,
        })

    return {"sessions": sessions_data}


@router.get("/dashboard/stats")
async def get_system_dashboard_stats(db: AsyncSession = Depends(get_db)) -> dict:
    """System-wide summary metrics for administrators."""
    total_students = (await db.execute(select(func.count(StudentProfile.id)))).scalar_one() or 0
    total_teachers = (await db.execute(select(func.count(TeacherProfile.id)))).scalar_one() or 0
    total_classrooms = (await db.execute(select(func.count(Classroom.id)))).scalar_one() or 0
    active_sessions = (
        await db.execute(
            select(func.count(AttendanceSession.id)).where(AttendanceSession.status == SessionStatus.ACTIVE)
        )
    ).scalar_one() or 0
    total_records = (await db.execute(select(func.count(AttendanceRecord.id)))).scalar_one() or 0
    present_records = (
        await db.execute(
            select(func.count(AttendanceRecord.id)).where(
                AttendanceRecord.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.LATE])
            )
        )
    ).scalar_one() or 0

    overall_rate = round((present_records / total_records * 100), 2) if total_records > 0 else 0.0

    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_classrooms": total_classrooms,
        "active_sessions": active_sessions,
        "total_attendance_records": total_records,
        "overall_attendance_rate": overall_rate,
    }

# ---------------------------------------------------------------------------
# Admin Sessions Endpoints (Create, View, Attendance, End ANY session)
# ---------------------------------------------------------------------------
from pydantic import BaseModel
from app.models.base import ProximityMode
from app.utils.datetime_utils import utcnow
from app.services.session_service import SessionService
from app.models.teacher_subject import TeacherSubjectAssignment


class AdminSessionCreate(BaseModel):
    teacher_id: uuid.UUID
    subject_id: uuid.UUID
    section_id: uuid.UUID
    classroom_id: uuid.UUID
    proximity_mode: Optional[str] = None


@router.post("/sessions", response_model=dict, status_code=status.HTTP_201_CREATED)
async def admin_create_session(
    payload: AdminSessionCreate,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Admin endpoint to start a live attendance session with BLE Beacon or Phone."""
    # 1. Resolve TeacherProfile: could be TeacherProfile.id or User.id
    t_prof_res = await db.execute(
        select(TeacherProfile, User.full_name)
        .join(User, TeacherProfile.user_id == User.id)
        .where(
            (TeacherProfile.id == payload.teacher_id) | (TeacherProfile.user_id == payload.teacher_id)
        )
    )
    t_prof_row = t_prof_res.first()
    if not t_prof_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher profile not found for the given teacher_id",
        )
    teacher_profile, teacher_full_name = t_prof_row
    teacher_profile_id = teacher_profile.id

    # 2. Classroom & Proximity Mode lookup
    classroom_res = await db.execute(
        select(Classroom).where(Classroom.id == payload.classroom_id)
    )
    classroom = classroom_res.scalars().first()
    if not classroom:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found")

    proximity_mode = classroom.proximity_mode or ProximityMode.BEACON
    if payload.proximity_mode:
        try:
            proximity_mode = ProximityMode(payload.proximity_mode.lower())
        except ValueError:
            pass

    # 3. Ensure assignment exists for this teacher, subject, section
    assign_stmt = select(TeacherSubjectAssignment).where(
        TeacherSubjectAssignment.teacher_id == teacher_profile_id,
        TeacherSubjectAssignment.subject_id == payload.subject_id,
        TeacherSubjectAssignment.section_id == payload.section_id,
    )
    assign_res = await db.execute(assign_stmt)
    assignment = assign_res.scalars().first()
    if not assignment:
        assignment = TeacherSubjectAssignment(
            teacher_id=teacher_profile_id,
            subject_id=payload.subject_id,
            section_id=payload.section_id,
            classroom_id=payload.classroom_id,
            academic_year="2026-2027",
            is_active=True,
        )
        db.add(assignment)
        await db.commit()

    # 4. If any stale active session exists for this teacher, expire it first
    stale_stmt = select(AttendanceSession).where(
        AttendanceSession.teacher_id == teacher_profile_id,
        AttendanceSession.status == SessionStatus.ACTIVE,
    )
    stale_res = await db.execute(stale_stmt)
    for stale_session in stale_res.scalars().all():
        stale_session.status = SessionStatus.EXPIRED
        stale_session.ended_at = utcnow()
        db.add(stale_session)
    await db.commit()

    # 5. Create new session via SessionService (generates token & pushes to Redis)
    session_service = SessionService(db)
    session = await session_service.create_session(
        teacher_id=teacher_profile_id,
        subject_id=payload.subject_id,
        section_id=payload.section_id,
        classroom_id=payload.classroom_id,
        proximity_mode=proximity_mode,
    )

    subj_res = await db.execute(select(Subject.name).where(Subject.id == payload.subject_id))
    subj_name = subj_res.scalar_one_or_none() or "Subject"

    sec_res = await db.execute(select(Section.name).where(Section.id == payload.section_id))
    sec_name = sec_res.scalar_one_or_none() or "Section"

    return {
        "id": str(session.id),
        "teacher_id": str(teacher_profile.user_id),
        "teacher_name": teacher_full_name,
        "subject_id": str(payload.subject_id),
        "subject_name": subj_name,
        "section_id": str(payload.section_id),
        "section_name": sec_name,
        "classroom_id": str(payload.classroom_id),
        "classroom_name": classroom.name,
        "proximity_mode": proximity_mode.value if hasattr(proximity_mode, "value") else str(proximity_mode),
        "status": session.status.value if hasattr(session.status, "value") else str(session.status),
        "session_challenge": session.session_challenge,
        "started_at": session.started_at.isoformat(),
        "expires_at": session.expires_at.isoformat(),
        "total_enrolled": session.total_enrolled,
        "total_present": session.total_present,
        "total_absent": session.total_absent,
        "attendance_rate": 0.0,
    }


@router.get("/sessions", response_model=dict)
async def admin_list_sessions(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """List ALL attendance sessions with teacher, subject, section, and classroom names."""
    skip = (page - 1) * page_size
    stmt = (
        select(
            AttendanceSession,
            Subject.name.label("subject_name"),
            Section.name.label("section_name"),
        )
        .join(Subject, AttendanceSession.subject_id == Subject.id)
        .join(Section, AttendanceSession.section_id == Section.id)
        .order_by(AttendanceSession.started_at.desc())
        .offset(skip)
        .limit(page_size)
    )
    if status_filter:
        try:
            sf = SessionStatus(status_filter.upper())
            stmt = stmt.where(AttendanceSession.status == sf)
        except ValueError:
            pass

    res = await db.execute(stmt)
    rows = res.all()

    # Teacher names lookup via TeacherProfile -> User
    teacher_ids = list({row[0].teacher_id for row in rows})
    teacher_map: dict = {}
    if teacher_ids:
        t_res = await db.execute(
            select(TeacherProfile.id, User.full_name)
            .join(User, TeacherProfile.user_id == User.id)
            .where(TeacherProfile.id.in_(teacher_ids))
        )
        teacher_map = {str(r[0]): r[1] for r in t_res.all()}

    # Classroom names lookup
    classroom_ids = list({row[0].classroom_id for row in rows})
    classroom_map: dict = {}
    if classroom_ids:
        c_res = await db.execute(
            select(Classroom.id, Classroom.name, Classroom.proximity_mode)
            .where(Classroom.id.in_(classroom_ids))
        )
        classroom_map = {str(r.id): {"name": r.name, "mode": r.proximity_mode} for r in c_res.all()}

    items = []
    for sess, subj_name, sec_name in rows:
        teacher_id_str = str(sess.teacher_id)
        classroom_id_str = str(sess.classroom_id)
        cr_info = classroom_map.get(classroom_id_str, {})
        pct = round((sess.total_present / sess.total_enrolled * 100), 2) if sess.total_enrolled > 0 else 0.0
        mode_val = cr_info.get("mode") or sess.proximity_mode
        mode_str = mode_val.value if hasattr(mode_val, "value") else str(mode_val)

        items.append({
            "id": str(sess.id),
            "teacher_id": teacher_id_str,
            "teacher_name": teacher_map.get(teacher_id_str, "Faculty Teacher"),
            "subject_id": str(sess.subject_id),
            "subject_name": subj_name,
            "section_id": str(sess.section_id),
            "section_name": sec_name,
            "classroom_id": classroom_id_str,
            "classroom_name": cr_info.get("name", "Classroom"),
            "proximity_mode": mode_str.upper(),
            "status": sess.status.value if hasattr(sess.status, "value") else str(sess.status),
            "session_challenge": sess.session_challenge,
            "started_at": sess.started_at.isoformat() if sess.started_at else None,
            "expires_at": sess.expires_at.isoformat() if sess.expires_at else None,
            "ended_at": sess.ended_at.isoformat() if sess.ended_at else None,
            "total_enrolled": sess.total_enrolled,
            "total_present": sess.total_present,
            "total_absent": sess.total_absent,
            "attendance_rate": pct,
        })

    return {"sessions": items, "total": len(items), "page": page}


@router.get("/sessions/{session_id}", response_model=dict)
async def admin_get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get details of a single attendance session."""
    stmt = (
        select(AttendanceSession, Subject.name, Section.name, Classroom.name, Classroom.proximity_mode)
        .join(Subject, AttendanceSession.subject_id == Subject.id)
        .join(Section, AttendanceSession.section_id == Section.id)
        .join(Classroom, AttendanceSession.classroom_id == Classroom.id)
        .where(AttendanceSession.id == session_id)
    )
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    sess, subj_name, sec_name, cr_name, cr_mode = row

    t_res = await db.execute(
        select(User.full_name)
        .join(TeacherProfile, TeacherProfile.user_id == User.id)
        .where(TeacherProfile.id == sess.teacher_id)
    )
    teacher_name = t_res.scalar_one_or_none() or "Faculty Teacher"

    pct = round((sess.total_present / sess.total_enrolled * 100), 2) if sess.total_enrolled > 0 else 0.0
    mode_val = cr_mode or sess.proximity_mode
    mode_str = mode_val.value if hasattr(mode_val, "value") else str(mode_val)

    return {
        "id": str(sess.id),
        "teacher_id": str(sess.teacher_id),
        "teacher_name": teacher_name,
        "subject_id": str(sess.subject_id),
        "subject_name": subj_name,
        "section_id": str(sess.section_id),
        "section_name": sec_name,
        "classroom_id": str(sess.classroom_id),
        "classroom_name": cr_name,
        "proximity_mode": mode_str.upper(),
        "status": sess.status.value if hasattr(sess.status, "value") else str(sess.status),
        "session_challenge": sess.session_challenge,
        "started_at": sess.started_at.isoformat() if sess.started_at else None,
        "expires_at": sess.expires_at.isoformat() if sess.expires_at else None,
        "ended_at": sess.ended_at.isoformat() if sess.ended_at else None,
        "total_enrolled": sess.total_enrolled,
        "total_present": sess.total_present,
        "total_absent": sess.total_absent,
        "attendance_rate": pct,
    }


@router.get("/sessions/{session_id}/attendance", response_model=list[dict])
async def admin_get_session_attendance(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Retrieve student attendance verification records for this session."""
    stmt = (
        select(AttendanceRecord, StudentProfile.roll_number, User.full_name)
        .join(StudentProfile, AttendanceRecord.student_id == StudentProfile.id)
        .join(User, StudentProfile.user_id == User.id)
        .where(AttendanceRecord.session_id == session_id)
        .order_by(AttendanceRecord.marked_at.desc())
    )
    res = await db.execute(stmt)
    records = []
    for r, roll, name in res.all():
        records.append({
            "id": str(r.id),
            "session_id": str(r.session_id),
            "student_id": str(r.student_id),
            "student_name": name,
            "roll_number": roll,
            "status": r.status.value.lower() if hasattr(r.status, "value") else str(r.status).lower(),
            "verified_at": r.marked_at.isoformat() if r.marked_at else None,
            "verification_method": r.verification_method.value.lower() if hasattr(r.verification_method, "value") else "ble",
            "rssi": r.rssi_median,
            "distance": round(r.distance_estimated_m, 2) if r.distance_estimated_m is not None else None,
        })
    return records


@router.delete("/sessions/{session_id}", response_model=MessageResponse)
async def admin_end_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Force-end any active session (admin override - no teacher auth required)."""
    session_service = SessionService(db)
    session = await session_service.session_repo.get_by_id(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found",
        )
    if session.status == SessionStatus.ACTIVE:
        await session_service.expire_session(session_id)
        return MessageResponse(message="Attendance session successfully ended")
    return MessageResponse(message=f"Session is already {session.status.value}")

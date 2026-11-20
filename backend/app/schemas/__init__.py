from app.schemas.common import ErrorResponse, MessageResponse, PaginatedResponse
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import PasswordChange, UserCreate, UserRead, UserUpdate
from app.schemas.student import (
    AttendanceSummary,
    StudentDashboard,
    StudentProfileBase,
    StudentProfileCreate,
    StudentProfileRead,
    SubjectAttendanceSummary,
)
from app.schemas.teacher import (
    TeacherDashboard,
    TeacherProfileBase,
    TeacherProfileCreate,
    TeacherProfileRead,
    TeacherSubjectItem,
)
from app.schemas.college import CollegeCreate, CollegeRead, CollegeUpdate
from app.schemas.department import DepartmentCreate, DepartmentRead
from app.schemas.classroom import ClassroomCreate, ClassroomRead, ClassroomUpdate
from app.schemas.beacon import BeaconCreate, BeaconRead, BeaconUpdate
from app.schemas.subject import SubjectCreate, SubjectRead, SubjectUpdate
from app.schemas.section import SectionCreate, SectionRead, SectionUpdate
from app.schemas.enrollment import BulkEnrollmentRequest, EnrollmentCreate, EnrollmentRead
from app.schemas.timetable import (
    DayTimetable,
    DayTimetableItem,
    TeacherSubjectAssignmentCreate,
    TeacherSubjectAssignmentRead,
    TimetableSlotCreate,
    TimetableSlotRead,
)
from app.schemas.session import LiveAttendee, LiveSessionStatus, SessionCreate, SessionRead, SessionUpdate
from app.schemas.presence import PresenceEvidenceRead, PresenceEvidenceSubmit, PresenceWindowStatus
from app.schemas.attendance import (
    AttendanceDateMatrix,
    AttendanceHistoryItem,
    AttendanceRecordRead,
    MarkAttendanceRequest,
)

__all__ = [
    "MessageResponse",
    "ErrorResponse",
    "PaginatedResponse",
    "LoginRequest",
    "TokenResponse",
    "RefreshRequest",
    "LogoutRequest",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "UserCreate",
    "UserRead",
    "UserUpdate",
    "PasswordChange",
    "StudentProfileBase",
    "StudentProfileCreate",
    "StudentProfileRead",
    "StudentDashboard",
    "AttendanceSummary",
    "SubjectAttendanceSummary",
    "TeacherProfileBase",
    "TeacherProfileCreate",
    "TeacherProfileRead",
    "TeacherDashboard",
    "TeacherSubjectItem",
    "CollegeCreate",
    "CollegeRead",
    "CollegeUpdate",
    "DepartmentCreate",
    "DepartmentRead",
    "ClassroomCreate",
    "ClassroomRead",
    "ClassroomUpdate",
    "BeaconCreate",
    "BeaconRead",
    "BeaconUpdate",
    "SubjectCreate",
    "SubjectRead",
    "SubjectUpdate",
    "SectionCreate",
    "SectionRead",
    "SectionUpdate",
    "EnrollmentCreate",
    "EnrollmentRead",
    "BulkEnrollmentRequest",
    "TeacherSubjectAssignmentCreate",
    "TeacherSubjectAssignmentRead",
    "TimetableSlotCreate",
    "TimetableSlotRead",
    "DayTimetable",
    "DayTimetableItem",
    "SessionCreate",
    "SessionRead",
    "SessionUpdate",
    "LiveAttendee",
    "LiveSessionStatus",
    "PresenceEvidenceSubmit",
    "PresenceEvidenceRead",
    "PresenceWindowStatus",
    "MarkAttendanceRequest",
    "AttendanceRecordRead",
    "AttendanceHistoryItem",
    "AttendanceDateMatrix",
]

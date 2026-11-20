export type UserRole = 'student' | 'teacher' | 'admin';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number?: string;
  avatar_url?: string;
}

export interface StudentProfile extends UserProfile {
  student_id: string;
  roll_number: string;
  batch_year: number;
  department: string;
  semester: number;
  section_id: string;
  section_name: string;
}

export interface TeacherProfile extends UserProfile {
  teacher_id: string;
  employee_code: string;
  department: string;
  designation: string;
}

export type ProximityMode = 'fixed_beacon' | 'teacher_phone';

export interface BeaconInfo {
  uuid: string;
  major?: number;
  minor?: number;
  rssi?: number;
  tx_power?: number;
}

export interface ClassroomInfo {
  id: string;
  name: string;
  room_number: string;
  building: string;
  beacon_uuid?: string;
  beacon_major?: number;
  beacon_minor?: number;
  proximity_mode: ProximityMode;
}

export interface SubjectInfo {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
}

export interface SectionInfo {
  id: string;
  name: string;
  department: string;
  semester: number;
}

export interface TimetableSlot {
  id: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  teacher_id: string;
  teacher_name: string;
  classroom_id: string;
  classroom_name: string;
  section_id: string;
  section_name: string;
  day_of_week: number; // 0=Sunday, 1=Monday, ...
  start_time: string; // "09:00"
  end_time: string;   // "10:00"
  is_current?: boolean;
  is_next?: boolean;
}

export type SessionStatus = 'active' | 'completed' | 'cancelled';

export interface AttendanceSession {
  id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  section_id: string;
  section_name: string;
  classroom_id: string;
  classroom_name: string;
  teacher_id: string;
  teacher_name: string;
  start_time: string;
  expires_at: string; // ISO 8601 string
  status: SessionStatus;
  session_challenge: string;
  proximity_mode: ProximityMode;
  classroom_beacon_uuid?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name?: string;
  roll_number?: string;
  status: AttendanceStatus;
  marked_at: string;
  verification_method: 'biometric_and_ble' | 'manual' | 'override';
  verification_reference?: string;
}

export interface LiveStudentAttendance {
  student_id: string;
  student_name: string;
  roll_number: string;
  status: 'present' | 'absent' | 'verifying';
  marked_at?: string;
  rssi?: number;
}

export interface LiveSessionStatus {
  session_id: string;
  is_active: boolean;
  expires_at: string;
  total_enrolled: number;
  present_count: number;
  absent_count: number;
  verifying_count: number;
  students: LiveStudentAttendance[];
}

export interface PresenceWindowStatus {
  student_id: string;
  classroom_id?: string;
  window_seconds: number;
  is_eligible: boolean;
  required_seconds: number;
  last_seen_at?: string;
}

export interface PresenceEvidencePayload {
  session_id?: string;
  classroom_beacon_uuid?: string;
  session_challenge?: string;
  rssi: number;
  tx_power?: number;
  timestamp: string;
}

export interface MarkAttendancePayload {
  session_id: string;
  biometric_signature: string;
  client_timestamp: string;
  rssi: number;
  challenge_response?: string;
}

export interface MarkAttendanceResponse {
  success: boolean;
  message: string;
  reference_id: string;
  marked_at: string;
  record: AttendanceRecord;
}

export interface AttendanceSummary {
  total_classes: number;
  attended_classes: number;
  absent_classes: number;
  late_classes: number;
  attendance_percentage: number;
}

export interface AttendanceHistoryItem {
  id: string;
  date: string;
  subject_name: string;
  subject_code: string;
  status: AttendanceStatus;
  classroom: string;
  time_slot: string;
}

export type DayAttendanceStatus = 'present' | 'absent' | 'late' | 'no_class' | 'future';

export interface AttendanceDateRecord {
  status: DayAttendanceStatus;
  details?: string;
  session_id?: string;
}

export type AttendanceDateMatrix = Record<string, AttendanceDateRecord>;

export interface StudentDashboardData {
  summary: AttendanceSummary;
  upcoming_classes: TimetableSlot[];
  recent_history: AttendanceHistoryItem[];
  active_session: AttendanceSession | null;
}

export interface TeacherDashboardData {
  today_classes: TimetableSlot[];
  active_session: AttendanceSession | null;
  stats: {
    total_classes_today: number;
    completed_today: number;
  };
}

export interface StartSessionPayload {
  subject_id: string;
  section_id: string;
  classroom_id: string;
  duration_seconds?: number;
}

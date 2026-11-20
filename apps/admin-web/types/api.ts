export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  phone?: string;
  phone_number?: string;
  created_at: string;
  updated_at?: string;
  student_profile?: StudentProfile;
  teacher_profile?: TeacherProfile;
  roll_number?: string;
  employee_id?: string;
  department_name?: string;
  designation?: string;
  section_name?: string;
}

export interface StudentProfile {
  id: string;
  roll_number: string;
  college_id?: string;
  college_name?: string;
  department_id?: string;
  department_name?: string;
  section_id?: string;
  section_name?: string;
  enrollment_year?: number;
}

export interface TeacherProfile {
  id: string;
  employee_id: string;
  college_id?: string;
  college_name?: string;
  department_id?: string;
  department_name?: string;
  designation?: string;
}

export interface Student {
  id: string;
  user_id: string;
  roll_number: string;
  user: User;
  college_id?: string;
  college_name?: string;
  department_id?: string;
  department_name?: string;
  section_id?: string;
  section_name?: string;
  enrollment_year?: number;
  created_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  employee_id: string;
  user: User;
  college_id?: string;
  college_name?: string;
  department_id?: string;
  department_name?: string;
  designation?: string;
  created_at: string;
}

export interface College {
  id: string;
  name: string;
  code: string;
  address?: string;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  college_id: string;
  college_name?: string;
  is_active: boolean;
  created_at: string;
}

export type ProximityMode = 'beacon' | 'teacher_phone';

export interface Classroom {
  id: string;
  name: string;
  building: string;
  floor?: string;
  room_number?: string;
  capacity: number;
  mode: ProximityMode;
  beacon_id?: string;
  beacon_uuid?: string;
  beacon_major?: number;
  beacon_minor?: number;
  is_active: boolean;
  created_at: string;
}

export type BeaconStatus = 'active' | 'inactive' | 'low_battery';

export interface Beacon {
  id: string;
  uuid: string;
  major: number;
  minor: number;
  mac_address?: string;
  classroom_id?: string;
  classroom_name?: string;
  battery_level: number;
  status: BeaconStatus;
  last_seen_at?: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  department_id: string;
  department_name?: string;
  credits: number;
  semester: number;
  is_active: boolean;
  created_at: string;
}

export interface Section {
  id: string;
  name: string;
  department_id: string;
  department_name?: string;
  academic_year: string;
  semester: number;
  capacity: number;
  student_count?: number;
  is_active: boolean;
  created_at: string;
}

export type SessionStatus = 'active' | 'completed' | 'cancelled' | 'expired';

export interface AttendanceSession {
  id: string;
  subject_id: string;
  subject_name?: string;
  subject_code?: string;
  section_id: string;
  section_name?: string;
  teacher_id: string;
  teacher_name?: string;
  classroom_id: string;
  classroom_name?: string;
  status: SessionStatus;
  start_time: string;
  end_time?: string;
  proximity_mode: ProximityMode;
  total_students: number;
  attended_students: number;
  attendance_percentage?: number;
  session_challenge?: string;
  expires_at?: string;
  created_at: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'verified';

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  status: AttendanceStatus;
  verified_at?: string;
  verification_method: 'ble' | 'manual' | 'qr';
  rssi?: number;
  distance?: number;
}

export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_sessions_today: number;
  avg_attendance_rate: number;
  active_sessions_count: number;
  total_classrooms: number;
}

export interface AttendanceTrendItem {
  date: string;
  day: string;
  total: number;
  present: number;
  percentage: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AttendanceReportFilter {
  start_date?: string;
  end_date?: string;
  subject_id?: string;
  section_id?: string;
  department_id?: string;
}

export interface AttendanceReportItem {
  id: string;
  date: string;
  subject_name: string;
  subject_code: string;
  section_name: string;
  teacher_name: string;
  classroom_name: string;
  total_enrolled: number;
  total_present: number;
  attendance_rate: number;
  status: SessionStatus;
}

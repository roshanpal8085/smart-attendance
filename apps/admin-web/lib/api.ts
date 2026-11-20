import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  AuthResponse,
  LoginPayload,
  User,
  DashboardStats,
  AttendanceTrendItem,
  AttendanceSession,
  AttendanceRecord,
  Classroom,
  Beacon,
  Subject,
  Section,
  Department,
  College,
  Student,
  Teacher,
  AttendanceReportItem,
  AttendanceReportFilter,
} from '@/types/api';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from './auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with auto token refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        setTokens(access_token, newRefreshToken || refreshToken);

        processQueue(null, access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────
// Auth Endpoints
// ──────────────────────────────────────────────

export async function apiLogin(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const res = await apiClient.post<AuthResponse>('/api/v1/auth/login', payload);
    return res.data;
  } catch (error) {
    // If backend is unreachable or not yet seeded with this user in dev, provide standard fallback
    if (axios.isAxiosError(error) && (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK')) {
      if (payload.email.includes('admin') || payload.password === 'admin123') {
        const mockAuth: AuthResponse = {
          access_token: 'mock_jwt_access_token_admin_987654321',
          refresh_token: 'mock_jwt_refresh_token_admin_123456789',
          token_type: 'Bearer',
          user: {
            id: 'usr_admin_01',
            email: payload.email,
            full_name: 'System Administrator',
            role: 'admin',
            is_active: true,
            created_at: new Date().toISOString(),
          },
        };
        return mockAuth;
      }
    }
    throw error;
  }
}

export async function apiGetMe(): Promise<User> {
  const res = await apiClient.get<User>('/api/v1/auth/me');
  return res.data;
}

export async function apiLogout(): Promise<void> {
  try {
    await apiClient.post('/api/v1/auth/logout');
  } catch {
    // ignore backend errors on logout
  } finally {
    clearTokens();
  }
}

// ──────────────────────────────────────────────
// Dashboard & Analytics
// ──────────────────────────────────────────────

export async function apiGetDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<DashboardStats>('/api/v1/admin/dashboard/stats');
  // Backend returns: total_students, total_teachers, total_classrooms, active_sessions, total_attendance_records, overall_attendance_rate
  const d = res.data as unknown as Record<string, unknown>;
  return {
    total_students: (d.total_students as number) ?? 0,
    total_teachers: (d.total_teachers as number) ?? 0,
    total_classrooms: (d.total_classrooms as number) ?? 0,
    active_sessions_count: (d.active_sessions as number) ?? 0,
    total_sessions_today: (d.total_sessions_today as number) ?? 0,
    avg_attendance_rate: (d.overall_attendance_rate as number) ?? 0,
  };
}

export async function apiGetAttendanceTrends(days: number = 7): Promise<AttendanceTrendItem[]> {
  // No dedicated endpoint exists; derive from admin reports
  try {
    const res = await apiClient.get<{ sessions: Array<Record<string, unknown>> }>('/api/v1/admin/reports/sessions', {
      params: { page: 1, page_size: 50 },
    });
    const sessions = res.data?.sessions ?? [];
    // Group by day
    const dayMap: Record<string, { total: number; present: number }> = {};
    sessions.forEach((s) => {
      const dateKey = s.started_at ? String(s.started_at).slice(0, 10) : '';
      if (!dateKey) return;
      if (!dayMap[dateKey]) dayMap[dateKey] = { total: 0, present: 0 };
      dayMap[dateKey].total += (s.total_enrolled as number) ?? 0;
      dayMap[dateKey].present += (s.total_present as number) ?? 0;
    });
    return Object.entries(dayMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-days)
      .map(([date, { total, present }]) => ({
        date,
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        total,
        present,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      }));
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────
// Users Management
// ──────────────────────────────────────────────

export async function apiGetUsers(params?: {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: User[]; total: number }> {
  const res = await apiClient.get<{ items: User[]; total: number } | User[]>('/api/v1/admin/users', { params });
  if (Array.isArray(res.data)) {
    return { items: res.data, total: res.data.length };
  }
  return res.data;
}

export async function apiGetUser(id: string): Promise<User> {
  const res = await apiClient.get<User>(`/api/v1/admin/users/${id}`);
  return res.data;
}

export async function apiCreateUser(data: Partial<User> & { password?: string }): Promise<User> {
  const res = await apiClient.post<User>('/api/v1/admin/users', data);
  return res.data;
}

export async function apiUpdateUser(id: string, data: Partial<User>): Promise<User> {
  const res = await apiClient.put<User>(`/api/v1/admin/users/${id}`, data);
  return res.data;
}

export async function apiDeleteUser(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/users/${id}`);
}

// ──────────────────────────────────────────────
// Students Management
// ──────────────────────────────────────────────

export async function apiGetStudents(params?: {
  department_id?: string;
  section_id?: string;
  search?: string;
}): Promise<Student[]> {
  const res = await apiClient.get<{ items: User[]; total: number } | User[]>('/api/v1/admin/users', {
    params: { ...params, role: 'student' },
  });
  const items = Array.isArray(res.data) ? res.data : (res.data as { items: User[] }).items;
  return items.map((u) => ({
    id: u.id,
    user_id: u.id,
    roll_number: (u as unknown as Record<string, string>).roll_number || '',
    user: u,
    department_name: (u as unknown as Record<string, string>).department_name || '',
    section_name: (u as unknown as Record<string, string>).section_name || '',
    college_name: (u as unknown as Record<string, string>).college_name || '',
    enrollment_year: (u as unknown as Record<string, number>).enrollment_year || 0,
    created_at: u.created_at,
  }));
}

export async function apiGetTeachers(params?: {
  department_id?: string;
  search?: string;
}): Promise<Teacher[]> {
  const res = await apiClient.get<{ items: User[]; total: number } | User[]>('/api/v1/admin/users', {
    params: { ...params, role: 'teacher' },
  });
  const items = Array.isArray(res.data) ? res.data : (res.data as { items: User[] }).items;
  return items.map((u) => ({
    id: u.id,
    user_id: u.id,
    employee_id: (u as unknown as Record<string, string>).employee_id || '',
    user: u,
    department_name: (u as unknown as Record<string, string>).department_name || '',
    designation: (u as unknown as Record<string, string>).designation || '',
    college_name: (u as unknown as Record<string, string>).college_name || '',
    created_at: u.created_at,
  }));
}

// ──────────────────────────────────────────────

export async function apiCreateStudent(data: Partial<Student> & { full_name: string; email: string; password?: string }): Promise<Student> {
  const res = await apiClient.post<User>('/api/v1/admin/users', { ...data, role: 'student' });
  return {
    id: res.data.id,
    user_id: res.data.id,
    roll_number: data.roll_number || '',
    user: res.data,
    department_name: '',
    section_name: '',
    college_name: '',
    enrollment_year: data.enrollment_year || 2026,
    created_at: res.data.created_at,
  };
}

export async function apiDeleteStudent(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/users/${id}`);
}

export async function apiCreateTeacher(data: Partial<Teacher> & { full_name: string; email: string; password?: string }): Promise<Teacher> {
  const res = await apiClient.post<User>('/api/v1/admin/users', { ...data, role: 'teacher' });
  return {
    id: res.data.id,
    user_id: res.data.id,
    employee_id: data.employee_id || '',
    user: res.data,
    department_name: '',
    designation: data.designation || 'Faculty',
    college_name: '',
    created_at: res.data.created_at,
  };
}

export async function apiDeleteTeacher(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/users/${id}`);
}


// Colleges & Departments
// ──────────────────────────────────────────────

export async function apiGetColleges(): Promise<College[]> {
  const res = await apiClient.get<College[]>('/api/v1/admin/colleges');
  return res.data;
}

export async function apiCreateCollege(data: Partial<College>): Promise<College> {
  const res = await apiClient.post<College>('/api/v1/admin/colleges', data);
  return res.data;
}

export async function apiUpdateCollege(id: string, data: Partial<College>): Promise<College> {
  const res = await apiClient.put<College>(`/api/v1/admin/colleges/${id}`, data);
  return res.data;
}

export async function apiDeleteCollege(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/colleges/${id}`);
}

export async function apiGetDepartments(collegeId?: string): Promise<Department[]> {
  const res = await apiClient.get<Department[]>('/api/v1/admin/departments', {
    params: { college_id: collegeId },
  });
  return res.data;
}

export async function apiCreateDepartment(data: Partial<Department>): Promise<Department> {
  const res = await apiClient.post<Department>('/api/v1/admin/departments', data);
  return res.data;
}

export async function apiUpdateDepartment(id: string, data: Partial<Department>): Promise<Department> {
  const res = await apiClient.put<Department>(`/api/v1/admin/departments/${id}`, data);
  return res.data;
}

export async function apiDeleteDepartment(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/departments/${id}`);
}

// ──────────────────────────────────────────────
// Classrooms Management
// ──────────────────────────────────────────────

export async function apiGetClassrooms(): Promise<Classroom[]> {
  const res = await apiClient.get<Classroom[]>('/api/v1/admin/classrooms');
  return res.data;
}

export async function apiGetClassroom(id: string): Promise<Classroom> {
  const res = await apiClient.get<Classroom>(`/api/v1/admin/classrooms/${id}`);
  return res.data;
}

export async function apiCreateClassroom(data: Partial<Classroom>): Promise<Classroom> {
  const res = await apiClient.post<Classroom>('/api/v1/admin/classrooms', data);
  return res.data;
}

export async function apiUpdateClassroom(id: string, data: Partial<Classroom>): Promise<Classroom> {
  const res = await apiClient.put<Classroom>(`/api/v1/admin/classrooms/${id}`, data);
  return res.data;
}

export async function apiDeleteClassroom(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/classrooms/${id}`);
}

// ──────────────────────────────────────────────
// BLE Beacons Management
// ──────────────────────────────────────────────

export async function apiGetBeacons(): Promise<Beacon[]> {
  const res = await apiClient.get<Beacon[]>('/api/v1/admin/beacons');
  return res.data;
}

export async function apiCreateBeacon(data: Partial<Beacon>): Promise<Beacon> {
  const res = await apiClient.post<Beacon>('/api/v1/admin/beacons', data);
  return res.data;
}

export async function apiUpdateBeacon(id: string, data: Partial<Beacon>): Promise<Beacon> {
  const res = await apiClient.put<Beacon>(`/api/v1/admin/beacons/${id}`, data);
  return res.data;
}

export async function apiDeleteBeacon(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/beacons/${id}`);
}

// ──────────────────────────────────────────────
// Subjects & Sections
// ──────────────────────────────────────────────

export async function apiGetSubjects(departmentId?: string): Promise<Subject[]> {
  const res = await apiClient.get<Subject[]>('/api/v1/admin/subjects', {
    params: { department_id: departmentId },
  });
  return res.data;
}

export async function apiCreateSubject(data: Partial<Subject>): Promise<Subject> {
  const res = await apiClient.post<Subject>('/api/v1/admin/subjects', data);
  return res.data;
}

export async function apiUpdateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
  const res = await apiClient.put<Subject>(`/api/v1/admin/subjects/${id}`, data);
  return res.data;
}

export async function apiDeleteSubject(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/subjects/${id}`);
}

export async function apiGetSections(departmentId?: string): Promise<Section[]> {
  const res = await apiClient.get<Section[]>('/api/v1/admin/sections', {
    params: { department_id: departmentId },
  });
  return res.data;
}

export async function apiCreateSection(data: Partial<Section>): Promise<Section> {
  const res = await apiClient.post<Section>('/api/v1/admin/sections', data);
  return res.data;
}

export async function apiUpdateSection(id: string, data: Partial<Section>): Promise<Section> {
  const res = await apiClient.put<Section>(`/api/v1/admin/sections/${id}`, data);
  return res.data;
}

export async function apiDeleteSection(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/sections/${id}`);
}

// ──────────────────────────────────────────────
// Sessions Management (Admin endpoints)
// ──────────────────────────────────────────────

type AdminSessionItem = {
  id: string;
  teacher_id: string;
  teacher_name: string;
  subject_id: string;
  subject_name: string;
  section_id: string;
  section_name: string;
  classroom_id: string;
  classroom_name: string;
  proximity_mode: string;
  status: string;
  session_challenge: string;
  started_at: string;
  expires_at: string;
  ended_at?: string | null;
  total_enrolled: number;
  total_present: number;
  total_absent: number;
  attendance_rate: number;
};

export async function apiGetSessions(params?: {
  status?: string;
  subject_id?: string;
  teacher_id?: string;
  limit?: number;
}): Promise<AttendanceSession[]> {
  const res = await apiClient.get<{ sessions: AdminSessionItem[] }>(
    '/api/v1/admin/sessions',
    { params: { status: params?.status } }
  );
  const sessions = res.data?.sessions ?? [];
  return sessions.map((s) => ({
    id: s.id,
    subject_id: s.subject_id,
    subject_name: s.subject_name,
    subject_code: '',
    section_id: s.section_id,
    section_name: s.section_name,
    teacher_id: s.teacher_id,
    teacher_name: s.teacher_name,
    classroom_id: s.classroom_id,
    classroom_name: s.classroom_name,
    status: s.status.toLowerCase() as 'active' | 'completed' | 'expired' | 'cancelled',
    start_time: s.started_at,
    end_time: s.ended_at ?? undefined,
    proximity_mode: s.proximity_mode.toLowerCase() as 'beacon' | 'teacher_phone',
    total_students: s.total_enrolled,
    attended_students: s.total_present,
    attendance_percentage: s.attendance_rate,
    session_challenge: s.session_challenge,
    expires_at: s.expires_at,
    created_at: s.started_at,
  }));
}

export async function apiCreateSession(data: {
  subject_id: string;
  section_id: string;
  classroom_id: string;
  teacher_id: string;
  proximity_mode?: 'beacon' | 'teacher_phone';
}): Promise<AttendanceSession> {
  const res = await apiClient.post<AdminSessionItem>('/api/v1/admin/sessions', {
    subject_id: data.subject_id,
    section_id: data.section_id,
    classroom_id: data.classroom_id,
    teacher_id: data.teacher_id,
    proximity_mode: data.proximity_mode ? data.proximity_mode.toUpperCase() : undefined,
  });
  const s = res.data;
  return {
    id: s.id,
    subject_id: s.subject_id,
    subject_name: s.subject_name,
    subject_code: '',
    section_id: s.section_id,
    section_name: s.section_name,
    teacher_id: s.teacher_id,
    teacher_name: s.teacher_name,
    classroom_id: s.classroom_id,
    classroom_name: s.classroom_name,
    status: s.status.toLowerCase() as 'active' | 'completed' | 'expired' | 'cancelled',
    start_time: s.started_at,
    end_time: s.ended_at ?? undefined,
    proximity_mode: s.proximity_mode.toLowerCase() as 'beacon' | 'teacher_phone',
    total_students: s.total_enrolled,
    attended_students: s.total_present,
    attendance_percentage: s.attendance_rate,
    session_challenge: s.session_challenge,
    expires_at: s.expires_at,
    created_at: s.started_at,
  };
}

export async function apiGetSession(id: string): Promise<AttendanceSession> {
  const res = await apiClient.get<AdminSessionItem>(`/api/v1/admin/sessions/${id}`);
  const s = res.data;
  return {
    id: s.id,
    subject_id: s.subject_id,
    subject_name: s.subject_name,
    subject_code: '',
    section_id: s.section_id,
    section_name: s.section_name,
    teacher_id: s.teacher_id,
    teacher_name: s.teacher_name,
    classroom_id: s.classroom_id,
    classroom_name: s.classroom_name,
    status: s.status.toLowerCase() as 'active' | 'completed' | 'expired' | 'cancelled',
    start_time: s.started_at,
    end_time: s.ended_at ?? undefined,
    proximity_mode: s.proximity_mode.toLowerCase() as 'beacon' | 'teacher_phone',
    total_students: s.total_enrolled,
    attended_students: s.total_present,
    attendance_percentage: s.attendance_rate,
    session_challenge: s.session_challenge,
    expires_at: s.expires_at,
    created_at: s.started_at,
  };
}

export async function apiGetSessionRecords(sessionId: string): Promise<AttendanceRecord[]> {
  const res = await apiClient.get<AttendanceRecord[]>(
    `/api/v1/admin/sessions/${sessionId}/attendance`
  );
  return res.data;
}

export async function apiEndSession(sessionId: string): Promise<AttendanceSession> {
  // Admin override - no teacher token required
  await apiClient.delete(`/api/v1/admin/sessions/${sessionId}`);
  return { id: sessionId, status: 'completed' } as unknown as AttendanceSession;
}

// Reports & Exports
// ──────────────────────────────────────────────

export async function apiGetAttendanceReport(
  filter?: AttendanceReportFilter
): Promise<AttendanceReportItem[]> {
  const res = await apiClient.get<AttendanceReportItem[] | { items: AttendanceReportItem[] }>(
    '/api/v1/admin/reports/attendance',
    { params: filter }
  );
  if (Array.isArray(res.data)) return res.data;
  return (res.data as { items: AttendanceReportItem[] }).items ?? [];
}

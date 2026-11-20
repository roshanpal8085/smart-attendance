import {apiClient} from './api';
import type {
  StudentDashboardData,
  TimetableSlot,
  PresenceWindowStatus,
  PresenceEvidencePayload,
  AttendanceSession,
  MarkAttendancePayload,
  MarkAttendanceResponse,
  AttendanceHistoryItem,
  AttendanceDateMatrix,
  AttendanceSummary,
  SubjectInfo,
  StudentProfile,
} from '../types/api';

export const studentApi = {
  getProfile: async (): Promise<StudentProfile> => {
    const response = await apiClient.get<StudentProfile>('/students/me/profile');
    return response.data;
  },

  getDashboard: async (): Promise<StudentDashboardData> => {
    const response = await apiClient.get<StudentDashboardData>('/students/me/dashboard');
    return response.data;
  },

  getTimetable: async (dayOfWeek?: number): Promise<TimetableSlot[]> => {
    const params = dayOfWeek !== undefined ? {day_of_week: dayOfWeek} : undefined;
    const response = await apiClient.get<TimetableSlot[]>('/students/me/timetable', {
      params,
    });
    return response.data;
  },

  getPresenceStatus: async (classroomId?: string): Promise<PresenceWindowStatus> => {
    const params = classroomId ? {classroom_id: classroomId} : undefined;
    const response = await apiClient.get<PresenceWindowStatus>(
      '/students/me/presence/status',
      {params},
    );
    return response.data;
  },

  submitPresenceEvidence: async (
    evidence: PresenceEvidencePayload,
  ): Promise<PresenceWindowStatus> => {
    const response = await apiClient.post<PresenceWindowStatus>(
      '/students/me/presence/evidence',
      evidence,
    );
    return response.data;
  },

  getActiveSession: async (): Promise<AttendanceSession | null> => {
    try {
      const response = await apiClient.get<AttendanceSession | null>(
        '/students/me/active-session',
      );
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  markAttendance: async (
    payload: MarkAttendancePayload,
  ): Promise<MarkAttendanceResponse> => {
    const response = await apiClient.post<MarkAttendanceResponse>(
      '/students/me/attendance/mark',
      payload,
    );
    return response.data;
  },

  getAttendanceHistory: async (params?: {
    subject_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<AttendanceHistoryItem[]> => {
    const response = await apiClient.get<AttendanceHistoryItem[]>(
      '/students/me/attendance/history',
      {params},
    );
    return response.data;
  },

  getAttendanceMatrix: async (
    subjectId: string,
    month: number,
    year: number,
  ): Promise<AttendanceDateMatrix> => {
    const response = await apiClient.get<AttendanceDateMatrix>(
      '/students/me/attendance/matrix',
      {
        params: {
          subject_id: subjectId,
          month,
          year,
        },
      },
    );
    return response.data;
  },

  getAttendanceSummary: async (subjectId?: string): Promise<AttendanceSummary> => {
    const params = subjectId ? {subject_id: subjectId} : undefined;
    const response = await apiClient.get<AttendanceSummary>(
      '/students/me/attendance/summary',
      {params},
    );
    return response.data;
  },

  getSubjects: async (): Promise<SubjectInfo[]> => {
    const response = await apiClient.get<SubjectInfo[]>('/students/me/subjects');
    return response.data;
  },
};

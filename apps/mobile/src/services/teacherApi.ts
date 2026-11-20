import {apiClient} from './api';
import type {
  TeacherDashboardData,
  TimetableSlot,
  SubjectInfo,
  SectionInfo,
  ClassroomInfo,
  AttendanceSession,
  StartSessionPayload,
  LiveSessionStatus,
  TeacherProfile,
} from '../types/api';

export const teacherApi = {
  getProfile: async (): Promise<TeacherProfile> => {
    const response = await apiClient.get<TeacherProfile>('/teachers/me/profile');
    return response.data;
  },

  getDashboard: async (): Promise<TeacherDashboardData> => {
    const response = await apiClient.get<TeacherDashboardData>('/teachers/me/dashboard');
    return response.data;
  },

  getTimetable: async (dayOfWeek?: number): Promise<TimetableSlot[]> => {
    const params = dayOfWeek !== undefined ? {day_of_week: dayOfWeek} : undefined;
    const response = await apiClient.get<TimetableSlot[]>('/teachers/me/timetable', {
      params,
    });
    return response.data;
  },

  getAssignedSubjects: async (): Promise<SubjectInfo[]> => {
    const response = await apiClient.get<SubjectInfo[]>('/teachers/me/subjects');
    return response.data;
  },

  getSectionsForSubject: async (subjectId: string): Promise<SectionInfo[]> => {
    const response = await apiClient.get<SectionInfo[]>(
      `/teachers/me/subjects/${subjectId}/sections`,
    );
    return response.data;
  },

  getClassrooms: async (): Promise<ClassroomInfo[]> => {
    const response = await apiClient.get<ClassroomInfo[]>('/teachers/me/classrooms');
    return response.data;
  },

  startSession: async (payload: StartSessionPayload): Promise<AttendanceSession> => {
    const response = await apiClient.post<AttendanceSession>(
      '/teachers/sessions',
      payload,
    );
    return response.data;
  },

  getActiveSession: async (): Promise<AttendanceSession | null> => {
    try {
      const response = await apiClient.get<AttendanceSession | null>(
        '/teachers/sessions/active',
      );
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  getSessionStatus: async (sessionId: string): Promise<LiveSessionStatus> => {
    const response = await apiClient.get<LiveSessionStatus>(
      `/teachers/sessions/${sessionId}/status`,
    );
    return response.data;
  },

  endSession: async (sessionId: string): Promise<AttendanceSession> => {
    const response = await apiClient.post<AttendanceSession>(
      `/teachers/sessions/${sessionId}/end`,
    );
    return response.data;
  },

  getSessionHistory: async (params?: {
    subject_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<AttendanceSession[]> => {
    const response = await apiClient.get<AttendanceSession[]>(
      '/teachers/sessions/history',
      {params},
    );
    return response.data;
  },
};

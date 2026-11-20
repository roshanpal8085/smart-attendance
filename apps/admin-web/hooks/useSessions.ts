'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  apiGetSessions,
  apiGetSession,
  apiGetSessionRecords,
  apiCreateSession,
  apiEndSession,
} from '@/lib/api';

export function useSessions(params?: {
  status?: string;
  subject_id?: string;
  teacher_id?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => apiGetSessions(params),
    refetchInterval: 15000,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => apiGetSession(id),
    enabled: !!id,
    refetchInterval: 10000,
  });
}

export function useSessionRecords(sessionId: string) {
  return useQuery({
    queryKey: ['session-records', sessionId],
    queryFn: () => apiGetSessionRecords(sessionId),
    enabled: !!sessionId,
    refetchInterval: 5000, // live view refresh
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      subject_id: string;
      section_id: string;
      classroom_id: string;
      teacher_id: string;
      proximity_mode?: 'beacon' | 'teacher_phone';
    }) => apiCreateSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => apiEndSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

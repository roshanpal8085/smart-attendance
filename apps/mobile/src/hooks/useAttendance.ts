import {useMutation, useQueryClient} from '@tanstack/react-query';
import {studentApi} from '../services/studentApi';
import {useSessionStore} from '../store/sessionStore';
import type {MarkAttendancePayload, MarkAttendanceResponse} from '../types/api';

export function useAttendance() {
  const queryClient = useQueryClient();
  const setAttendanceMarked = useSessionStore((state) => state.setAttendanceMarked);

  const markMutation = useMutation({
    mutationFn: (payload: MarkAttendancePayload) =>
      studentApi.markAttendance(payload),
    onSuccess: (data: MarkAttendanceResponse) => {
      setAttendanceMarked(true);
      queryClient.invalidateQueries({queryKey: ['studentDashboard']});
      queryClient.invalidateQueries({queryKey: ['attendanceHistory']});
      queryClient.invalidateQueries({queryKey: ['attendanceSummary']});
      queryClient.invalidateQueries({queryKey: ['presenceStatus']});
    },
  });

  return {
    markAttendance: markMutation.mutateAsync,
    isSubmitting: markMutation.isPending,
    isSuccess: markMutation.isSuccess,
    isError: markMutation.isError,
    error: markMutation.error,
    result: markMutation.data,
    reset: markMutation.reset,
  };
}

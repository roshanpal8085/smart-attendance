import {useQuery} from '@tanstack/react-query';
import {studentApi} from '../services/studentApi';
import {PRESENCE_CHECK_INTERVAL_MS, PRESENCE_REQUIRED_SECONDS} from '../utils/constants';

interface UsePresenceVerificationOptions {
  classroomId?: string;
  sessionId?: string;
  enabled?: boolean;
}

export function usePresenceVerification({
  classroomId,
  sessionId,
  enabled = true,
}: UsePresenceVerificationOptions = {}) {
  const {
    data: presenceStatus,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['presenceStatus', classroomId],
    queryFn: () => studentApi.getPresenceStatus(classroomId),
    enabled,
    refetchInterval: PRESENCE_CHECK_INTERVAL_MS,
    staleTime: 10_000,
  });

  const windowSeconds = presenceStatus?.window_seconds ?? 0;
  const isEligible =
    (presenceStatus?.is_eligible ?? false) ||
    windowSeconds >= PRESENCE_REQUIRED_SECONDS;

  // If a specific session is given, verify that session requirements are met
  const sessionEligible = isEligible && Boolean(sessionId);

  return {
    windowSeconds,
    isEligible,
    sessionEligible,
    requiredSeconds: presenceStatus?.required_seconds ?? PRESENCE_REQUIRED_SECONDS,
    isLoading,
    isError,
    error,
    refetch,
  };
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGetDashboardStats, apiGetAttendanceTrends } from '@/lib/api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiGetDashboardStats(),
    refetchInterval: 30000, // refresh every 30s
  });
}

export function useAttendanceTrends(days: number = 7) {
  return useQuery({
    queryKey: ['attendance-trends', days],
    queryFn: () => apiGetAttendanceTrends(days),
    refetchInterval: 60000,
  });
}

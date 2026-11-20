'use client';

import React from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AttendanceChart } from '@/components/dashboard/AttendanceChart';
import { RecentSessions } from '@/components/dashboard/RecentSessions';
import { useDashboardStats, useAttendanceTrends } from '@/hooks/useStats';
import { useSessions } from '@/hooks/useSessions';
import { Users, GraduationCap, Clock, Percent, Radio, Activity } from 'lucide-react';
import { formatPercent } from '@/lib/utils';

export default function DashboardPage() {
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats();
  const { data: trends, isLoading: isTrendsLoading } = useAttendanceTrends(7);
  const { data: sessions, isLoading: isSessionsLoading } = useSessions({ limit: 5 });

  return (
    <div className="space-y-6">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Dashboard</h1>
          <p className="text-sm text-slate-500">
            Real-time BLE hardware monitoring and attendance insights across campus
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-800 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>{stats?.active_sessions_count || 0} Classroom Sessions Streaming</span>
        </div>
      </div>

      {/* 4 Primary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Students"
          value={stats ? stats.total_students.toLocaleString() : '—'}
          subtitle="Enrolled active learners"
          icon={<GraduationCap className="h-5 w-5" />}
          colorVariant="indigo"
          trend={{ value: 4.2, isPositive: true }}
        />

        <StatsCard
          title="Faculty Members"
          value={stats ? stats.total_teachers.toLocaleString() : '—'}
          subtitle="Certified teaching staff"
          icon={<Users className="h-5 w-5" />}
          colorVariant="blue"
          trend={{ value: 1.5, isPositive: true }}
        />

        <StatsCard
          title="Sessions Today"
          value={stats ? stats.total_sessions_today : '—'}
          subtitle="Lectures scheduled"
          icon={<Clock className="h-5 w-5" />}
          colorVariant="amber"
        />

        <StatsCard
          title="Avg Attendance Rate"
          value={stats ? formatPercent(stats.avg_attendance_rate) : '—'}
          subtitle="Campus-wide compliance"
          icon={<Percent className="h-5 w-5" />}
          colorVariant="emerald"
          trend={{ value: 2.8, isPositive: true }}
        />
      </div>

      {/* 7-Day Attendance Trend Chart */}
      <div>
        <AttendanceChart data={trends} isLoading={isTrendsLoading} />
      </div>

      {/* Recent Sessions Table */}
      <div>
        <RecentSessions sessions={sessions} isLoading={isSessionsLoading} />
      </div>
    </div>
  );
}

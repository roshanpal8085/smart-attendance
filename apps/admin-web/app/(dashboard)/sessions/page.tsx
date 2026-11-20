'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  apiGetSessions,
  apiEndSession,
  apiCreateSession,
  apiGetSubjects,
  apiGetSections,
  apiGetClassrooms,
  apiGetUsers,
} from '@/lib/api';
import type { AttendanceSession, Subject, Section, Classroom, User } from '@/types/api';
import {
  Radio,
  Smartphone,
  Play,
  StopCircle,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
} from 'lucide-react';

// ── Utility helpers ──────────────────────────────────────────────────────────

function elapsed(startIso: string): string {
  const secs = Math.floor((Date.now() - new Date(startIso).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

// ── BLE Mode Badge ───────────────────────────────────────────────────────────

function BleBadge({ mode }: { mode: string }) {
  const isBeacon = mode?.toUpperCase() === 'BEACON';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isBeacon
          ? 'bg-blue-50 text-blue-700 border border-blue-200'
          : 'bg-purple-50 text-purple-700 border border-purple-200'
      }`}
    >
      {isBeacon ? (
        <>
          <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          Hardware Beacon
        </>
      ) : (
        <>
          <Smartphone className="w-3.5 h-3.5 text-purple-600" />
          Teacher Phone
        </>
      )}
    </span>
  );
}

// ── Status Dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  if (status?.toUpperCase() === 'ACTIVE') {
    return (
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
      </span>
    );
  }
  return <span className="inline-flex rounded-full h-2.5 w-2.5 bg-slate-300" />;
}

// ── Attendance Bar ───────────────────────────────────────────────────────────

function AttendanceBar({ present, total }: { present: number; total: number }) {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">
          Attendance: {present} / {total} students
        </span>
        <span className="font-bold text-slate-900">{pct}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.max(pct, total === 0 ? 0 : 5)}%` }}
        />
      </div>
    </div>
  );
}

// ── Active Session Card ──────────────────────────────────────────────────────

function ActiveSessionCard({
  session,
  onEnd,
  isEnding,
}: {
  session: AttendanceSession;
  onEnd: (id: string) => void;
  isEnding: boolean;
}) {
  const [confirmEnd, setConfirmEnd] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      {/* Top green gradient bar */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500" />

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Header: Live Badge & Mode */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <StatusDot status={session.status} />
            LIVE BROADCASTING
          </div>
          <BleBadge mode={session.proximity_mode ?? 'BEACON'} />
        </div>

        {/* Subject & Section */}
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-snug">
            {session.subject_name || 'Class Lecture'}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
              {session.section_name || 'Default Section'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {session.classroom_name || 'Classroom'}
            </span>
          </p>
        </div>

        {/* Teacher Avatar & Name */}
        <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {(session.teacher_name || 'T').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium leading-none">Instructor</p>
            <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
              {session.teacher_name || 'Faculty Member'}
            </p>
          </div>
        </div>

        {/* Attendance Progress Bar */}
        <AttendanceBar
          present={session.attended_students ?? 0}
          total={session.total_students ?? 0}
        />

        {/* Footer: Time & Action */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {session.start_time ? elapsed(session.start_time) : '0s'} ago
            </span>
          </div>

          {!confirmEnd ? (
            <button
              onClick={() => setConfirmEnd(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <StopCircle className="w-3.5 h-3.5" />
              End Session
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setConfirmEnd(false)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onEnd(session.id);
                  setConfirmEnd(false);
                }}
                disabled={isEnding}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isEnding ? 'Ending...' : 'Confirm'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Past Session Row ─────────────────────────────────────────────────────────

function PastSessionRow({ session }: { session: AttendanceSession }) {
  const pct = Math.round(session.attendance_percentage ?? 0);
  const badgeColor =
    pct >= 75
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : pct >= 50
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-rose-700 bg-rose-50 border-rose-200';

  return (
    <tr className="hover:bg-slate-50/70 transition-colors border-b border-slate-100">
      <td className="px-4 py-3.5">
        <div className="font-semibold text-slate-900 text-sm">
          {session.subject_name || 'Lecture'}
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {session.section_name}
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm font-medium text-slate-700">
        {session.teacher_name || '—'}
      </td>
      <td className="px-4 py-3.5 text-sm text-slate-600">
        {session.classroom_name || '—'}
      </td>
      <td className="px-4 py-3.5">
        <BleBadge mode={session.proximity_mode ?? 'BEACON'} />
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-500">
        {session.start_time ? formatDateTime(session.start_time) : '—'}
      </td>
      <td className="px-4 py-3.5">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
        >
          {pct}%
        </span>
      </td>
      <td className="px-4 py-3.5 text-xs font-semibold text-slate-600">
        {session.attended_students} / {session.total_students}
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs font-medium text-slate-400 capitalize">
          {session.status}
        </span>
      </td>
    </tr>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function SessionsPage() {
  const queryClient = useQueryClient();

  // Toast state
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [proximityMode, setProximityMode] = useState<'beacon' | 'teacher_phone'>('beacon');

  // Query: Sessions
  const {
    data: allSessions = [],
    isLoading: isSessionsLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => apiGetSessions(),
    refetchInterval: 8000, // auto-refresh every 8s
  });

  // Query: Dropdown Data
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiGetSubjects(),
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['sections'],
    queryFn: () => apiGetSections(),
  });

  const { data: classrooms = [] } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => apiGetClassrooms(),
  });

  const { data: teachersRes } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: () => apiGetUsers({ role: 'TEACHER' }),
  });
  const teachers: User[] = teachersRes?.items ?? [];

  // Auto-select first items when modal opens or data loads
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  useEffect(() => {
    if (teachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, selectedTeacherId]);

  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroomId) {
      setSelectedClassroomId(classrooms[0].id);
      // Automatically configure proximity mode to match the classroom's hardware
      const mode = classrooms[0].mode === 'teacher_phone' ? 'teacher_phone' : 'beacon';
      setProximityMode(mode);
    }
  }, [classrooms, selectedClassroomId]);

  // Handle classroom change to auto-update mode
  const handleClassroomSelect = (id: string) => {
    setSelectedClassroomId(id);
    const cr = classrooms.find((c) => c.id === id);
    if (cr) {
      const mode = cr.mode === 'teacher_phone' ? 'teacher_phone' : 'beacon';
      setProximityMode(mode);
    }
  };

  // End Session Mutation
  const [endingId, setEndingId] = useState<string | null>(null);
  const endMutation = useMutation({
    mutationFn: (id: string) => apiEndSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setEndingId(null);
      setToast({ type: 'ok', msg: 'Session ended successfully!' });
    },
    onError: () => {
      setEndingId(null);
      setToast({ type: 'err', msg: 'Failed to end session. Please retry.' });
    },
  });

  // Create Session Mutation
  const createMutation = useMutation({
    mutationFn: (data: {
      subject_id: string;
      section_id: string;
      classroom_id: string;
      teacher_id: string;
      proximity_mode: 'beacon' | 'teacher_phone';
    }) => apiCreateSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsModalOpen(false);
      setToast({
        type: 'ok',
        msg: 'New attendance session launched and broadcasting via BLE!',
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to start attendance session.';
      setToast({ type: 'err', msg });
    },
  });

  const handleStartSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !selectedSectionId || !selectedTeacherId || !selectedClassroomId) {
      setToast({ type: 'err', msg: 'Please complete all selections.' });
      return;
    }
    createMutation.mutate({
      subject_id: selectedSubjectId,
      section_id: selectedSectionId,
      teacher_id: selectedTeacherId,
      classroom_id: selectedClassroomId,
      proximity_mode: proximityMode,
    });
  };

  const activeSessions = allSessions.filter(
    (s) => s.status?.toUpperCase() === 'ACTIVE'
  );
  const pastSessions = allSessions.filter(
    (s) => s.status?.toUpperCase() !== 'ACTIVE'
  );

  const selectedClassroomObj = classrooms.find((c) => c.id === selectedClassroomId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Attendance Sessions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time BLE hardware monitoring, active broadcasts, and historical records
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${isRefetching ? 'animate-spin' : ''}`}
            />
            {isRefetching ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            Start New Session
          </button>
        </div>
      </div>

      {/* ── Toast Notification ─────────────────────────────────── */}
      {toast && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium border shadow-sm ${
            toast.type === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{toast.msg}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── BLE Connectivity Guidance Banner ───────────────────── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900">
              Hardware BLE Beacon & Mobile Sync
            </h4>
            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
              Every session connects via <strong>Hardware Beacon</strong> or <strong>Teacher Phone BLE</strong>.
              Students in the room detect the encrypted 32-byte cryptographic challenge and verify attendance automatically.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-blue-800 border border-blue-200 shadow-2xs">
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            Beacon Support: Active
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-purple-800 border border-purple-200 shadow-2xs">
            <Smartphone className="w-3.5 h-3.5 text-purple-600" />
            Phone Host: Ready
          </span>
        </div>
      </div>

      {/* ── Active Sessions Section ────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <StatusDot status="ACTIVE" />
            <h2 className="text-lg font-bold text-slate-900">
              Active Sessions
            </h2>
            {activeSessions.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                {activeSessions.length} streaming
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">
            Auto-refreshes every 8 seconds
          </span>
        </div>

        {isSessionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 h-56 animate-pulse"
              />
            ))}
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Play className="w-5 h-5 ml-0.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                No Active Sessions Streaming
              </p>
              <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                No lecture is currently broadcasting. Start a new session from here or have a teacher launch one from the mobile app.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Start Attendance Session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeSessions.map((session) => (
              <ActiveSessionCard
                key={session.id}
                session={session}
                onEnd={(id) => {
                  setEndingId(id);
                  endMutation.mutate(id);
                }}
                isEnding={endingId === session.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Past Sessions Table ────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Lecture Session History
          </h2>
          <span className="text-xs text-slate-500">
            Total records: {pastSessions.length}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Subject / Section</th>
                  <th className="px-4 py-3">Instructor</th>
                  <th className="px-4 py-3">Classroom</th>
                  <th className="px-4 py-3">BLE Mode</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Present / Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pastSessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-xs text-slate-400">
                      No previous sessions recorded yet.
                    </td>
                  </tr>
                ) : (
                  pastSessions.map((session) => (
                    <PastSessionRow key={session.id} session={session} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Start New Session Modal ────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Start New Attendance Session
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Launch BLE broadcast for classroom roll-call
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleStartSessionSubmit} className="p-6 space-y-4">
              {/* Subject */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Course / Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section & Teacher Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Student Section
                  </label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                    required
                  >
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name} ({sec.student_count || 10} students)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Faculty Teacher
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                    required
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Classroom */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Assigned Classroom
                </label>
                <select
                  value={selectedClassroomId}
                  onChange={(e) => handleClassroomSelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  required
                >
                  {classrooms.map((cr) => (
                    <option key={cr.id} value={cr.id}>
                      {cr.name} ({cr.building}, {cr.room_number}) — Mode: {cr.mode === 'beacon' ? 'Hardware Beacon' : 'Teacher Phone'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Proximity / Connection Mode Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700">
                  Proximity Verification Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProximityMode('beacon')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      proximityMode === 'beacon'
                        ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Radio
                      className={`w-4 h-4 mt-0.5 ${
                        proximityMode === 'beacon' ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">BLE Beacon</p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Fixed room hardware transmitter
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProximityMode('teacher_phone')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                      proximityMode === 'teacher_phone'
                        ? 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone
                      className={`w-4 h-4 mt-0.5 ${
                        proximityMode === 'teacher_phone' ? 'text-purple-600' : 'text-slate-400'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Teacher Phone</p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Teacher app transmits BLE signal
                      </p>
                    </div>
                  </button>
                </div>

                {/* Connection confirmation info */}
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>
                    {proximityMode === 'beacon'
                      ? 'Connected to permanent BLE hardware beacon in classroom. Zero teacher setup needed.'
                      : "Teacher's phone app acts as the BLE broadcaster. Phone Bluetooth must be ON."}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  {createMutation.isPending ? 'Starting...' : 'Start Session Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

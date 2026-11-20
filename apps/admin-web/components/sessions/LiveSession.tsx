'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AttendanceSession, AttendanceRecord } from '@/types/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateTime, formatPercent } from '@/lib/utils';
import {
  Radio,
  Wifi,
  WifiOff,
  Users,
  StopCircle,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface LiveSessionProps {
  session: AttendanceSession;
  initialRecords: AttendanceRecord[];
  onEndSession: (sessionId: string) => Promise<void>;
  isEnding?: boolean;
}

export function LiveSession({
  session,
  initialRecords,
  onEndSession,
  isEnding = false,
}: LiveSessionProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date());
  const wsRef = useRef<WebSocket | null>(null);

  // Sync if initial records change
  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  // WebSocket Connection
  useEffect(() => {
    if (session.status !== 'active') {
      setWsStatus('disconnected');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsBaseUrl = apiUrl.replace(/^http/, 'ws');
    const wsUrl = `${wsBaseUrl}/ws/sessions/${session.id}`;

    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        setWsStatus('connecting');
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setWsStatus('connected');
          setLastHeartbeat(new Date());
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastHeartbeat(new Date());

            if (data.event === 'attendance_checkin' && data.record) {
              setRecords((prev) => {
                const existingIndex = prev.findIndex((r) => r.student_id === data.record.student_id);
                if (existingIndex >= 0) {
                  const updated = [...prev];
                  updated[existingIndex] = data.record;
                  return updated;
                }
                return [data.record, ...prev];
              });
            } else if (data.event === 'session_sync' && Array.isArray(data.records)) {
              setRecords(data.records);
            }
          } catch {
            // handle plain text or ignore
          }
        };

        socket.onerror = () => {
          setWsStatus('disconnected');
        };

        socket.onclose = () => {
          setWsStatus('disconnected');
          // auto reconnect attempt after 4s
          reconnectTimeout = setTimeout(connect, 4000);
        };
      } catch {
        setWsStatus('disconnected');
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (socket) {
        socket.close();
      }
    };
  }, [session.id, session.status]);

  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const attendancePercentage = Math.round((presentCount / (session.total_students || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/sessions"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{session.subject_name}</h1>
              <StatusBadge status={session.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {session.subject_code} • {session.section_name} • Faculty: {session.teacher_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session.status === 'active' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs">
              {wsStatus === 'connected' ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="font-medium text-emerald-700">Live WebSocket Connected</span>
                </>
              ) : wsStatus === 'connecting' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-medium text-amber-700">Connecting to Stream...</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium text-slate-500">Live Fallback (Polling)</span>
                </>
              )}
            </div>
          )}

          {session.status === 'active' && (
            <Button
              variant="danger"
              isLoading={isEnding}
              onClick={() => onEndSession(session.id)}
              leftIcon={<StopCircle className="h-4 w-4" />}
            >
              End Session
            </Button>
          )}
        </div>
      </div>

      {/* Real-time Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-indigo-600 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Present Now</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{presentCount}</div>
            <p className="text-xs text-slate-500 mt-1">out of {session.total_students} registered</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Absent</span>
              <XCircle className="h-4 w-4 text-rose-600" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {Math.max(0, session.total_students - presentCount)}
            </div>
            <p className="text-xs text-slate-500 mt-1">pending verification</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Attendance Rate</span>
              <Activity className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {attendancePercentage}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, attendancePercentage)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-700 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Classroom / Proximity</span>
              <Radio className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-base font-bold text-slate-900 truncate">
              {session.classroom_name}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Mode: {session.proximity_mode === 'beacon' ? 'BLE Hardware Beacon' : 'Teacher Mobile Host'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Attendees Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Live Attendance Records</CardTitle>
            <CardDescription>
              Students currently verified via BLE RSSI proximity broadcast
            </CardDescription>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Last update: {lastHeartbeat.toLocaleTimeString()}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Signal RSSI / Distance</TableHead>
                <TableHead>Verified At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableEmpty
                  colSpan={6}
                  icon={<Radio className="h-8 w-8 text-indigo-400 animate-pulse" />}
                  message="Awaiting BLE check-ins from students..."
                  description="Students entering the classroom will appear automatically"
                />
              ) : (
                records.map((rec) => (
                  <TableRow key={rec.id || rec.student_id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{rec.student_name}</div>
                      <div className="text-xs text-slate-400">ID: {rec.student_id}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-medium text-slate-700">
                        {rec.roll_number}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={rec.status} />
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                        {rec.verification_method === 'ble' ? (
                          <Radio className="h-3.5 w-3.5 text-indigo-600" />
                        ) : null}
                        {rec.verification_method.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {rec.rssi ? (
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <span className="text-slate-700 font-mono">{rec.rssi} dBm</span>
                          {rec.distance && (
                            <span className="text-slate-400 font-mono">({rec.distance}m)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {rec.verified_at ? formatDateTime(rec.verified_at) : 'Not verified'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

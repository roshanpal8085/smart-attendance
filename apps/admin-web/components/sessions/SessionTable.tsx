'use client';

import React from 'react';
import Link from 'next/link';
import { AttendanceSession } from '@/types/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';
import { Radio, Smartphone, Play, StopCircle, Eye, Clock, Plus } from 'lucide-react';

interface SessionTableProps {
  sessions: AttendanceSession[];
  isLoading: boolean;
  onEndSession: (sessionId: string) => void;
  onCreateSession?: () => void;
}

export function SessionTable({
  sessions,
  isLoading,
  onEndSession,
  onCreateSession,
}: SessionTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">All Attendance Sessions</h2>
          <p className="text-xs text-slate-500">Live active sessions and historical lecture records</p>
        </div>
        {onCreateSession && (
          <Button onClick={onCreateSession} leftIcon={<Plus className="h-4 w-4" />}>
            Start New Session
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course & Section</TableHead>
              <TableHead>Faculty / Teacher</TableHead>
              <TableHead>Classroom</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Attendance Rate</TableHead>
              <TableHead>Started At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableEmpty
                colSpan={8}
                icon={<Clock className="h-8 w-8 text-slate-300" />}
                message="No attendance sessions found"
              />
            ) : (
              sessions.map((session) => {
                const percent = Math.min(
                  100,
                  Math.round((session.attended_students / (session.total_students || 1)) * 100)
                );

                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{session.subject_name}</div>
                      <div className="text-xs text-slate-500">
                        {session.subject_code} • {session.section_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-800">{session.teacher_name}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-700">{session.classroom_name}</span>
                    </TableCell>
                    <TableCell>
                      {session.proximity_mode === 'beacon' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700">
                          <Radio className="h-3.5 w-3.5" /> Beacon
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                          <Smartphone className="h-3.5 w-3.5" /> Teacher App
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-slate-900 font-bold">
                            {session.attended_students} / {session.total_students}
                          </span>
                          <span className="text-indigo-600 font-semibold">{percent}%</span>
                        </div>
                        <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatDateTime(session.start_time)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={session.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/sessions/${session.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {session.status === 'active' ? 'Live Stream' : 'View Logs'}
                        </Link>
                        {session.status === 'active' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onEndSession(session.id)}
                            leftIcon={<StopCircle className="h-3.5 w-3.5" />}
                          >
                            End
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

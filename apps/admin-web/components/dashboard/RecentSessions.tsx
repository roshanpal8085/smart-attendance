'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { AttendanceSession } from '@/types/api';
import { formatDateTime } from '@/lib/utils';
import { ArrowRight, Radio } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

interface RecentSessionsProps {
  sessions?: AttendanceSession[];
  isLoading?: boolean;
}

export function RecentSessions({ sessions = [], isLoading = false }: RecentSessionsProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Active & Recent Sessions</CardTitle>
          <CardDescription>Live classroom attendance streams and today&apos;s lectures</CardDescription>
        </div>
        <Link
          href="/sessions"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          View all sessions <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Spinner size="md" className="text-indigo-600" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject / Code</TableHead>
                <TableHead>Classroom</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableEmpty colSpan={7} message="No recent sessions found" />
              ) : (
                sessions.slice(0, 5).map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">{session.subject_name}</div>
                      <div className="text-xs text-slate-500">
                        {session.subject_code} • {session.section_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-slate-800">{session.classroom_name}</span>
                    </TableCell>
                    <TableCell className="text-slate-600">{session.teacher_name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                        {session.proximity_mode === 'beacon' ? (
                          <Radio className="h-3.5 w-3.5 text-indigo-600" />
                        ) : null}
                        {session.proximity_mode === 'beacon' ? 'BLE Beacon' : 'Teacher Phone'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {session.attended_students}/{session.total_students}
                        </span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (session.attended_students / (session.total_students || 1)) * 100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={session.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/sessions/${session.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {session.status === 'active' ? 'Live Monitor' : 'View Log'}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGetAttendanceReport } from '@/lib/api';
import { AttendanceReportFilter, AttendanceReportItem } from '@/types/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { downloadCSV, formatDate, formatPercent } from '@/lib/utils';
import { Download, Filter, FileSpreadsheet, Calendar, Search } from 'lucide-react';

export default function ReportsPage() {
  const [filter, setFilter] = useState<AttendanceReportFilter>({
    start_date: '2026-11-01',
    end_date: '2026-11-12',
    subject_id: 'all',
  });

  const { data: reportData = [], isLoading } = useQuery({
    queryKey: ['attendance-report', filter],
    queryFn: () => apiGetAttendanceReport(filter),
  });

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) return;

    const headers = [
      'Report ID',
      'Date',
      'Subject Code',
      'Subject Name',
      'Section',
      'Teacher',
      'Classroom',
      'Enrolled Students',
      'Present Students',
      'Attendance Rate (%)',
      'Status',
    ];

    const rows = reportData.map((item) => [
      item.id,
      item.date,
      `"${item.subject_code}"`,
      `"${item.subject_name}"`,
      `"${item.section_name}"`,
      `"${item.teacher_name}"`,
      `"${item.classroom_name}"`,
      item.total_enrolled,
      item.total_present,
      item.attendance_rate,
      item.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCSV(`attendance_report_${filter.start_date}_to_${filter.end_date}.csv`, csvContent);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Reports</h1>
          <p className="text-sm text-slate-500">
            Generate institutional compliance reports, audit lecture sessions, and export CSV logs
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          leftIcon={<Download className="h-4 w-4" />}
          variant="primary"
          disabled={reportData.length === 0}
        >
          Export to CSV
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <Input
                label="Start Date"
                type="date"
                value={filter.start_date || ''}
                onChange={(e) => setFilter((prev) => ({ ...prev, start_date: e.target.value }))}
                leftIcon={<Calendar className="h-4 w-4" />}
              />
            </div>

            <div>
              <Input
                label="End Date"
                type="date"
                value={filter.end_date || ''}
                onChange={(e) => setFilter((prev) => ({ ...prev, end_date: e.target.value }))}
                leftIcon={<Calendar className="h-4 w-4" />}
              />
            </div>

            <div>
              <Select
                label="Subject Filter"
                value={filter.subject_id || 'all'}
                onChange={(e) => setFilter((prev) => ({ ...prev, subject_id: e.target.value }))}
                options={[
                  { value: 'all', label: 'All Subjects' },
                  { value: 'sbj_1', label: 'Distributed Systems (CS601)' },
                  { value: 'sbj_2', label: 'Mobile Apps (CS602)' },
                  { value: 'sbj_3', label: 'Embedded Systems (EC503)' },
                ]}
              />
            </div>

            <div>
              <Button
                variant="outline"
                className="w-full"
                leftIcon={<Filter className="h-4 w-4" />}
                onClick={() => {
                  // triggers re-query naturally via TanStack Query key
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Session Attendance Summaries</CardTitle>
            <CardDescription>
              Showing results from {filter.start_date} to {filter.end_date}
            </CardDescription>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total Sessions: {reportData.length}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner size="lg" className="text-indigo-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Classroom</TableHead>
                  <TableHead>Present / Total</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.length === 0 ? (
                  <TableEmpty
                    colSpan={8}
                    icon={<FileSpreadsheet className="h-8 w-8 text-slate-300" />}
                    message="No attendance reports found for this period"
                  />
                ) : (
                  reportData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-slate-800 text-xs">
                        {item.date}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900">{item.subject_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{item.subject_code}</div>
                      </TableCell>
                      <TableCell className="text-slate-700 text-sm">{item.section_name}</TableCell>
                      <TableCell className="text-slate-700 text-sm">{item.teacher_name}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{item.classroom_name}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-slate-900">
                          {item.total_present} / {item.total_enrolled}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-bold ${
                            item.attendance_rate >= 85
                              ? 'text-emerald-600'
                              : item.attendance_rate >= 75
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {formatPercent(item.attendance_rate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

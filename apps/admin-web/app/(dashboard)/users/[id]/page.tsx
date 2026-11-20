'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser } from '@/hooks/useUsers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate, formatDateTime } from '@/lib/utils';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  GraduationCap,
  Briefcase,
  Building,
  CheckCircle,
} from 'lucide-react';

export default function UserDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: user, isLoading, error } = useUser(id);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" className="text-indigo-600" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Link href="/users" className="inline-flex items-center gap-1.5 text-sm text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Link>
        <Card className="p-8 text-center">
          <p className="text-slate-600 font-medium">User profile not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Users Directory
        </Link>
        <StatusBadge status={user.is_active ? 'Active' : 'Inactive'} />
      </div>

      {/* User Header Card */}
      <Card className="shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-800" />
        <CardContent className="relative pt-0 pb-6 px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 gap-4">
            <div className="flex items-end gap-4">
              <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-md border border-slate-200">
                <div className="h-full w-full rounded-xl bg-indigo-50 flex items-center justify-center text-3xl font-bold text-indigo-700">
                  {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
              </div>
              <div className="mb-1">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {user.full_name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      user.role === 'admin'
                        ? 'danger'
                        : user.role === 'teacher'
                        ? 'info'
                        : 'neutral'
                    }
                  >
                    {user.role.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-slate-500">ID: {user.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Contact Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Email Address</p>
                <p className="text-sm font-medium text-slate-800">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="text-sm font-medium text-slate-800">{user.phone_number || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Member Since</p>
                <p className="text-sm font-medium text-slate-800">{formatDate(user.created_at)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role specific profile details */}
      {user.student_profile && (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
              <div>
                <CardTitle>Academic Enrollment Details</CardTitle>
                <CardDescription>Associated student profile and section cohort</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase">Roll Number</p>
              <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
                {user.student_profile.roll_number}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase">Department</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">
                {user.student_profile.department_name || 'Computer Science'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase">Section</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">
                {user.student_profile.section_name || 'Section A'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase">Enrollment Year</p>
              <p className="text-sm font-semibold text-slate-900 mt-1">
                {user.student_profile.enrollment_year || 2024}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {user.teacher_profile && (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-600" />
              <div>
                <CardTitle>Faculty Roster Details</CardTitle>
                <CardDescription>Designation and assigned academic department</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase">Employee ID</p>
              <p className="text-base font-bold text-slate-900 mt-1 font-mono">
                {user.teacher_profile.employee_id}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase">Designation</p>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {user.teacher_profile.designation || 'Associate Professor'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium uppercase">Department</p>
              <p className="text-base font-semibold text-slate-900 mt-1">
                {user.teacher_profile.department_name || 'Computer Science & Engineering'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

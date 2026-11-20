'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGetStudents, apiCreateStudent, apiDeleteStudent } from '@/lib/api';
import { Student } from '@/types/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { GraduationCap, Search, Plus, Trash2, Mail } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  // New student form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [departmentName, setDepartmentName] = useState('Computer Science');
  const [sectionName, setSectionName] = useState('Section A');

  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', searchTerm],
    queryFn: () => apiGetStudents({ search: searchTerm }),
  });

  const createMutation = useMutation({
    mutationFn: (data: { full_name: string; email: string; roll_number: string }) =>
      apiCreateStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsCreateOpen(false);
      setFullName('');
      setEmail('');
      setRollNumber('');
      setFeedback({ type: 'success', message: 'Student registered successfully.' });
    },
    onError: () => {
      setFeedback({ type: 'danger', message: 'Failed to create student account.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setFeedback({ type: 'success', message: 'Student removed successfully.' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      full_name: fullName,
      email,
      roll_number: rollNumber,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Students Directory</h1>
          <p className="text-sm text-slate-500">
            Enrolled students registered for BLE proximity attendance tracking
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Register Student
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by student name or roll #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Total: {students.length} students
        </span>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Roll Number</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableEmpty
                colSpan={7}
                icon={<GraduationCap className="h-8 w-8 text-slate-300" />}
                message="No students found"
              />
            ) : (
              students.map((std) => (
                <TableRow key={std.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                        {std.user.full_name ? std.user.full_name[0] : 'S'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{std.user.full_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {std.user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {std.roll_number}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-800 text-sm font-medium">
                    {std.department_name || 'Computer Science'}
                  </TableCell>
                  <TableCell className="text-slate-700 text-sm">
                    {std.section_name || 'Section A'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={std.user.is_active ? 'Active' : 'Inactive'} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(std.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => deleteMutation.mutate(std.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove student"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Register Student Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New Student"
        description="Add a student account with institutional roll number"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Jordan Lee"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Institutional Email"
            type="email"
            placeholder="jordan.lee@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Roll Number"
            placeholder="e.g. CS-2026-099"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            required
          />

          <Input
            label="Department"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
          />

          <Input
            label="Cohort / Section"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Register Student
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

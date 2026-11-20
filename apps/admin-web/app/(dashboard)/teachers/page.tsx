'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGetTeachers, apiCreateTeacher, apiDeleteTeacher } from '@/lib/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { BookOpen, Search, Plus, Trash2, Mail, Briefcase } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function TeachersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [departmentName, setDepartmentName] = useState('Computer Science');

  const queryClient = useQueryClient();

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers', searchTerm],
    queryFn: () => apiGetTeachers({ search: searchTerm }),
  });

  const createMutation = useMutation({
    mutationFn: (data: { full_name: string; email: string; employee_id: string; designation: string }) =>
      apiCreateTeacher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsCreateOpen(false);
      setFullName('');
      setEmail('');
      setEmployeeId('');
      setFeedback({ type: 'success', message: 'Faculty member created successfully.' });
    },
    onError: () => {
      setFeedback({ type: 'danger', message: 'Failed to create faculty member.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setFeedback({ type: 'success', message: 'Faculty member deleted.' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      full_name: fullName,
      email,
      employee_id: employeeId,
      designation,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Faculty Members</h1>
          <p className="text-sm text-slate-500">
            Professors and instructors authorized to broadcast and host attendance sessions
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Add Faculty
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
            placeholder="Search faculty by name or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Total: {teachers.length} faculty
        </span>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Faculty Name</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length === 0 ? (
              <TableEmpty
                colSpan={7}
                icon={<BookOpen className="h-8 w-8 text-slate-300" />}
                message="No faculty members found"
              />
            ) : (
              teachers.map((tch) => (
                <TableRow key={tch.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700">
                        {tch.user.full_name ? tch.user.full_name[0] : 'T'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{tch.user.full_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {tch.user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {tch.employee_id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      {tch.designation || 'Faculty'}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-800 text-sm font-medium">
                    {tch.department_name || 'Computer Science'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tch.user.is_active ? 'Active' : 'Inactive'} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(tch.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => deleteMutation.mutate(tch.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove faculty member"
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

      {/* Add Faculty Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Faculty Member"
        description="Register a teacher profile with institutional employee ID"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Dr. Alan Turing"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <Input
            label="Institutional Email"
            type="email"
            placeholder="alan.turing@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Employee ID"
            placeholder="e.g. EMP-T-1008"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />

          <Input
            label="Designation"
            placeholder="e.g. Associate Professor"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          />

          <Input
            label="Department"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
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
              Add Faculty
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

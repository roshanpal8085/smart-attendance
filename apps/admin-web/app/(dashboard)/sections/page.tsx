'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGetSections, apiCreateSection, apiDeleteSection, apiGetDepartments } from '@/lib/api';
import { Section } from '@/types/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Users2, Plus, Trash2, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SectionsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('dept_1');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [semester, setSemester] = useState(6);
  const [capacity, setCapacity] = useState(65);

  const queryClient = useQueryClient();

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['sections'],
    queryFn: () => apiGetSections(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiGetDepartments(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Section>) => apiCreateSection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      setIsCreateOpen(false);
      setName('');
      setFeedback({ type: 'success', message: 'Cohort section created successfully.' });
    },
    onError: () => {
      setFeedback({ type: 'danger', message: 'Failed to create cohort section.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      setFeedback({ type: 'success', message: 'Section removed.' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      department_id: departmentId,
      academic_year: academicYear,
      semester: Number(semester),
      capacity: Number(capacity),
      is_active: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Sections & Batches</h1>
          <p className="text-sm text-slate-500">
            Student cohorts assigned to course lectures and attendance groups
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Add Section
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Sections Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Section Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Academic Year</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Capacity / Enrolled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.length === 0 ? (
              <TableEmpty
                colSpan={7}
                icon={<Users2 className="h-8 w-8 text-slate-300" />}
                message="No cohort sections found"
              />
            ) : (
              sections.map((sec) => (
                <TableRow key={sec.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                        <Users2 className="h-4 w-4" />
                      </div>
                      <div className="font-semibold text-slate-900">{sec.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700 text-sm">
                    {sec.department_name || 'Computer Science'}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {sec.academic_year}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      Semester {sec.semester}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">
                        {sec.student_count || 0} / {sec.capacity}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sec.is_active ? 'Active' : 'Inactive'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => deleteMutation.mutate(sec.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete section"
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

      {/* Add Section Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Cohort Section"
        description="Define a student batch for attendance rosters"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Section Name"
            placeholder="e.g. CSE Section A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </Select>

          <Input
            label="Academic Year"
            placeholder="2026-2027"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Semester"
              type="number"
              placeholder="6"
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              required
            />
            <Input
              label="Student Capacity"
              type="number"
              placeholder="65"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              required
            />
          </div>

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
              Create Section
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

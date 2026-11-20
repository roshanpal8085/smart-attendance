'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGetSubjects, apiCreateSubject, apiDeleteSubject, apiGetDepartments } from '@/lib/api';
import { Subject } from '@/types/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { BookMarked, Plus, Trash2, Award } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SubjectsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('dept_1');
  const [credits, setCredits] = useState(4);
  const [semester, setSemester] = useState(6);

  const queryClient = useQueryClient();

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiGetSubjects(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiGetDepartments(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Subject>) => apiCreateSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsCreateOpen(false);
      setName('');
      setCode('');
      setFeedback({ type: 'success', message: 'Course curriculum added successfully.' });
    },
    onError: () => {
      setFeedback({ type: 'danger', message: 'Failed to create subject.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setFeedback({ type: 'success', message: 'Course removed.' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      code,
      department_id: departmentId,
      credits: Number(credits),
      semester: Number(semester),
      is_active: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Course Subjects</h1>
          <p className="text-sm text-slate-500">
            Registered syllabus curriculum subjects and credit allocations
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Add Subject
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Subjects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Code</TableHead>
              <TableHead>Subject Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length === 0 ? (
              <TableEmpty
                colSpan={7}
                icon={<BookMarked className="h-8 w-8 text-slate-300" />}
                message="No course subjects found"
              />
            ) : (
              subjects.map((sbj) => (
                <TableRow key={sbj.id}>
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded">
                      {sbj.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{sbj.name}</div>
                  </TableCell>
                  <TableCell className="text-slate-700 text-sm">
                    {sbj.department_name || 'Computer Science'}
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-800 font-medium text-xs">
                      Semester {sbj.semester}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                      <Award className="h-3.5 w-3.5 text-amber-500" />
                      {sbj.credits} Credits
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sbj.is_active ? 'Active' : 'Inactive'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => deleteMutation.mutate(sbj.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete subject"
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

      {/* Add Subject Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Course Subject"
        description="Register a curriculum syllabus unit"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Subject Name"
            placeholder="e.g. Distributed Systems & Cloud Computing"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Course Code"
            placeholder="e.g. CS601"
            value={code}
            onChange={(e) => setCode(e.target.value)}
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
              label="Credits"
              type="number"
              placeholder="4"
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
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
              Create Subject
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

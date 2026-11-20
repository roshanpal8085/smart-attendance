'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGetDepartments, apiCreateDepartment, apiDeleteDepartment, apiGetColleges } from '@/lib/api';
import { Department } from '@/types/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function DepartmentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [collegeId, setCollegeId] = useState('col_1');

  const queryClient = useQueryClient();

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiGetDepartments(),
  });

  const { data: colleges = [] } = useQuery({
    queryKey: ['colleges'],
    queryFn: () => apiGetColleges(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Department>) => apiCreateDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsCreateOpen(false);
      setName('');
      setCode('');
      setFeedback({ type: 'success', message: 'Department created successfully.' });
    },
    onError: () => {
      setFeedback({ type: 'danger', message: 'Failed to create department.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setFeedback({ type: 'success', message: 'Department removed.' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      code,
      college_id: collegeId,
      is_active: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Departments</h1>
          <p className="text-sm text-slate-500">
            Departments and faculties responsible for courses and cohorts
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Add Department
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Departments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department Name</TableHead>
              <TableHead>Department Code</TableHead>
              <TableHead>Associated College</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 ? (
              <TableEmpty
                colSpan={6}
                icon={<Layers className="h-8 w-8 text-slate-300" />}
                message="No departments found"
              />
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div className="font-semibold text-slate-900">{dept.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {dept.code}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-700 text-sm">
                    {dept.college_name || 'Apex Institute of Technology'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={dept.is_active ? 'Active' : 'Inactive'} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(dept.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => deleteMutation.mutate(dept.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete department"
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

      {/* Add Department Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Academic Department"
        description="Link department to a parent college body"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Department Name"
            placeholder="e.g. Computer Science and Engineering"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Department Code"
            placeholder="e.g. CSE"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          <Select
            label="Parent College"
            value={collegeId}
            onChange={(e) => setCollegeId(e.target.value)}
          >
            {colleges.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name} ({col.code})
              </option>
            ))}
          </Select>

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
              Create Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

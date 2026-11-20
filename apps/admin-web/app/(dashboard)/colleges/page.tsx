'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGetColleges, apiCreateCollege, apiDeleteCollege } from '@/lib/api';
import { College } from '@/types/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Building, Plus, Trash2, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function CollegesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');

  const queryClient = useQueryClient();

  const { data: colleges = [], isLoading } = useQuery({
    queryKey: ['colleges'],
    queryFn: () => apiGetColleges(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<College>) => apiCreateCollege(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colleges'] });
      setIsCreateOpen(false);
      setName('');
      setCode('');
      setAddress('');
      setFeedback({ type: 'success', message: 'College institution registered.' });
    },
    onError: () => {
      setFeedback({ type: 'danger', message: 'Failed to create college.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteCollege(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colleges'] });
      setFeedback({ type: 'success', message: 'College removed.' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name, code, address, is_active: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Colleges & Schools</h1>
          <p className="text-sm text-slate-500">
            Institutional entities and constituent schools under the attendance system
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Add College
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Colleges Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>College Name</TableHead>
              <TableHead>Institutional Code</TableHead>
              <TableHead>Campus Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {colleges.length === 0 ? (
              <TableEmpty
                colSpan={6}
                icon={<Building className="h-8 w-8 text-slate-300" />}
                message="No colleges found"
              />
            ) : (
              colleges.map((col) => (
                <TableRow key={col.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                        <Building className="h-4 w-4" />
                      </div>
                      <div className="font-semibold text-slate-900">{col.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {col.code}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {col.address || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={col.is_active ? 'Active' : 'Inactive'} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDate(col.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => deleteMutation.mutate(col.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete college"
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

      {/* Add College Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add College Institution"
        description="Register a new academic body"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="College Name"
            placeholder="e.g. Apex Institute of Technology"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="College Code"
            placeholder="e.g. AIT"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          <Input
            label="Campus Address"
            placeholder="e.g. 100 University Boulevard"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
              Create College
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

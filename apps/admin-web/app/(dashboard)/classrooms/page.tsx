'use client';

import React, { useState } from 'react';
import {
  useClassrooms,
  useCreateClassroom,
  useUpdateClassroom,
  useDeleteClassroom,
  useBeacons,
} from '@/hooks/useClassrooms';
import { ClassroomTable } from '@/components/classrooms/ClassroomTable';
import { ClassroomForm, ClassroomFormData } from '@/components/classrooms/ClassroomForm';
import { Modal } from '@/components/ui/Modal';
import { Classroom } from '@/types/api';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

export default function ClassroomsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [deletingClassroom, setDeletingClassroom] = useState<Classroom | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const { data: classrooms = [], isLoading } = useClassrooms();
  const { data: beacons = [] } = useBeacons();

  const createMutation = useCreateClassroom();
  const updateMutation = useUpdateClassroom();
  const deleteMutation = useDeleteClassroom();

  const filteredClassrooms = classrooms.filter((room) => {
    const matchesMode = modeFilter === 'all' || room.mode === modeFilter;
    const matchesSearch =
      searchTerm === '' ||
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.beacon_uuid && room.beacon_uuid.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesMode && matchesSearch;
  });

  const handleCreateSubmit = async (data: ClassroomFormData) => {
    try {
      await createMutation.mutateAsync(data);
      setIsCreateModalOpen(false);
      setFeedback({ type: 'success', message: `Classroom "${data.name}" created successfully.` });
    } catch {
      setFeedback({ type: 'danger', message: 'Failed to create classroom.' });
    }
  };

  const handleUpdateSubmit = async (data: ClassroomFormData) => {
    if (!editingClassroom) return;
    try {
      await updateMutation.mutateAsync({ id: editingClassroom.id, data });
      setEditingClassroom(null);
      setFeedback({ type: 'success', message: `Classroom "${data.name}" updated successfully.` });
    } catch {
      setFeedback({ type: 'danger', message: 'Failed to update classroom.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClassroom) return;
    try {
      await deleteMutation.mutateAsync(deletingClassroom.id);
      setDeletingClassroom(null);
      setFeedback({ type: 'success', message: `Classroom "${deletingClassroom.name}" deleted.` });
    } catch {
      setFeedback({ type: 'danger', message: 'Failed to delete classroom.' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Classroom Management</h1>
        <p className="text-sm text-slate-500">
          Configure physical lecture halls, proximity modes, and associated BLE hardware beacons
        </p>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <ClassroomTable
        classrooms={filteredClassrooms}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        modeFilter={modeFilter}
        onModeFilterChange={setModeFilter}
        onCreateNew={() => setIsCreateModalOpen(true)}
        onEdit={(room) => setEditingClassroom(room)}
        onDelete={(room) => setDeletingClassroom(room)}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Classroom"
        description="Assign proximity verification mode and capacity"
      >
        <ClassroomForm
          beacons={beacons}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingClassroom}
        onClose={() => setEditingClassroom(null)}
        title={`Edit Classroom: ${editingClassroom?.name}`}
        description="Update room details or proximity hardware assignment"
      >
        <ClassroomForm
          initialData={editingClassroom}
          beacons={beacons}
          onSubmit={handleUpdateSubmit}
          onCancel={() => setEditingClassroom(null)}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingClassroom}
        onClose={() => setDeletingClassroom(null)}
        title="Delete Classroom"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <strong className="text-slate-900">{deletingClassroom?.name}</strong>?
            Any scheduled sessions will lose their room assignment.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setDeletingClassroom(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={deleteMutation.isPending}
            >
              Delete Classroom
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

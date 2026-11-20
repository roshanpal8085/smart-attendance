'use client';

import React, { useState } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { UserTable } from '@/components/users/UserTable';
import { UserForm, UserFormData } from '@/components/users/UserForm';
import { Modal } from '@/components/ui/Modal';
import { User } from '@/types/api';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const { data, isLoading } = useUsers({
    role: roleFilter,
    search: searchTerm,
  });

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const handleCreateSubmit = async (formData: UserFormData) => {
    try {
      await createUserMutation.mutateAsync(formData);
      setIsCreateModalOpen(false);
      setFeedback({ type: 'success', message: `User "${formData.full_name}" created successfully.` });
    } catch {
      setFeedback({ type: 'danger', message: 'Failed to create user. Please check your input.' });
    }
  };

  const handleUpdateSubmit = async (formData: UserFormData) => {
    if (!editingUser) return;
    try {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        data: formData,
      });
      setEditingUser(null);
      setFeedback({ type: 'success', message: `User "${formData.full_name}" updated successfully.` });
    } catch {
      setFeedback({ type: 'danger', message: 'Failed to update user.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    try {
      await deleteUserMutation.mutateAsync(deletingUser.id);
      setDeletingUser(null);
      setFeedback({ type: 'success', message: `User "${deletingUser.full_name}" has been deleted.` });
    } catch {
      setFeedback({ type: 'danger', message: 'Failed to delete user.' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500">
          Manage system administrators, faculty members, and student user credentials
        </p>
      </div>

      {feedback && (
        <Alert
          variant={feedback.type}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      <UserTable
        users={data?.items || []}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        onCreateNew={() => setIsCreateModalOpen(true)}
        onEdit={(user) => setEditingUser(user)}
        onDelete={(user) => setDeletingUser(user)}
      />

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New User Account"
        description="Create credentials and assign an institutional role"
      >
        <UserForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createUserMutation.isPending}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit User: ${editingUser?.full_name}`}
        description="Update contact information or role permissions"
      >
        <UserForm
          initialData={editingUser}
          onSubmit={handleUpdateSubmit}
          onCancel={() => setEditingUser(null)}
          isLoading={updateUserMutation.isPending}
        />
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Confirm User Deletion"
        description="Are you sure you want to permanently delete this account?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will permanently remove the account for{' '}
            <strong className="text-slate-900">{deletingUser?.full_name}</strong> ({deletingUser?.email}).
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setDeletingUser(null)}
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={deleteUserMutation.isPending}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

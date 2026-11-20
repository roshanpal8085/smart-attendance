'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, UserRole } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const userSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'teacher', 'student']),
  phone: z.string().optional(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: 'Password must be at least 6 characters if provided',
    }),
  is_active: z.boolean().default(true),
});

export type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: User | null;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function UserForm({ initialData, onSubmit, onCancel, isLoading = false }: UserFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      email: initialData?.email || '',
      role: initialData?.role || 'student',
      phone: initialData?.phone || '',
      password: '',
      is_active: initialData?.is_active ?? true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Full Name"
        placeholder="e.g. Jane Doe"
        error={errors.full_name?.message}
        {...register('full_name')}
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="jane.doe@college.edu"
        error={errors.email?.message}
        {...register('email')}
      />

      <Select
        label="Role"
        error={errors.role?.message}
        {...register('role')}
        options={[
          { value: 'student', label: 'Student' },
          { value: 'teacher', label: 'Teacher / Faculty' },
          { value: 'admin', label: 'Administrator' },
        ]}
      />

      <Input
        label="Phone Number (Optional)"
        placeholder="+1-555-0199"
        error={errors.phone?.message}
        {...register('phone')}
      />

      <Input
        label={isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex items-center gap-2 pt-2">
        <input
          id="is_active"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          {...register('is_active')}
        />
        <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
          Account Active
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Save Changes' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}

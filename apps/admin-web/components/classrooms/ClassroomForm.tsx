'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Classroom, Beacon } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const classroomSchema = z.object({
  name: z.string().min(2, 'Classroom name is required'),
  building: z.string().min(2, 'Building is required'),
  floor: z.string().optional(),
  room_number: z.string().optional(),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  mode: z.enum(['beacon', 'teacher_phone']),
  beacon_id: z.string().optional(),
  beacon_uuid: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type ClassroomFormData = z.infer<typeof classroomSchema>;

interface ClassroomFormProps {
  initialData?: Classroom | null;
  beacons?: Beacon[];
  onSubmit: (data: ClassroomFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ClassroomForm({
  initialData,
  beacons = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: ClassroomFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ClassroomFormData>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      name: initialData?.name || '',
      building: initialData?.building || '',
      floor: initialData?.floor || '',
      room_number: initialData?.room_number || '',
      capacity: initialData?.capacity || 60,
      mode: initialData?.mode || 'beacon',
      beacon_id: initialData?.beacon_id || '',
      beacon_uuid: initialData?.beacon_uuid || '',
      is_active: initialData?.is_active ?? true,
    },
  });

  const selectedMode = watch('mode');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Classroom Name"
        placeholder="e.g. Auditorium Hall A"
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Building"
          placeholder="e.g. Science Block"
          error={errors.building?.message}
          {...register('building')}
        />

        <Input
          label="Room Number"
          placeholder="e.g. LH-201"
          error={errors.room_number?.message}
          {...register('room_number')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Floor"
          placeholder="e.g. 2nd Floor"
          error={errors.floor?.message}
          {...register('floor')}
        />

        <Input
          label="Capacity (Seats)"
          type="number"
          placeholder="60"
          error={errors.capacity?.message}
          {...register('capacity')}
        />
      </div>

      <Select
        label="Attendance Verification Mode"
        error={errors.mode?.message}
        {...register('mode')}
        options={[
          { value: 'beacon', label: 'Hardware BLE Beacon' },
          { value: 'teacher_phone', label: "Teacher's Smartphone Host (BLE Advertiser)" },
        ]}
      />

      {selectedMode === 'beacon' && (
        <div className="p-3.5 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3">
          <p className="text-xs font-semibold text-indigo-900">BLE Beacon Configuration</p>
          <Select
            label="Assigned Hardware Beacon"
            error={errors.beacon_id?.message}
            {...register('beacon_id')}
          >
            <option value="">Select a registered beacon...</option>
            {beacons.map((b) => (
              <option key={b.id} value={b.id}>
                {b.uuid} (Major: {b.major}, Minor: {b.minor}) - {b.battery_level}% battery
              </option>
            ))}
          </Select>

          <Input
            label="Custom Beacon UUID (Optional manual override)"
            placeholder="e.g. E2C56DB5-DFFB-48D2-B060-D0F5A71096E0"
            error={errors.beacon_uuid?.message}
            {...register('beacon_uuid')}
          />
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <input
          id="is_active"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          {...register('is_active')}
        />
        <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
          Classroom Available & Active
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Update Classroom' : 'Create Classroom'}
        </Button>
      </div>
    </form>
  );
}

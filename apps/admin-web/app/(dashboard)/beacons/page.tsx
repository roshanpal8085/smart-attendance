'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGetBeacons, apiCreateBeacon, apiDeleteBeacon, apiGetClassrooms } from '@/lib/api';
import { Beacon } from '@/types/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Bluetooth, Plus, Trash2, Battery, BatteryCharging, BatteryWarning, Radio } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function BeaconsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  const [uuid, setUuid] = useState('E2C56DB5-DFFB-48D2-B060-D0F5A71096E0');
  const [major, setMajor] = useState(100);
  const [minor, setMinor] = useState(10);
  const [macAddress, setMacAddress] = useState('DC:A6:32:8B:11:99');
  const [classroomId, setClassroomId] = useState('');

  const queryClient = useQueryClient();

  const { data: beacons = [], isLoading } = useQuery({
    queryKey: ['beacons'],
    queryFn: () => apiGetBeacons(),
  });

  const { data: classrooms = [] } = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => apiGetClassrooms(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Beacon>) => apiCreateBeacon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beacons'] });
      setIsCreateOpen(false);
      setFeedback({ type: 'success', message: 'Hardware BLE beacon registered successfully.' });
    },
    onError: () => {
      setFeedback({ type: 'danger', message: 'Failed to register beacon hardware.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDeleteBeacon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beacons'] });
      setFeedback({ type: 'success', message: 'Beacon removed.' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      uuid,
      major: Number(major),
      minor: Number(minor),
      mac_address: macAddress,
      classroom_id: classroomId || undefined,
      battery_level: 100,
      status: 'active',
    });
  };

  const getBatteryIcon = (level: number) => {
    if (level < 20) return <BatteryWarning className="h-4 w-4 text-rose-500" />;
    return <Battery className="h-4 w-4 text-emerald-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">BLE Hardware Beacons</h1>
          <p className="text-sm text-slate-500">
            Monitor physical Bluetooth Low Energy beacons deployed across campus classrooms
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Register Beacon
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Beacons Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>UUID / Identification</TableHead>
              <TableHead>Major / Minor</TableHead>
              <TableHead>MAC Address</TableHead>
              <TableHead>Assigned Classroom</TableHead>
              <TableHead>Battery Level</TableHead>
              <TableHead>Last Broadcast</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {beacons.length === 0 ? (
              <TableEmpty
                colSpan={8}
                icon={<Bluetooth className="h-8 w-8 text-slate-300" />}
                message="No beacons registered"
              />
            ) : (
              beacons.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                        <Bluetooth className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-mono text-xs font-semibold text-slate-900 truncate max-w-[220px]" title={b.uuid}>
                          {b.uuid}
                        </div>
                        <div className="text-[11px] text-slate-400">ID: {b.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-medium text-slate-700">
                      {b.major} / {b.minor}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-600">
                      {b.mac_address || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-slate-800">
                      {b.classroom_name || 'Unassigned'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getBatteryIcon(b.battery_level)}
                      <span className="text-xs font-semibold text-slate-800">
                        {b.battery_level}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {formatDateTime(b.last_seen_at)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => deleteMutation.mutate(b.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete beacon"
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

      {/* Register Beacon Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New BLE Beacon"
        description="Add a hardware beacon device to the attendance tracking mesh"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Proximity UUID"
            placeholder="e.g. E2C56DB5-DFFB-48D2-B060-D0F5A71096E0"
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Major Number"
              type="number"
              placeholder="100"
              value={major}
              onChange={(e) => setMajor(Number(e.target.value))}
              required
            />
            <Input
              label="Minor Number"
              type="number"
              placeholder="1"
              value={minor}
              onChange={(e) => setMinor(Number(e.target.value))}
              required
            />
          </div>

          <Input
            label="MAC Address"
            placeholder="DC:A6:32:8B:11:01"
            value={macAddress}
            onChange={(e) => setMacAddress(e.target.value)}
          />

          <Select
            label="Assign to Classroom"
            value={classroomId}
            onChange={(e) => setClassroomId(e.target.value)}
          >
            <option value="">Leave Unassigned</option>
            {classrooms.map((cr) => (
              <option key={cr.id} value={cr.id}>
                {cr.name} ({cr.building})
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
              Register Beacon
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

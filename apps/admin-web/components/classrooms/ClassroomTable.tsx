'use client';

import React from 'react';
import { Classroom } from '@/types/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Radio, Smartphone, Edit2, Trash2, Plus, MapPin, Search } from 'lucide-react';

interface ClassroomTableProps {
  classrooms: Classroom[];
  isLoading: boolean;
  onEdit: (classroom: Classroom) => void;
  onDelete: (classroom: Classroom) => void;
  onCreateNew: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  modeFilter: string;
  onModeFilterChange: (mode: string) => void;
}

export function ClassroomTable({
  classrooms,
  isLoading,
  onEdit,
  onDelete,
  onCreateNew,
  searchTerm,
  onSearchChange,
  modeFilter,
  onModeFilterChange,
}: ClassroomTableProps) {
  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search classrooms or buildings..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={modeFilter}
              onChange={(e) => onModeFilterChange(e.target.value)}
              options={[
                { value: 'all', label: 'All Modes' },
                { value: 'beacon', label: 'BLE Beacon Only' },
                { value: 'teacher_phone', label: 'Teacher Phone Host' },
              ]}
            />
          </div>
        </div>

        <Button onClick={onCreateNew} leftIcon={<Plus className="h-4 w-4" />}>
          Add Classroom
        </Button>
      </div>

      {/* Classroom Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Classroom</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Proximity Mode</TableHead>
              <TableHead>Beacon Hardware</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classrooms.length === 0 ? (
              <TableEmpty
                colSpan={7}
                icon={<MapPin className="h-8 w-8 text-slate-300" />}
                message="No classrooms found"
                description="Create a classroom or change search filters"
              />
            ) : (
              classrooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{room.name}</div>
                    <div className="text-xs text-slate-500">ID: {room.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-slate-800 text-sm font-medium">{room.building}</div>
                    <div className="text-xs text-slate-500">
                      {room.floor ? `${room.floor} • ` : ''}
                      Room {room.room_number || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {room.mode === 'beacon' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Radio className="h-3.5 w-3.5 text-indigo-600" />
                        Hardware Beacon
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        <Smartphone className="h-3.5 w-3.5 text-amber-600" />
                        Teacher Host
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {room.mode === 'beacon' ? (
                      <div>
                        <div className="font-mono text-xs text-slate-800 truncate max-w-[200px]" title={room.beacon_uuid}>
                          {room.beacon_uuid || 'Unassigned'}
                        </div>
                        {room.beacon_major !== undefined && room.beacon_minor !== undefined && (
                          <div className="text-[11px] text-slate-500">
                            Major: {room.beacon_major} | Minor: {room.beacon_minor}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">None (Uses smartphone)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-800">{room.capacity} seats</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={room.is_active ? 'Active' : 'Inactive'} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(room)}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit classroom"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(room)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete classroom"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

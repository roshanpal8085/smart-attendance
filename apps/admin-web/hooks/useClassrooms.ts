'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  apiGetClassrooms,
  apiGetClassroom,
  apiCreateClassroom,
  apiUpdateClassroom,
  apiDeleteClassroom,
  apiGetBeacons,
} from '@/lib/api';
import { Classroom } from '@/types/api';

export function useClassrooms() {
  return useQuery({
    queryKey: ['classrooms'],
    queryFn: () => apiGetClassrooms(),
  });
}

export function useClassroom(id: string) {
  return useQuery({
    queryKey: ['classroom', id],
    queryFn: () => apiGetClassroom(id),
    enabled: !!id,
  });
}

export function useCreateClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Classroom>) => apiCreateClassroom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
  });
}

export function useUpdateClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Classroom> }) =>
      apiUpdateClassroom(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      queryClient.invalidateQueries({ queryKey: ['classroom', variables.id] });
    },
  });
}

export function useDeleteClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDeleteClassroom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
  });
}

export function useBeacons() {
  return useQuery({
    queryKey: ['beacons'],
    queryFn: () => apiGetBeacons(),
  });
}

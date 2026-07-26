import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  queryAI,
} from '../services/maintenance.service';
import type {
  CreateMaintenanceRequest,
  UpdateMaintenanceRequest,
  AIQueryRequest,
} from '../types/api';

export function useMaintenance(status?: string) {
  return useQuery({
    queryKey: ['maintenance', status],
    queryFn: () => getMaintenance(status),
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      componentId,
      data,
    }: {
      componentId: string;
      data: CreateMaintenanceRequest;
    }) => createMaintenance(componentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaintenanceRequest }) =>
      updateMaintenance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });
}

export function useDeleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMaintenance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });
}

export function useQueryAI() {
  return useMutation({
    mutationFn: (data: AIQueryRequest) => queryAI(data),
  });
}

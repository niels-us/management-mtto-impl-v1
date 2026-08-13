import api from '@shared/api/client';
import type {
  Maintenance,
  CreateMaintenanceRequest,
  UpdateMaintenanceRequest,
} from '@entities/maintenance/model';

export async function getMaintenance(status?: string): Promise<Maintenance[]> {
  const params = status ? { status } : {};
  const response = await api.get<Maintenance[]>('/V1/maintenance', { params });
  return response.data;
}

export async function createMaintenance(
  componentId: string,
  data: CreateMaintenanceRequest
): Promise<Maintenance> {
  const response = await api.post<Maintenance>(
    `/V1/components/${componentId}/maintenance`,
    data
  );
  return response.data;
}

export async function updateMaintenance(
  id: string,
  data: UpdateMaintenanceRequest
): Promise<Maintenance> {
  const response = await api.patch<Maintenance>(`/V1/maintenance/${id}`, data);
  return response.data;
}

export async function deleteMaintenance(id: string): Promise<void> {
  await api.delete(`/V1/maintenance/${id}`);
}
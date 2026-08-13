import api from '@shared/api/client';
import type { Component } from '@entities/component/model';

export async function getVesselComponents(vesselId: string): Promise<Component[]> {
  const response = await api.get<Component[]>(`/V1/vessels/${vesselId}/components`);
  return response.data;
}

import api from './api';
import type { Component } from '../types/api';

export async function getVesselComponents(vesselId: string): Promise<Component[]> {
  const response = await api.get<Component[]>(`/V1/vessels/${vesselId}/components`);
  return response.data;
}

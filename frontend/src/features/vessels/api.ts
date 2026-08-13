import api from '@shared/api/client';
import type { Vessel } from '@entities/vessel/model';

export async function getVessels(): Promise<Vessel[]> {
  const response = await api.get<Vessel[]>('/V1/vessels');
  return response.data;
}

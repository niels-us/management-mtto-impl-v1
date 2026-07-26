import api from './api';
import type { Vessel } from '../types/api';

export async function getVessels(): Promise<Vessel[]> {
  const response = await api.get<Vessel[]>('/V1/vessels');
  return response.data;
}

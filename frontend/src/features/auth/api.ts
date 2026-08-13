import api from '@shared/api/client';
import type { LoginRequest, LoginResponse } from './model';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/V1/auth/login', data);
  return response.data;
}

import api from './api';
import type { LoginRequest, LoginResponse } from '../types/api';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/V1/auth/login', data);
  return response.data;
}

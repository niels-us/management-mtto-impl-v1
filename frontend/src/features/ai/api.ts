import api from '@shared/api/client';
import type { AIQueryRequest, AIQueryResponse, AIHealthResponse } from './model';

export async function queryAI(data: AIQueryRequest): Promise<AIQueryResponse> {
  const response = await api.post<AIQueryResponse>('/V1/maintenance/query-ai', data);
  return response.data;
}

export async function getAIHealth(): Promise<AIHealthResponse> {
  const response = await api.get<AIHealthResponse>('/V1/maintenance/ai-health');
  return response.data;
}

import { useMutation } from '@tanstack/react-query';
import { queryAI } from './api';
import type { AIQueryRequest } from './model';

export function useQueryAI() {
  return useMutation({
    mutationFn: (data: AIQueryRequest) => queryAI(data),
  });
}

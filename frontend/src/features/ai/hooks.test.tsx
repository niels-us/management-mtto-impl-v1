import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQueryAI } from './hooks';

vi.mock('./api', () => ({
  queryAI: vi.fn(),
}));

import { queryAI } from './api';
import type { AIQueryResponse } from './model';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useQueryAI', () => {
  it('runs the query mutation with the request payload', async () => {
    const response: AIQueryResponse = {
      success: true,
      question: 'How do I fix the pump?',
      answer: 'Replace the pump gasket.',
      dataSource: 'manual',
      timestamp: '2026-08-13T10:00:00Z',
      processingTimeMs: 120,
      error: null,
    };
    vi.mocked(queryAI).mockResolvedValue(response);
    const { result } = renderHook(() => useQueryAI(), { wrapper });

    result.current.mutate({ question: 'How do I fix the pump?' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryAI).toHaveBeenCalledWith({ question: 'How do I fix the pump?' });
    expect(result.current.data).toEqual(response);
  });

  it('surfaces query errors', async () => {
    vi.mocked(queryAI).mockRejectedValue(new Error('AI unavailable'));
    const { result } = renderHook(() => useQueryAI(), { wrapper });

    result.current.mutate({ question: 'Is AI up?' });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

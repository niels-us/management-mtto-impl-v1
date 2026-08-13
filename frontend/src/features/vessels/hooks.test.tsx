import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVessels } from './hooks';

vi.mock('./api', () => ({
  getVessels: vi.fn(),
}));

import { getVessels } from './api';
import type { Vessel } from '@entities/vessel/model';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

const vessels: Vessel[] = [
  { id: 'v1', name: 'Titan', registrationNumber: 'REG-001', customerId: 'c1', createdAt: '2026-01-10T00:00:00Z' },
];

describe('useVessels', () => {
  it('returns the vessel list', async () => {
    vi.mocked(getVessels).mockResolvedValue(vessels);
    const { result } = renderHook(() => useVessels(), { wrapper });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(vessels);
    expect(getVessels).toHaveBeenCalledTimes(1);
  });

  it('surfaces errors from the api', async () => {
    vi.mocked(getVessels).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useVessels(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

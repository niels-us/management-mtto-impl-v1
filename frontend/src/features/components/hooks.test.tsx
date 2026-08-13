import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useComponents } from './hooks';

vi.mock('./api', () => ({
  getVesselComponents: vi.fn(),
}));

import { getVesselComponents } from './api';
import type { Component } from '@entities/component/model';

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

const components: Component[] = [
  { id: 'c1', vesselId: 'v1', name: 'Engine', customerId: 'c1', serialNumber: 'SN-01', installedAt: null },
];

describe('useComponents', () => {
  it('does not fetch without a vesselId', () => {
    const { result } = renderHook(() => useComponents(undefined), { wrapper });
    expect(result.current.isPending).toBe(true);
    expect(getVesselComponents).not.toHaveBeenCalled();
  });

  it('fetches components for a vesselId', async () => {
    vi.mocked(getVesselComponents).mockResolvedValue(components);
    const { result } = renderHook(() => useComponents('v1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(components);
    expect(getVesselComponents).toHaveBeenCalledWith('v1');
  });
});

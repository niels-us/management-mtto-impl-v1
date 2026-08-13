import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useMaintenance,
  useCreateMaintenance,
  useUpdateMaintenance,
  useDeleteMaintenance,
} from './hooks';

vi.mock('./api', () => ({
  getMaintenance: vi.fn(),
  createMaintenance: vi.fn(),
  updateMaintenance: vi.fn(),
  deleteMaintenance: vi.fn(),
}));

import {
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from './api';
import type { Maintenance } from '@entities/maintenance/model';

const maintenance: Maintenance[] = [
  {
    id: 'm1',
    componentId: 'c1',
    customerId: 'c1',
    status: 'pending',
    description: 'Replace filter',
    scheduledAt: '2026-08-15T10:00:00Z',
    performedAt: null,
    createdBy: 'u1',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: null,
  },
];

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidateSpy };
}

describe('useMaintenance', () => {
  it('fetches maintenance and passes the status filter', async () => {
    vi.mocked(getMaintenance).mockResolvedValue(maintenance);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useMaintenance('PENDING'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(maintenance);
    expect(getMaintenance).toHaveBeenCalledWith('PENDING');
  });
});

describe('useCreateMaintenance', () => {
  it('creates maintenance and invalidates the list cache', async () => {
    vi.mocked(createMaintenance).mockResolvedValue(maintenance[0]);
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useCreateMaintenance(), { wrapper });

    result.current.mutate({
      componentId: 'c1',
      data: {
        description: 'x',
        scheduledAt: '2026-08-15T10:00',
        customerId: 'c1',
        createdBy: 'u1',
      },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createMaintenance).toHaveBeenCalledWith('c1', {
      description: 'x',
      scheduledAt: '2026-08-15T10:00',
      customerId: 'c1',
      createdBy: 'u1',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['maintenance'] });
  });
});

describe('useUpdateMaintenance', () => {
  it('updates maintenance and invalidates the list cache', async () => {
    vi.mocked(updateMaintenance).mockResolvedValue(maintenance[0]);
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useUpdateMaintenance(), { wrapper });

    result.current.mutate({ id: 'm1', data: { status: 'completed' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateMaintenance).toHaveBeenCalledWith('m1', { status: 'completed' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['maintenance'] });
  });
});

describe('useDeleteMaintenance', () => {
  it('deletes maintenance and invalidates the list cache', async () => {
    vi.mocked(deleteMaintenance).mockResolvedValue(undefined);
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useDeleteMaintenance(), { wrapper });

    result.current.mutate('m1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteMaintenance).toHaveBeenCalledWith('m1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['maintenance'] });
  });
});

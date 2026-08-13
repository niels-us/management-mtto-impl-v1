import { defineFeature, loadFeature } from 'jest-cucumber';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, vi } from 'vitest';
import { getFeatureFile, getMockData } from '../../util/TestHelper';
import MaintenanceDetailPage from '@pages/maintenance/MaintenanceDetailPage';
import type { Maintenance } from '@entities/maintenance/model';

const navigateMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());
const deleteMock = vi.hoisted(() => vi.fn());
const useMaintenanceMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'm1' }),
  useNavigate: () => navigateMock,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('@features/maintenance/hooks', () => ({
  useMaintenance: useMaintenanceMock,
  useUpdateMaintenance: () => ({ mutateAsync: updateMock, isPending: false }),
  useDeleteMaintenance: () => ({ mutateAsync: deleteMock, isPending: false }),
}));

const maintenance = getMockData<Maintenance[]>(import.meta.url, 'maintenance-mock');
const feature = loadFeature(getFeatureFile(import.meta.url, 'detail'));

defineFeature(feature, (test) => {
  beforeEach(() => {
    navigateMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  test('Loading state shows skeletons', ({ given, when, then }) => {
    given('the maintenance record is loading', () => {
      useMaintenanceMock.mockReturnValue({ data: undefined, isLoading: true });
    });

    when('the user opens the maintenance detail', () => {
      render(<MaintenanceDetailPage />);
    });

    then('a loading skeleton is displayed', () => {
      expect(screen.queryByText('Replace filter')).not.toBeInTheDocument();
    });
  });

  test('Missing record', ({ given, when, then }) => {
    given('the maintenance list is empty', () => {
      useMaintenanceMock.mockReturnValue({ data: [], isLoading: false });
    });

    when('the user opens the maintenance detail', () => {
      render(<MaintenanceDetailPage />);
    });

    then('the message "Maintenance record not found" is displayed', () => {
      expect(screen.getByText('Maintenance record not found')).toBeInTheDocument();
    });
  });

  test('Record details are shown', ({ given, when, then, and }) => {
    given('a maintenance record exists', () => {
      useMaintenanceMock.mockReturnValue({ data: maintenance, isLoading: false });
    });

    when('the user opens the maintenance detail', () => {
      render(<MaintenanceDetailPage />);
    });

    then('the description "Replace filter" is displayed', () => {
      expect(screen.getByText('Replace filter')).toBeInTheDocument();
    });

    and('the component id "c1" is displayed', () => {
      expect(screen.getByText('c1')).toBeInTheDocument();
    });

    and('the created by user "u1" is displayed', () => {
      expect(screen.getByText('u1')).toBeInTheDocument();
    });
  });

  test('Updating the status', ({ given, when, and, then }) => {
    given('a maintenance record exists', () => {
      useMaintenanceMock.mockReturnValue({ data: maintenance, isLoading: false });
    });

    when('the user opens the maintenance detail', () => {
      render(<MaintenanceDetailPage />);
    });

    and('the user sets the status to "completed"', async () => {
      await userEvent.selectOptions(screen.getByRole('combobox'), 'completed');
    });

    and('the user submits the update', async () => {
      updateMock.mockResolvedValueOnce({});
      await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    });

    then('the API is called with id "m1" and status "completed"', async () => {
      await waitFor(() =>
        expect(updateMock).toHaveBeenCalledWith({
          id: 'm1',
          data: { status: 'completed' },
        })
      );
    });
  });

  test('Deleting the record', ({ given, when, and, then }) => {
    given('a maintenance record exists', () => {
      useMaintenanceMock.mockReturnValue({ data: maintenance, isLoading: false });
    });

    when('the user opens the maintenance detail', () => {
      render(<MaintenanceDetailPage />);
    });

    and('the user deletes the record', async () => {
      deleteMock.mockResolvedValueOnce({});
      await userEvent.click(screen.getByRole('button', { name: 'Delete Record' }));
    });

    then('the API is called with id "m1"', async () => {
      await waitFor(() => expect(deleteMock).toHaveBeenCalledWith('m1'));
    });

    and('the user is navigated to "/maintenance"', () => {
      expect(navigateMock).toHaveBeenCalledWith('/maintenance');
    });
  });
});

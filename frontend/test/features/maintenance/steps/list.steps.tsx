import { defineFeature, loadFeature } from 'jest-cucumber';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { getFeatureFile, getMockData } from '../../util/TestHelper';
import MaintenanceListPage from '@pages/maintenance/MaintenanceListPage';
import type { Maintenance } from '@entities/maintenance/model';

const useMaintenanceMock = vi.hoisted(() => vi.fn());

vi.mock('@features/maintenance/hooks', () => ({
  useMaintenance: useMaintenanceMock,
}));

const maintenance = getMockData<Maintenance[]>(import.meta.url, 'maintenance-mock');
const feature = loadFeature(getFeatureFile(import.meta.url, 'list'));

defineFeature(feature, (test) => {
  afterEach(() => {
    cleanup();
  });

  const openPage = () => {
    render(
      <MemoryRouter>
        <MaintenanceListPage />
      </MemoryRouter>
    );
  };

  test('Loading state shows skeletons', ({ given, when, then }) => {
    given('the maintenance list is loading', () => {
      useMaintenanceMock.mockReturnValue({ data: undefined, isLoading: true });
    });

    when('the user opens the maintenance page', openPage);

    then('a loading skeleton is displayed', () => {
      expect(screen.getByText('Maintenance')).toBeInTheDocument();
      expect(screen.queryByText('Replace filter')).not.toBeInTheDocument();
    });
  });

  test('No maintenance records', ({ given, when, then }) => {
    given('the maintenance list is empty', () => {
      useMaintenanceMock.mockReturnValue({ data: [], isLoading: false });
    });

    when('the user opens the maintenance page', openPage);

    then('the message "No maintenance records found" is displayed', () => {
      expect(screen.getByText('No maintenance records found')).toBeInTheDocument();
    });
  });

  test('Records are listed with status badges', ({ given, when, then, and }) => {
    given('the maintenance list contains 2 records', () => {
      useMaintenanceMock.mockReturnValue({ data: maintenance, isLoading: false });
    });

    when('the user opens the maintenance page', openPage);

    then('the record "Replace filter" is displayed', () => {
      expect(screen.getByText('Replace filter')).toBeInTheDocument();
    });

    and('the record "Oil change" is displayed', () => {
      expect(screen.getByText('Oil change')).toBeInTheDocument();
    });

    and('a "Pending" status badge is shown', () => {
      expect(screen.getAllByText('Pending')).toHaveLength(2);
    });

    and('a "Completed" status badge is shown', () => {
      expect(screen.getAllByText('Completed')).toHaveLength(2);
    });
  });

  test('Filtering by status', ({ given, when, and, then }) => {
    given('the maintenance list contains 2 records', () => {
      useMaintenanceMock.mockReturnValue({ data: maintenance, isLoading: false });
    });

    when('the user opens the maintenance page', openPage);

    and('the user selects the filter "Pending"', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Pending' }));
    });

    then('the list is requested with status "pending"', () => {
      expect(useMaintenanceMock).toHaveBeenLastCalledWith('pending');
    });
  });
});

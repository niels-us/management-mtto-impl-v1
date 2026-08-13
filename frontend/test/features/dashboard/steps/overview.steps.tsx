import { defineFeature, loadFeature } from 'jest-cucumber';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { getFeatureFile, getMockData } from '../../util/TestHelper';
import DashboardPage from '@pages/dashboard/DashboardPage';
import type { Vessel } from '@entities/vessel/model';
import type { Maintenance } from '@entities/maintenance/model';

vi.mock('recharts', () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => children ?? null;
  return {
    ResponsiveContainer: passthrough,
    BarChart: passthrough,
    Bar: passthrough,
    XAxis: passthrough,
    YAxis: passthrough,
    CartesianGrid: passthrough,
    Tooltip: passthrough,
  };
});

const useVesselsMock = vi.hoisted(() => vi.fn());
const useMaintenanceMock = vi.hoisted(() => vi.fn());

vi.mock('@features/vessels/hooks', () => ({
  useVessels: useVesselsMock,
}));

vi.mock('@features/maintenance/hooks', () => ({
  useMaintenance: useMaintenanceMock,
}));

interface DashboardMock {
  vessels: Vessel[];
  maintenance: Maintenance[];
}

const dashboard = getMockData<DashboardMock>(import.meta.url, 'dashboard-mock');
const feature = loadFeature(getFeatureFile(import.meta.url, 'overview'));

defineFeature(feature, (test) => {
  afterEach(() => {
    cleanup();
  });

  const openDashboard = () => {
    render(<DashboardPage />);
  };

  test('Loading state shows skeletons', ({ given, when, then }) => {
    given('the dashboard data is loading', () => {
      useVesselsMock.mockReturnValue({ data: undefined, isLoading: true });
      useMaintenanceMock.mockReturnValue({ data: undefined, isLoading: true });
    });

    when('the user opens the dashboard', openDashboard);

    then('the stat cards are displayed', () => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Vessels')).toBeInTheDocument();
    });
  });

  test('Stats and recent maintenance are shown', ({ given, and, when, then }) => {
    given('the fleet has 2 vessels', () => {
      useVesselsMock.mockReturnValue({ data: dashboard.vessels, isLoading: false });
    });

    and('there are 3 maintenance records', () => {
      useMaintenanceMock.mockReturnValue({
        data: dashboard.maintenance,
        isLoading: false,
      });
    });

    when('the user opens the dashboard', openDashboard);

    then('the stat "Total Vessels" shows the value 2', () => {
      expect(screen.getByText('Total Vessels')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    and('the recent maintenance description "Replace filter" is displayed', () => {
      expect(screen.getByText('Replace filter')).toBeInTheDocument();
    });
  });

  test('Empty maintenance state', ({ given, when, then }) => {
    given('the fleet has no maintenance', () => {
      useVesselsMock.mockReturnValue({ data: [], isLoading: false });
      useMaintenanceMock.mockReturnValue({ data: [], isLoading: false });
    });

    when('the user opens the dashboard', openDashboard);

    then('the message "No maintenance records" is displayed', () => {
      expect(screen.getByText('No maintenance records')).toBeInTheDocument();
    });
  });
});

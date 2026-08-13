import { defineFeature, loadFeature } from 'jest-cucumber';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { getFeatureFile, getMockData } from '../../util/TestHelper';
import VesselListPage from '@pages/vessels/VesselListPage';
import type { Vessel } from '@entities/vessel/model';

const useVesselsMock = vi.hoisted(() => vi.fn());

vi.mock('@features/vessels/hooks', () => ({
  useVessels: useVesselsMock,
}));

const vessels = getMockData<Vessel[]>(import.meta.url, 'vessels-mock');
const feature = loadFeature(getFeatureFile(import.meta.url, 'list'));

defineFeature(feature, (test) => {
  afterEach(() => {
    cleanup();
  });

  const openPage = () => {
    render(
      <MemoryRouter>
        <VesselListPage />
      </MemoryRouter>
    );
  };

  test('Loading state shows skeletons', ({ given, when, then }) => {
    given('the vessel list is loading', () => {
      useVesselsMock.mockReturnValue({ data: undefined, isLoading: true });
    });

    when('the user opens the vessels page', openPage);

    then('a loading skeleton is displayed', () => {
      expect(screen.getByText('Vessels')).toBeInTheDocument();
      expect(screen.queryByText('Titan')).not.toBeInTheDocument();
    });
  });

  test('No registered vessels', ({ given, when, then }) => {
    given('the vessel list is empty', () => {
      useVesselsMock.mockReturnValue({ data: [], isLoading: false });
    });

    when('the user opens the vessels page', openPage);

    then('the message "No vessels found" is displayed', () => {
      expect(screen.getByText('No vessels found')).toBeInTheDocument();
    });
  });

  test('Registered vessels are listed', ({ given, when, then, and }) => {
    given('the vessel list contains 2 vessels', () => {
      useVesselsMock.mockReturnValue({ data: vessels, isLoading: false });
    });

    when('the user opens the vessels page', openPage);

    then('the vessel "Titan" is displayed', () => {
      expect(screen.getByText('Titan')).toBeInTheDocument();
    });

    and('the vessel "Orion" is displayed', () => {
      expect(screen.getByText('Orion')).toBeInTheDocument();
    });

    and('each vessel shows a "View Components" button', () => {
      expect(screen.getAllByText('View Components')).toHaveLength(2);
    });
  });
});

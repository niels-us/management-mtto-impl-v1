import { defineFeature, loadFeature } from 'jest-cucumber';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { getFeatureFile, getMockData } from '../../util/TestHelper';
import ComponentListPage from '@pages/components/ComponentListPage';
import type { Component } from '@entities/component/model';

const useComponentsMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'v1' }),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('@features/components/hooks', () => ({
  useComponents: useComponentsMock,
}));

const components = getMockData<Component[]>(import.meta.url, 'components-mock');
const feature = loadFeature(getFeatureFile(import.meta.url, 'list'));

defineFeature(feature, (test) => {
  afterEach(() => {
    cleanup();
  });

  const openPage = () => {
    render(<ComponentListPage />);
  };

  test('Loading state shows skeletons', ({ given, when, then }) => {
    given('the component list is loading', () => {
      useComponentsMock.mockReturnValue({ data: undefined, isLoading: true });
    });

    when('the user opens the components page for vessel v1', openPage);

    then('a loading skeleton is displayed', () => {
      expect(screen.getByText('Components')).toBeInTheDocument();
      expect(screen.queryByText('Main Engine')).not.toBeInTheDocument();
    });
  });

  test('No registered components', ({ given, when, then }) => {
    given('the component list is empty', () => {
      useComponentsMock.mockReturnValue({ data: [], isLoading: false });
    });

    when('the user opens the components page for vessel v1', openPage);

    then('the message "No components registered for this vessel" is displayed', () => {
      expect(
        screen.getByText('No components registered for this vessel')
      ).toBeInTheDocument();
    });
  });

  test('Registered components are listed', ({ given, when, then, and }) => {
    given('the vessel has 2 components', () => {
      useComponentsMock.mockReturnValue({ data: components, isLoading: false });
    });

    when('the user opens the components page for vessel v1', openPage);

    then('the component "Main Engine" is displayed', () => {
      expect(screen.getByText('Main Engine')).toBeInTheDocument();
    });

    and('the component "Aux Boiler" is displayed', () => {
      expect(screen.getByText('Aux Boiler')).toBeInTheDocument();
    });

    and('each component shows a "Create Maintenance" button', () => {
      expect(screen.getAllByText('Create Maintenance')).toHaveLength(2);
    });
  });
});

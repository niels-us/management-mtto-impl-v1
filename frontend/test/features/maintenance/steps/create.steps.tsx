import { defineFeature, loadFeature } from 'jest-cucumber';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, vi } from 'vitest';
import { getFeatureFile } from '../../util/TestHelper';
import CreateMaintenancePage from '@pages/maintenance/CreateMaintenancePage';

const navigateMock = vi.hoisted(() => vi.fn());
const createMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'c1' }),
  useNavigate: () => navigateMock,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('@features/auth/auth-context', () => ({
  useAuth: () => ({
    token: 'token',
    user: { sub: 'u1', customerId: 'cust1', username: 'user1', role: 'admin' },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@features/maintenance/hooks', () => ({
  useCreateMaintenance: () => ({ mutateAsync: createMock, isPending: false }),
}));

const feature = loadFeature(getFeatureFile(import.meta.url, 'create'));

defineFeature(feature, (test) => {
  beforeEach(() => {
    navigateMock.mockReset();
    createMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  const openPage = () => {
    render(<CreateMaintenancePage />);
  };

  const fillValidForm = async () => {
    await userEvent.type(
      screen.getByLabelText('Description'),
      'Replace fuel injector'
    );
    await userEvent.type(screen.getByLabelText('Scheduled Date'), '2026-08-20T10:00');
  };

  test('The form is rendered', ({ when, then }) => {
    when('the user opens the create maintenance page', openPage);

    then('the description and scheduled date fields are displayed', () => {
      expect(
        screen.getByRole('heading', { name: 'Create Maintenance' })
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Scheduled Date')).toBeInTheDocument();
    });
  });

  test('Invalid input is rejected', ({ given, when, and, then }) => {
    given('the user is on the create maintenance page', openPage);

    when('the user enters a short description', async () => {
      await userEvent.type(screen.getByLabelText('Description'), 'ab');
    });

    and('the user submits the form', async () => {
      await userEvent.click(
        screen.getByRole('button', { name: 'Create Maintenance' })
      );
    });

    then('the API is not called', () => {
      expect(createMock).not.toHaveBeenCalled();
    });
  });

  test('Valid input creates maintenance', ({ given, and, when, then }) => {
    given('the user is on the create maintenance page', openPage);

    and('the user is authenticated', () => {
      createMock.mockResolvedValueOnce({});
    });

    when('the user enters a description and scheduled date', async () => {
      await fillValidForm();
    });

    and('the user submits the form', async () => {
      await userEvent.click(
        screen.getByRole('button', { name: 'Create Maintenance' })
      );
    });

    then('the API is called with the maintenance payload', async () => {
      await waitFor(() =>
        expect(createMock).toHaveBeenCalledWith({
          componentId: 'c1',
          data: {
            description: 'Replace fuel injector',
            scheduledAt: new Date('2026-08-20T10:00').toISOString(),
            customerId: 'cust1',
            createdBy: 'u1',
          },
        })
      );
    });

    and('the user is navigated to "/maintenance"', () => {
      expect(navigateMock).toHaveBeenCalledWith('/maintenance');
    });
  });
});

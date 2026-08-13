import { defineFeature, loadFeature } from 'jest-cucumber';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, vi } from 'vitest';
import { getFeatureFile } from '../../util/TestHelper';
import LoginPage from '@pages/login/LoginPage';

const navigateMock = vi.hoisted(() => vi.fn());
const loginMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  Navigate: ({ to }: { to: string }) => <div>redirect {to}</div>,
}));

vi.mock('@features/auth/auth-context', () => ({
  useAuth: () => ({
    token: null,
    user: null,
    isAuthenticated: false,
    login: loginMock,
    logout: vi.fn(),
  }),
}));

const feature = loadFeature(getFeatureFile(import.meta.url, 'login'));

defineFeature(feature, (test) => {
  beforeEach(() => {
    navigateMock.mockReset();
    loginMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  test('Successful login redirects to the dashboard', ({ given, and, when, then }) => {
    given('the user is on the login page', () => {
      render(<LoginPage />);
    });

    and('the authentication API accepts the credentials', () => {
      loginMock.mockResolvedValueOnce(undefined);
    });

    when('the user submits the sign-in form', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    });

    then('the user is redirected to the dashboard', async () => {
      await waitFor(() =>
        expect(navigateMock).toHaveBeenCalledWith('/', { replace: true })
      );
    });
  });

  test('Failed login shows the API error', ({ given, and, when, then }) => {
    given('the user is on the login page', () => {
      render(<LoginPage />);
    });

    and(/^the authentication API rejects with message "(.+)"$/, (message: string) => {
      loginMock.mockRejectedValueOnce({ response: { data: { message } } });
    });

    when('the user submits the sign-in form', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    });

    then('the error message "Bad credentials" is shown', async () => {
      expect(await screen.findByText('Bad credentials')).toBeInTheDocument();
      expect(navigateMock).not.toHaveBeenCalled();
    });
  });

  test('Failed login without message shows a fallback', ({ given, and, when, then }) => {
    given('the user is on the login page', () => {
      render(<LoginPage />);
    });

    and('the authentication API fails without a message', () => {
      loginMock.mockRejectedValueOnce(new Error('boom'));
    });

    when('the user submits the sign-in form', async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    });

    then('the error message "Invalid credentials" is shown', async () => {
      expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { queryClient } from '@shared/api/query-client';
import { AuthProvider, useAuth } from './auth-context';

const client = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('@shared/api/client', () => ({ default: client }));
vi.mock('@shared/api/query-client', () => ({
  queryClient: { clear: vi.fn() },
}));

const payload = btoa(
  JSON.stringify({ sub: 'u1', customerId: 'c1', username: 'user1', role: 'admin' })
);
const fakeToken = `header.${payload}.signature`;

function Probe() {
  const { isAuthenticated, user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="user">{user?.username ?? ''}</span>
      <button onClick={() => login('user1', 'password').catch(() => {})}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderProbe() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts unauthenticated', () => {
    localStorage.removeItem('mtto_token');
    renderProbe();
    expect(screen.getByTestId('auth')).toHaveTextContent('no');
  });

  it('logs in, stores the token and parses the user', async () => {
    client.post.mockResolvedValue({ data: { token: fakeToken } });
    renderProbe();

    await userEvent.click(screen.getByText('login'));

    expect(client.post).toHaveBeenCalledWith('/V1/auth/login', { username: 'user1', password: 'password' });
    expect(localStorage.getItem('mtto_token')).toBe(fakeToken);
    expect(screen.getByTestId('auth')).toHaveTextContent('yes');
    expect(screen.getByTestId('user')).toHaveTextContent('user1');
    expect(queryClient.clear).toHaveBeenCalled();
  });

  it('remains unauthenticated when login fails', async () => {
    client.post.mockRejectedValue(new Error('invalid credentials'));
    renderProbe();

    await userEvent.click(screen.getByText('login'));

    expect(screen.getByTestId('auth')).toHaveTextContent('no');
    expect(localStorage.getItem('mtto_token')).toBeNull();
  });

  it('logs out, clears storage and the query cache', async () => {
    client.post.mockResolvedValue({ data: { token: fakeToken } });
    renderProbe();

    await userEvent.click(screen.getByText('login'));
    expect(screen.getByTestId('auth')).toHaveTextContent('yes');

    vi.mocked(queryClient.clear).mockClear();
    await userEvent.click(screen.getByText('logout'));

    expect(localStorage.getItem('mtto_token')).toBeNull();
    expect(screen.getByTestId('auth')).toHaveTextContent('no');
    expect(queryClient.clear).toHaveBeenCalled();
  });
});

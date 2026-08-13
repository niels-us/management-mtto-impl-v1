import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('./auth-context', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from './auth-context';

function renderProtected(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>dashboard content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('renders the outlet when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      token: 'token',
      isAuthenticated: true,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
    renderProtected();
    expect(screen.getByText('dashboard content')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      token: null,
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
    renderProtected();
    expect(screen.getByText('login page')).toBeInTheDocument();
  });
});

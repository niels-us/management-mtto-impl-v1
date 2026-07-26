import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { login as loginService } from '../services/auth.service';

interface User {
  sub?: string;
  customerId?: string;
  username?: string;
  role?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseJWT(token: string): User | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mtto_token'));
  const [user, setUser] = useState<User | null>(() => {
    const t = localStorage.getItem('mtto_token');
    return t ? parseJWT(t) : null;
  });

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginService({ username, password });
    const { token: newToken } = response;
    localStorage.setItem('mtto_token', newToken);
    setToken(newToken);
    setUser(parseJWT(newToken));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('mtto_token');
    localStorage.removeItem('mtto_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

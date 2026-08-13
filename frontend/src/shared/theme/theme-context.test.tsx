import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ThemeProvider, useTheme } from './theme-context';

const STORAGE_KEY = 'mtto_theme';

function renderThemeHook() {
  return renderHook(() => useTheme(), { wrapper: ThemeProvider });
}

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })
  );
}

describe('ThemeProvider', () => {
  it('defaults to light when there is no stored preference and the system is light', () => {
    localStorage.removeItem(STORAGE_KEY);
    const { result } = renderThemeHook();
    expect(result.current.theme).toBe('light');
  });

  it('uses a stored dark preference', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const { result } = renderThemeHook();
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('falls back to the system preference when nothing is stored', () => {
    localStorage.removeItem(STORAGE_KEY);
    stubMatchMedia(true);
    const { result } = renderThemeHook();
    expect(result.current.theme).toBe('dark');
    vi.unstubAllGlobals();
  });

  it('toggles between light and dark and persists the choice', () => {
    localStorage.removeItem(STORAGE_KEY);
    const { result } = renderThemeHook();
    expect(result.current.theme).toBe('light');

    act(() => result.current.toggle());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');

    act(() => result.current.toggle());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('exposes setTheme', () => {
    const { result } = renderThemeHook();
    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');
  });
});

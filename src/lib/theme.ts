'use client';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function resolveTheme(): ThemeMode {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: ThemeMode, persist = true) {
  if (typeof window === 'undefined') return theme;

  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', theme === 'dark');

  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures and keep the theme applied in-memory.
    }
  }
  return theme;
}

export function clearStoredTheme() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

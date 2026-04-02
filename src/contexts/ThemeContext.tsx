'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyTheme,
  clearStoredTheme,
  getStoredTheme,
  getSystemTheme,
  resolveTheme,
  type ThemeMode,
} from '@/lib/theme';

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  followSystemTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => resolveTheme());

  useEffect(() => {
    const initialTheme = getStoredTheme() ?? getSystemTheme();
    setThemeState(initialTheme);
    applyTheme(initialTheme, false);

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'theme') {
        setThemeState(resolveTheme());
      }
    };

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (!getStoredTheme()) {
        const nextTheme = getSystemTheme();
        setThemeState(nextTheme);
        applyTheme(nextTheme, false);
      }
    };

    window.addEventListener('storage', onStorage);
    mql.addEventListener?.('change', onSystemChange);

    return () => {
      window.removeEventListener('storage', onStorage);
      mql.removeEventListener?.('change', onSystemChange);
    };
  }, []);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme, true);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const nextTheme: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme, true);
      return nextTheme;
    });
  }, []);

  const followSystemTheme = useCallback(() => {
    clearStoredTheme();
    const nextTheme = getSystemTheme();
    setThemeState(nextTheme);
    applyTheme(nextTheme, false);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme,
      setTheme,
      followSystemTheme,
    }),
    [theme, toggleTheme, setTheme, followSystemTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  return useContext(ThemeContext);
}

export { ThemeContext };

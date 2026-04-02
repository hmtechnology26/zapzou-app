'use client';

import { useThemeContext } from '@/contexts/ThemeContext';

export function useTheme() {
  const context = useThemeContext();

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}


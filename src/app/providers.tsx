'use client';

import { AppProvider } from '@/hooks/useApp';
import { PublishModalProvider } from '@/contexts/PublishModalContext';
import { ExitModalProvider } from '@/contexts/ExitModalContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PublishModal } from '@/components/PublishModal';
import { ExitModal } from '@/components/ExitModal';
import { useServiceWorkerRegistration } from './useServiceWorkerRegistration';

export function Providers({ children }: { children: React.ReactNode }) {
  useServiceWorkerRegistration();
  return (
    <ThemeProvider>
      <AppProvider>
        <ExitModalProvider>
          <PublishModalProvider>
            {children}
            <PublishModal />
            <ExitModal />
          </PublishModalProvider>
        </ExitModalProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

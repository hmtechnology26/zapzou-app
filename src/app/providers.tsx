'use client';

import { AppProvider } from '@/hooks/useApp';
import { PublishModalProvider } from '@/contexts/PublishModalContext';
import { ExitModalProvider } from '@/contexts/ExitModalContext';
import { PublishModal } from '@/components/PublishModal';
import { ExitModal } from '@/components/ExitModal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ExitModalProvider>
        <PublishModalProvider>
          {children}
          <PublishModal />
          <ExitModal />
        </PublishModalProvider>
      </ExitModalProvider>
    </AppProvider>
  );
}
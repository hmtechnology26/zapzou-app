'use client';

import { AppProvider } from '@/hooks/useApp';
import { PublishModalProvider } from '@/contexts/PublishModalContext';
import { PublishModal } from '@/components/PublishModal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <PublishModalProvider>
        {children}
        <PublishModal />
      </PublishModalProvider>
    </AppProvider>
  );
}

'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface PublishModalContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const PublishModalContext = createContext<PublishModalContextType | undefined>(undefined);

export function PublishModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <PublishModalContext.Provider value={{ isOpen, open, close }}>
      {children}
    </PublishModalContext.Provider>
  );
}

export function usePublishModal() {
  const context = useContext(PublishModalContext);
  if (context === undefined) {
    throw new Error('usePublishModal must be used within a PublishModalProvider');
  }
  return context;
}

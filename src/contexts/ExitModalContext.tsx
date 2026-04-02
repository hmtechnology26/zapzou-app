"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface ExitModalContextType {
  showExitModal: boolean;
  pendingNav: string | null;
  setShowExitModal: (show: boolean) => void;
  setPendingNav: (nav: string | null) => void;
  checkAndShowExitModal: (targetPath: string) => boolean;
}

const ExitModalContext = createContext<ExitModalContextType | undefined>(undefined);

export function ExitModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  const checkAndShowExitModal = useCallback((targetPath: string): boolean => {
    // Verifica se está em uma página de lugar (/places/[slug])
    const isPlacePage = pathname.startsWith("/places/") && pathname.split("/").length === 3;
    
    if (!isPlacePage) return false;
    
    // Se for para outro lugar com placeId, não mostra modal
    const hrefHasPlaceId = targetPath.includes("placeId=");
    const isSamePlace = targetPath.startsWith("/places/") && hrefHasPlaceId;
    
    if (isSamePlace) return false;
    
    setPendingNav(targetPath);
    setShowExitModal(true);
    return true;
  }, [pathname]);

  return (
    <ExitModalContext.Provider value={{ showExitModal, pendingNav, setShowExitModal, setPendingNav, checkAndShowExitModal }}>
      {children}
    </ExitModalContext.Provider>
  );
}

export function useExitModal() {
  const context = useContext(ExitModalContext);
  if (!context) {
    throw new Error("useExitModal must be used within ExitModalProvider");
  }
  return context;
}
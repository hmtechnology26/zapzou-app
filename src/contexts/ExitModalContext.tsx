"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  const checkAndShowExitModal = useCallback((targetPath: string): boolean => {
    if (isAuthenticated) return false;
    
    const isPlacePage = pathname.startsWith("/places/") && pathname.split("/").length === 3;
    
    if (!isPlacePage) return false;
    
    const hrefHasPlaceId = targetPath.includes("placeId=");
    const isSamePlace = targetPath.startsWith("/places/") && hrefHasPlaceId;
    
    if (isSamePlace) return false;
    
    setPendingNav(targetPath);
    setShowExitModal(true);
    return true;
  }, [pathname, isAuthenticated]);

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

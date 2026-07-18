"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "@/hooks/useApp";
import { BottomNav } from "@/components/BottomNav";

function ProtectedLayoutSkeleton() {
  const rows = Array.from({ length: 3 });

  return (
    <div
      className="min-h-screen bg-background animate-pulse text-transparent selection-none"
      aria-busy="true"
      aria-live="polite"
    >
      <header className="fixed inset-x-0 top-0 z-40 h-16 bg-surface-container-lowest/60 backdrop-blur-xl border-b border-outline-variant/20 flex items-center px-4">
        <div className="h-6 w-32 rounded-full bg-surface-container-lowest/60" />
        <div className="ml-auto flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-surface-container-lowest/60" />
          <div className="h-10 w-16 rounded-full bg-surface-container-lowest/60" />
        </div>
      </header>
      <main className="pt-20 px-4 md:px-8 max-w-2xl mx-auto space-y-4 pb-28">
        <div className="h-6 w-3/4 rounded-full bg-surface-container-lowest/40" />
        <div className="h-4 w-1/2 rounded-full bg-surface-container-lowest/40" />
        {rows.map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-3xl bg-surface-container-lowest/40 border border-outline-variant/20"
          />
        ))}
      </main>
    </div>
  );
}

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useApp();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [hasMounted, setHasMounted] = useState(false);

const publicExact = ["/", "/home", "/landing", "/login", "/search", "/places", "/contact", "/favorites", "/meus-anuncios", "/meus-ambientes", "/explore", "/imports/roteiro"];
  const publicPrefixes = ["/service/", "/places/", "/auth/", "/login/", "/imports/"];
  const hideBottomNavExact = ["/home", "/landing", "/login/create-ad", "/login/join-community", "/login/save-favorites"];

  const isPublicPage =
    publicExact.includes(pathname) ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    setHasMounted(true);
  }, []);

useEffect(() => {
    if (loading === false && !user && !isPublicPage) {
      router.push("/login");
    }
  }, [user, loading, isPublicPage, router]);

  const shouldShowBottomNav = hasMounted && pathname && !hideBottomNavExact.includes(pathname);

  if (isPublicPage) {
    return (
      <div className="min-h-screen">
        {children}
        {shouldShowBottomNav && <BottomNav />}
      </div>
    );
  }

  if (loading) {
    return <ProtectedLayoutSkeleton />;
  }

  const showBottomNav = hasMounted && pathname ? true : false;

  return (
    <div className="min-h-screen">
      {children}
      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default ProtectedLayout;

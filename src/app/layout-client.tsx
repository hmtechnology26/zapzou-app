'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/hooks/useApp';
import { BottomNav } from '@/components/BottomNav';

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useApp();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const [hasMounted, setHasMounted] = useState(false);

  const isPublicPage = 
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/search' ||
    pathname === '/places' ||
    pathname.startsWith('/service/') ||
    pathname.startsWith('/places/') ||
    pathname.startsWith('/auth/');

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (loading === false && !user && !isPublicPage) {
      router.push('/login');
    }
  }, [user, loading, isPublicPage, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const tabPaths = ['/', '/places', '/places/', '/my-services', '/profile'];
  const showBottomNav = hasMounted && pathname && tabPaths.includes(pathname);

  return (
    <div className="min-h-screen">
      {children}
      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default ProtectedLayout;

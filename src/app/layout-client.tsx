'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/hooks/useApp';
import { BottomNav } from '@/components/BottomNav';

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const router = useRouter();
  const pathname = usePathname() ?? '';

  const isPublicPage = 
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/search' ||
    pathname === '/places' ||
    pathname.startsWith('/service/') ||
    pathname.startsWith('/places/');

  useEffect(() => {
    if (!user && !isPublicPage) {
      router.push('/login');
    }
  }, [user, isPublicPage, router]);

  const tabPaths = ['/', '/places', '/places/', '/my-services', '/profile'];
  const showBottomNav = pathname && tabPaths.includes(pathname);

  if (!user && !isPublicPage) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {children}
      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default ProtectedLayout;

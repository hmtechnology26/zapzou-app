'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/hooks/useApp';
import { BottomNav } from '@/components/BottomNav';

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useApp();
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

  // Se não tem usuário e não é página pública, retorna null (mas agora só após loading=false)
  if (!user && !isPublicPage) {
    console.log('[Layout] Sem acesso - retornando null');
    return null;
  }

  const tabPaths = ['/', '/places', '/places/', '/my-services', '/profile'];
  const showBottomNav = pathname && tabPaths.includes(pathname);

  return (
    <div className="min-h-screen">
      {children}
      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default ProtectedLayout;

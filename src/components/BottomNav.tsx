'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from './Icon';
import { usePublishModal } from '@/contexts/PublishModalContext';
import { useApp } from '@/hooks/useApp';
import { useExitModal } from '@/contexts/ExitModalContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Feed', icon: 'home' },
  { path: '/places', label: 'Comunidades', icon: 'explore' },
  { path: '/meus-anuncios', label: 'Meus Anúncios', icon: 'storefront' },
  { path: '/meus-ambientes', label: 'Minhas Comunidades', icon: 'apartment' },
  { path: '/favorites', label: 'Favoritos', icon: 'favorite' },
  { path: '/contact', label: 'Suporte', icon: 'support_agent' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = usePublishModal();
  const { user, selectedEnvironments } = useApp();
  const { checkAndShowExitModal } = useExitModal();

  useEffect(() => {
    const routes = ['/', '/places', '/meus-anuncios', '/meus-ambientes', '/favorites', '/contact', '/login'];

    routes.forEach((route) => {
      void router.prefetch(route);
    });
  }, [router]);

  const handleNavClick = (e: React.MouseEvent, itemPath: string) => {
    if (itemPath === '/post') {
      e.preventDefault();

      if (!user) {
        router.push('/login');
        return;
      }

      if (selectedEnvironments.length === 0) {
        router.push('/places');
        return;
      }

      open();
      return;
    }

    if (checkAndShowExitModal(itemPath)) {
      return;
    }

    if ((itemPath === '/meus-anuncios' || itemPath === '/meus-ambientes' || itemPath === '/favorites') && !user) {
      e.preventDefault();
      router.push('/login');
      return;
    }

    router.push(itemPath);
  };

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-[60]
        w-full md:hidden
        min-h-[72px]
        bg-surface-container-lowest/95 backdrop-blur-xl
        border-t border-outline-variant/20
        shadow-[0_-8px_30px_rgba(0,0,0,0.08)]
        rounded-t-3xl
        flex justify-around items-center
        px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]
      "
    >
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        const isCenter = item.path === '/post';

        return (
          <button
            key={item.path}
            onClick={(e) => handleNavClick(e, item.path)}
            className={`flex min-w-0 flex-col items-center justify-center px-3 py-1 transition-all active:scale-90 duration-150 ${
              isCenter
                ? 'text-primary'
                : isActive
                  ? 'text-primary'
                  : 'text-on-surface-variant'
            }`}
          >
            {isCenter ? (
              <Icon
                icon="add_circle"
                weight={400}
                grade={0}
                size={32}
                className="text-primary"
              />
            ) : (
              <Icon
                icon={item.icon}
                weight={isActive ? 400 : 300}
                grade={isActive ? 0 : -25}
                size={24}
              />
            )}

            <span className="mt-1 text-[9px] font-medium tracking-wide text-center leading-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

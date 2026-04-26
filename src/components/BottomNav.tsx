'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from './Icon';
import { useApp } from '@/hooks/useApp';
import { useExitModal } from '@/contexts/ExitModalContext';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Início', icon: 'home' },
  { path: '/places', label: 'Comunidades', icon: 'explore' },
  { path: '/meus-anuncios', label: 'Meus anúncios', icon: 'storefront', requiresAuth: true },
  { path: '/meus-ambientes', label: 'Minhas comunidades', icon: 'apartment', requiresAuth: true },
  { path: '/favorites', label: 'Favoritos', icon: 'favorite', requiresAuth: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const { user } = useApp();
  const { checkAndShowExitModal } = useExitModal();

  useEffect(() => {
    ['/', '/places', '/meus-anuncios', '/meus-ambientes', '/favorites', '/login'].forEach((route) => {
      void router.prefetch(route);
    });
  }, [router]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    item: NavItem
  ) => {
    if (checkAndShowExitModal(item.path)) return;

    if (item.requiresAuth && !user) {
      e.preventDefault();
      router.push('/login');
      return;
    }

    router.push(item.path);
  };

  return (
    <nav
      className="
        fixed bottom-4 left-4 right-4 z-[60]
        md:hidden
        overflow-hidden
        rounded-[2rem]
        border border-white/20
        bg-white/[0.08]
        px-2 py-2
        shadow-[0_18px_60px_rgba(0,0,0,0.22)]
        backdrop-blur-3xl
        supports-[backdrop-filter]:bg-white/[0.10]
        dark:border-white/10
        dark:bg-zinc-950/55
        dark:supports-[backdrop-filter]:bg-zinc-950/45
        pb-[calc(0.5rem+env(safe-area-inset-bottom))]
      "
    >
      {/* brilho/reflexo de vidro */}
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/25 via-white/[0.06] to-transparent dark:from-white/10" />

      {/* borda interna iluminada */}
      <div className="pointer-events-none absolute inset-[1px] rounded-[1.9rem] border border-white/10" />

      {/* blur glow inferior */}
      <div className="pointer-events-none absolute -bottom-10 left-1/2 h-16 w-56 -translate-x-1/2 rounded-full bg-primary/20 blur-2xl" />

      <div className="relative flex items-center justify-between gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== '/' && pathname.startsWith(item.path));

          return (
            <button
              key={item.path}
              type="button"
              aria-label={item.label}
              title={item.label}
              onClick={(e) => handleNavClick(e, item)}
              className={`
                group relative flex h-12 min-w-0 flex-1 items-center justify-center
                rounded-2xl transition-all duration-300
                active:-translate-y-1 active:scale-95
                ${
                  isActive
                    ? 'text-primary'
                    : 'text-on-surface-variant hover:bg-white/[0.06]'
                }
              `}
            >
              {isActive && (
                <>
                  <span className="absolute -top-1 h-1 w-5 rounded-full bg-primary shadow-[0_0_16px_rgba(48,204,54,0.65)]" />
                  <span className="absolute inset-0 rounded-2xl bg-primary/[0.10]" />
                </>
              )}

              <span
                className={`
                  relative flex h-10 w-10 items-center justify-center rounded-2xl
                  transition-all duration-300
                  ${
                    isActive
                      ? 'scale-105 bg-primary text-white shadow-[0_10px_28px_rgba(48,204,54,0.35)]'
                      : 'bg-white/[0.04] group-active:bg-white/[0.10]'
                  }
                `}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent" />
                )}

                <Icon
                  icon={item.icon}
                  size={23}
                  weight={isActive ? 700 : 300}
                  grade={isActive ? 0 : -25}
                  className="relative z-10"
                />
              </span>

              {/* label aparece ao toque */}
              <span
                className="
                  pointer-events-none absolute -top-10 whitespace-nowrap rounded-full
                  border border-white/10
                  bg-zinc-950/80 px-2.5 py-1
                  text-[9px] font-black uppercase tracking-wide text-white
                  opacity-0 shadow-xl backdrop-blur-xl transition-all duration-200
                  group-active:-translate-y-1 group-active:opacity-100
                "
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
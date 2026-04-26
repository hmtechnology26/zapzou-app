'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '../hooks/useApp';
import { useTheme } from '@/hooks/useTheme';
import { useExitModal } from '@/contexts/ExitModalContext';
import { Icon } from './Icon';
import { Avatar } from './Avatar';

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: 'search' | 'menu' | 'share' | 'more';
  onRightAction?: () => void;
  variant?: 'default' | 'primary';
  userAvatar?: string;
  onMenuClick?: () => void;
  onAvatarClick?: () => void;
  activePath?: string;
  leftAvatar?: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const baseNavItems: NavItem[] = [
  { path: '/', label: 'An\u00fancios', icon: 'home' },
  { path: '/places', label: 'Comunidades', icon: 'explore' },
  { path: '/meus-anuncios', label: 'Meus Anúncios', icon: 'storefront' },
  { path: '/meus-ambientes', label: 'Minhas Comunidades', icon: 'apartment' },
  { path: '/favorites', label: 'Favoritos', icon: 'favorite' },
  
];

export function TopAppBar({
  title,
  showBack = false,
  onBack,
  rightAction,
  onRightAction,
  variant = 'default',
  userAvatar: propAvatar,
  onMenuClick,
  onAvatarClick: propAvatarClick,
  leftAvatar,
}: TopAppBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { checkAndShowExitModal } = useExitModal();

  const hasManagedEnvironments = (user?.managedEnvironmentIds?.length ?? 0) > 0;
  const navItems = hasManagedEnvironments
    ? [...baseNavItems, { path: '/moderation', label: 'Moderação', icon: 'admin_panel_settings' }]
    : baseNavItems;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const routes = ['/', '/places', '/meus-anuncios', '/meus-ambientes', '/favorites', '/contact', '/profile', '/login'];

    if (hasManagedEnvironments) {
      routes.push('/moderation');
    }

    if (typeof window !== 'undefined') {
      const connection = (navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }).connection;
      const saveData = Boolean(connection?.saveData);
      const effectiveType = String(connection?.effectiveType || '');
      const isSlowConnection = effectiveType.includes('2g') || effectiveType === '3g';
      const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;

      if (saveData || isSlowConnection || isMobileViewport) {
        return;
      }
    }

    routes.forEach((route) => {
      void router.prefetch(route);
    });
  }, [router, hasManagedEnvironments]);
  
  const userAvatar = mounted ? (propAvatar || user?.avatar) : null;
  const onAvatarClick = propAvatarClick || (() => router.push('/profile'));
  const currentPath = pathname ?? '';
  const canManageMembers = (user?.managedEnvironmentIds?.length ?? 0) > 0;

  const finalRightAction = onRightAction || (() => {
    if (!user) {
      router.push('/login');
    }
  });

  const textColor = variant === 'primary' ? 'text-white' : 'text-primary';
  const bgColor = variant === 'primary' ? 'bg-[#30CC36]/85' : 'bg-surface-container-lowest/95';
  const themeButtonClass =
    variant === 'primary'
      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
      : 'bg-surface-container-high/70 text-on-surface hover:bg-surface-container-high';
  const themeIcon = theme === 'dark' ? 'light_mode' : 'dark_mode';

  const handleNavClick = (path: string) => {
    if (checkAndShowExitModal(path)) {
      return;
    }
    router.push(path);
  };

  return (
  <header
    className="
      fixed left-3 right-3 z-50
      top-[calc(env(safe-area-inset-top)+0.125rem)] md:top-2
      rounded-[2rem]
      border border-white/20
      bg-white/[0.08]
      shadow-[0_18px_60px_rgba(0,0,0,0.16)]
      backdrop-blur-3xl
      supports-[backdrop-filter]:bg-white/[0.10]
      dark:border-white/10
      dark:bg-zinc-950/55
      dark:supports-[backdrop-filter]:bg-zinc-950/45
      transition-all duration-300
      overflow-hidden
    "
  >
    <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/25 via-white/[0.06] to-transparent dark:from-white/10" />
    <div className="pointer-events-none absolute inset-[1px] rounded-[1.9rem] border border-white/10" />

    <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:h-20 md:px-6">
      <div className="flex items-center gap-3 md:gap-8">
        <Link href="/" prefetch className="flex items-center cursor-pointer group">
          <img
            src={theme === 'dark' ? '/conectae_logo_light.png' : '/conectae_logo.png'}
            alt="Conectae"
            className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03] md:h-11"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </Link>

        {title && (
          <h1 className="hidden items-center gap-2 text-lg font-black tracking-tight text-on-surface md:flex">
            {leftAvatar && (
              <img
                src={leftAvatar}
                alt=""
                className="h-7 w-7 rounded-full border border-white/20 object-cover shadow-sm"
                loading="lazy"
                decoding="async"
              />
            )}
            {title}
          </h1>
        )}

        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1 backdrop-blur-xl md:flex">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? currentPath === '/'
                : currentPath === item.path || currentPath.startsWith(item.path + '/');

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavClick(item.path)}
                className={`
                  group relative flex items-center gap-2 rounded-full px-4 py-2.5
                  text-[13px] font-bold transition-all duration-300
                  ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'text-on-surface-variant hover:bg-white/[0.08] hover:text-primary'
                  }
                `}
              >
                <Icon icon={item.icon} size={19} weight={isActive ? 700 : 400} />

                <span className="hidden whitespace-nowrap lg:inline">
                  {item.label}
                </span>

                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {mounted && (
          <button
            type="button"
            onClick={toggleTheme}
            className="
              flex h-10 w-10 items-center justify-center rounded-full
              border border-white/10 bg-white/[0.08]
              text-on-surface shadow-sm backdrop-blur-xl
              transition-all duration-200 hover:bg-white/[0.12]
              active:scale-95 md:h-11 md:w-11
            "
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            <Icon icon={themeIcon} size={20} weight={700} />
          </button>
        )}

        {mounted && canManageMembers && (
          <button
            onClick={() => router.push('/moderation')}
            className="
              flex h-10 w-10 items-center justify-center rounded-full
              border border-primary/10 bg-primary/10 text-primary
              shadow-sm transition-all active:scale-95 md:hidden
            "
            title="Moderação"
          >
            <Icon icon="admin_panel_settings" size={22} weight={700} />
          </button>
        )}

        {user ? (
          <button
            onClick={onAvatarClick as any}
            className="
              group flex items-center rounded-full border border-white/10
              bg-white/[0.08] p-1 backdrop-blur-xl
              transition-all duration-300 hover:bg-white/[0.12]
              active:scale-95
            "
          >
            <div className="relative">
              <Avatar
                src={userAvatar || undefined}
                name={user?.name || ''}
                alt="User"
                className="
                  h-10 w-10 shadow-sm ring-2 ring-primary/20
                  transition-all duration-300 group-hover:ring-primary
                  md:h-11 md:w-11
                "
              />

              {user.plan === 'plus' && (
                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-primary">
                  <Icon icon="check" size={10} className="text-white" weight={900} />
                </div>
              )}
            </div>
          </button>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="
              flex items-center gap-2 rounded-full bg-primary px-5 py-2.5
              text-[13px] font-black text-white shadow-lg shadow-primary/25
              transition-all hover:brightness-110 active:scale-95
            "
          >
            <Icon icon="login" size={18} weight={700} />
            <span>Entrar</span>
          </button>
        )}
      </div>
    </div>
  </header>
);
}

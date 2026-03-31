'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '../hooks/useApp';
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
  leftCustomAction?: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const baseNavItems: NavItem[] = [
  { path: '/', label: 'Anúncios', icon: 'home' },
  { path: '/places', label: 'Ambientes', icon: 'explore' },
  { path: '/meus-anuncios', label: 'Meus Anúncios', icon: 'storefront' },
  { path: '/favorites', label: 'Favoritos', icon: 'favorite' },
  { path: '/contact', label: 'Suporte', icon: 'support_agent' },
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
  leftCustomAction,
}: TopAppBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useApp();

  const navItems = useMemo(() => {
    const items = [...baseNavItems];
    if (user?.managedEnvironmentIds && user.managedEnvironmentIds.length > 0) {
      items.push({ path: '/moderation', label: 'Moderação', icon: 'admin_panel_settings' });
    }
    return items;
  }, [user?.managedEnvironmentIds]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
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
  const bgColor = variant === 'primary' ? 'bg-emerald-700/85' : 'bg-white/95';

  return (
    <header className={`fixed top-0 w-full z-50 ${bgColor} backdrop-blur-xl border-b border-slate-200/5 transition-all duration-300`}>
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-4 h-16 md:h-20">
        <div className="flex items-center gap-3 md:gap-8">
          {showBack && (
            <button
              onClick={onBack}
              className={`hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full transition-colors p-2 active:scale-95 duration-200 ${textColor}`}
            >
              <Icon icon="arrow_back" weight={400} grade={0} size={24} />
            </button>
          )}

          {!showBack && (
            <div 
              onClick={() => router.push('/')}
              className="flex items-center cursor-pointer group"
            >
              <img 
                src="/zapzou_logo.png" 
                alt="ZapZou" 
                className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]" 
              />
            </div>
          )}

          {title && (
            <div className="flex items-center gap-2 ml-2">
              <h1 className={`font-semibold text-lg tracking-tight ${textColor} flex items-center gap-2`}>
                {leftAvatar && (
                  <img src={leftAvatar} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200/50 shadow-sm" />
                )}
                {title}
              </h1>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl">
            {navItems.map((item) => {
              const isActive = item.path === '/' 
                ? currentPath === '/' 
                : currentPath === item.path || currentPath.startsWith(item.path + '/');
                
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 relative group ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-on-surface-variant hover:text-primary transition-colors'
                  }`}
                >
                  <Icon icon={item.icon} size={20} weight={isActive ? 700 : 400} />
                  <span className="hidden lg:inline">{item.label}</span>
                  {isActive && <span className="lg:hidden">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {rightAction === 'search' ? (
            <button
               onClick={onRightAction}
               className="p-3 rounded-full bg-surface-container-high text-primary hover:bg-primary/5 active:scale-95 transition-all shadow-sm"
            >
               <Icon icon="search" size={24} weight={700} />
            </button>
          ) : (
            <div className="flex items-center gap-2 md:gap-4">
              {mounted && canManageMembers && (
                <button 
                  onClick={() => router.push('/moderation')}
                  className="md:hidden w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary active:scale-95 transition-all shadow-sm"
                  title="Moderação"
                >
                  <Icon icon="admin_panel_settings" size={22} weight={700} />
                </button>
              )}
              
              {user ? (
                <button
                  onClick={onAvatarClick as any}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10 active:scale-95 group"
                >
                  <div className="relative">
                    <Avatar 
                      src={userAvatar || undefined} 
                      name={user?.name || ''} 
                      alt="User" 
                      className="w-10 h-10 md:w-11 md:h-11 ring-2 ring-primary/20 shadow-sm group-hover:ring-primary transition-all duration-300" 
                    />
                    {user.plan === 'plus' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#25D366] rounded-full flex items-center justify-center border-2 border-white">
                        <Icon icon="check" size={10} className="text-white" weight={900} />
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-black leading-none text-on-surface truncate max-w-[100px]">{user.name}</p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1 opacity-70 group-hover:opacity-100">Plano Plus</p>
                  </div>
                </button>
              ) : (
                <button 
                  onClick={() => router.push('/login')}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full primary-gradient text-white text-[13px] font-black shadow-lg shadow-primary/20 active:scale-95 transition-all hover:brightness-110"
                >
                  <Icon icon="login" size={18} weight={700} />
                  <span>Entrar</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

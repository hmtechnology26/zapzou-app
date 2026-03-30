'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '../hooks/useApp';
import { Icon } from './Icon';

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
}

export function TopAppBar({
  title,
  showBack = false,
  onBack,
  rightAction = 'search',
  onRightAction,
  variant = 'default',
  userAvatar: propAvatar,
  onMenuClick,
  onAvatarClick: propAvatarClick,
}: TopAppBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const tabPaths = ['/', '/places', '/post', '/my-services', '/profile'];
  const userAvatar = mounted ? (propAvatar || user?.avatar) : null;
  const onAvatarClick = propAvatarClick || (() => router.push('/profile'));
  const currentPath = pathname ?? '';

  const finalRightAction = onRightAction || (() => {
    if (!user) {
      router.push('/login');
    } else if (rightAction === 'search') {
      router.push('/search');
    }
  });

  const textColor = variant === 'primary' ? 'text-white' : 'text-primary';
  const bgColor = variant === 'primary' ? 'bg-emerald-700/85' : 'bg-white/85';

  return (
    <header className={`fixed top-0 w-full z-50 ${bgColor} backdrop-blur-xl flex items-center justify-between px-4 h-16 w-full ${variant === 'primary' ? '' : 'border-b border-slate-200/10'}`}>
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBack}
            className={`hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full transition-colors p-2 active:scale-95 duration-200 ${textColor}`}
          >
            <Icon icon="arrow_back" weight={400} grade={0} size={24} />
          </button>
        )}

        {title ? (
          <div className="flex items-center gap-2">
            {!showBack && !tabPaths.includes(currentPath) && (
              <button
                onClick={() => router.push('/')}
                className={`hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full transition-colors p-2 active:scale-95 duration-200 ${textColor}`}
              >
                <Icon icon="home" weight={400} grade={0} size={24} />
              </button>
            )}
            <h1 className={`font-semibold text-lg tracking-tight ${textColor}`}>{title}</h1>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {!tabPaths.includes(currentPath) && (
              <button
                onClick={() => router.push('/')}
                className={`hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full transition-colors p-2 active:scale-95 duration-200 ${textColor}`}
              >
                <Icon icon="home" weight={400} grade={0} size={24} />
              </button>
            )}
            <h1 className={`font-black text-2xl tracking-tighter ${textColor}`}>ZapZou</h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!userAvatar ? (
          <button
            onClick={finalRightAction}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full primary-gradient text-white text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <Icon icon="login" weight={400} grade={0} size={20} />
            <span>Entrar</span>
          </button>
        ) : (
          <>
            <button
              onClick={finalRightAction}
              className={`hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full transition-colors p-2 active:scale-95 duration-200 ${textColor}`}
            >
              <Icon icon={rightAction} weight={400} grade={0} size={24} />
            </button>
            {user?.membershipRole === 'moderator' && (
              <button
                onClick={() => router.push('/moderation')}
                className={`hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full transition-colors p-2 active:scale-95 duration-200 ${textColor}`}
                title="Painel de Moderação"
              >
                <Icon icon="admin_panel_settings" weight={400} grade={0} size={24} />
              </button>
            )}
            <div className="relative">
              <button
                onClick={onAvatarClick}
                className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border-2 border-primary shadow-sm hover:scale-105 transition-transform active:scale-95 ml-1"
              >
                <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
              </button>
              {user?.plan && user.plan !== 'free' && (
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-md ${
                  user.plan === 'pro' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'
                }`}>
                  {user.plan === 'pro' ? 'PRÓ' : 'PLUS'}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
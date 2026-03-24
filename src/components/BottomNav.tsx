'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Icon } from './Icon';
import { usePublishModal } from '@/contexts/PublishModalContext';
import { useApp } from '@/hooks/useApp';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Início', icon: 'home' },
  { path: '/places', label: 'Ambientes', icon: 'explore' },
  { path: '/post', label: 'Publicar', icon: 'add_circle' },
  { path: '/my-services', label: 'Meus Serviços', icon: 'storefront' },
  { path: '/profile', label: 'Perfil', icon: 'person' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = usePublishModal();
  const { user, selectedEnvironments } = useApp();

  const handleNavClick = (e: React.MouseEvent, itemPath: string) => {
    // Publicar - precisa estar logado e ter ambientes
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
    }
    // Meus Serviços e Perfil - precisa estar logado
    if ((itemPath === '/my-services' || itemPath === '/profile') && !user) {
      e.preventDefault();
      router.push('/login');
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/10 shadow-glass-lg rounded-t-3xl flex justify-around items-center px-4 py-1 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        const isCenter = item.path === '/post';

        return (
          <a
            key={item.path}
            href={item.path}
            onClick={(e) => handleNavClick(e, item.path)}
            className={`flex flex-col items-center justify-center px-4 py-1 transition-all active:scale-90 duration-150 ${
              isCenter 
                ? 'text-primary' 
                : isActive 
                  ? 'text-primary' 
                  : 'text-slate-500'
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
            <span className="text-[10px] font-medium tracking-wide mt-1">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

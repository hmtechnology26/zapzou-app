'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useApp } from '@/hooks/useApp';
import { useState, useEffect } from 'react';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, setUser } = useApp();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(user?.name || '');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    if (user) setUser({ ...user, name });
    router.push('/profile');
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-background">
      <header className="fixed top-0 w-full z-50 bg-white/85 backdrop-blur-xl flex items-center justify-between px-4 h-16 md:border-b md:border-slate-200">
        <div className="flex items-center gap-3 max-w-7xl mx-auto w-full">
          <button 
            onClick={() => router.back()}
            className="hover:bg-slate-100/50 rounded-full transition-colors p-2 active:scale-95 duration-200 text-primary"
          >
            <Icon icon="arrow_back" size={24} />
          </button>
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">Editar Perfil</h1>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {mounted && user ? (
            <button onClick={() => router.push('/profile')} className="hover:scale-105 transition-transform active:scale-95 ml-1">
              <Avatar
                src={user.avatar}
                name={user.name}
                alt="Avatar"
                className="w-10 h-10 border-2 border-primary shadow-sm"
              />
            </button>
          ) : (
            <button 
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 px-4 py-2 rounded-full primary-gradient text-white text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              <Icon icon="login" size={20} />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </header>
      <main className="pt-20 px-6 max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col items-center">
          <Avatar
            src={user?.avatar}
            name={user?.name}
            alt={user?.name || 'Avatar'}
            className="w-24 h-24 border-4 border-white shadow-lg"
            fallbackClassName="text-2xl"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-on-surface">Nome</label>
          <input className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <button onClick={handleSave} className="w-full primary-gradient text-white font-bold py-4 rounded-full shadow-lg">Salvar</button>
      </main>
    </div>
  );
}

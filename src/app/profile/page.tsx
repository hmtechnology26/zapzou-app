'use client';

import { useRouter } from 'next/navigation';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '@/components/TopAppBar';
import { useApp } from '@/hooks/useApp';

export default function ProfilePage() {
  const router = useRouter();
  const { user, services, setUser } = useApp();

  const activeServices = services.filter(s => s.isActive).length;

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar title="Meu Perfil" />
      <main className="pt-20 px-6 max-w-2xl mx-auto">
        <section className="flex flex-col items-center py-8">
          <div className="relative">
            <img className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" src={user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'} alt={user?.name} />
            <button onClick={() => router.push('/edit-profile')} className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
              <Icon icon="edit" weight={400} grade={0} size={18} />
            </button>
          </div>
          <h2 className="mt-4 font-bold text-xl text-on-surface">{user?.name}</h2>
          {user?.plan && user.plan !== 'free' && (
            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold text-white ${
              user.plan === 'pro' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-purple-500 to-purple-600'
            }`}>
              Plano {user.plan === 'pro' ? 'PRÓ' : 'PLUS'}
            </div>
          )}
          <p className="text-on-surface-variant">{user?.email}</p>
        </section>
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low rounded-2xl p-6 text-center">
            <span className="text-3xl font-black text-primary">{activeServices}</span>
            <p className="text-on-surface-variant text-sm">Serviços Ativos</p>
          </div>
          <div className="bg-surface-container-low rounded-2xl p-6 text-center">
            <span className="text-3xl font-black text-primary">{services.length}</span>
            <p className="text-on-surface-variant text-sm">Total de Serviços</p>
          </div>
        </section>
        
        {user?.plan && user.plan !== 'free' && (
          <section className="mt-6">
            <div className={`rounded-3xl p-5 ${
              user.plan === 'pro' 
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200' 
                : 'bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    user.plan === 'pro' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}>
                    <Icon icon="workspace_premium" size={24} className="text-white" weight={700} />
                  </div>
                  <div>
                    <p className={`font-bold text-lg ${
                      user.plan === 'pro' ? 'text-blue-700' : 'text-purple-700'
                    }`}>
                      Plano {user.plan === 'pro' ? 'PRÓ' : 'PLUS'}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {user.plan === 'pro' ? 'até 5 serviços' : 'Serviços ilimitados'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/plans')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                    user.plan === 'pro' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-purple-500 text-white'
                  }`}
                >
                  Alterar
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mt-8 space-y-2">
          <button onClick={() => router.push('/plans')} className="w-full flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl">
            <Icon icon="workspace_premium" weight={400} grade={0} size={24} className="text-primary" />
            <span className="flex-1 text-left font-medium">Planos</span>
            <Icon icon="chevron_right" weight={400} grade={0} size={24} />
          </button>
          <button onClick={() => router.push('/my-services')} className="w-full flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl">
            <Icon icon="storefront" weight={400} grade={0} size={24} className="text-primary" />
            <span className="flex-1 text-left font-medium">Meus Serviços</span>
            <Icon icon="chevron_right" weight={400} grade={0} size={24} />
          </button>
          {/* <button onClick={() => router.push('/members')} className="w-full flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl">
            <Icon icon="group" weight={400} grade={0} size={24} className="text-primary" />
            <span className="flex-1 text-left font-medium">Membros</span>
            <Icon icon="chevron_right" weight={400} grade={0} size={24} />
          </button>
          <button onClick={() => router.push('/admin-settings')} className="w-full flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl">
            <Icon icon="settings" weight={400} grade={0} size={24} className="text-primary" />
            <span className="flex-1 text-left font-medium">Configurações</span>
            <Icon icon="chevron_right" weight={400} grade={0} size={24} />
          </button> */}
          <button onClick={() => { setUser(null); router.push('/login'); }} className="w-full flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl">
            <Icon icon="logout" weight={400} grade={0} size={24} className="text-error" />
            <span className="flex-1 text-left font-medium text-error">Sair</span>
          </button>
        </section>
      </main>
    </div>
  );
}

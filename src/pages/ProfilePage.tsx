import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';
import { useApp } from '../hooks/useApp';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, services, setUser } = useApp();

  const activeServices = services.filter(s => s.isActive).length;

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar title="Meu Perfil" />
      
      <main className="pt-20 px-6 max-w-2xl mx-auto">
        <section className="flex flex-col items-center py-8">
          <div className="relative">
            <img 
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" 
              src={user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
              alt={user?.name}
            />
            <button 
              onClick={() => navigate('/edit-profile')}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-transform"
            >
              <Icon icon="edit" weight={400} grade={0} size={18} className="text-sm" />
            </button>
          </div>
          <h2 className="mt-4 text-xl font-bold text-on-surface">{user?.name}</h2>
          <p className="text-on-surface-variant">{user?.email}</p>
        </section>

        <section className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-surface-container-low rounded-2xl">
            <p className="text-2xl font-bold text-primary">{activeServices}</p>
            <p className="text-xs text-on-surface-variant">Serviços</p>
          </div>
          <div className="text-center p-4 bg-surface-container-low rounded-2xl">
            <p className="text-2xl font-bold text-primary">148</p>
            <p className="text-xs text-on-surface-variant">Visualizações</p>
          </div>
          <div className="text-center p-4 bg-surface-container-low rounded-2xl">
            <p className="text-2xl font-bold text-primary">4.9</p>
            <p className="text-xs text-on-surface-variant">Avaliação</p>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">
            Configurações
          </h3>

          <button 
            onClick={() => navigate('/my-services')}
            className="w-full p-4 bg-surface-container-low rounded-2xl flex items-center gap-4 hover:bg-surface-container transition-colors"
          >
            <Icon icon="storefront" weight={400} grade={0} size={24} className="text-primary text-2xl" />
            <div className="flex-1 text-left">
              <h4 className="font-semibold text-on-surface">Meus Serviços</h4>
              <p className="text-xs text-on-surface-variant">Gerenciar serviços cadastrados</p>
            </div>
            <Icon icon="chevron_right" weight={400} grade={0} size={24} className="text-on-surface-variant" />
          </button>

          {user?.role === 'admin' && (
            <button 
              onClick={() => navigate('/members')}
              className="w-full p-4 bg-surface-container-low rounded-2xl flex items-center gap-4 hover:bg-surface-container transition-colors"
            >
              <Icon icon="group" weight={400} grade={0} size={24} className="text-primary text-2xl" />
              <div className="flex-1 text-left">
                <h4 className="font-semibold text-on-surface">Gerenciar Membros</h4>
                <p className="text-xs text-on-surface-variant">Controlar acesso de membros</p>
              </div>
              <Icon icon="chevron_right" weight={400} grade={0} size={24} className="text-on-surface-variant" />
            </button>
          )}

          <button 
            onClick={() => navigate('/notifications')}
            className="w-full p-4 bg-surface-container-low rounded-2xl flex items-center gap-4 hover:bg-surface-container transition-colors"
          >
            <Icon icon="notifications" weight={400} grade={0} size={24} className="text-primary text-2xl" />
            <div className="flex-1 text-left">
              <h4 className="font-semibold text-on-surface">Notificações</h4>
              <p className="text-xs text-on-surface-variant">Configurar alertas e avisos</p>
            </div>
            <Icon icon="chevron_right" weight={400} grade={0} size={24} className="text-on-surface-variant" />
          </button>

          <button 
            onClick={() => navigate('/edit-profile')}
            className="w-full p-4 bg-surface-container-low rounded-2xl flex items-center gap-4 hover:bg-surface-container transition-colors"
          >
            <Icon icon="settings" weight={400} grade={0} size={24} className="text-primary text-2xl" />
            <div className="flex-1 text-left">
              <h4 className="font-semibold text-on-surface">Preferências da Conta</h4>
              <p className="text-xs text-on-surface-variant">Editar perfil e e-mail</p>
            </div>
            <Icon icon="chevron_right" weight={400} grade={0} size={24} className="text-on-surface-variant" />
          </button>

          <button className="w-full p-4 bg-surface-container-low rounded-2xl flex items-center gap-4 hover:bg-surface-container transition-colors">
            <Icon icon="help" weight={400} grade={0} size={24} className="text-primary text-2xl" />
            <div className="flex-1 text-left">
              <h4 className="font-semibold text-on-surface">Ajuda & Suporte</h4>
              <p className="text-xs text-on-surface-variant">Tire suas dúvidas</p>
            </div>
            <Icon icon="chevron_right" weight={400} grade={0} size={24} className="text-on-surface-variant" />
          </button>

          <button 
            onClick={() => {
              setUser(null);
              navigate('/');
            }}
            className="w-full p-4 mt-4 bg-error-container/20 rounded-2xl flex items-center gap-4 hover:bg-error-container/30 transition-colors"
          >
            <Icon icon="logout" weight={400} grade={0} size={24} className="text-error text-2xl" />
            <div className="flex-1 text-left">
              <h4 className="font-semibold text-error">Sair</h4>
              <p className="text-xs text-on-surface-variant">Encerrar sessão</p>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
}

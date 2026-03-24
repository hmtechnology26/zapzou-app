import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';
import { useApp } from '../hooks/useApp';

export function PlacesPage() {
  const navigate = useNavigate();
  const { selectedEnvironments, user } = useApp();

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar title="Meus Ambientes" />
      
      <main className="pt-20 px-6 max-w-2xl mx-auto">
        <div className="mt-4 mb-6">
          <p className="text-on-surface-variant">
            Ambientes onde seus serviços estão visíveis.
          </p>
        </div>

        <section className="space-y-4">
          {selectedEnvironments.map((env) => (
            <div 
              key={env.id}
              className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-4"
            >
              {env.image ? (
                <img 
                  className="w-16 h-16 rounded-full object-cover" 
                  src={env.image} 
                  alt={env.name}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
                  <Icon icon="domain" weight={400} grade={0} size={24} className="text-outline text-2xl" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-on-surface">{env.name}</h3>
                <p className="text-sm text-on-surface-variant">{env.members} membros</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="bg-primary-container/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Ativo
                </span>
                {user?.role === 'admin' && (
                  <button 
                    onClick={() => navigate(`/admin/logo/${env.id}`)}
                    className="p-2 text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors active:scale-95"
                    title="Configurar Ambiente"
                  >
                    <Icon icon="settings" weight={400} grade={0} size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}

          <button 
            onClick={() => navigate('/explore')}
            className="w-full border-2 border-dashed border-outline-variant/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-on-surface-variant hover:bg-white/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center">
              <Icon icon="add_location_alt" weight={400} grade={0} size={24} className="text-primary text-2xl" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Adicionar Ambiente</p>
              <p className="text-xs opacity-70">Expanda sua visibilidade</p>
            </div>
          </button>
        </section>

        {user?.role === 'admin' && (
          <section className="mt-10">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">
              Gerenciar Ambientes
            </h3>
            
            <button 
              onClick={() => navigate('/members')}
              className="w-full bg-surface-container-low p-4 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <Icon icon="group" weight={400} grade={0} size={24} className="text-primary text-2xl" />
                <div className="text-left">
                  <h4 className="font-semibold text-on-surface">Gerenciar Membros</h4>
                  <p className="text-xs text-on-surface-variant">Visualize e gerencie membros dos ambientes</p>
                </div>
              </div>
              <Icon icon="chevron_right" weight={400} grade={0} size={24} className="text-on-surface-variant" />
            </button>
          </section>
        )}
      </main>

    </div>
  );
}

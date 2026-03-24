import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';
import { useApp } from '../hooks/useApp';

export function ModerationPage() {
  const navigate = useNavigate();
  const { services, approveService, rejectService } = useApp();

  const pendingServices = services.filter(s => s.status === 'pending');

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar 
        title="Moderação" 
        showBack 
        onBack={() => navigate(-1)}
        variant="primary"
      />
      
      <main className="pt-20 px-4 max-w-2xl mx-auto">
        <div className="mt-4 mb-8 px-2">
          <h2 className="text-xl font-bold text-on-surface">Solicitações Pendentes</h2>
          <p className="text-on-surface-variant text-sm">
            Analise os novos serviços antes de publicá-los na comunidade.
          </p>
        </div>

        {pendingServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <Icon icon="task_alt" weight={400} grade={0} size={64} className="mb-4 text-outline" />
            <p className="text-on-surface-variant font-medium">Tudo limpo por aqui!</p>
            <p className="text-xs">Não há solicitações aguardando aprovação.</p>
          </div>
        ) : (
          <section className="space-y-4">
            {pendingServices.map((service) => (
              <div key={service.id} className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/10 shadow-sm">
                <div className="flex gap-4 mb-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-surface-container flex-shrink-0">
                    <img className="w-full h-full object-cover" src={service.image} alt={service.title} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-on-surface leading-tight mb-1">{service.title}</h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mb-2">{service.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        {service.category}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">por <b>{service.provider}</b></span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => rejectService(service.id)}
                    className="flex items-center justify-center gap-2 py-3 bg-error-container/10 text-error rounded-2xl font-bold text-sm active:scale-95 transition-all"
                  >
                    <Icon icon="close" weight={400} grade={0} size={20} />
                    Reprovar
                  </button>
                  <button 
                    onClick={() => approveService(service.id)}
                    className="flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-md shadow-primary/20 active:scale-95 transition-all"
                  >
                    <Icon icon="check" weight={400} grade={0} size={20} />
                    Aprovar
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

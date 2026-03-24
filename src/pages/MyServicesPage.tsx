import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';
import { useApp } from '../hooks/useApp';

export function MyServicesPage() {
  const navigate = useNavigate();
  const { user, services, toggleServiceStatus, removeService } = useApp();

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar 
        title="Meus Serviços" 
        showBack 
        onBack={() => navigate(-1)}
        userAvatar={user?.avatar}
        onAvatarClick={() => navigate('/profile')}
      />
      
      <main className="pt-20 px-4 max-w-2xl mx-auto space-y-6">
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-lowest p-5 rounded-3xl flex flex-col justify-between h-32 border border-outline-variant/10">
            <Icon icon="check_circle" weight={400} grade={0} size={24} className="text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Serviços Ativos</p>
              <p className="text-3xl font-extrabold text-on-surface">
                {services.filter(s => s.isActive).length}
              </p>
            </div>
          </div>
          <div className="bg-primary-container p-5 rounded-3xl flex flex-col justify-between h-32 text-on-primary-container">
            <Icon icon="visibility" weight={400} grade={0} size={24} className="text-on-primary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Visualizações</p>
              <p className="text-3xl font-extrabold">96</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-on-surface-variant px-1">Gerenciar Catálogo</h2>
          
          {services.map((service) => (
            <div 
              key={service.id}
              className={`bg-surface-container-lowest rounded-3xl p-4 flex flex-col gap-4 border border-outline-variant/10 ${!service.isActive ? 'opacity-75' : ''}`}
            >
              <div className="flex gap-4">
                <div className={`w-24 h-24 rounded-2xl overflow-hidden bg-surface-container flex-shrink-0 ${!service.isActive ? 'grayscale' : ''}`}>
                  <img 
                    className="w-full h-full object-cover" 
                    src={service.image} 
                    alt={service.title}
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-on-surface leading-tight">{service.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                        service.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : service.status === 'rejected'
                            ? 'bg-error-container/20 text-error'
                            : service.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        {service.status === 'pending' ? 'Pendente' : service.status === 'rejected' ? 'Reprovado' : service.isActive ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">{service.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-on-surface-variant font-medium">
                      {service.status === 'pending' ? 'Aguardando aprovação' : service.status === 'rejected' ? 'Não permitido neste ambiente' : 'Ativar / Pausar'}
                    </span>
                    <label className={`relative inline-flex items-center ${service.status !== 'active' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={service.isActive}
                        onChange={() => service.status === 'active' && toggleServiceStatus(service.id)}
                        disabled={service.status !== 'active'}
                      />
                      <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  onClick={() => navigate(`/edit-service/${service.id}`)}
                  className="flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-2xl text-on-surface font-semibold text-sm hover:bg-surface-container transition-colors active:scale-95"
                >
                  <Icon icon="edit" weight={400} grade={0} size={24} className="text-lg" />
                  Editar
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Tem certeza que deseja excluir seu anúncio?')) {
                      removeService(service.id);
                    }
                  }}
                  className="flex items-center justify-center gap-2 py-3 bg-error-container/20 rounded-2xl text-error font-semibold text-sm hover:bg-error-container/30 transition-colors active:scale-95"
                >
                  <Icon icon="delete" weight={400} grade={0} size={24} className="text-lg" />
                  Excluir
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={() => navigate('/select-environments')}
            className="w-full border-2 border-dashed border-outline-variant/30 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-on-surface-variant hover:bg-white/50 transition-colors active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon icon="add" weight={400} grade={0} size={24} className="text-primary text-3xl" />
            </div>
            <div className="text-center">
              <p className="font-bold">Anunciar Novo Serviço</p>
              <p className="text-xs opacity-70">Aumente suas vendas hoje mesmo</p>
            </div>
          </button>
        </section>

        <section className="bg-secondary-container/30 p-6 rounded-3xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-2">
            <h4 className="font-bold text-on-secondary-container">Dica de Sucesso</h4>
            <p className="text-sm text-on-secondary-container/80 leading-relaxed">
              Serviços com fotos reais de alta qualidade recebem até 3x mais contatos no WhatsApp.
            </p>
          </div>
          <Icon icon="lightbulb" weight={400} grade={0} size={48} className="absolute -right-4 -bottom-4 text-8xl text-secondary-container/40 pointer-events-none" />
        </section>
      </main>

    </div>
  );
}

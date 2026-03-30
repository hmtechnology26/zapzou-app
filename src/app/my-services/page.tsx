'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { usePublishModal } from '@/contexts/PublishModalContext';
import { useState, useEffect } from 'react';

export default function MyServicesPage() {
  const router = useRouter();
  const { services, toggleServiceStatus, removeService, user, selectedEnvironments, setSelectedEnvironments } = useApp();
  const { open } = usePublishModal();
  const [mounted, setMounted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<typeof services[0] | null>(null);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [tempSelectedEnvs, setTempSelectedEnvs] = useState<string[]>([]);
  const [envSearch, setEnvSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNewService = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (selectedEnvironments.length === 0) {
      router.push('/places');
      return;
    }
    open();
  };

  const toggleTempEnv = (envId: string) => {
    if (tempSelectedEnvs.includes(envId)) {
      setTempSelectedEnvs(tempSelectedEnvs.filter(id => id !== envId));
    } else {
      setTempSelectedEnvs([...tempSelectedEnvs, envId]);
    }
  };

  const confirmEnvSelection = () => {
    const selected = selectedEnvironments.filter(e => tempSelectedEnvs.includes(e.id));
    setSelectedEnvironments(selected);
    setShowEnvModal(false);
    router.push('/register-service');
  };

  const filteredEnvs = selectedEnvironments.filter(e => 
    e.name.toLowerCase().includes(envSearch.toLowerCase())
  );

  const activeServices = services.filter(s => s.isActive).length;

  const handleToggleStatus = (serviceId: string) => {
    toggleServiceStatus(serviceId);
  };

  const handleDeleteClick = (service: typeof services[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      removeService(serviceToDelete.id);
      setShowDeleteModal(false);
      setServiceToDelete(null);
    }
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
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">Meus Serviços</h1>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {mounted && user?.avatar ? (
            <button onClick={() => router.push('/profile')} className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary shadow-sm hover:scale-105 transition-transform">
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
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

      <main className="pt-20 px-4 md:px-8 max-w-3xl mx-auto space-y-6">
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-lowest p-5 rounded-3xl flex flex-col justify-between h-32 border border-outline-variant/10">
            <Icon icon="check_circle" weight={400} size={32} className="text-primary" style={{ fontVariationSettings: "'FILL' 1" }} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Serviços Ativos</p>
              <p className="text-3xl font-extrabold text-on-surface">{activeServices}</p>
            </div>
          </div>
          <div className="bg-primary-container p-5 rounded-3xl flex flex-col justify-between h-32 text-on-primary-container">
            <Icon icon="visibility" weight={400} size={32} className="text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Visualizações</p>
              <p className="text-3xl font-extrabold">148</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-on-surface-variant px-1">Gerenciar Catálogo</h2>
          
            {services.length === 0 ? (
            <button 
              onClick={handleNewService}
              className="w-full border-2 border-dashed border-outline-variant/30 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-on-surface-variant hover:bg-white/50 transition-colors active:scale-[0.98]"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon icon="add" weight={400} size={32} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="font-bold">Anunciar Novo Serviço</p>
                <p className="text-xs opacity-70">Aumente suas vendas hoje mesmo</p>
              </div>
            </button>
          ) : (
            <>
              {services.map((service) => (
                <div key={service.id} className="bg-surface-container-lowest rounded-3xl p-4 flex flex-col gap-4 border border-outline-variant/10">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface-container flex-shrink-0">
                      <img className="w-full h-full object-cover" src={service.image || 'https://via.placeholder.com/150'} alt={service.title} />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-on-surface leading-tight">{service.title}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter flex-shrink-0 ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                            {service.isActive ? 'Ativo' : 'Pausado'}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">{service.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-on-surface-variant font-medium">Ativar / Pausar</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={service.isActive || false}
                            onChange={() => handleToggleStatus(service.id)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button 
                      onClick={() => router.push(`/register-service?id=${service.id}`)}
                      className="flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-2xl text-on-surface font-semibold text-sm hover:bg-surface-container transition-colors active:scale-95"
                    >
                      <Icon icon="edit" weight={400} size={20} />
                      Editar
                    </button>
                    <button 
                      onClick={(e) => handleDeleteClick(service, e)}
                      className="flex items-center justify-center gap-2 py-3 bg-error-container/20 rounded-2xl text-error font-semibold text-sm hover:bg-error-container/30 transition-colors active:scale-95"
                    >
                      <Icon icon="delete" weight={400} size={20} />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}

              <button 
                onClick={handleNewService}
                className="w-full border-2 border-dashed border-outline-variant/30 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 text-on-surface-variant hover:bg-white/50 transition-colors active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon icon="add" weight={400} size={32} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-bold">Anunciar Novo Serviço</p>
                  <p className="text-xs opacity-70">Aumente suas vendas hoje mesmo</p>
                </div>
              </button>
            </>
          )}
        </section>

        <section className="bg-secondary-container/30 p-6 rounded-3xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-2">
            <h4 className="font-bold text-on-secondary-container">Dica de Sucesso</h4>
            <p className="text-sm text-on-secondary-container/80 leading-relaxed">Serviços com fotos reais de alta qualidade recebem até 3x mais contatos no WhatsApp.</p>
            <button className="mt-2 text-primary text-xs font-extrabold uppercase tracking-widest flex items-center gap-1">
              Ver mais dicas <Icon icon="arrow_forward" weight={400} size={12} />
            </button>
          </div>
          <Icon icon="lightbulb" weight={400} size={128} className="absolute -right-4 -bottom-4 text-secondary-container/40 pointer-events-none" />
        </section>
      </main>

      {showEnvModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-outline-variant/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-on-surface text-lg">Publicar em</h3>
                <button onClick={() => setShowEnvModal(false)} className="p-2 hover:bg-surface-container rounded-full">
                  <Icon icon="close" size={24} />
                </button>
              </div>
              <p className="text-on-surface-variant text-sm">Selecione um ou mais ambientes para publicar seu serviço</p>
            </div>
            
            <div className="p-4 border-b border-outline-variant/10">
              <div className="relative">
                <Icon icon="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Buscar ambientes..."
                  value={envSearch}
                  onChange={(e) => setEnvSearch(e.target.value)}
                  className="w-full bg-surface-container-highest rounded-full py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredEnvs.length === 0 ? (
                <p className="text-center text-on-surface-variant py-8">Nenhum ambiente encontrado</p>
              ) : (
                filteredEnvs.map((env) => (
                  <div
                    key={env.id}
                    onClick={() => toggleTempEnv(env.id)}
                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors ${
                      tempSelectedEnvs.includes(env.id) ? 'bg-primary/5 border border-primary/20' : 'bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                      tempSelectedEnvs.includes(env.id) ? 'border-primary bg-primary' : 'border-outline-variant'
                    }`}>
                      {tempSelectedEnvs.includes(env.id) && (
                        <Icon icon="check" size={14} className="text-white" weight={700} />
                      )}
                    </div>
                    {env.image ? (
                      <img src={env.image} alt={env.name} className="w-10 h-10 rounded-full object-cover mr-3" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center mr-3">
                        <Icon icon="domain" size={20} className="text-on-surface-variant" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-on-surface text-sm">{env.name}</p>
                      <p className="text-xs text-on-surface-variant">{env.members} membros</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-outline-variant/10">
              <button
                onClick={confirmEnvSelection}
                disabled={tempSelectedEnvs.length === 0}
                className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 ${
                  tempSelectedEnvs.length > 0 
                    ? 'primary-gradient text-white shadow-lg shadow-primary/20' 
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <Icon icon="arrow_forward" size={20} />
                Continuar ({tempSelectedEnvs.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && serviceToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-error-container/30 flex items-center justify-center">
                <Icon icon="delete" weight={400} size={32} className="text-error" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Excluir Serviço</h3>
                <p className="text-on-surface-variant text-sm">{serviceToDelete.title}</p>
              </div>
            </div>
            <p className="text-on-surface-variant mb-6">
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-full border-2 border-surface-variant text-on-surface-variant font-bold"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-full bg-error text-white font-bold"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

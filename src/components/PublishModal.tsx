'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { usePublishModal } from '@/contexts/PublishModalContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const serviceCategories = ['Alimentação', 'Limpeza', 'Manutenção', 'Pet Sitting', 'Beleza', 'Tecnologia', 'Outros'];

export function PublishModal() {
  const router = useRouter();
  const { isOpen, close } = usePublishModal();
  const { user, selectedEnvironment, services, addService, selectedEnvironments, requestAffiliation } = useApp();
  
  const [step, setStep] = useState<'environments' | 'form'>('environments');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [form, setForm] = useState({
    serviceName: '',
    category: serviceCategories[0],
    description: '',
    WhatsApp: '',
    instagram: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [menuItems, setMenuItems] = useState<{name: string; description: string; price: string; image?: string}[]>([]);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [menuItemForm, setMenuItemForm] = useState<{id?: string; name: string; description: string; price: string; image?: string}>({ name: '', description: '', price: '', image: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const filteredEnvironments = selectedEnvironments.filter(env => 
    env.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEnvironment) {
      setActiveEnvId(selectedEnvironment.id);
    }
  }, [selectedEnvironment]);

  useEffect(() => {
    if (isOpen) {
      if (!user) {
        close();
        router.push('/login');
        return;
      }
      if (selectedEnvironments.length === 0) {
        close();
        router.push('/places');
        return;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setForm({ serviceName: '', category: serviceCategories[0], description: '', WhatsApp: '', instagram: '' });
      setImages([]);
      setMenuItems([]);
      setStep('environments');
      setSearchQuery('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || images.length >= 5) return;
    setUploading(true);
    try {
      setErrorMsg('');
      const { data, error } = await supabase.storage
        .from('zapzou')
        .upload(`services/${Date.now()}-${Math.random()}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('zapzou')
        .getPublicUrl(data.path);

      setImages([...images, publicUrl]);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Falha ao enviar imagem. Configure o Storage (bucket/policies) para habilitar uploads.',
      );
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const selectEnvironment = (envId: string) => {
     setActiveEnvId(envId);
  };

  const handleContinueToForm = () => {
    if (!activeEnvId) return;
    setStep('form');
  };

  const handleRequestAffiliation = async () => {
     if (!activeEnvId) return;
     try {
       await requestAffiliation(activeEnvId);
     } catch(err: any){
       setErrorMsg(err.message || 'Erro ao afiliar');
     }
  };

  const handlePublish = async () => {
    if (!form.serviceName || !form.WhatsApp || !activeEnvId) return;
    setErrorMsg('');

    try {
      const newService = {
        title: form.serviceName,
        description: form.description,
        category: form.category,
        image: images[0] || '',
        images: images,
        WhatsApp: form.WhatsApp ? `55${form.WhatsApp}` : '',
        instagram: form.instagram,
        status: 'active',
        environmentId: activeEnvId,
        menu: menuItems.map((item, idx) => ({ ...item, id: `menu-${Date.now()}-${idx}` })),
      };

      await addService(newService);
      close();
      router.push('/');
    } catch(err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao publicar serviço. Verifique se você está em um raio de 500m ou se ultrapassou o limite do seu plano.');
    }
  };

  if (!isOpen) return null;

  const currentEnv = selectedEnvironments.find(e => e.id === activeEnvId);
  const isChurch = currentEnv?.type === 'church';
  const memStatus = user?.membershipStatus; 
  const isBlocked = step === 'form' && isChurch && memStatus !== 'active';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            {step === 'form' && (
              <button onClick={() => setStep('environments')} className="p-1 -ml-1">
                <Icon icon="arrow_back" size={24} />
              </button>
            )}
            <h3 className="font-bold text-on-surface text-lg">
              {step === 'environments' ? 'Onde publicar?' : 'Novo Serviço'}
            </h3>
          </div>
          <button onClick={close} className="p-2 rounded-full hover:bg-surface-container-low">
            <Icon icon="close" size={24} />
          </button>
        </div>

        {step === 'form' && currentEnv && (
          <div className="px-6 py-3 bg-surface-container-lowest border-b border-outline-variant/10 flex items-center gap-3">
            {currentEnv.image ? (
              <img src={currentEnv.image} alt={currentEnv.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                <Icon icon="domain" size={20} className="text-on-surface-variant" />
              </div>
            )}
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Publicando em</p>
              <p className="font-semibold text-on-surface text-sm">{currentEnv.name}</p>
            </div>
            <button onClick={() => setStep('environments')} className="ml-auto text-primary text-xs font-medium">
              Alterar
            </button>
          </div>
        )}

        {step === 'environments' ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-4">
              <p className="text-on-surface-variant text-sm">Selecione o ambiente onde deseja oferecer este serviço</p>
            </div>
            
            <div className="px-6 pb-4">
              <div className="relative">
                <Icon icon="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Buscar ambientes disponíveis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container-highest rounded-full py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
              {filteredEnvironments.map((env) => (
                <div
                  key={env.id}
                  onClick={() => selectEnvironment(env.id)}
                  className={`flex items-center p-4 rounded-xl cursor-pointer transition-colors ${
                    activeEnvId === env.id ? 'bg-primary/5 border border-primary/20' : 'bg-surface-container-lowest hover:bg-surface-container-low'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                    activeEnvId === env.id ? 'border-primary bg-primary' : 'border-outline-variant'
                  }`}>
                    {activeEnvId === env.id && (
                      <Icon icon="circle" size={10} className="text-primary" weight={700} />
                    )}
                  </div>
                  {env.image ? (
                    <img src={env.image} alt={env.name} className="w-12 h-12 rounded-full object-cover mr-3" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mr-3">
                      <Icon icon="domain" size={24} className="text-on-surface-variant" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface">{env.name}</p>
                    <p className="text-xs text-on-surface-variant">{env.type === 'church' ? 'Igreja (Moderado)' : 'Livre'}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/10">
              <button
                onClick={handleContinueToForm}
                disabled={!activeEnvId}
                className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 ${
                  activeEnvId 
                    ? 'primary-gradient text-white shadow-lg shadow-primary/20' 
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                Continuar
                <Icon icon="arrow_forward" size={20} />
              </button>
            </div>
          </div>
        ) : isBlocked ? (
           <div className="p-8 text-center flex flex-col items-center">
              <Icon icon="lock" size={48} className="text-primary mb-4" />
              <h2 className="text-xl font-bold text-on-surface mb-2">Acesso Restrito</h2>
              
              {memStatus === 'pending' ? (
                 <>
                   <p className="text-on-surface-variant mb-6 text-sm">
                     Sua afiliação em **{currentEnv?.name}** está em análise pela liderança.
                   </p>
                   <button className="w-full py-4 bg-slate-200 text-slate-500 rounded-full font-bold cursor-not-allowed">
                      Aguardando Aprovação
                   </button>
                 </>
              ) : (
                 <>
                   <p className="text-on-surface-variant mb-6 text-sm">
                     Você precisa se afiliar à comunidade **{currentEnv?.name}** antes de poder anunciar.
                   </p>
                   {errorMsg && <p className="text-error text-sm mb-4">{errorMsg}</p>}
                   <button onClick={handleRequestAffiliation} className="w-full py-4 primary-gradient text-white rounded-full font-bold shadow-lg">
                      Solicitar Afiliação
                   </button>
                 </>
              )}
           </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {errorMsg && (
              <div className="bg-error/10 border border-error/20 p-4 rounded-xl text-error text-sm font-medium">
                {errorMsg}
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-on-surface">Fotos do Serviço</label>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img src={img} alt="Preview" className="w-20 h-20 rounded-xl object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 p-1 bg-error rounded-full text-white">
                      <Icon icon="close" size={12} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="cursor-pointer flex-shrink-0">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <div className="w-20 h-20 rounded-xl bg-surface-container-lowest border-2 border-dashed border-outline-variant/30 flex items-center justify-center">
                      <Icon icon="add_photo_alternate" size={24} className="text-on-surface-variant" />
                    </div>
                  </label>
                )}
              </div>
              {uploading && <span className="text-sm text-on-surface-variant">Enviando...</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-on-surface">Nome do Serviço *</label>
                <input className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface" placeholder="Ex: Marmitas da Julia" value={form.serviceName} onChange={(e) => setForm({...form, serviceName: e.target.value})} />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-on-surface">Categoria *</label>
                <select className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                  {serviceCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-on-surface">Descrição *</label>
                <textarea className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface resize-none" rows={3} placeholder="Descreva seu serviço..." value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface">WhatsApp *</label>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface" 
                  placeholder="51999999999" 
                  value={form.WhatsApp.replace(/^55/, '')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setForm({...form, WhatsApp: value});
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface">Instagram</label>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface" 
                  placeholder="@seuinstagram" 
                  value={form.instagram || ''}
                  onChange={(e) => {
                    let value = e.target.value.trim();
                    setForm({...form, instagram: value});
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {step === 'form' && !isBlocked && (
          <div className="px-6 py-4 border-t border-outline-variant/10">
            <button onClick={handlePublish} disabled={!form.serviceName || !form.WhatsApp} className="w-full primary-gradient text-white font-bold py-4 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              Publicar Serviço
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { usePublishModal } from '@/contexts/PublishModalContext';
import { useState, useEffect } from 'react';

const serviceCategories = ['Alimentação', 'Limpeza', 'Manutenção', 'Pet Sitting', 'Beleza', 'Tecnologia', 'Outros'];

export function PublishModal() {
  const router = useRouter();
  const { isOpen, close } = usePublishModal();
  const { user, selectedEnvironment, services, addService, selectedEnvironments } = useApp();
  
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
  const [selectedEnvs, setSelectedEnvs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [menuItems, setMenuItems] = useState<{name: string; description: string; price: string; image?: string}[]>([]);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [menuItemForm, setMenuItemForm] = useState<{id?: string; name: string; description: string; price: string; image?: string}>({ name: '', description: '', price: '', image: '' });

  const filteredEnvironments = selectedEnvironments.filter(env => 
    env.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (selectedEnvironment) {
      setSelectedEnvs([selectedEnvironment.id]);
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
      setSelectedEnvs([]);
      setMenuItems([]);
      setStep('environments');
      setSearchQuery('');
    }
  }, [isOpen]);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAddMenuItem = () => {
    if (menuItemForm.name && menuItemForm.price) {
      const newItem = { ...menuItemForm, id: menuItemForm.id || `menu-${Date.now()}` };
      setMenuItems([...menuItems, newItem]);
      setMenuItemForm({ name: '', description: '', price: '', image: '' });
      setShowMenuItemModal(false);
    }
  };

  const handleRemoveMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || images.length >= 5) return;
    setUploading(true);
    const base64 = await convertToBase64(file);
    setImages([...images, base64]);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const toggleEnvironment = (envId: string) => {
    if (selectedEnvs.includes(envId)) {
      setSelectedEnvs(selectedEnvs.filter(id => id !== envId));
    } else {
      setSelectedEnvs([...selectedEnvs, envId]);
    }
  };

  const handlePublish = async () => {
    if (!form.serviceName || !form.WhatsApp) return;

    const envsToUse = selectedEnvs.length > 0 ? selectedEnvs : selectedEnvironments.map(e => e.id);
    
    if (envsToUse.length === 0) {
      alert('Adicione pelo menos um ambiente primeiro');
      return;
    }

    for (const envId of envsToUse) {
      const newService = {
        title: form.serviceName,
        description: form.description,
        category: form.category,
        image: images[0] || '',
        images: images,
        provider: user?.name || 'Usuário',
        status: 'active' as const,
        isActive: true,
        WhatsApp: form.WhatsApp ? `55${form.WhatsApp}` : '',
        instagram: form.instagram || undefined,
        environmentId: envId,
        environmentSlug: selectedEnvironments.find(e => e.id === envId)?.slug,
        menu: menuItems.length > 0 ? menuItems.map((item, idx) => ({
          id: idx.toString(),
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image || ''
        })) : undefined,
      };

      await addService(newService as any);
    }

    close();
  };

  const handleContinueToForm = () => {
    if (selectedEnvs.length === 0) return;
    setStep('form');
  };

  if (!isOpen) return null;

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
              {step === 'environments' ? 'Publicar serviço' : 'Novo Serviço'}
            </h3>
          </div>
          <button onClick={close} className="p-2 rounded-full hover:bg-surface-container-low">
            <Icon icon="close" size={24} />
          </button>
        </div>

        {step === 'environments' ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-4">
              <p className="text-on-surface-variant text-sm">Selecione um ou mais ambientes para publicar seu serviço</p>
            </div>
            
            <div className="px-6 pb-4">
              <div className="relative">
                <Icon icon="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Buscar ambientes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container-highest rounded-full py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
              {filteredEnvironments.length === 0 ? (
                <p className="text-center text-on-surface-variant py-8">Nenhum ambiente encontrado</p>
              ) : (
                filteredEnvironments.map((env) => (
                  <div
                    key={env.id}
                    onClick={() => toggleEnvironment(env.id)}
                    className={`flex items-center p-4 rounded-xl cursor-pointer transition-colors ${
                      selectedEnvs.includes(env.id) ? 'bg-primary/5 border border-primary/20' : 'bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                      selectedEnvs.includes(env.id) ? 'border-primary bg-primary' : 'border-outline-variant'
                    }`}>
                      {selectedEnvs.includes(env.id) && (
                        <Icon icon="check" size={14} className="text-white" weight={700} />
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
                      <p className="text-xs text-on-surface-variant">{env.members} membros</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/10">
              <button
                onClick={handleContinueToForm}
                disabled={selectedEnvs.length === 0}
                className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 ${
                  selectedEnvs.length > 0 
                    ? 'primary-gradient text-white shadow-lg shadow-primary/20' 
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <Icon icon="arrow_forward" size={20} />
                Continuar ({selectedEnvs.length})
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                <input className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60" placeholder="Ex: Marmitas da Julia" value={form.serviceName} onChange={(e) => setForm({...form, serviceName: e.target.value})} />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-on-surface">Categoria *</label>
                <select className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                  {serviceCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-on-surface">Descrição *</label>
                <textarea className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60 resize-none" rows={3} placeholder="Descreva seu serviço..." value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface">WhatsApp *</label>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60" 
                  placeholder="51999999999" 
                  value={form.WhatsApp.replace(/^55/, '')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setForm({...form, WhatsApp: value});
                  }}
                />
                <p className="text-xs text-on-surface-variant mt-1">Digite apenas DDD + número</p>
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface">Instagram</label>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60" 
                  placeholder="@seuinstagram ou https://instagram.com/..." 
                  value={form.instagram || ''}
                  onChange={(e) => {
                    let value = e.target.value.trim();
                    setForm({...form, instagram: value});
                  }}
                />
              </div>

              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-on-surface">Opções/Serviços</label>
                  <button 
                    type="button"
                    onClick={() => setShowMenuItemModal(true)}
                    className="text-xs text-primary font-bold"
                  >
                    + Adicionar opção
                  </button>
                </div>
                {menuItems.length > 0 && (
                  <div className="space-y-2">
                    {menuItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-surface-container-low p-3 rounded-xl">
                        <div className="flex-1">
                          <p className="font-bold text-on-surface text-sm">{item.name}</p>
                          {item.description && <p className="text-xs text-on-surface-variant">{item.description}</p>}
                          <p className="text-primary font-bold text-sm">R$ {item.price}</p>
                        </div>
                        <button onClick={() => handleRemoveMenuItem(idx)} className="p-2 text-error">
                          <Icon icon="delete" size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {menuItems.length === 0 && (
                  <p className="text-xs text-on-surface-variant">Adicione opções de serviços que você oferece (opcional)</p>
                )}
              </div>

              <div className="col-span-2">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="location_on" size={18} className="text-primary" weight={700} />
                    <span className="text-sm font-medium text-on-surface">Publicando em:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedEnvironments.filter(e => selectedEnvs.includes(e.id)).map((env) => (
                      <div key={env.id} className="flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 shadow-sm">
                        {env.image ? (
                          <img src={env.image} alt={env.name} className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-surface-container flex items-center justify-center">
                            <Icon icon="domain" size={8} className="text-on-surface-variant" />
                          </div>
                        )}
                        <span className="text-xs font-medium text-on-surface">{env.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="px-6 py-4 border-t border-outline-variant/10">
            <button onClick={handlePublish} disabled={!form.serviceName || !form.WhatsApp || selectedEnvs.length === 0} className="w-full primary-gradient text-white font-bold py-4 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
              Publicar Serviço
            </button>
          </div>
        )}
        </div>
      </div>

      {showMenuItemModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h4 className="font-bold text-on-surface text-lg mb-4">Adicionar Opção</h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-on-surface">Foto (opcional)</label>
                <div className="mt-1 flex items-center gap-3">
                  <label className="w-14 h-14 rounded-lg bg-surface-container-low flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary transition-colors">
                    {menuItemForm.image ? (
                      <img src={menuItemForm.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Icon icon="add_photo_alternate" size={20} className="text-primary" />
                    )}
                    <input type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const base64 = await convertToBase64(file);
                        setMenuItemForm({...menuItemForm, image: base64});
                      }
                    }} className="hidden" />
                  </label>
                  <span className="text-xs text-on-surface-variant">Clique para adicionar</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-on-surface">Nome *</label>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-xl p-3 mt-1 text-on-surface placeholder:text-on-surface-variant/60" 
                  placeholder="Ex: Marmita de Frango" 
                  value={menuItemForm.name}
                  onChange={(e) => setMenuItemForm({...menuItemForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-on-surface">Descrição</label>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-xl p-3 mt-1 text-on-surface placeholder:text-on-surface-variant/60" 
                  placeholder="Ex: Arroz, feijão, frango grelhado" 
                  value={menuItemForm.description}
                  onChange={(e) => setMenuItemForm({...menuItemForm, description: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-on-surface">Valor (R$) *</label>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-xl p-3 mt-1 text-on-surface placeholder:text-on-surface-variant/60" 
                  placeholder="25,00" 
                  value={menuItemForm.price}
                  onChange={(e) => setMenuItemForm({...menuItemForm, price: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowMenuItemModal(false)}
                className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface font-bold"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddMenuItem}
                disabled={!menuItemForm.name || !menuItemForm.price}
                className="flex-1 py-3 rounded-xl primary-gradient text-white font-bold disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

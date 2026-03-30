'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { supabase } from '@/lib/supabase';

const categories = ['Alimentação', 'Limpeza', 'Manutenção', 'Pet Sitting', 'Beleza', 'Tecnologia', 'Outros'];

function RegisterServiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams?.get('id') || null;
  const { 
    addService, 
    updateService, 
    services, 
    toggleServiceStatus, 
    user, 
    selectedEnvironment, 
    requestAffiliation 
  } = useApp();
  
  const existingService = serviceId ? services.find(s => s.id === serviceId) : null;
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: categories[0],
    WhatsApp: '',
    instagram: '',
    image: '',
  });
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  
  const [menuItems, setMenuItems] = useState<{id?: string; name: string; description: string; price: string; image?: string}[]>([]);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [menuItemForm, setMenuItemForm] = useState<{id?: string; name: string; description: string; price: string; image?: string}>({ name: '', description: '', price: '', image: '' });
  const [editingMenuItemIndex, setEditingMenuItemIndex] = useState<number | null>(null);

  useEffect(() => {
    if (existingService) {
      setForm({
        title: existingService.title || '',
        description: existingService.description || '',
        category: existingService.category || categories[0],
        WhatsApp: existingService.WhatsApp || '',
        instagram: existingService.instagram || '',
        image: existingService.image || '',
      });
      setIsActive(existingService.isActive ?? true);
      setMenuItems(existingService.menu || []);
    }
  }, [existingService]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      setErrorMsg('');
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(URL.createObjectURL(file));

      const { data, error } = await supabase.storage
        .from('zapzou')
        .upload(`services/${Date.now()}-${Math.random()}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('zapzou')
        .getPublicUrl(data.path);

      setForm({ ...form, image: publicUrl });
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl('');
    } catch (error: any) {
      setErrorMsg(
        error?.message ||
          'Falha ao enviar imagem. Configure o Storage (bucket/policies) para habilitar uploads.',
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.WhatsApp) return;
    setErrorMsg('');

    const serviceData = {
      ...form,
      WhatsApp: form.WhatsApp ? `55${form.WhatsApp}` : '',
      isActive: isActive,
      environmentId: selectedEnvironment?.id || '',
      menu: menuItems.map((item, idx) => ({ ...item, id: item.id || `menu-${Date.now()}-${idx}` })),
    };

    try {
      if (existingService) {
        await updateService(existingService.id, serviceData);
      } else {
        await addService(serviceData);
      }
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao publicar serviço. Verifique seus limites de plano ou distância do local.');
    }
  };

  const handleToggleActive = () => {
    if (existingService) {
      toggleServiceStatus(existingService.id);
      setIsActive(!isActive);
    }
  };

  const handleAddMenuItem = () => {
    if (menuItemForm.name && menuItemForm.price) {
      const newItem = { ...menuItemForm, id: menuItemForm.id || `menu-${Date.now()}` };
      if (editingMenuItemIndex !== null) {
        const updatedItems = [...menuItems];
        updatedItems[editingMenuItemIndex] = newItem;
        setMenuItems(updatedItems);
        setEditingMenuItemIndex(null);
      } else {
        setMenuItems([...menuItems, newItem]);
      }
      setMenuItemForm({ name: '', description: '', price: '', image: '' });
      setShowMenuItemModal(false);
    }
  };

  const handleRemoveMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleEditMenuItem = (index: number) => {
    const item = menuItems[index];
    setMenuItemForm({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      image: item.image || '',
    });
    setEditingMenuItemIndex(index);
    setShowMenuItemModal(true);
  };

  const handleMenuItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      setErrorMsg('');
      const { data, error } = await supabase.storage
        .from('zapzou')
        .upload(`menu-items/${Date.now()}-${Math.random()}`, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('zapzou')
        .getPublicUrl(data.path);

      setMenuItemForm({ ...menuItemForm, image: publicUrl });
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Falha ao enviar imagem do item do menu. Configure o Storage para habilitar uploads.',
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRequestAffiliation = async () => {
    if (!selectedEnvironment?.id) return;
    try {
      await requestAffiliation(selectedEnvironment.id);
    } catch(err: any) {
      setErrorMsg(err.message || 'Erro ao solicitar afiliação');
    }
  };

  // Verificações de Acesso / Moderação
  if (!mounted) return null;

  const isChurch = selectedEnvironment?.type === 'church';
  const memStatus = user?.membershipStatus; // 'active', 'pending', or null

  const isBlocked = isChurch && memStatus !== 'active';

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
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">
            {existingService ? 'Editar Serviço' : 'Cadastrar Serviço'}
          </h1>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {user?.avatar ? (
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

      <main className="pt-20 px-4 md:px-8 max-w-2xl mx-auto space-y-6">
        {selectedEnvironment && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="location_on" size={20} className="text-primary" weight={700} />
              <span className="font-semibold text-on-surface text-sm">Ambiente alvo:</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm inline-flex">
              {selectedEnvironment.image ? (
                <img src={selectedEnvironment.image} alt={selectedEnvironment.name} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center">
                  <Icon icon="domain" size={12} className="text-on-surface-variant" />
                </div>
              )}
              <span className="text-xs font-medium text-on-surface">{selectedEnvironment.name}</span>
            </div>
          </div>
        )}

        {isBlocked ? (
           <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-surface-container-low rounded-2xl">
              <Icon icon="lock" size={48} className="text-primary mb-4" />
              <h2 className="text-xl font-bold text-on-surface mb-2">Restrito para Membros</h2>
              
              {memStatus === 'pending' ? (
                 <>
                   <p className="text-on-surface-variant mb-6 text-sm">
                     Sua afiliação neste ambiente está **em análise pela liderança**. Aguarde a aprovação para publicar seus serviços.
                   </p>
                   <button className="px-6 py-3 bg-slate-200 text-slate-500 rounded-full font-bold cursor-not-allowed">
                      Aguardando Liderança
                   </button>
                 </>
              ) : (
                 <>
                   <p className="text-on-surface-variant mb-6 text-sm">
                     Criar anúncios em <b>{selectedEnvironment?.name}</b> requer afiliação na comunidade. Deseja enviar um pedido de entrada?
                   </p>
                   {errorMsg && <p className="text-error text-sm mb-4">{errorMsg}</p>}
                   <button onClick={handleRequestAffiliation} className="px-6 py-3 primary-gradient text-white rounded-full font-bold shadow-lg active:scale-95 transition-all">
                      Solicitar Afiliação
                   </button>
                 </>
              )}
           </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            {errorMsg && (
              <div className="bg-error/10 border border-error/20 p-4 rounded-xl text-error text-sm font-medium">
                <Icon icon="error" size={18} className="inline mr-2" />
                {errorMsg}
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-on-surface">Foto do Serviço</label>
              <div className="mt-2 flex items-center gap-4">
                <label className="cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="w-24 h-24 rounded-2xl bg-surface-container-lowest border-2 border-dashed border-outline-variant/30 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                    {imagePreviewUrl || form.image ? (
                      <img src={imagePreviewUrl || form.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-on-surface-variant">
                        <Icon icon="add_photo_alternate" weight={400} size={24} />
                        <span className="text-[10px]">Adicionar</span>
                      </div>
                    )}
                  </div>
                </label>
                {uploading && (
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Icon icon="cloud_upload" weight={400} size={20} className="animate-pulse" />
                    <span className="text-sm">Enviando...</span>
                  </div>
                )}
                {(imagePreviewUrl || form.image) && (
                  <button 
                    onClick={() => {
                      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                      setImagePreviewUrl('');
                      setForm({ ...form, image: '' });
                    }}
                    className="text-error text-sm font-medium"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-on-surface">Nome do Serviço</label>
              <input 
                className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60" 
                placeholder="Ex: Limpeza Residencial" 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
              />
            </div>

            <div>
              <label className="text-sm font-medium text-on-surface">Categoria</label>
              <select 
                className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface" 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-on-surface">Descrição</label>
              <textarea 
                className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60" 
                rows={4} 
                placeholder="Descreva seu serviço..." 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
              />
            </div>

            <div>
              <label className="text-sm font-medium text-on-surface">WhatsApp</label>
              <input 
                className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60" 
                placeholder="51999999999" 
                value={form.WhatsApp.replace(/^55/, '')}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '');
                  setForm({...form, WhatsApp: value});
                }}
              />
              <p className="text-xs text-on-surface-variant mt-1">Digite apenas DDD + número</p>
            </div>

            <div>
              <label className="text-sm font-medium text-on-surface">Instagram (opcional)</label>
              <input 
                className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60" 
                placeholder="@seuinstagram" 
                value={form.instagram || ''}
                onChange={e => {
                  let value = e.target.value.trim();
                  setForm({...form, instagram: value});
                }}
              />
            </div>

            {existingService && (
              <div className="bg-surface-container-lowest p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-on-surface">Serviço Ativo</p>
                    <p className="text-xs text-on-surface-variant">Quando ativado, apareça no feed de serviços</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isActive}
                      onChange={handleToggleActive}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                  </label>
                </div>
              </div>
            )}

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-on-surface">Opções / Serviços</label>
                <button 
                  type="button"
                  onClick={() => {
                    setMenuItemForm({ name: '', description: '', price: '', image: '' });
                    setEditingMenuItemIndex(null);
                    setShowMenuItemModal(true);
                  }}
                  className="text-xs text-primary font-bold"
                >
                  + Adicionar opção
                </button>
              </div>
              {menuItems.length > 0 && (
                <div className="space-y-2">
                  {menuItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-xl">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                            <Icon icon="image" size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-on-surface text-sm truncate">{item.name}</p>
                        <p className="text-xs text-on-surface-variant truncate">{item.price}</p>
                      </div>
                      <button onClick={() => handleEditMenuItem(idx)} className="p-2 text-primary">
                        <Icon icon="edit" size={18} />
                      </button>
                      <button onClick={() => handleRemoveMenuItem(idx)} className="p-2 text-error">
                        <Icon icon="delete" size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button 
              onClick={handleSubmit} 
              disabled={!form.title || !form.WhatsApp || uploading}
              className="w-full primary-gradient text-white font-bold py-4 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {existingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}
            </button>
          </div>
        )}

        {/* Modal Options */}
        {showMenuItemModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
            <div className="bg-white dark:bg-slate-900 w-full md:w-96 md:rounded-2xl p-6 rounded-t-2xl animate-in slide-in-from-bottom duration-300">
               {/* modal config omitted for brevity but intact */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-on-surface">
                  {editingMenuItemIndex !== null ? 'Editar Opção' : 'Nova Opção'}
                </h3>
                <button onClick={() => setShowMenuItemModal(false)} className="p-2">
                  <Icon icon="close" size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-on-surface">Nome *</label>
                  <input 
                    className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface" 
                    placeholder="Ex: Marmita Pequena"
                    value={menuItemForm.name}
                    onChange={(e) => setMenuItemForm({...menuItemForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface">Preço *</label>
                  <input 
                    className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface" 
                    placeholder="Ex: R$ 25"
                    value={menuItemForm.price}
                    onChange={(e) => setMenuItemForm({...menuItemForm, price: e.target.value})}
                  />
                </div>

                <button 
                  onClick={handleAddMenuItem}
                  disabled={!menuItemForm.name || !menuItemForm.price}
                  className="w-full primary-gradient text-white font-bold py-3 rounded-xl disabled:opacity-50"
                >
                  {editingMenuItemIndex !== null ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function RegisterServicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <RegisterServiceContent />
    </Suspense>
  );
}

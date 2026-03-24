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
  const { addService, updateService, services, toggleServiceStatus, user, selectedEnvironments } = useApp();
  
  const existingService = serviceId ? services.find(s => s.id === serviceId) : null;
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: categories[0],
    WhatsApp: '',
    instagram: '',
    image: '',
  });
  const [isActive, setIsActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [menuItems, setMenuItems] = useState<{id?: string; name: string; description: string; price: string; image?: string}[]>([]);

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
      setIsActive(existingService.isActive || false);
      setMenuItems(existingService.menu || []);
    }
  }, [existingService]);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [menuItemForm, setMenuItemForm] = useState<{id?: string; name: string; description: string; price: string; image?: string}>({ name: '', description: '', price: '', image: '' });
  const [editingMenuItemIndex, setEditingMenuItemIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data, error } = await supabase.storage
        .from('zapzou')
        .upload(`services/${Date.now()}-${Math.random()}`, file);

      if (error) {
        const base64 = await convertToBase64(file);
        setForm({ ...form, image: base64 });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('zapzou')
          .getPublicUrl(data.path);
        setForm({ ...form, image: publicUrl });
      }
    } catch (error) {
      const base64 = await convertToBase64(file);
      setForm({ ...form, image: base64 });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.WhatsApp) return;

    const serviceData = {
      ...form,
      WhatsApp: form.WhatsApp ? `55${form.WhatsApp}` : '',
      provider: user?.name || 'User',
      status: 'active' as const,
      isActive: isActive,
      environmentId: selectedEnvironments[0]?.id || '',
      environmentSlug: selectedEnvironments[0]?.slug || '',
      environments: selectedEnvironments.map(e => ({ id: e.id, slug: e.slug })),
      menu: menuItems.map((item, idx) => ({ ...item, id: item.id || `menu-${Date.now()}-${idx}` })),
    };

    if (existingService) {
      await updateService(existingService.id, serviceData);
    } else {
      await addService(serviceData);
    }
    
    router.push('/');
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
    const base64 = await convertToBase64(file);
    setMenuItemForm({ ...menuItemForm, image: base64 });
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
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">
            {existingService ? 'Editar Serviço' : 'Cadastrar Serviço'}
          </h1>
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

      <main className="pt-20 px-4 md:px-8 max-w-2xl mx-auto space-y-6">
        {selectedEnvironments.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="location_on" size={20} className="text-primary" weight={700} />
              <span className="font-semibold text-on-surface text-sm">Publicando em:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedEnvironments.map((env) => (
                <div key={env.id} className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
                  {env.image ? (
                    <img src={env.image} alt={env.name} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center">
                      <Icon icon="domain" size={12} className="text-on-surface-variant" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-on-surface">{env.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
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
                  {form.image ? (
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
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
              {form.image && (
                <button 
                  onClick={() => setForm({ ...form, image: '' })}
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
              placeholder="@seuinstagram ou https://instagram.com/..." 
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
            {menuItems.length === 0 && (
              <p className="text-xs text-on-surface-variant text-center py-4">Adicione opções de serviços ou itens do cardápio</p>
            )}
          </div>
        </div>
        
        <button 
          onClick={handleSubmit} 
          disabled={!form.title || !form.WhatsApp || uploading}
          className="w-full primary-gradient text-white font-bold py-4 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {existingService ? 'Salvar Alterações' : 'Cadastrar Serviço'}
        </button>

        {showMenuItemModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
            <div className="bg-white dark:bg-slate-900 w-full md:w-96 md:rounded-2xl p-6 rounded-t-2xl animate-in slide-in-from-bottom duration-300">
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
                  <label className="text-sm font-medium text-on-surface">Foto (opcional)</label>
                  <div className="mt-2 flex items-center gap-4">
                    <label className="w-16 h-16 rounded-xl bg-surface-container-low flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary transition-colors">
                      {menuItemForm.image ? (
                        <img src={menuItemForm.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Icon icon="add_photo_alternate" size={24} className="text-primary" />
                      )}
                      <input type="file" accept="image/*" onChange={handleMenuItemImageUpload} className="hidden" />
                    </label>
                    <span className="text-xs text-on-surface-variant">Clique para adicionar foto</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-on-surface">Nome *</label>
                  <input 
                    className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60" 
                    placeholder="Ex: Marmita Pequena"
                    value={menuItemForm.name}
                    onChange={(e) => setMenuItemForm({...menuItemForm, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-on-surface">Descrição</label>
                  <input 
                    className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60" 
                    placeholder="Ex: Ideal para um almoço leve"
                    value={menuItemForm.description}
                    onChange={(e) => setMenuItemForm({...menuItemForm, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-on-surface">Preço *</label>
                  <input 
                    className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60" 
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <RegisterServiceContent />
    </Suspense>
  );
}

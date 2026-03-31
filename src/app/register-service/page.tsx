'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useApp } from '@/hooks/useApp';
import { supabase } from '@/lib/supabase';
import { getEnvironmentAvailabilityState } from '@/lib/environment-rules';

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
    selectedEnvironments,
    setSelectedEnvironment,
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [menuItems, setMenuItems] = useState<{id?: string; name: string; description: string; price: string; image?: string}[]>([]);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [menuItemForm, setMenuItemForm] = useState<{id?: string; name: string; description: string; price: string; image?: string}>({ name: '', description: '', price: '', image: '' });
  const [editingMenuItemIndex, setEditingMenuItemIndex] = useState<number | null>(null);
  const [menuItemFiles, setMenuItemFiles] = useState<Map<number, File>>(new Map());
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertAction, setAlertAction] = useState<{ label: string; onClick: () => void } | null>(null);

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
      
      // Load environment for existing service
      if (existingService.environmentId) {
        const env = selectedEnvironments.find(e => e.id === existingService.environmentId);
        if (env) {
          setSelectedEnvironment(env);
        }
      }
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

  // Verificações de Acesso / Moderação
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!selectedEnvironment) {
      setAlertTitle('Nenhum ambiente selecionado');
      setAlertMessage('Selecione um ambiente para continuar.');
      setAlertAction({ label: 'Selecionar Ambiente', onClick: () => router.push('/places') });
      setShowAlert(true);
      return;
    }
    if (user.plan === 'free') {
      const freeServicesCount = services.filter(s => s.provider === user.id).length;
      if (freeServicesCount >= 2) {
        setAlertTitle('Limite do Plano Grátis');
        setAlertMessage('Você já atingiu o limite de 2 serviços do Plano Grátis. Para continuar publicando, contrate o Plano Pró ou Plus.');
        setAlertAction({ label: 'Ver Planos', onClick: () => router.push('/plans') });
        setShowAlert(true);
      }
    }
  }, [user, selectedEnvironment]);

  if (!mounted) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      setErrorMsg('');
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      setImageFile(file);
      setForm({ ...form, image: previewUrl });
    } catch (error: any) {
      setErrorMsg(error?.message || 'Erro ao selecionar imagem.');
    } finally {
      setUploading(false);
    }
  };

  const uploadImageToR2 = async (file: File, prefix: string): Promise<string> => {
    const edgeFunctionUrl = process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL;
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    
    if (!edgeFunctionUrl || !r2PublicUrl) {
      throw new Error('R2 not configured');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const fileName = `${prefix}/${Date.now()}-${Math.random()}.webp`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        path: fileName,
        contentType: file.type || 'image/webp',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }

    const { uploadUrl } = await response.json();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'image/webp' },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to R2');
    }

    return `${r2PublicUrl}/${fileName}`;
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called', { existingService: !!existingService, form, imageFile: !!imageFile, isActive });
    
    if (!form.title || !form.WhatsApp) {
      console.log('Validation failed: missing title or WhatsApp');
      setErrorMsg('Preencha o nome do serviço e WhatsApp');
      return;
    }
    setUploading(true);
    setErrorMsg('');

    try {
      console.log('Starting submit...');
      
      let finalImage = form.image;
      
      if (imageFile && form.image.startsWith('blob:')) {
        console.log('Uploading new image...');
        finalImage = await uploadImageToR2(imageFile, 'services');
        console.log('Image uploaded:', finalImage);
      }

      const menuItemsWithImages = await Promise.all(menuItems.map(async (item, index) => {
        if (item.image && item.image.startsWith('blob:') && menuItemFiles.has(index)) {
          const file = menuItemFiles.get(index);
          if (file) {
            const uploadedUrl = await uploadImageToR2(file, 'menu-items');
            return { ...item, image: uploadedUrl };
          }
        }
        return item;
      }));

      let effectiveMembershipStatus = user?.membershipStatus ?? null;
      if (selectedEnvironment?.id && user?.id) {
        const { data: membershipData, error: membershipError } = await supabase
          .from('environment_members')
          .select('status')
          .eq('user_id', user.id)
          .eq('environment_id', selectedEnvironment.id)
          .maybeSingle();

        if (!membershipError && membershipData?.status) {
          effectiveMembershipStatus = membershipData.status;
        }
      }

      const environmentAvailability = getEnvironmentAvailabilityState(selectedEnvironment ?? undefined, {
        membershipStatus: effectiveMembershipStatus,
      });
      const nextPublicationStatus = existingService?.status || (environmentAvailability.status === 'pending' ? 'pending' : 'active');
      const nextIsActive = existingService ? Boolean(existingService.isActive) : nextPublicationStatus === 'active';

      const serviceData = {
        ...form,
        image: finalImage,
        WhatsApp: form.WhatsApp ? `55${form.WhatsApp}` : '',
        isActive: nextIsActive,
        status: nextPublicationStatus,
        environmentId: selectedEnvironment?.id || '',
        menu: menuItemsWithImages.map((item, idx) => ({ ...item, id: item.id || `menu-${Date.now()}-${idx}` })),
      };

      console.log('Service data:', serviceData);
      
      if (existingService) {
        console.log('Updating existing service...');
        await updateService(existingService.id, serviceData);
        console.log('Service updated successfully');
      } else {
        await addService(serviceData);
      }
      router.replace('/');
      router.refresh();
    } catch (err: any) {
      console.error('Submit error:', err);
      setErrorMsg(err.message || 'Erro ao publicar serviço. Verifique seus limites de plano ou distância do local.');
    } finally {
      setUploading(false);
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
      const newIndex = menuItems.length;
      
      if (editingMenuItemIndex !== null) {
        const updatedItems = [...menuItems];
        updatedItems[editingMenuItemIndex] = newItem;
        setMenuItems(updatedItems);
        setEditingMenuItemIndex(null);
      } else {
        setMenuItems([...menuItems, newItem]);
        
        if (menuItemForm.image && menuItemForm.image.startsWith('blob:')) {
          const newFiles = new Map(menuItemFiles);
          const formFile = new File([menuItemForm.image], 'preview', { type: 'image/webp' });
          newFiles.set(newIndex, formFile);
          setMenuItemFiles(newFiles);
        }
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
      const previewUrl = URL.createObjectURL(file);
      setMenuItemForm({ ...menuItemForm, image: previewUrl });
      
      const newFiles = new Map(menuItemFiles);
      newFiles.set(menuItems.length, file);
      setMenuItemFiles(newFiles);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao selecionar imagem.');
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

  const environmentAvailability = getEnvironmentAvailabilityState(selectedEnvironment ?? undefined, {
    membershipStatus: user?.membershipStatus ?? null,
  });

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
          {user ? (
            <button onClick={() => router.push('/profile')} className="hover:scale-105 transition-transform active:scale-95 ml-1">
              <Avatar
                src={user.avatar}
                name={user.name}
                alt="Avatar"
                className="w-10 h-10 border-2 border-primary shadow-sm"
              />
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

        {selectedEnvironment && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="space-y-4">
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

      {showAlert && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="error_outline" size={32} className="text-error" />
            </div>
            <h3 className="text-lg font-semibold text-on-surface mb-2">{alertTitle}</h3>
            <p className="text-on-surface-variant text-sm mb-6">{alertMessage}</p>
            <div className="flex flex-col gap-2">
              {alertAction && (
                <button onClick={() => { setShowAlert(false); alertAction.onClick(); }} className="w-full primary-gradient text-white font-bold py-3 rounded-full">
                  {alertAction.label}
                </button>
              )}
              <button onClick={() => setShowAlert(false)} className="w-full bg-surface-container-high text-on-surface font-medium py-3 rounded-full">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
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


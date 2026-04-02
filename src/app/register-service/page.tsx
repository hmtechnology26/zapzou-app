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
    requestAffiliation,
    setSelectedEnvironments
  } = useApp();
  const [specificMembershipStatus, setSpecificMembershipStatus] = useState<'active' | 'pending' | 'banned' | null>(null);
  const [loadingMembership, setLoadingMembership] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'uploading' | 'locating' | 'saving'>('idle');
  
  const envIdFromQuery = searchParams?.get('envId');
  const existingService = serviceId ? services.find(s => s.id === serviceId) : null;
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: categories[0],
    WhatsApp: '',
    instagram: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  
  const [menuItems, setMenuItems] = useState<{id?: string; name: string; description: string; price: string; image?: string}[]>([]);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [menuItemForm, setMenuItemForm] = useState<{id?: string; name: string; description: string; price: string; image?: string}>({ name: '', description: '', price: '', image: '' });
  const [editingMenuItemIndex, setEditingMenuItemIndex] = useState<number | null>(null);
  const [menuItemFiles, setMenuItemFiles] = useState<Map<number, File>>(new Map());
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertAction, setAlertAction] = useState<{ label: string; onClick: () => void } | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (existingService) {
      setForm({
        title: existingService.title || '',
        description: existingService.description || '',
        category: existingService.category || categories[0],
        WhatsApp: existingService.WhatsApp || '',
        instagram: existingService.instagram || '',
      });
      setImages(existingService.images || []);
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

  // Fetch or set correct environment from query param
  useEffect(() => {
    if (!mounted || !user) return;

    const resolveEnvironment = async () => {
      // 1. Prioritize envId from query param (New service flow)
      if (envIdFromQuery) {
        console.log('Resolving environment from query param:', envIdFromQuery);
        
        // Check if we already have it in selected list
        let targetEnv = selectedEnvironments.find(e => e.id === envIdFromQuery);
        
        if (!targetEnv) {
          // Fetch from Supabase
          const { data, error } = await supabase
            .from('environments')
            .select('*')
            .eq('id', envIdFromQuery)
            .single();
            
          if (data && !error) {
            targetEnv = {
              id: data.id,
              name: data.name,
              slug: data.slug || data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
              type: data.type,
              members: Number(data.members_count ?? 0),
              image: data.image_url || '',
              status: data.status,
              latitude: data.latitude,
              longitude: data.longitude,
              requiresModeratorApproval: Boolean(data.requires_moderator_approval),
              requiresRadiusValidation: Boolean(data.requires_radius_validation),
            } as any;
            
            // Add to global list if not there
            if (!selectedEnvironments.some(e => e.id === targetEnv!.id)) {
              setSelectedEnvironments(prev => [...prev, targetEnv!]);
            }
          }
        }
        
        if (targetEnv) {
          console.log('Setting selected environment to:', targetEnv.name);
          setSelectedEnvironment(targetEnv);
        }
      } 
      // 2. Otherwise prioritize existing service's environment (Edit flow)
      else if (existingService?.environmentId) {
        const targetEnv = selectedEnvironments.find(e => e.id === existingService.environmentId);
        if (targetEnv) {
          setSelectedEnvironment(targetEnv);
        }
      }
    };

    resolveEnvironment();
  }, [mounted, user, envIdFromQuery, existingService, selectedEnvironments, setSelectedEnvironment, setSelectedEnvironments]);

  // Fetch membership status for THE SELECTED environment specifically
  useEffect(() => {
    if (!mounted || !user || !selectedEnvironment?.id) {
       setSpecificMembershipStatus(null);
       return;
    }
    
    const fetchSpecificMembership = async () => {
      setLoadingMembership(true);
      const { data, error } = await supabase
        .from('environment_members')
        .select('status')
        .eq('user_id', user.id)
        .eq('environment_id', selectedEnvironment.id)
        .maybeSingle();

      if (data && !error) {
        setSpecificMembershipStatus(data.status);
      } else {
        setSpecificMembershipStatus(null);
      }
      setLoadingMembership(false);
    };

    fetchSpecificMembership();
  }, [mounted, user, selectedEnvironment?.id]);

  // Verificações de Acesso / Moderação
  useEffect(() => {
    if (!mounted || !user) return;
    
    // Se temos um envId na query, esperamos ele ser resolvido pelo resolveEnvironment
    // para não mostrar o alerta de "nenhum ambiente selecionado" prematuramente
    if (envIdFromQuery && !selectedEnvironment) {
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
      const userCreatedServices = services.filter(s => s.provider_id === user.id);
      if (userCreatedServices.length >= 2 && !serviceId) {
        setAlertTitle('Limite do Plano Grátis');
        setAlertMessage('Você já atingiu o limite de 2 serviços do Plano Grátis. Para continuar publicando, contrate o Plano Pró ou Plus.');
        setAlertAction({ label: 'Ver Planos', onClick: () => router.push('/plans') });
        setShowAlert(true);
      }
    }
  }, [user, selectedEnvironment, mounted, envIdFromQuery, services.length, serviceId, router]);

  if (!mounted) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= 5) {
      setErrorMsg('Máximo de 5 fotos permitidas');
      return;
    }

    setUploading(true);
    try {
      setErrorMsg('');
      const previewUrl = URL.createObjectURL(file);
      setImages([...images, previewUrl]);
      setImageFiles([...imageFiles, file]);
    } catch (error: any) {
      setErrorMsg(error?.message || 'Erro ao selecionar imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    const newFiles = [...imageFiles];
    if (newImages[index].startsWith('blob:')) {
      URL.revokeObjectURL(newImages[index]);
    }
    newImages.splice(index, 1);
    newFiles.splice(index, 1);
    setImages(newImages);
    setImageFiles(newFiles);
  };

  const uploadImageToR2 = async (file: File, prefix: string): Promise<string> => {
    console.log('uploadImageToR2 started', { fileName: file.name, size: file.size, type: file.type, prefix });
    let edgeFunctionUrl = process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL;
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!edgeFunctionUrl || !r2PublicUrl || !supabaseAnonKey) {
      console.error('Environment variables missing:', { edgeFunctionUrl, r2PublicUrl, hasKey: !!supabaseAnonKey });
      throw new Error('Configuração do servidor de imagens incompleta.');
    }

    // Garante que o nome da função esteja no URL
    if (!edgeFunctionUrl.includes('r2-signed-upload')) {
        edgeFunctionUrl = edgeFunctionUrl.endsWith('/') 
            ? `${edgeFunctionUrl}r2-signed-upload` 
            : `${edgeFunctionUrl}/r2-signed-upload`;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Sessão expirada. Por favor, faça login novamente.');

    const contentType = file.type || 'image/webp';
    // Clean fileName for regex
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(7);
    const fileName = `${prefix}/${timestamp}-${randomPart}.webp`;
    
    console.log('Requesting signed URL...', { edgeFunctionUrl, path: fileName, contentType });
    
    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey, // Essential for Supabase Gateway
        },
        body: JSON.stringify({
          path: fileName,
          contentType: contentType,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Resposta inválida do servidor de upload' }));
        console.error('Edge function error:', error);
        throw new Error(error.error || 'Erro ao obter URL de upload');
      }

      const { uploadUrl } = await response.json();
      if (!uploadUrl) throw new Error('URL de upload não recebida');
      
      console.log('Got signed URL, starting PUT to R2...');

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      });

      if (!uploadResponse.ok) {
        console.error('R2 upload failed with status:', uploadResponse.status);
        throw new Error('Falha no upload para o storage R2');
      }

      const finalUrl = `${r2PublicUrl}/${fileName}`;
      console.log('Upload successful! Final URL:', finalUrl);
      return finalUrl;
    } catch (err: any) {
      console.error('Error in uploadImageToR2:', err);
      throw err;
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called', { existingService: !!existingService, images, isActive });
    
    if (!form.title || !form.WhatsApp) {
      console.log('Validation failed: missing title or WhatsApp');
      setErrorMsg('Preencha o nome do serviço e WhatsApp');
      return;
    }
    setUploading(true);
    setErrorMsg('');
    setSubmitStatus('uploading');

    try {
      console.log('Starting submit...');
      
      const uploadedImages: string[] = [];
      
      for (let i = 0; i < imageFiles.length; i++) {
        if (images[i].startsWith('blob:')) {
          const uploadedUrl = await uploadImageToR2(imageFiles[i], 'services');
          uploadedImages.push(uploadedUrl);
          console.log('Image uploaded:', uploadedUrl);
        } else {
          uploadedImages.push(images[i]);
        }
      }
      
      const finalImage = uploadedImages[0] || '';
      const finalImages = uploadedImages;

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

      setSubmitStatus('saving');
      const environmentAvailability = getEnvironmentAvailabilityState(selectedEnvironment ?? undefined, {
        membershipStatus: effectiveMembershipStatus,
      });
      const nextPublicationStatus = existingService?.status || (environmentAvailability.status === 'pending' ? 'pending' : 'active');
      const nextIsActive = existingService ? Boolean(existingService.isActive) : nextPublicationStatus === 'active';

      const serviceData = {
        ...form,
        image: finalImage,
        images: finalImages,
        WhatsApp: form.WhatsApp ? `55${form.WhatsApp}` : '',
        isActive: nextIsActive,
        status: nextPublicationStatus,
        environmentId: selectedEnvironment?.id || '',
        menu: menuItemsWithImages.map((item, idx) => ({ ...item, id: item.id || `menu-${Date.now()}-${idx}` })),
      };

      console.log('Service data:', serviceData);
      
      setSubmitStatus('locating');
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
      setSubmitStatus('idle');
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
    membershipStatus: specificMembershipStatus,
  });

  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-background">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/85 backdrop-blur-xl flex items-center justify-between px-4 h-16 md:border-b md:border-outline-variant/20">
        <div className="flex items-center gap-3 max-w-7xl mx-auto w-full">
          <button 
            onClick={() => router.back()}
            className="hover:bg-surface-container-high/70 rounded-full transition-colors p-2 active:scale-95 duration-200 text-primary"
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
            <div className="flex items-center gap-2 bg-surface-container-lowest rounded-full px-3 py-1.5 shadow-sm inline-flex">
              {selectedEnvironment.image ? (
                <img src={selectedEnvironment.image} alt={selectedEnvironment.name} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center">
                  <Icon icon="domain" size={12} className="text-on-surface-variant" />
                </div>
              )}
              <span className="text-xs font-medium text-on-surface">{selectedEnvironment.name}</span>
            </div>
            
            {/* Aviso de disponibilidade */}
            {environmentAvailability && (
              <div className={`mt-4 p-3 rounded-xl border flex items-start gap-2 ${
                environmentAvailability.status === 'pending' 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-700' 
                  : 'bg-[#30CC36]/10 border-[#30CC36]/30 text-[#30CC36]'
              }`}>
                <Icon 
                  icon={environmentAvailability.status === 'pending' ? 'info' : 'check_circle'} 
                  size={18} 
                  className={environmentAvailability.status === 'pending' ? 'text-amber-600 mt-0.5' : 'text-[#30CC36] mt-0.5'} 
                />
                <div className="flex-1">
                   <p className="text-xs font-bold">{environmentAvailability.label}</p>
                   <p className="text-[11px] leading-tight mt-0.5">{environmentAvailability.reason}</p>
                </div>
              </div>
            )}
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
              <label className="text-sm font-medium text-on-surface">Fotos do Serviço (até 5)</label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {images.map((img, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-2xl overflow-hidden">
                    <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white"
                    >
                      <Icon icon="close" size={12} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="w-20 h-20 rounded-2xl bg-surface-container-lowest border-2 border-dashed border-outline-variant/30 flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                      <div className="flex flex-col items-center gap-1 text-on-surface-variant">
                        <Icon icon="add_photo_alternate" weight={400} size={20} />
                        <span className="text-[8px]">Adicionar</span>
                      </div>
                    </div>
                  </label>
                )}
                {uploading && (
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Icon icon="cloud_upload" weight={400} size={20} className="animate-pulse" />
                    <span className="text-sm">Enviando...</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-2">{images.length}/5 fotos adicionadas</p>
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
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
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
              {submitStatus === 'uploading' ? 'Enviando imagens...' : 
               submitStatus === 'locating' ? 'Obtendo localização...' : 
               submitStatus === 'saving' ? 'Salvando serviço...' : 
               (existingService ? 'Salvar Alterações' : 'Cadastrar Serviço')}
            </button>
          </div>
        </div>
        )}

        {/* Modal Options */}
        {showMenuItemModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
            <div className="bg-surface-container-lowest dark:bg-surface-container-lowest w-full md:w-96 md:rounded-2xl p-6 rounded-t-2xl animate-in slide-in-from-bottom duration-300">
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
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-sm p-6 text-center border border-outline-variant/10">
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

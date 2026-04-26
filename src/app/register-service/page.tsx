'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useApp } from '@/hooks/useApp';
import { supabase } from '@/lib/supabase';
import { SERVICE_CATEGORIES } from '@/lib/service-categories';
import { normalizeWebsiteUrl } from '@/lib/website';
import { isPlanAtServiceLimit } from '@/lib/plan-rules';
import { formatCnpj, normalizeCnpj } from '@/lib/cnpj';

type CategoryLabel = (typeof SERVICE_CATEGORIES)[number]['label'];
const categories = SERVICE_CATEGORIES.map((category) => category.label) as CategoryLabel[];

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
    setSelectedEnvironments
  } = useApp();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'uploading' | 'saving'>('idle');
  
  const envIdFromQuery = searchParams?.get('envId');
  const existingService = serviceId ? services.find(s => s.id === serviceId) : null;
  
  const [form, setForm] = useState<{
    title: string;
    description: string;
    category: CategoryLabel;
    cnpj: string;
    WhatsApp: string;
    instagram: string;
    website: string;
  }>({
    title: '',
    description: '',
    category: categories[0],
    cnpj: '',
    WhatsApp: '',
    instagram: '',
    website: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([]);
  
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
  const hydratedServiceIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!existingService) {
      hydratedServiceIdRef.current = null;
      return;
    }

    if (hydratedServiceIdRef.current === existingService.id) {
      return;
    }

    const existingImages =
      Array.isArray(existingService.images) && existingService.images.length > 0
        ? existingService.images
        : existingService.image
          ? [existingService.image]
          : [];

    setForm({
      title: existingService.title || '',
      description: existingService.description || '',
      category: categories.includes(existingService.category as CategoryLabel)
        ? (existingService.category as CategoryLabel)
        : categories[0],
      cnpj: formatCnpj(existingService.cnpj || ''),
      WhatsApp: existingService.WhatsApp || '',
      instagram: existingService.instagram || '',
      website: existingService.website || '',
    });
    setImages(existingImages);
    setImageFiles(existingImages.map(() => null));
    setIsActive(existingService.isActive ?? true);
    setMenuItems(existingService.menu || []);
    hydratedServiceIdRef.current = existingService.id;
  }, [existingService]);

  useEffect(() => {
    if (!existingService?.environmentId) return;
    const env = selectedEnvironments.find(e => e.id === existingService.environmentId);
    if (env) {
      setSelectedEnvironment(env);
    }
  }, [existingService?.environmentId, selectedEnvironments, setSelectedEnvironment]);

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

  // Verificações de Acesso / Moderação
  useEffect(() => {
    if (!mounted || !user) return;
    
    // Se temos um envId na query, esperamos ele ser resolvido pelo resolveEnvironment
    // para não mostrar o alerta de "nenhum ambiente selecionado" prematuramente
    if (envIdFromQuery && !selectedEnvironment) {
       return;
    }

    const userCreatedServices = services.filter(s => s.provider_id === user.id);
    if (!serviceId && isPlanAtServiceLimit(user.plan, userCreatedServices.length)) {
      setAlertTitle(user.plan === 'free' ? 'Limite do Plano Grátis' : 'Limite do Plano Pró');
      setAlertMessage(
        user.plan === 'free'
          ? 'Você já atingiu o limite de 2 serviços do Plano Grátis. Para continuar publicando, contrate o Plano Pró ou Plus.'
          : 'Você já atingiu o limite de 5 serviços do Plano Pró. Para continuar publicando, faça upgrade para o Plano Plus.',
      );
      setAlertAction({ label: 'Ver Planos', onClick: () => router.push('/plans') });
      setShowAlert(true);
    }
  }, [user, selectedEnvironment, mounted, envIdFromQuery, services, serviceId, router]);

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
      setImages((prev) => [...prev, previewUrl]);
      setImageFiles((prev) => [...prev, file]);
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
      setErrorMsg('Preencha o nome do servico e WhatsApp');
      return;
    }

    if (!user) {
      setErrorMsg('Usuario nao autenticado. Faca login para continuar.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSubmitStatus('uploading');

    try {
      console.log('Starting submit...');
      
      const finalImages: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const currentImage = images[i];
        const currentFile = imageFiles[i];

        if (currentImage.startsWith('blob:')) {
          if (!currentFile) {
            continue;
          }
          const uploadedUrl = await uploadImageToR2(currentFile, 'services');
          finalImages.push(uploadedUrl);
          console.log('Image uploaded:', uploadedUrl);
        } else if (currentImage) {
          finalImages.push(currentImage);
        }
      }

      const finalImage = finalImages[0] || '';

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

      setSubmitStatus('saving');

      if (user?.plan !== 'plus' && !existingService && isPlanAtServiceLimit(user.plan, services.filter((service) => service.provider_id === user.id).length)) {
        throw new Error(
          user.plan === 'free'
            ? 'Você já atingiu o limite de 2 serviços do Plano Grátis.'
            : 'Você já atingiu o limite de 5 serviços do Plano Pró.',
        );
      }

      const nextPublicationStatus = existingService?.status || 'active';
      const nextIsActive = existingService ? Boolean(existingService.isActive) : true;

      const persistedEnvironmentId =
        typeof existingService?.environmentId === 'string' && existingService.environmentId.length > 0
          ? existingService.environmentId
          : null;

      const serviceData = {
        ...form,
        cnpj: form.cnpj || '',
        image: finalImage,
        images: finalImages,
        WhatsApp: form.WhatsApp ? `55${form.WhatsApp}` : '',
        website: normalizeWebsiteUrl(form.website),
        isActive: nextIsActive,
        status: nextPublicationStatus,
        environmentId: persistedEnvironmentId,
        menu: menuItemsWithImages.map((item, idx) => ({ ...item, id: item.id || `menu-${Date.now()}-${idx}` })),
      };

      console.log('Service data:', serviceData);
      
      setSubmitStatus('saving');
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
      setErrorMsg(err.message || 'Erro ao publicar serviço. Tente novamente em instantes.');
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
    if (menuItemForm.name.trim()) {
      const newItem = {
        ...menuItemForm,
        name: menuItemForm.name.trim(),
        description: menuItemForm.description.trim(),
        price: menuItemForm.price.trim(),
        image: menuItemForm.image || '',
        id: menuItemForm.id || `menu-${Date.now()}`,
      };
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
    setMenuItemFiles((prev) => {
      const next = new Map<number, File>();
      prev.forEach((file, key) => {
        if (key === index) return;
        next.set(key > index ? key - 1 : key, file);
      });
      return next;
    });
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
      if (menuItemForm.image?.startsWith('blob:')) {
        URL.revokeObjectURL(menuItemForm.image);
      }
      setMenuItemForm({ ...menuItemForm, image: previewUrl });
      
      const newFiles = new Map(menuItemFiles);
      newFiles.set(editingMenuItemIndex ?? menuItems.length, file);
      setMenuItemFiles(newFiles);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao selecionar imagem.');
    } finally {
      setUploading(false);
    }
  };

  const closeMenuItemModal = () => {
    const targetIndex = editingMenuItemIndex ?? menuItems.length;
    const nextFiles = new Map(menuItemFiles);
    nextFiles.delete(targetIndex);
    setMenuItemFiles(nextFiles);
    if (menuItemForm.image?.startsWith('blob:')) {
      URL.revokeObjectURL(menuItemForm.image);
    }
    setMenuItemForm({ name: '', description: '', price: '', image: '' });
    setEditingMenuItemIndex(null);
    setShowMenuItemModal(false);
  };

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
            {existingService ? 'Editar anuncio' : 'Criar anuncio'}
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

      <main className="pt-20 px-4 md:px-8 max-w-3xl mx-auto space-y-6">
        <section className="rounded-[2rem] border border-[#30cc36]/30 bg-gradient-to-br from-[#30cc36]/10 via-surface-container-lowest to-surface-container p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#30cc36]">
                Fluxo de publicação
              </p>
              <h2 className="mt-2 text-xl sm:text-2xl font-black text-on-surface">
                {existingService ? 'Atualize seu anúncio' : 'Monte seu anúncio em minutos'}
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant max-w-xl">
                Preencha os dados do servico e publique. O vinculo de ambientes e feito depois em Meus Ambientes.
              </p>
            </div>
            <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-[#30cc36]/15 items-center justify-center">
              <Icon icon="campaign" size={22} className="text-[#30cc36]" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon icon="apartment" size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Ambientes vinculados depois da criação</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Seu anuncio pode ser criado agora. Depois, vincule os ambientes em Meus Ambientes para aparecer conforme geolocalizacao.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/meus-ambientes')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-on-surface text-white px-4 py-2 text-xs font-black uppercase tracking-wide"
            >
              <Icon icon="arrow_outward" size={14} />
              Meus Ambientes
            </button>
          </div>
        </section>

        <div className="space-y-6 animate-in fade-in duration-500">
          {errorMsg && (
            <div className="bg-error/10 border border-error/20 p-4 rounded-xl text-error text-sm font-medium">
              <Icon icon="error" size={18} className="inline mr-2" />
              {errorMsg}
            </div>
          )}

          <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:p-5">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-on-surface">Mídia do anúncio</h3>
            <p className="text-xs text-on-surface-variant mt-1">Adicione ate 5 fotos para destacar seu serviço.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative w-20 h-20 rounded-2xl overflow-hidden">
                  <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
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
          </section>

          <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-on-surface">Dados do anúncio</h3>
            <div>
              <label className="text-sm font-medium text-on-surface">Nome do serviço/Empresa</label>
              <input
                className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60"
                placeholder="Ex: Limpeza Residencial ou Clean Limpezas"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-on-surface">CNPJ (Preencha para PROFISSIONAL no seu anúncio)</label>
              <input
                className="w-full bg-surface-container border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={18}
                placeholder="00.000.000/0001-00"
                value={form.cnpj}
                onChange={(e) => {
                  const digits = normalizeCnpj(e.target.value);
                  setForm((prev) => ({ ...prev, cnpj: formatCnpj(digits) }));
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-on-surface">Categoria</label>
              <select
                className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value as CategoryLabel})}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-on-surface">Descricao</label>
              <textarea
                className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60"
                rows={4}
                placeholder="Descreva seu servico..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-on-surface">Contato</h3>
            <div>
              <label className="text-sm font-medium text-on-surface">WhatsApp (obrigatorio)</label>
              <input
                className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60"
                placeholder="51999999999"
                value={form.WhatsApp.replace(/^55/, '')}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '');
                  setForm({...form, WhatsApp: value});
                }}
              />
              <p className="text-xs text-on-surface-variant mt-1">Digite apenas DDD + numero</p>
            </div>

            <div>
              <label className="text-sm font-medium text-on-surface">Instagram (opcional)</label>
              <input
                className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60"
                placeholder="@seuinstagram"
                value={form.instagram || ''}
                onChange={e => {
                  const value = e.target.value.trim();
                  setForm({...form, instagram: value});
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-on-surface">Site da empresa (opcional)</label>
              <input
                className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface placeholder:text-on-surface-variant/60"
                placeholder="https://seusite.com ou seusite.com"
                value={form.website || ''}
                onChange={e => setForm({...form, website: e.target.value.trim()})}
              />
            </div>
          </section>

          {existingService && (
            <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-on-surface">Anuncio ativo</p>
                  <p className="text-xs text-on-surface-variant">Quando ativado, aparece no feed de servicos.</p>
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
            </section>
          )}

          <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-on-surface">Opcoes / servicos</label>
              <button
                type="button"
                onClick={() => {
                  setMenuItemForm({ name: '', description: '', price: '', image: '' });
                  setEditingMenuItemIndex(null);
                  setShowMenuItemModal(true);
                }}
                className="text-xs text-primary font-bold"
              >
                + Adicionar opcao
              </button>
            </div>
            {menuItems.length > 0 && (
              <div className="space-y-2">
                {menuItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-xl">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                          <Icon icon="image" size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-on-surface text-sm truncate">{item.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{item.price || 'Sem valor'}</p>
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
          </section>

          <button
            onClick={handleSubmit}
            disabled={!form.title || !form.WhatsApp || uploading}
            className="w-full primary-gradient text-white font-bold py-4 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitStatus === 'uploading' ?
              'Enviando imagens...' :
              submitStatus === 'saving' ?
                'Salvando anuncio...' :
                (existingService ? 'Salvar alteracoes' : 'Publicar anuncio')
            }
          </button>
        </div>

        {/* Modal Options */}
        {showMenuItemModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
            <div className="bg-surface-container-lowest dark:bg-surface-container-lowest w-full md:w-96 md:rounded-2xl p-6 rounded-t-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-on-surface">
                  {editingMenuItemIndex !== null ? 'Editar Opção' : 'Nova Opção'}
                </h3>
                <button onClick={closeMenuItemModal} className="p-2">
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
                  <label className="text-sm font-medium text-on-surface">Preço (opcional)</label>
                  <input 
                    className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface" 
                    placeholder="Ex: R$ 25"
                    value={menuItemForm.price}
                    onChange={(e) => setMenuItemForm({...menuItemForm, price: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-on-surface">Imagem da opção</label>
                  <div className="mt-2 rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-lowest p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-high flex items-center justify-center flex-shrink-0">
                        {menuItemForm.image ? (
                          <img
                            src={menuItemForm.image}
                            alt={menuItemForm.name || 'Prévia da opção'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <Icon icon="image" size={24} className="text-on-surface-variant/40" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-on-surface">1 imagem por opção</p>
                        <p className="text-xs text-on-surface-variant">A imagem é opcional e substitui a anterior ao selecionar outra.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer active:scale-95 transition-transform">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleMenuItemImageUpload}
                        />
                        {menuItemForm.image ? 'Trocar imagem' : 'Adicionar imagem'}
                      </label>
                      {menuItemForm.image && (
                        <button
                          type="button"
                          onClick={() => {
                            const targetIndex = editingMenuItemIndex ?? menuItems.length;
                            const nextFiles = new Map(menuItemFiles);
                            nextFiles.delete(targetIndex);
                            setMenuItemFiles(nextFiles);
                            if (menuItemForm.image?.startsWith('blob:')) {
                              URL.revokeObjectURL(menuItemForm.image);
                            }
                            setMenuItemForm({ ...menuItemForm, image: '' });
                          }}
                          className="px-4 py-2 rounded-xl border border-outline-variant/20 text-on-surface text-xs font-bold"
                        >
                          Remover imagem
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAddMenuItem}
                  disabled={!menuItemForm.name.trim()}
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


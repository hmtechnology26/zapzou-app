'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { usePublishModal } from '@/contexts/PublishModalContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { searchPlaces, type PlaceSearchResult } from '@/lib/maps';
import type { Environment } from '@/types';

const serviceCategories = ['Alimentação', 'Limpeza', 'Manutenção', 'Pet Sitting', 'Beleza', 'Tecnologia', 'Outros'];

export function PublishModal() {
  const router = useRouter();
  const { isOpen, close } = usePublishModal();
  const { user, selectedEnvironment, services, addService, selectedEnvironments, setSelectedEnvironments, requestAffiliation } = useApp();
  
  const [step, setStep] = useState<'search' | 'form'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  
  const [form, setForm] = useState({
    serviceName: '',
    category: serviceCategories[0],
    description: '',
    WhatsApp: '',
    instagram: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [menuItems, setMenuItems] = useState<{name: string; description: string; price: string; image?: string}[]>([]);
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [menuItemForm, setMenuItemForm] = useState<{name: string; description: string; price: string; image?: string}>({ name: '', description: '', price: '', image: '' });
  const [errorMsg, setErrorMsg] = useState('');
  
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertAction, setAlertAction] = useState<{ label: string; onClick: () => void } | null>(null);
  
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null);
  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (!user) {
        close();
        router.push('/login');
        return;
      }
      if (user.plan === 'free') {
        const freeServicesCount = services.filter(s => s.provider === user.id).length;
        if (freeServicesCount >= 2) {
          close();
          setAlertTitle('Limite do Plano Grátis');
          setAlertMessage('Você já atingiu o limite de 2 serviços do Plano Grátis. Para continuar publicando, contrate o Plano Pró ou Plus.');
          setAlertAction({ label: 'Ver Planos', onClick: () => router.push('/plans') });
          setShowAlert(true);
          return;
        }
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          },
          () => {}
        );
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchLoading(true);
      setHasSearched(true);
      try {
        const results = await searchPlaces(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const mapPrimaryTypeToEnvType = (primaryType: string): string => {
    const typeMap: Record<string, string> = {
      church: 'church',
      condominium_complex: 'residential',
      apartment_building: 'residential',
      apartment_complex: 'residential',
      housing_complex: 'residential',
      shopping_mall: 'club'
    };
    return typeMap[primaryType] || 'residential';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      residential: 'Residencial',
      church: 'Igreja',
      club: 'Clube',
      association: 'Associação',
      apartment_building: 'Prédio',
      condominium_complex: 'Condomínio',
      shopping_mall: 'Shopping'
    };
    return labels[type] || type;
  };

  const handleSelectPlace = async (place: PlaceSearchResult) => {
    setSelectedPlace(place);
    setUploading(true);
    setErrorMsg('');

    try {
      const placeType = mapPrimaryTypeToEnvType(place.primaryType);
      const isChurchType = placeType === 'church';

      const { data: existingEnv, error: fetchError } = await supabase
        .from('environments')
        .select('id')
        .eq('google_place_id', place.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let envId = existingEnv?.id;

      if (!envId) {
        const slug = place.displayName?.text?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || place.id;
        
        const { data: newEnv, error: insertError } = await supabase
          .from('environments')
          .insert({
            name: place.displayName?.text || 'Novo Local',
            slug: slug,
            type: placeType,
            status: 'active',
            google_place_id: place.id,
            latitude: place.location?.latitude,
            longitude: place.location?.longitude,
            address: place.formattedAddress,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        envId = newEnv.id;
      }

      const membershipStatus = isChurchType ? 'pending' : 'active';

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error: memberError } = await supabase
        .from('environment_members')
        .upsert({
          environment_id: envId,
          user_id: user.id,
          status: membershipStatus,
          role: 'member'
        }, { onConflict: 'environment_id,user_id' });

      if (memberError) throw memberError;

      const newEnv = {
        id: envId,
        slug: place.displayName?.text?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || place.id,
        name: place.displayName?.text || '',
        type: placeType,
        members: 1,
        image: '',
        latitude: place.location?.latitude,
        longitude: place.location?.longitude,
        status: 'active',
      } as Environment & { membershipStatus: 'active' | 'pending' };

      const envExists = selectedEnvironments.find(e => e.id === envId);
      if (!envExists) {
        setSelectedEnvironments([...selectedEnvironments, newEnv]);
      }

      setActiveEnvId(envId);

      if (isChurchType) {
        setAlertTitle('Afiliação Solicitada');
        setAlertMessage(`Sua solicitação de afiliação em ${place.displayName?.text} está em análise. Você será notificado quando for aprovado.`);
        setAlertAction({ label: 'Aguardar', onClick: () => {
          setShowAlert(false);
          close();
        }});
        setShowAlert(true);
      } else {
        setStep('form');
      }
    } catch (err: any) {
      console.error('Error selecting place:', err);
      setErrorMsg(err.message || 'Erro ao selecionar local. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setStep('search');
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
      setSelectedPlace(null);
      setActiveEnvId(null);
      setForm({ serviceName: '', category: serviceCategories[0], description: '', WhatsApp: '', instagram: '' });
      setImages([]);
      setImageFiles([]);
      setMenuItems([]);
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || images.length >= 5) return;
    setUploading(true);
    try {
      setErrorMsg('');
      const previewUrl = URL.createObjectURL(file);
      setImages([...images, previewUrl]);
      setImageFiles([...imageFiles, file]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao selecionar imagem.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    if (images[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(images[index]);
    }
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const uploadImagesToR2 = async (files: File[], prefix: string): Promise<string[]> => {
    console.log('uploadImagesToR2 started', { files: files.length, prefix });
    const edgeFunctionUrl = process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL;
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    
    if (!edgeFunctionUrl || !r2PublicUrl) {
      throw new Error('R2 não configurado. Contate o administrador.');
    }

    console.log('Getting session...');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');
    console.log('Session obtained');

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Uploading file ${i + 1}/${files.length}:`, file.name);
      const fileName = `${prefix}/${Date.now()}-${Math.random()}.webp`;
      
      try {
        console.log('Fetching signed URL...');
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

        console.log('Signed URL response:', response.status);
        if (!response.ok) {
          const error = await response.json();
          console.error('Error getting signed URL:', error);
          throw new Error(error.error || 'Erro ao obter URL de upload');
        }

        const { uploadUrl } = await response.json();
        console.log('Got upload URL, uploading...');

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'image/webp' },
          body: file,
        });

        console.log('Upload response:', uploadResponse.status);
        if (!uploadResponse.ok) {
          throw new Error('Falha ao fazer upload da imagem');
        }

        const url = `${r2PublicUrl}/${fileName}`;
        console.log('Uploaded URL:', url);
        uploadedUrls.push(url);
      } catch (err: any) {
        console.error('Upload error:', err);
        throw err;
      }
    }

    console.log('All uploads complete:', uploadedUrls);
    return uploadedUrls;
  };

  const handlePublish = async () => {
    console.log('handlePublish started', { form, activeEnvId, imageFiles });
    
    if (!form.serviceName || !form.WhatsApp || !activeEnvId) {
      console.log('Validation failed', { serviceName: !!form.serviceName, WhatsApp: !!form.WhatsApp, activeEnvId: !!activeEnvId });
      setErrorMsg('Preencha o nome do serviço e WhatsApp');
      return;
    }
    setUploading(true);
    setErrorMsg('');

    try {
      console.log('Starting publish...');
      
      let finalImages = [...images];
      
      const filesToUpload = imageFiles.filter((f): f is File => f instanceof File);
      console.log('Files to upload:', filesToUpload.length);
      
      if (filesToUpload.length > 0) {
        console.log('Uploading images...');
        const uploadedUrls = await uploadImagesToR2(filesToUpload, 'services');
        console.log('Uploaded URLs:', uploadedUrls);
        const blobIndices = images.map((img, i) => img.startsWith('blob:') ? i : -1).filter(i => i >= 0);
        finalImages = images.map((img, i) => {
          if (img.startsWith('blob:') && blobIndices.includes(i)) {
            const idx = blobIndices.indexOf(i);
            return uploadedUrls[idx] || '';
          }
          return img;
        });
      }

      const newService = {
        title: form.serviceName,
        description: form.description,
        category: form.category,
        image: finalImages[0] || '',
        images: finalImages,
        WhatsApp: form.WhatsApp ? `55${form.WhatsApp}` : '',
        instagram: form.instagram,
        status: 'active',
        environmentId: activeEnvId,
        menu: menuItems.map((item, idx) => ({ ...item, id: `menu-${Date.now()}-${idx}` })),
      };

      console.log('Adding service:', newService);
      await addService(newService);
      console.log('Service added successfully');
      setImages([]);
      setImageFiles([]);
      close();
      router.push('/');
    } catch(err: any) {
      console.error('Publish error:', err);
      setErrorMsg(err.message || 'Erro ao publicar serviço.');
    } finally {
      setUploading(false);
    }
  };

  const addMenuItem = () => {
    if (menuItemForm.name && menuItemForm.price) {
      setMenuItems([...menuItems, { ...menuItemForm }]);
      setMenuItemForm({ name: '', description: '', price: '', image: '' });
      setShowMenuItemModal(false);
    }
  };

  if (!isOpen) return null;

  const currentEnv = selectedEnvironments.find(e => e.id === activeEnvId);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
            <div className="flex items-center gap-3">
              {step === 'form' && (
                <button onClick={() => setStep('search')} className="p-1 -ml-1">
                  <Icon icon="arrow_back" size={24} />
                </button>
              )}
              <h3 className="font-bold text-on-surface text-lg">
                {step === 'search' ? 'Encontrar Local' : 'Novo Serviço'}
              </h3>
            </div>
            <button onClick={close} className="p-2 rounded-full hover:bg-surface-container-low">
              <Icon icon="close" size={24} />
            </button>
          </div>

          {step === 'form' && currentEnv && (
            <div className="px-6 py-3 bg-surface-container-lowest border-b border-outline-variant/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                <Icon icon="domain" size={20} className="text-on-surface-variant" />
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Publicando em</p>
                <p className="font-semibold text-on-surface text-sm">{currentEnv.name}</p>
              </div>
            </div>
          )}

          {step === 'search' ? (
            <div className="flex-1 flex flex-col min-h-0 p-6">
              <div className="relative mb-4">
                <Icon icon="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Buscar condomínio, igreja, prédio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container-highest rounded-full py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                  </div>
                )}
              </div>

              {uploading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                  <span className="ml-3 text-on-surface-variant">Processando...</span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-error/10 border border-error/20 p-3 rounded-xl text-error text-sm mb-4">
                  {errorMsg}
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-2">
                {hasSearched && searchResults.map((place) => {
                  const distance = userLocation && place.location
                    ? calculateDistance(userLocation.lat, userLocation.lng, place.location.latitude, place.location.longitude)
                    : null;
                  
                  return (
                    <div
                      key={place.id}
                      onClick={() => handleSelectPlace(place)}
                      className="flex items-center p-4 rounded-xl cursor-pointer bg-surface-container-lowest hover:bg-surface-container-low border border-transparent hover:border-outline-variant/20 transition-all active:scale-[0.98]"
                    >
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mr-3">
                        <Icon icon="location_on" size={24} className="text-on-surface-variant" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-on-surface">{place.displayName?.text}</p>
                        <p className="text-xs text-on-surface-variant">
                          {getTypeLabel(place.primaryType)}
                          {distance !== null && (
                            <span className="text-primary font-medium"> • {distance.toFixed(1)}km</span>
                          )}
                        </p>
                      </div>
                      <Icon icon="add_circle" size={24} className="text-primary" />
                    </div>
                  );
                })}

                {hasSearched && searchResults.length === 0 && !searchLoading && (
                  <div className="text-center py-8 opacity-50">
                    <Icon icon="search_off" size={32} className="mx-auto mb-2 text-outline" />
                    <p className="text-sm">Nenhum local encontrado</p>
                  </div>
                )}

                {!hasSearched && (
                  <div className="text-center py-8 opacity-50">
                    <Icon icon="search" size={32} className="mx-auto mb-2 text-outline" />
                    <p className="text-sm">Busque por um local para publicar</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {errorMsg && (
                <div className="bg-error/10 border border-error/20 p-4 rounded-xl text-error text-sm font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-on-surface">Nome do Serviço *</label>
                <input 
                  className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface" 
                  placeholder="Ex: Faxineira Maria"
                  value={form.serviceName}
                  onChange={(e) => setForm({...form, serviceName: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface">Categoria</label>
                <select 
                  className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface"
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                >
                  {serviceCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface">Descrição</label>
                <textarea 
                  className="w-full bg-surface-container-lowest border-none rounded-xl p-4 mt-2 text-on-surface min-h-[100px]" 
                  placeholder="Descreva seu serviço..."
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                />
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
                  onChange={(e) => setForm({...form, instagram: e.target.value.trim()})}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface">Fotos (até 5)</label>
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img src={img} alt="" className="w-20 h-20 rounded-xl object-cover" />
                      <button 
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-error text-white rounded-full p-1"
                      >
                        <Icon icon="close" size={12} />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-outline-variant flex items-center justify-center cursor-pointer flex-shrink-0">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <Icon icon="add_photo_alternate" size={24} className="text-on-surface-variant" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {step === 'form' && (
          <div className="px-6 py-4 border-t border-outline-variant/10">
            <button 
              onClick={handlePublish} 
              disabled={!form.serviceName || !form.WhatsApp || uploading}
              className="w-full primary-gradient text-white font-bold py-4 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Publicando...
                </>
              ) : (
                <>
                  Publicar Serviço
                  <Icon icon="send" size={20} />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {showAlert && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="info" size={32} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-on-surface mb-2">{alertTitle}</h3>
            <p className="text-on-surface-variant text-sm mb-6">{alertMessage}</p>
            {alertAction && (
              <button onClick={() => { setShowAlert(false); alertAction.onClick(); }} className="w-full primary-gradient text-white font-bold py-3 rounded-full">
                {alertAction.label}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useApp } from '@/hooks/useApp';
import { usePublishModal } from '@/contexts/PublishModalContext';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  AUTO_APPROVAL_RADIUS_KM,
  calculateDistanceKm,
  inferEnvironmentTypeFromPlace,
  inferEnvironmentValidationFlagsFromPlace,
  isWithinAutoApprovalRadius,
  resolveEnvironmentAccessDecision,
} from '@/lib/environment-rules';
import { searchPlaces, type PlaceSearchResult } from '@/lib/maps';
import type { Environment } from '@/types';

const serviceCategories = ['Alimentação', 'Limpeza', 'Manutenção', 'Pet Sitting', 'Beleza', 'Tecnologia', 'Outros'];

export function PublishModal() {
  const router = useRouter();
  const { isOpen, close } = usePublishModal();
  const { user, services, addService, selectedEnvironments, setSelectedEnvironments, setSelectedEnvironment } = useApp();
  
  const [step, setStep] = useState<'search' | 'radius' | 'moderator' | 'form'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [selectedPlaceDistanceKm, setSelectedPlaceDistanceKm] = useState<number | null>(null);
  const [selectedPlaceDecision, setSelectedPlaceDecision] = useState<ReturnType<typeof resolveEnvironmentAccessDecision> | null>(null);
  const [selectedEnvironmentRecord, setSelectedEnvironmentRecord] = useState<Environment | null>(null);
  
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

  const ensureCurrentLocation = useCallback(async () => {
    if (userLocation) {
      return userLocation;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      throw new Error('Geolocalização indisponível neste dispositivo.');
    }

    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(nextLocation);
          resolve(nextLocation);
        },
        (error) => reject(new Error(error.message || 'Falha ao obter sua localização.')),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  }, [userLocation]);

  const syncEnvironmentMembership = useCallback(
    async (envId: string, status: 'active' | 'pending') => {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('environment_members')
        .upsert(
          {
            environment_id: envId,
            user_id: user.id,
            status,
            role: 'member',
          },
          { onConflict: 'environment_id,user_id' },
        );

      if (error) {
        throw error;
      }
    },
    [user],
  );

  const getEnvironmentMembershipStatus = useCallback(async (envId: string) => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('environment_members')
      .select('status')
      .eq('user_id', user.id)
      .eq('environment_id', envId)
      .maybeSingle();

    if (error) {
      console.warn('getEnvironmentMembershipStatus failed:', error);
      return null;
    }

    return data?.status ?? null;
  }, [user?.id]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      residential: 'Residencial',
      church: 'Igreja',
      place_of_worship: 'Igreja',
      cathedral: 'Catedral',
      chapel: 'Capela',
      temple: 'Templo',
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
    setSelectedPlaceDistanceKm(null);
    setSelectedPlaceDecision(null);

    try {
      const inferredType = inferEnvironmentTypeFromPlace(place.primaryType);
      const inferredFlags = inferEnvironmentValidationFlagsFromPlace(place.primaryType);

      const { data: existingEnv, error: fetchError } = await supabase
        .from('environments')
        .select('*')
        .eq('google_place_id', place.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      let envRecord = existingEnv;

      if (!envRecord) {
        const slug = place.displayName?.text?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || place.id;

        const baseInsertPayload = {
          name: place.displayName?.text || 'Novo Local',
          slug,
          type: inferredType,
          status: 'active',
          google_place_id: place.id,
          latitude: place.location?.latitude,
          longitude: place.location?.longitude,
          address: place.formattedAddress,
        };

        const insertWithFlags = {
          ...baseInsertPayload,
          requires_moderator_approval: inferredFlags.requiresModeratorApproval,
          requires_radius_validation: inferredFlags.requiresRadiusValidation,
        };

        const firstInsert = await supabase
          .from('environments')
          .insert(insertWithFlags)
          .select('*')
          .single();

        if (firstInsert.error) {
          if (firstInsert.error.code === '42703') {
            const retryInsert = await supabase
              .from('environments')
              .insert(baseInsertPayload)
              .select('*')
              .single();

            if (retryInsert.error) {
              throw retryInsert.error;
            }

            envRecord = retryInsert.data;
          } else {
            throw firstInsert.error;
          }
        } else {
          envRecord = firstInsert.data;
        }
      }

      const decision = resolveEnvironmentAccessDecision({
        type: (envRecord.type as Environment['type']) || inferredType,
        requiresModeratorApproval:
          envRecord.requires_moderator_approval ?? inferredFlags.requiresModeratorApproval,
        requiresRadiusValidation:
          envRecord.requires_radius_validation ?? inferredFlags.requiresRadiusValidation,
      });

      const membershipStatusPromise = getEnvironmentMembershipStatus(envRecord.id);

      const normalizedEnvironment: Environment = {
        id: envRecord.id,
        slug: envRecord.slug || place.displayName?.text?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || place.id,
        name: envRecord.name || place.displayName?.text || '',
        type: (envRecord.type as Environment['type']) || inferredType,
        members: 1,
        image: '',
        latitude: envRecord.latitude ?? place.location?.latitude,
        longitude: envRecord.longitude ?? place.location?.longitude,
        status: envRecord.status ?? 'active',
        requiresModeratorApproval: decision.requiresModeratorApproval,
        requiresRadiusValidation: decision.requiresRadiusValidation,
      };

      setSelectedPlaceDecision(decision);
      setSelectedEnvironmentRecord(normalizedEnvironment);
      setSelectedEnvironments((prev) => {
        const filtered = prev.filter((env) => env.id !== normalizedEnvironment.id);
        return [normalizedEnvironment, ...filtered];
      });

      if (decision.mode === 'moderator') {
        setActiveEnvId(null);
        setStep('moderator');
        setUploading(false);

        void membershipStatusPromise.then((membershipStatus) => {
          if (membershipStatus === 'active') {
            setSelectedPlaceDecision({
              ...decision,
              mode: 'open',
            });
            setActiveEnvId(normalizedEnvironment.id);
            setSelectedEnvironment(normalizedEnvironment);
            setStep('form');
          }
        });
        return;
      }

      const membershipStatus = await membershipStatusPromise;
      const effectiveDecision =
        membershipStatus === 'active'
          ? {
              ...decision,
              mode: 'open' as const,
            }
          : decision;

      if (effectiveDecision.mode === 'radius') {
        const distance = userLocation && place.location
          ? calculateDistanceKm(
              userLocation.lat,
              userLocation.lng,
              place.location.latitude,
              place.location.longitude,
            )
          : null;

        setSelectedPlaceDistanceKm(distance);

        if (isWithinAutoApprovalRadius(distance)) {
          await syncEnvironmentMembership(normalizedEnvironment.id, 'active');
          setActiveEnvId(normalizedEnvironment.id);
          setSelectedEnvironment(normalizedEnvironment);
          setStep('form');
          return;
        }

        if (!userLocation) {
          setErrorMsg('Ative a localização para validar o raio de 500m.');
        }
        setActiveEnvId(null);
        setStep('radius');
        return;
      }

      await syncEnvironmentMembership(normalizedEnvironment.id, 'active');
      setActiveEnvId(normalizedEnvironment.id);
      setSelectedEnvironment(normalizedEnvironment);
      setStep('form');
    } catch (err: any) {
      console.error('Error selecting place:', err);
      setErrorMsg(err.message || 'Erro ao selecionar local. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleRequestModeratorApproval = async () => {
    if (!selectedEnvironmentRecord) {
      setErrorMsg('Selecione um ambiente antes de solicitar aprovação.');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      await syncEnvironmentMembership(selectedEnvironmentRecord.id, 'pending');
      setAlertTitle('Aprovação solicitada');
      setAlertMessage(`Sua solicitação para publicar em ${selectedEnvironmentRecord.name} foi enviada para o moderador.`);
      setAlertAction({
        label: 'Entendi',
        onClick: () => {
          setShowAlert(false);
          close();
        },
      });
      setShowAlert(true);
    } catch (error: any) {
      console.error('Error requesting moderator approval:', error);
      setErrorMsg(error?.message || 'Não foi possível solicitar a aprovação do moderador.');
    } finally {
      setUploading(false);
    }
  };

  const handleValidateRadius = async () => {
    if (!selectedEnvironmentRecord) {
      setErrorMsg('Selecione um ambiente antes de validar o raio.');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      const currentLocation = await ensureCurrentLocation();

      if (
        typeof selectedEnvironmentRecord.latitude !== 'number' ||
        typeof selectedEnvironmentRecord.longitude !== 'number'
      ) {
        throw new Error('Este ambiente não possui coordenadas para validação.');
      }

      const distance = calculateDistanceKm(
        currentLocation.lat,
        currentLocation.lng,
        selectedEnvironmentRecord.latitude,
        selectedEnvironmentRecord.longitude,
      );

      setSelectedPlaceDistanceKm(distance);

      if (!isWithinAutoApprovalRadius(distance)) {
        setStep('radius');
        setErrorMsg(
          `Você precisa estar dentro de ${AUTO_APPROVAL_RADIUS_KM * 1000}m para publicar neste ambiente.`,
        );
        return;
      }

      await syncEnvironmentMembership(selectedEnvironmentRecord.id, 'active');
      setActiveEnvId(selectedEnvironmentRecord.id);
      setSelectedEnvironment(selectedEnvironmentRecord);
      setStep('form');
    } catch (error: any) {
      console.error('Error validating radius:', error);
      setErrorMsg(error?.message || 'Não foi possível validar sua localização.');
      setStep('radius');
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
      setSelectedEnvironmentRecord(null);
      setSelectedPlaceDistanceKm(null);
      setSelectedPlaceDecision(null);
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
    let edgeFunctionUrl = process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL;
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    
    if (!edgeFunctionUrl || !r2PublicUrl) {
      console.error('Environment variables missing:', { edgeFunctionUrl, r2PublicUrl });
      throw new Error('R2 não configurado. Contate o administrador.');
    }

    // Garante que o nome da função esteja no URL
    if (!edgeFunctionUrl.includes('r2-signed-upload')) {
        edgeFunctionUrl = edgeFunctionUrl.endsWith('/') 
            ? `${edgeFunctionUrl}r2-signed-upload` 
            : `${edgeFunctionUrl}/r2-signed-upload`;
        console.log('Appended function name to URL:', edgeFunctionUrl);
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
        console.log('Fetching signed URL for:', fileName);
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

        console.log('Signed URL response status:', response.status);
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Invalid JSON response' }));
          console.error('Error getting signed URL:', error);
          throw new Error(error.error || 'Erro ao obter URL de upload');
        }

        const { uploadUrl } = await response.json();
        console.log('Got upload URL, starting R2 PUT...');

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'image/webp' },
          body: file,
        });

        console.log('Upload response status:', uploadResponse.status);
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text().catch(() => 'No error body');
          console.error('R2 upload failed:', errorText);
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
      router.replace('/');
      router.refresh();
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

  const currentEnv = selectedEnvironments.find(e => e.id === activeEnvId) || selectedEnvironmentRecord;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full md:max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
            <div className="flex items-center gap-3">
              {step !== 'search' && (
                <button
                  onClick={() => {
                    setStep('search');
                    setActiveEnvId(null);
                    setSelectedEnvironmentRecord(null);
                    setSelectedPlaceDistanceKm(null);
                    setSelectedPlaceDecision(null);
                    setErrorMsg('');
                  }}
                  className="p-1 -ml-1"
                >
                  <Icon icon="arrow_back" size={24} />
                </button>
              )}
              <h3 className="font-bold text-on-surface text-lg">
                {step === 'form' ? 'Novo Serviço' : 'Encontrar Local'}
              </h3>
            </div>
            <button onClick={close} className="p-2 rounded-full hover:bg-surface-container-low">
              <Icon icon="close" size={24} />
            </button>
          </div>

          {step !== 'search' && currentEnv && (
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
                    ? calculateDistanceKm(userLocation.lat, userLocation.lng, place.location.latitude, place.location.longitude)
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
          ) : step === 'form' ? (
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
          ) : (
            <div className="flex-1 overflow-y-auto p-6 -mt-12">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex flex-row items-center gap-2">
                    <Icon icon={step === 'radius' ? 'location_on' : 'admin_panel_settings'} size={36} className="text-primary mt-10" />
                    <h4 className="text-2xl mt-10 font-black tracking-tight text-on-surface">
                  {step === 'radius' ? 'Validação de Raio' : 'Aprovação Necessária'}
                </h4>
                </div>
                <p className="mt-3 max-w-sm text-sm leading-6 text-on-surface-variant">
                  {step === 'radius'
                    ? 'Estamos verificando sua proximidade com o local selecionado. Você precisa estar dentro de 500m para publicar neste ambiente.'
                    : 'Este ambiente exige aprovação do moderador antes que a opção de publicar seja liberada.'}
                </p>
                {selectedPlaceDecision && (
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.25em] text-primary/70">
                    {selectedPlaceDecision.mode === 'moderator'
                      ? ''
                      : selectedPlaceDecision.mode === 'radius'
                        ? 'Validação por raio'
                        : 'Acesso livre'}
                  </p>
                )}
                {selectedPlaceDistanceKm !== null && step === 'radius' && (
                  <p className="mt-3 rounded-full bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface">
                    Distância atual: {selectedPlaceDistanceKm.toFixed(2)}km
                  </p>
                )}
                {errorMsg && (
                  <div className="mt-4 rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                    {errorMsg}
                  </div>
                )}
                <button
                  onClick={step === 'radius' ? handleValidateRadius : handleRequestModeratorApproval}
                  disabled={uploading}
                  className="mt-8 w-full max-w-sm rounded-full bg-primary px-5 py-4 font-bold text-white shadow-lg shadow-primary/20 transition active:scale-[0.98] disabled:opacity-60"
                >
                  {uploading
                    ? 'Processando...'
                    : step === 'radius'
                      ? 'Requisitar Validação'
                      : 'Requisitar Aprovação'}
                </button>
                
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

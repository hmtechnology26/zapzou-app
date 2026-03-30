'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Service, Environment, Member } from '../types';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  plan?: 'free' | 'pro' | 'plus';
  membershipStatus?: 'active' | 'pending' | 'banned' | null;
  membershipRole?: 'member' | 'moderator' | null;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  selectedEnvironments: Environment[];
  setSelectedEnvironments: React.Dispatch<React.SetStateAction<Environment[]>>;
  selectedEnvironment: Environment | null;
  setSelectedEnvironment: (env: Environment | null) => void;
  updateEnvironment: (id: string, updates: Partial<Environment>) => void;
  services: Service[];
  toggleServiceStatus: (id: string) => Promise<void>;
  addService: (service: any) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  approveService: (id: string) => Promise<void>;
  rejectService: (id: string) => Promise<void>;
  members: Member[];
  rateService: (id: string, stars: number, comment?: string) => Promise<void>;
  loading: boolean;
  requestAffiliation: (envId: string) => Promise<void>;
  refreshMembership: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEnvironments, setSelectedEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        setUser(prev => ({
          ...prev,
          id: userId,
          name: data.name || 'Usuário',
          email: email,
          avatar: data.avatar || '',
          role: data.role === 'moderator' ? 'admin' : 'user',
          plan: data.plan || 'free',
          membershipStatus: prev?.membershipStatus || null,
          membershipRole: prev?.membershipRole || null
        }));
      } else {
        // Se a tabela users estiver bloqueada, usa dados básicos do auth
        setUser({
          id: userId,
          name: 'Usuário',
          email: email,
          avatar: '',
          role: 'user',
          plan: 'free',
          membershipStatus: null,
          membershipRole: null
        });
      }
    } catch(err) {
       setUser({
         id: userId,
         name: 'Usuário',
         email: email,
         avatar: '',
         role: 'user',
         plan: 'free',
         membershipStatus: null,
         membershipRole: null
       });
    }
  };

  useEffect(() => {
    async function loadEnvironments() {
      const { data, error } = await supabase
        .from('environments')
        .select('*')
        .order('name');
      
      if (data && !error) {
        const formatted = data.map((e: any) => ({
          id: e.id,
          name: e.name,
          slug: generateSlug(e.name),
          type: e.type,
          members: 0,
          image: e.image_url || '',
          isSelected: false,
          status: e.status,
          latitude: e.latitude,
          longitude: e.longitude
        }));
        setSelectedEnvironments(formatted);
        if (formatted.length > 0 && !selectedEnvironment) {
          setSelectedEnvironment(formatted[0]);
        }
      }
    }
    loadEnvironments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEnvironment) {
      refreshMembership();
      fetchServices();
      if (user) {
        fetchMembers();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnvironment, user?.id]);

  const refreshMembership = async () => {
    if (!user?.id || !selectedEnvironment) return;
    
    const { data, error } = await supabase
      .from('environment_members')
      .select('status, role')
      .eq('user_id', user.id)
      .eq('environment_id', selectedEnvironment.id)
      .maybeSingle();

    if (!error) {
       setUser(prev => prev ? { 
         ...prev, 
         membershipStatus: data?.status || null,
         membershipRole: data?.role || null 
       } : null);
    } else {
       setUser(prev => prev ? { 
         ...prev, 
         membershipStatus: null,
         membershipRole: null 
       } : null);
    }
  };

  const fetchMembers = async () => {
      if (!selectedEnvironment) return;
      const { data, error } = await supabase
        .from('environment_members')
        .select('id, user_id, status, role, user_public_profiles(name, avatar_url)')
        .eq('environment_id', selectedEnvironment.id);
        
      if (data && !error) {
         const mapped = data.map((m: any) => ({
            id: m.id,
            userId: m.user_id,
            name: m.user_public_profiles?.name || 'Usuário',
            email: '', 
            avatar: m.user_public_profiles?.avatar_url || '',
            isPending: m.status === 'pending',
            role: m.role
         }));
         setMembers(mapped);
      }
  };

  const fetchServices = async () => {
    const query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
      
    const { data, error } = await query;
    if (data && !error) {
      const formatted = data.map((s: any) => ({
        id: s.id,
        slug: s.slug || generateSlug(s.title),
        title: s.title,
        description: s.description,
        category: s.category,
        image: s.image_url || '',
        images: s.images_urls || [],
        provider: s.provider || 'Prestador',
        status: s.status as any,
        isActive: s.is_active,
        environmentId: s.environment_id,
        WhatsApp: s.whatsapp,
        instagram: s.instagram,
        frequency: s.frequency,
        menu: s.menu || [],
        latitude: s.latitude,
        longitude: s.longitude,
        rating: s.rating ?? 0,
        reviews: s.reviews_count ?? 0,
      }));
      setServices(formatted);
    }
  };

  const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number }> => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      throw new Error('Geolocalização indisponível neste dispositivo/navegador.');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => reject(new Error(err.message || 'Falha ao obter localização.')),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  };

  const requestAffiliation = async (envId: string) => {
      if (!user?.id) throw new Error("Usuário não logado");
      const { error } = await supabase
        .from('environment_members')
        .insert([{
           environment_id: envId,
           user_id: user.id
        }]);
      if (error) throw error;
      await refreshMembership();
  };

  const addService = async (service: any) => {
    if (!user) throw new Error("User not found");
    if (!service?.environmentId) throw new Error('Selecione um ambiente para publicar.');

    const location =
      typeof service?.latitude === 'number' && typeof service?.longitude === 'number'
        ? { latitude: service.latitude, longitude: service.longitude }
        : await getCurrentLocation();

    const { error } = await supabase
      .from('services')
      .insert([{
        title: service.title,
        description: service.description,
        category: service.category,
        image_url: service.image,
        images_urls: service.images ?? [],
        menu: service.menu ?? [],
        tags: service.tags ?? [],
        whatsapp: service.WhatsApp,
        instagram: service.instagram,
        frequency: service.frequency,
        status: service.status || 'active',
        is_active: true,
        environment_id: service.environmentId,
        latitude: location.latitude,
        longitude: location.longitude,
        provider_id: user.id,
      }]);

    if (error) throw error;
    await fetchServices();
  };

  const updateService = async (id: string, updatedFields: Partial<Service>) => {
    const payload: Record<string, unknown> = {};

    if (updatedFields.title !== undefined) payload.title = updatedFields.title;
    if (updatedFields.description !== undefined) payload.description = updatedFields.description;
    if (updatedFields.category !== undefined) payload.category = updatedFields.category;
    if (updatedFields.image !== undefined) payload.image_url = updatedFields.image;
    if (updatedFields.images !== undefined) payload.images_urls = updatedFields.images ?? [];
    if (updatedFields.menu !== undefined) payload.menu = updatedFields.menu ?? [];
    if (updatedFields.tags !== undefined) payload.tags = updatedFields.tags ?? [];
    if (updatedFields.price !== undefined) payload.price = updatedFields.price;
    if (updatedFields.WhatsApp !== undefined) payload.whatsapp = updatedFields.WhatsApp;
    if (updatedFields.instagram !== undefined) payload.instagram = updatedFields.instagram;
    if (updatedFields.frequency !== undefined) payload.frequency = updatedFields.frequency;
    if (updatedFields.status !== undefined) payload.status = updatedFields.status;
    if (updatedFields.isActive !== undefined) payload.is_active = updatedFields.isActive;
    if (updatedFields.environmentId !== undefined) payload.environment_id = updatedFields.environmentId;
    if (updatedFields.latitude !== undefined) payload.latitude = updatedFields.latitude;
    if (updatedFields.longitude !== undefined) payload.longitude = updatedFields.longitude;

    const { error } = await supabase
      .from('services')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
    await fetchServices();
  };

  const removeService = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
    await fetchServices();
  };

  const toggleServiceStatus = async (id: string) => {
     const s = services.find(x => x.id === id);
     if (s) {
       await updateService(id, { isActive: !s.isActive });
     }
  };

  const updateEnvironment = async (id: string, updates: Partial<Environment>) => {
  };
  const approveService = async (id: string) => {};
  const rejectService = async (id: string) => {};
  const rateService = async (id: string, stars: number, comment?: string) => {};

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      selectedEnvironments,
      setSelectedEnvironments,
      selectedEnvironment,
      setSelectedEnvironment,
      updateEnvironment,
      services,
      toggleServiceStatus,
      addService,
      updateService,
      removeService,
      approveService,
      rejectService,
      members,
      rateService,
      loading,
      requestAffiliation,
      refreshMembership
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

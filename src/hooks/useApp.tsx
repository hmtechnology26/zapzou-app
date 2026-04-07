'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { Service, Environment, Member, Review } from '../types';
import type { PlaceSearchResult } from '@/lib/maps';
import { supabase } from '../lib/supabase';
import { countCountableEnvironmentMemberships, getPlanLimits, isPlanAtEnvironmentLimit, type EnvironmentMembershipRole } from '@/lib/plan-rules';
import { isForcedPendingApprovalEnvironment } from '@/lib/environment-rules';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  plan?: 'free' | 'pro' | 'plus';
  membershipStatus?: 'active' | 'pending' | 'banned' | null;
  membershipRole?: EnvironmentMembershipRole;
  managedEnvironmentIds?: string[];
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
  userServices: Service[];
  fetchUserServices: (userId: string) => Promise<void>;
  toggleServiceStatus: (id: string) => Promise<void>;
  addService: (service: any) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  incrementServiceViews: (id: string) => Promise<void>;
  approveService: (id: string) => Promise<void>;
  rejectService: (id: string) => Promise<void>;
  members: Member[];
  favoritePlaces: PlaceSearchResult[];
  fetchFavoritePlaces: () => Promise<void>;
  storeFavoritePlace: (place: PlaceSearchResult) => Promise<void>;
  removeFavoritePlace: (placeId: string) => Promise<void>;
  rateService: (id: string, stars: number, comment?: string, isAnonymous?: boolean) => Promise<void>;
  fetchServiceReviews: (serviceId: string, opts?: { force?: boolean }) => Promise<Review[]>;
  addReview: (serviceId: string, stars: number, comment?: string, isAnonymous?: boolean) => Promise<Review | null>;
  loading: boolean;
  requestAffiliation: (
    envId: string,
    options?: {
      role?: EnvironmentMembershipRole;
      status?: 'active' | 'pending' | 'banned';
    },
  ) => Promise<void>;
  refreshMembership: () => Promise<void>;
  membershipVersion: number;
  signalMembershipChange: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const APP_FETCH_CACHE_TTL_MS = 30_000;

type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEnvironments, setSelectedEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [userServices, setUserServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [serviceReviews, setServiceReviews] = useState<Record<string, Review[]>>({});
  const reviewsHasUserAvatarColumnRef = useRef<boolean | null>(null);
  const [favoritePlaces, setFavoritePlaces] = useState<PlaceSearchResult[]>([]);
  const [membershipVersion, setMembershipVersion] = useState(0);
  const fetchCacheRef = useRef<{
    environments: CacheEntry<Environment[]> | null;
    services: CacheEntry<Service[]> | null;
    userServices: Map<string, CacheEntry<Service[]>>;
    members: Map<string, CacheEntry<Member[]>>;
    favorites: Map<string, CacheEntry<PlaceSearchResult[]>>;
  }>({
    environments: null,
    services: null,
    userServices: new Map(),
    members: new Map(),
    favorites: new Map(),
  });
  const signalMembershipChange = useCallback(() => {
    setMembershipVersion((prev) => prev + 1);
  }, []);

  const isFresh = <T,>(entry: CacheEntry<T> | null | undefined): entry is CacheEntry<T> => {
    return Boolean(entry) && Date.now() - entry.fetchedAt < APP_FETCH_CACHE_TTL_MS;
  };

  const fetchFavoritePlaces = useCallback(async () => {
    if (!user?.id) {
      setFavoritePlaces([]);
      return;
    }

    const cachedFavorites = fetchCacheRef.current.favorites.get(user.id);
    if (isFresh(cachedFavorites)) {
      setFavoritePlaces(cachedFavorites.data);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_place_favorites')
        .select('place_payload')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const parsed = data
          .map((row: any) => row.place_payload)
          .filter((payload): payload is PlaceSearchResult =>
            payload &&
            typeof payload === 'object' &&
            typeof (payload as any).id === 'string'
          );
        setFavoritePlaces(parsed);
        fetchCacheRef.current.favorites.set(user.id, {
          data: parsed,
          fetchedAt: Date.now(),
        });
      } else if (error) {
        console.warn('fetchFavoritePlaces failed:', error);
      }
    } catch (err) {
      console.error('fetchFavoritePlaces exception:', err);
    }
  }, [user?.id]);

  const storeFavoritePlace = useCallback(async (place: PlaceSearchResult) => {
    if (!user?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { error } = await supabase
        .from('user_place_favorites')
        .upsert(
          {
            user_id: user.id,
            place_id: place.id,
            place_payload: place
          },
          { onConflict: 'user_id,place_id' }
        );

      if (error) {
        throw error;
      }

      setFavoritePlaces((prev) => {
        const filtered = prev.filter((existing) => existing.id !== place.id);
        const nextFavorites = [place, ...filtered];
        if (user?.id) {
          fetchCacheRef.current.favorites.set(user.id, {
            data: nextFavorites,
            fetchedAt: Date.now(),
          });
        }
        return nextFavorites;
      });
    } catch (err) {
      console.error('storeFavoritePlace failed:', err);
      throw err;
    }
  }, [user?.id]);

  const removeFavoritePlace = useCallback(async (placeId: string) => {
    if (!user?.id) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_place_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('place_id', placeId);

      if (error) {
        throw error;
      }

      setFavoritePlaces((prev) => {
        const nextFavorites = prev.filter((place) => place.id !== placeId);
        if (user?.id) {
          fetchCacheRef.current.favorites.set(user.id, {
            data: nextFavorites,
            fetchedAt: Date.now(),
          });
        }
        return nextFavorites;
      });
    } catch (err) {
      console.error('removeFavoritePlace failed:', err);
      throw err;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setFavoritePlaces([]);
      return;
    }
    void fetchFavoritePlaces();
  }, [user?.id, fetchFavoritePlaces]);

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const normalizeAvatarUrl = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed === 'null' || trimmed === 'undefined') return '';
    return trimmed;
  };

  const extractAuthProfile = (authUser: any): { name: string; avatar: string } => {
    const meta = authUser?.user_metadata ?? {};
    const identities = Array.isArray(authUser?.identities) ? authUser.identities : [];
    const identityData = identities[0]?.identity_data ?? {};

    const nameRaw =
      meta?.name ??
      meta?.full_name ??
      identityData?.name ??
      identityData?.full_name ??
      '';

    const avatarRaw =
      meta?.avatar_url ??
      meta?.picture ??
      identityData?.avatar_url ??
      identityData?.picture ??
      '';

    return {
      name: typeof nameRaw === 'string' ? nameRaw.trim() : '',
      avatar: normalizeAvatarUrl(avatarRaw),
    };
  };

  const isNoRowsFoundError = (error: any): boolean => {
    // PostgREST "Results contain 0 rows" for .single()
    return error?.code === 'PGRST116';
  };

  const fetchManagedEnvironmentIds = useCallback(async (userId: string): Promise<string[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('environment_members')
      .select('environment_id')
      .eq('user_id', userId)
      .eq('role', 'moderator')
      .eq('status', 'active');

    if (error || !Array.isArray(data)) {
      if (error) {
        console.warn('fetchManagedEnvironmentIds failed:', error);
      }
      return [];
    }

    return data
      .map((row: any) => row.environment_id)
      .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0);
  }, []);

  const buildBaseUserFromSession = useCallback((authUser: any, email: string): User => {
    const authProfile = extractAuthProfile(authUser);

    return {
      id: authUser.id,
      name: authProfile.name || 'Usuário',
      email,
      avatar: authProfile.avatar || '',
      role: 'user',
      plan: 'plus',
      membershipStatus: null,
      membershipRole: null,
      managedEnvironmentIds: [],
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          if (session?.user) {
            const baseUser = buildBaseUserFromSession(session.user, session.user.email || '');
            setUser(baseUser);
            void fetchUserProfile(session.user.id, session.user.email || '', session.user);
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('checkUser error:', err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isMounted) {
        if (session?.user) {
          const baseUser = buildBaseUserFromSession(session.user, session.user.email || '');
          setUser(baseUser);
          void fetchUserProfile(session.user.id, session.user.email || '', session.user);
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [buildBaseUserFromSession]);

  const fetchUserProfile = async (userId: string, email: string, authUser?: any) => {
    const authProfile = extractAuthProfile(authUser);
    const identityData = Array.isArray(authUser?.identities) ? authUser.identities[0]?.identity_data : null;
    const userMetadata: Record<string, any> | undefined = authUser
      ? { ...(authUser.user_metadata || {}), ...(identityData || {}) }
      : undefined;
    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      console.log('User profile fetch:', { data: existingUser, error: fetchError, userId });
      
      if (existingUser && !fetchError) {
        let avatarToSave = normalizeAvatarUrl(existingUser.avatar);
        let nameToSave = existingUser.name;
        const managedEnvironmentIds = await fetchManagedEnvironmentIds(userId);
        
        if (userMetadata) {
          const avatarFromAuth = normalizeAvatarUrl(userMetadata.avatar_url || userMetadata.picture || '');
          if (avatarFromAuth) {
            avatarToSave = avatarFromAuth;
          }
          nameToSave = userMetadata.name || userMetadata.full_name || existingUser.name || 'Usuário';
          
          const updates: { avatar?: string; name?: string } = {};
          if (avatarFromAuth && avatarFromAuth !== existingUser.avatar) {
            updates.avatar = avatarFromAuth;
          }
          if (nameToSave && nameToSave !== existingUser.name) {
            updates.name = nameToSave;
          }
          if (Object.keys(updates).length > 0) {
            await supabase.from('users').update(updates).eq('id', userId);
          }
        }
        
        setUser((prev) => {
          const prevAvatar = prev?.avatar || '';
          const prevName = prev?.name || '';
          const prevPlan = prev?.plan || 'plus';

          const nextAvatar = normalizeAvatarUrl(avatarToSave) || prevAvatar;
          const nextName = (nameToSave || '').trim() || prevName || 'Usuário';
          const nextPlan =
            (existingUser.plan as User['plan'] | undefined) || prevPlan;

          return {
            ...prev,
            id: userId,
            name: nextName,
            email: email,
            avatar: nextAvatar,
            role: existingUser.role === 'moderator' ? 'admin' : 'user',
            plan: nextPlan,
            membershipStatus: prev?.membershipStatus || null,
            membershipRole: prev?.membershipRole || null,
            managedEnvironmentIds,
          };
        });
      } else {
        if (fetchError && !isNoRowsFoundError(fetchError)) {
          console.warn('User profile fetch failed (non-empty error):', fetchError);
          const managedEnvironmentIds = await fetchManagedEnvironmentIds(userId);
          setUser((prev) => ({
            ...prev,
            id: userId,
            name: authProfile.name || prev?.name || 'Usuário',
            email,
            avatar: authProfile.avatar || prev?.avatar || '',
            plan: 'plus',
            role: prev?.role || 'user',
            membershipStatus: prev?.membershipStatus || null,
            membershipRole: prev?.membershipRole || null,
            managedEnvironmentIds,
          }));
          return;
        }
        const googleAvatar = normalizeAvatarUrl(userMetadata?.avatar_url || userMetadata?.picture || '');
        const googleName = userMetadata?.name || userMetadata?.full_name || 'Usuário';
        const managedEnvironmentIds = await fetchManagedEnvironmentIds(userId);
        
        const payload: any = { id: userId, email, name: googleName, plan: 'plus' };
        if (googleAvatar) payload.avatar = googleAvatar;

        const { error: createError } = await supabase
          .from('users')
          .upsert(payload);
        
        if (createError) {
          console.error('Error creating user:', createError);
        }
        
        setUser({
          id: userId,
          name: googleName,
          email: email,
          avatar: googleAvatar || authProfile.avatar,
          role: 'user',
          plan: 'plus',
          membershipStatus: null,
          membershipRole: null,
          managedEnvironmentIds,
        });
      }
    } catch(err) {
       console.error('Exception fetching user profile:', err);
       const managedEnvironmentIds = await fetchManagedEnvironmentIds(userId);
       setUser({
         id: userId,
         name: 'Usuário',
         email: email,
         avatar: authProfile.avatar || '',
         role: 'user',
         plan: 'plus',
         membershipStatus: null,
         membershipRole: null,
         managedEnvironmentIds,
       });
    }
  };

  useEffect(() => {
    async function loadEnvironments() {
      if (!user?.id) {
        setSelectedEnvironments([]);
        fetchCacheRef.current.environments = null;
        return;
      }

      if (isFresh(fetchCacheRef.current.environments)) {
        const cachedEnvironments = fetchCacheRef.current.environments.data;
        setSelectedEnvironments(cachedEnvironments);
        if (cachedEnvironments.length > 0 && !selectedEnvironment) {
          setSelectedEnvironment(cachedEnvironments[0]);
        }
        return;
      }

      const { data: membersData } = await supabase
        .from('environment_members')
        .select('environment_id, role, status')
        .eq('user_id', user.id);

      const eligibleMemberships = (membersData || []).filter((membership: any) => {
        const envId = membership?.environment_id;
        if (typeof envId !== 'string' || !envId) return false;
        if (membership?.status === 'banned') return false;
        if (isForcedPendingApprovalEnvironment(envId)) return true;
        return membership?.status === 'active' && (
          membership?.role === 'resident' || membership?.role === 'service_provider'
        );
      });

      if (eligibleMemberships.length === 0) {
        setSelectedEnvironments([]);
        return;
      }

      const envIds = eligibleMemberships.map((m: any) => m.environment_id);

      const { data, error } = await supabase
        .from('environments')
        .select('*')
        .in('id', envIds)
        .order('name');
      
      if (data && !error) {
        const formatted = data.map((e: any) => ({
          id: e.id,
          name: e.name,
          slug: e.slug || generateSlug(e.name),
          type: e.type,
          members: Number(e.members_count ?? 0),
          image: e.image_url || '',
          isSelected: false,
          status: e.status,
          latitude: e.latitude,
          longitude: e.longitude,
          requiresModeratorApproval: Boolean(e.requires_moderator_approval),
          requiresRadiusValidation: Boolean(e.requires_radius_validation),
        }));
        fetchCacheRef.current.environments = {
          data: formatted,
          fetchedAt: Date.now(),
        };
        setSelectedEnvironments(formatted);
        if (formatted.length > 0 && !selectedEnvironment) {
          setSelectedEnvironment(formatted[0]);
        }
      }
    }
    loadEnvironments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, membershipVersion]);

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
      const cachedMembers = fetchCacheRef.current.members.get(selectedEnvironment.id);
      if (isFresh(cachedMembers)) {
        setMembers(cachedMembers.data);
        return;
      }

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
            avatar: normalizeAvatarUrl(m.user_public_profiles?.avatar_url || ''),
            isPending: m.status === 'pending',
            role: m.role
         }));
         setMembers(mapped);
         fetchCacheRef.current.members.set(selectedEnvironment.id, {
           data: mapped,
           fetchedAt: Date.now(),
         });
      }
  };

  const fetchServices = async () => {
    if (isFresh(fetchCacheRef.current.services)) {
      setServices(fetchCacheRef.current.services.data);
      return;
    }

    const query = supabase
      .from('services')
      .select('*, environments(name, slug, latitude, longitude, type)')
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
        provider_id: s.provider_id,
        publisherType: s.publisher_type as 'resident' | 'service_provider' | null,
        status: s.status as any,
        isActive: s.is_active,
        environmentId: s.environment_id,
        environmentName: s.environments?.name || '',
        environmentType: s.environments?.type || '',
        environmentLatitude: s.environments?.latitude,
        environmentLongitude: s.environments?.longitude,
        WhatsApp: s.whatsapp,
        instagram: s.instagram,
        frequency: s.frequency,
        menu: s.menu || [],
        rating: s.rating ?? 0,
        reviews_count: s.reviews_count ?? 0,
        views: s.views ?? 0,
      }));
      setServices(formatted);
      fetchCacheRef.current.services = {
        data: formatted,
        fetchedAt: Date.now(),
      };
    }
  };

  const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number }> => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      throw new Error('Geolocalização indisponível neste dispositivo/navegador.');
    }

    return new Promise((resolve, reject) => {
      console.log('Requesting permission for geolocation...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log('Geolocation success:', pos.coords.latitude, pos.coords.longitude);
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => {
          console.warn('Geolocation failed/denied:', err.code, err.message);
          // err.code 1 = PERMISSION_DENIED
          reject(new Error(err.code === 1 ? 'Permissão de localização negada.' : 'Falha ao obter localização.'));
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
      );
    });
  };

  const requestAffiliation = async (
    envId: string,
    options?: {
      role?: EnvironmentMembershipRole;
      status?: 'active' | 'pending' | 'banned';
    },
  ) => {
      if (!user?.id) throw new Error("Usuário não logado");

      const { data: existingMemberships, error: membershipsError } = await supabase
        .from('environment_members')
        .select('environment_id, status')
        .eq('user_id', user.id);

      if (membershipsError) {
        throw membershipsError;
      }

      const currentEnvironmentCount = countCountableEnvironmentMemberships(existingMemberships as any);
      const alreadyLinked = Array.isArray(existingMemberships)
        ? existingMemberships.some((membership: any) => membership?.environment_id === envId && membership?.status !== 'banned')
        : false;
      const planLimits = getPlanLimits(user.plan);

      if (!alreadyLinked && isPlanAtEnvironmentLimit(user.plan, currentEnvironmentCount)) {
        const envLimit = planLimits.environments;
        throw new Error(
          envLimit === 1
            ? 'Seu plano permite apenas 1 ambiente. Atualize para o PRÓ ou PLUS para adicionar mais.'
            : 'Seu plano já atingiu o limite de ambientes. Atualize para o PLUS para continuar.',
        );
      }

      const { error } = await supabase
        .from('environment_members')
        .upsert([{
           environment_id: envId,
           user_id: user.id,
           role: options?.role ?? 'member',
           status: options?.status ?? 'pending',
        }], { onConflict: 'environment_id,user_id' });
      if (error) throw error;
      await refreshMembership();
      signalMembershipChange();
  };

  const fetchUserServices = async (userId: string) => {
    const cachedUserServices = fetchCacheRef.current.userServices.get(userId);
    if (isFresh(cachedUserServices)) {
      setUserServices(cachedUserServices.data);
      return;
    }

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('provider_id', userId)
      .order('created_at', { ascending: false });
    
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
        provider_id: s.provider_id,
        status: s.status as any,
        isActive: s.is_active,
        environmentId: s.environment_id,
        WhatsApp: s.whatsapp,
        instagram: s.instagram,
        frequency: s.frequency,
        menu: s.menu || [],
        rating: s.rating ?? 0,
        reviews_count: s.reviews_count ?? 0,
        views: s.views ?? 0,
      }));
      setUserServices(formatted);
      fetchCacheRef.current.userServices.set(userId, {
        data: formatted,
        fetchedAt: Date.now(),
      });
    }
  };

  const addService = async (service: any) => {
    console.log('addService called', { service, user: !!user });
    if (!user) throw new Error("User not found");
    if (!service?.environmentId) throw new Error('Selecione um ambiente para publicar.');

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
        provider_id: user.id,
        provider: user.name || 'Prestador',
        publisher_type: service.publisherType || 'service_provider',
      }]);

    console.log('Service insert result:', { error });
    if (error) throw error;
    fetchCacheRef.current.services = null;
    if (user?.id) {
      fetchCacheRef.current.userServices.delete(user.id);
    }
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

    const { error } = await supabase
      .from('services')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
    fetchCacheRef.current.services = null;
    if (user?.id) {
      fetchCacheRef.current.userServices.delete(user.id);
    }
    await fetchServices();
  };

  const removeService = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
    fetchCacheRef.current.services = null;
    if (user?.id) {
      fetchCacheRef.current.userServices.delete(user.id);
    }
    await fetchServices();
  };

  const incrementServiceViews = async (id: string) => {
    const { data, error } = await supabase
      .from('services')
      .select('views')
      .eq('id', id)
      .single();
    
    if (!error && data) {
      const newViews = (data.views || 0) + 1;
      await supabase
        .from('services')
        .update({ views: newViews })
        .eq('id', id);
      setServices(prev => prev.map(s => s.id === id ? { ...s, views: newViews } : s));
    }
  };

  const toggleServiceStatus = async (id: string) => {
     const s = services.find(x => x.id === id);
     if (s) {
       const newStatus = !s.isActive;
       setServices(services.map(sv => sv.id === id ? { ...sv, isActive: newStatus } : sv));
       await updateService(id, { isActive: newStatus });
     }
  };

  const updateEnvironment = async (id: string, updates: Partial<Environment>) => {
  };
  const approveService = async (id: string) => {};
  const rejectService = async (id: string) => {};

  const withTimeout = async <T,>(input: PromiseLike<T>, timeoutMs: number, message = 'Tempo esgotado'): Promise<T> => {
    const promise = Promise.resolve(input);
    return await new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        // Evita rejeições "tardias" sem handler após timeout
        void promise.catch(() => {});
        reject(new Error(message));
      }, timeoutMs);

      promise.then(
        (value) => {
          clearTimeout(timeoutId);
          resolve(value);
        },
        (err) => {
          clearTimeout(timeoutId);
          reject(err);
        }
      );
    });
  };

  const isMissingColumnError = (err: any, column: string) => {
    const msg = String(err?.message || '').toLowerCase();
    const col = column.toLowerCase();
    return (
      err?.code === '42703' ||
      (msg.includes(col) && (msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('column')))
    );
  };

  const toUserFriendlyReviewError = (err: any) => {
    const msg = String(err?.message || '');
    const msgLower = msg.toLowerCase();

    if (!err) return new Error('Erro ao enviar avaliação');
    if (err?.code === '23505') return new Error('Você já avaliou este serviço.');
    if (err?.code === '23503') return new Error('Não foi possível vincular sua avaliação ao usuário/serviço. Saia e entre novamente e tente de novo.');
    if (err?.code === '22P02') return new Error('Dados inválidos ao enviar avaliação. Atualize a página e tente novamente.');
    if (err?.code === '42501' || msgLower.includes('row-level security')) {
      return new Error('Sem permissão para enviar avaliação. Faça login e tente novamente.');
    }
    if (err?.code === 'PGRST204' || msgLower.includes('schema cache')) {
      return new Error('A estrutura de avaliações no Supabase parece desatualizada (schema cache). Rode as migrações e recarregue o schema cache no Supabase.');
    }
    if (err instanceof Error) return err;
    return new Error(msg || 'Erro ao enviar avaliação');
  };

  const fetchServiceReviews = async (
    serviceId: string,
    opts?: { force?: boolean }
  ): Promise<Review[]> => {
    try {
      if (!opts?.force && serviceReviews[serviceId]) {
        return serviceReviews[serviceId];
      }

      const includeAvatarColumn = reviewsHasUserAvatarColumnRef.current !== false;
      let data: any;
      let error: any;
      try {
        ({ data, error } = (await withTimeout(
          supabase
            .from('reviews')
            .select(
              includeAvatarColumn
                ? 'id, service_id, user_id, user_name, user_avatar, stars, comment, created_at, is_anonymous, approved'
                : 'id, service_id, user_id, user_name, stars, comment, created_at, is_anonymous, approved'
            )
            .eq('service_id', serviceId)
            .or('is_anonymous.is.null,is_anonymous.eq.false,approved.eq.true')
            .order('created_at', { ascending: false })
            .limit(50),
          25000,
          'Tempo esgotado ao carregar avaliações'
        )) as any);
      } catch (err) {
        console.warn('fetchServiceReviews failed (exception/timeout):', err);
        return serviceReviews[serviceId] || [];
      }

      if (error && isMissingColumnError(error, 'user_avatar')) {
        reviewsHasUserAvatarColumnRef.current = false;
        try {
          ({ data, error } = (await withTimeout(
            supabase
              .from('reviews')
              .select('id, service_id, user_id, user_name, stars, comment, created_at, is_anonymous, approved')
              .eq('service_id', serviceId)
              .or('is_anonymous.is.null,is_anonymous.eq.false,approved.eq.true')
              .order('created_at', { ascending: false })
              .limit(50),
            25000,
            'Tempo esgotado ao carregar avaliações'
          )) as any);
        } catch (err) {
          console.warn('fetchServiceReviews failed (exception/timeout):', err);
          return serviceReviews[serviceId] || [];
        }
      }

      if (!error && includeAvatarColumn) {
        reviewsHasUserAvatarColumnRef.current = true;
      }

      if (!error && Array.isArray(data)) {
        const reviews = data.map((r) => ({
          id: r.id,
          service_id: r.service_id,
          user_id: r.user_id,
          userName: r.user_name,
          user_avatar: r.user_avatar,
          stars: r.stars,
          comment: r.comment,
          created_at: r.created_at,
          isAnonymous: r.is_anonymous,
          approved: r.approved,
        }));
        setServiceReviews((prev) => ({ ...prev, [serviceId]: reviews }));
        return reviews;
      }

      if (error) {
        console.warn('fetchServiceReviews failed:', error);
      } else if (data) {
        console.warn('fetchServiceReviews returned unexpected payload:', data);
      }

      return [];
    } catch (err) {
      console.warn('fetchServiceReviews failed (unexpected):', err);
      return serviceReviews[serviceId] || [];
    }
  };

  const addReview = async (serviceId: string, stars: number, comment?: string, isAnonymous = false): Promise<Review | null> => {
    if (!user) throw new Error('User must be logged in');

    const basePayload = {
      service_id: serviceId,
      user_id: user.id,
      user_name: isAnonymous ? null : user.name,
      user_avatar: isAnonymous ? null : user.avatar,
      stars,
      comment: comment || '',
      is_anonymous: isAnonymous,
      approved: isAnonymous ? false : true,  // Avaliações anónimas precisam de aprovação
    };
    const selectColumns = (includeAvatar: boolean) =>
      includeAvatar
        ? 'id, service_id, user_id, user_name, user_avatar, stars, comment, created_at, is_anonymous, approved'
        : 'id, service_id, user_id, user_name, stars, comment, created_at, is_anonymous, approved';
    const tryInsert = (payload: typeof basePayload, includeAvatar: boolean) =>
      supabase.from('reviews').insert(payload).select(selectColumns(includeAvatar)).single();

    let insertResult = await withTimeout(
      tryInsert(
        reviewsHasUserAvatarColumnRef.current === false ? basePayload : { ...basePayload, user_avatar: user.avatar },
        reviewsHasUserAvatarColumnRef.current !== false
      ),
      15000,
      'Tempo esgotado ao enviar avaliação'
    );

    let { data, error } = insertResult as { data: any; error: any };
    if (error && isMissingColumnError(error, 'user_avatar')) {
      reviewsHasUserAvatarColumnRef.current = false;
      insertResult = await withTimeout(
        tryInsert(basePayload, false),
        15000,
        'Tempo esgotado ao enviar avaliação'
      );
      ({ data, error } = insertResult as { data: any; error: any });
    }

    if (!error && reviewsHasUserAvatarColumnRef.current !== false) {
      reviewsHasUserAvatarColumnRef.current = true;
    }

    if (error) {
      console.warn('addReview failed:', error);
      throw toUserFriendlyReviewError(error);
    }

    const createdReview: Review | null = data
      ? {
          id: data.id,
          service_id: data.service_id,
          user_id: data.user_id,
          userName: data.user_name,
          user_avatar: data.user_avatar,
          stars: data.stars,
          comment: data.comment,
          created_at: data.created_at,
          isAnonymous: data.is_anonymous,
          approved: data.approved,
        }
      : null;

    // Atualiza o cache local imediatamente para evitar refetch bloqueante
    if (createdReview) {
      setServiceReviews(prev => {
        const current = Array.isArray(prev[serviceId]) ? prev[serviceId] : [];
        const nextForService = [createdReview, ...current.filter(r => r.id !== createdReview.id)];
        return { ...prev, [serviceId]: nextForService };
      });
    } else {
      setServiceReviews(prev => {
        const next = { ...prev };
        delete next[serviceId];
        return next;
      });
    }

    // Não bloqueia o fluxo do usuário caso a atualização do rating falhe/trave
    void withTimeout(updateServiceRating(serviceId), 8000).catch(() => {});

    return createdReview;
  };

  const updateServiceRating = async (serviceId: string) => {
    const reviews = serviceReviews[serviceId] || [];
    const { data } = await supabase
      .from('reviews')
      .select('stars')
      .eq('service_id', serviceId);
    if (data) {
      const total = data.length;
      const avg = total > 0 
        ? data.reduce((acc, r) => acc + r.stars, 0) / total 
        : 0;
      await supabase
        .from('services')
        .update({ rating: avg, reviews_count: total })
        .eq('id', serviceId);
      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, rating: avg, reviews_count: total } : s
      ));
    }
  };

  const rateService = async (id: string, stars: number, comment?: string, isAnonymous = false) => {
    await addReview(id, stars, comment, isAnonymous);
  };

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
      userServices,
      fetchUserServices,
      toggleServiceStatus,
      addService,
      updateService,
      removeService,
      incrementServiceViews,
      approveService,
      rejectService,
      members,
      favoritePlaces,
      fetchFavoritePlaces,
      storeFavoritePlace,
      removeFavoritePlace,
      rateService,
      fetchServiceReviews,
      addReview,
      loading,
      requestAffiliation,
      refreshMembership,
      membershipVersion,
      signalMembershipChange,
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

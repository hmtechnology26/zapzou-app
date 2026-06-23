'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { Service, Environment, Member, Review } from '../types';
import type { PlaceSearchResult } from '@/lib/maps';
import { supabase } from '../lib/supabase';
import {
  countCountableEnvironmentMemberships,
  getPlanLimits,
  isPlanAtEnvironmentLimit,
  type EnvironmentMembershipAccessType,
  type EnvironmentMembershipRole,
} from '@/lib/plan-rules';
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
  membershipAccessType?: EnvironmentMembershipAccessType;
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
  servicesLoading: boolean;
  refreshServices: () => Promise<void>;
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
  replyToReview: (reviewId: string, reply: string) => Promise<Review | null>;
  loading: boolean;
  requestAffiliation: (
    envId: string,
    options?: {
      role?: EnvironmentMembershipRole | null;
      accessType?: EnvironmentMembershipAccessType;
      status?: 'active' | 'pending' | 'banned';
    },
  ) => Promise<void>;
  refreshMembership: () => Promise<void>;
  membershipVersion: number;
  signalMembershipChange: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const normalizeArrayValue = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeRelatedRecord = <T,>(value: unknown): T | null => {
  if (Array.isArray(value)) {
    return (value[0] as T) ?? null;
  }

  if (value && typeof value === 'object') {
    return value as T;
  }

  return null;
};

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
  const [servicesLoading, setServicesLoading] = useState(true);
  const [userServices, setUserServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [serviceReviews, setServiceReviews] = useState<Record<string, Review[]>>({});
  const reviewsHasUserAvatarColumnRef = useRef<boolean | null>(null);
  const reviewsHasOwnerReplyColumnRef = useRef<boolean | null>(null);
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

  const refreshSelectedEnvironments = useCallback(async () => {
    if (!user?.id) {
      setSelectedEnvironments([]);
      return;
    }

    let membersData: any[] | null = null;
    const { data: membersWithAccessType, error: membersWithAccessTypeError } = await supabase
      .from('environment_members')
      .select('environment_id, role, access_type, status')
      .eq('user_id', user.id);

    if (membersWithAccessTypeError) {
      console.warn('refreshSelectedEnvironments (with access_type) failed:', membersWithAccessTypeError);

      const { data: membersLegacy, error: membersLegacyError } = await supabase
        .from('environment_members')
        .select('environment_id, role, status')
        .eq('user_id', user.id);

      if (membersLegacyError) {
        console.warn('refreshSelectedEnvironments (legacy) failed:', membersLegacyError);
        return;
      }

      membersData = (membersLegacy || []).map((membership: any) => ({
        ...membership,
        access_type: null,
      }));
    } else {
      membersData = membersWithAccessType || [];
    }

    const eligibleMemberships = (membersData || []).filter((membership: any) => {
      const envId = membership?.environment_id;
      if (typeof envId !== 'string' || !envId) return false;
      return membership?.status !== 'banned';
    });

    if (eligibleMemberships.length === 0) {
      setSelectedEnvironments([]);
      return;
    }

    const envIds = eligibleMemberships.map((m: any) => m.environment_id);
    const membershipByEnvironmentId = new Map(
      eligibleMemberships.map((membership: any) => [
        membership.environment_id,
        membership,
      ]),
    );

    const { data, error } = await supabase
      .from('environments')
      .select('*')
      .in('id', envIds)
      .order('name');

    if (error) {
      console.warn('refreshSelectedEnvironments (environments fetch) failed:', error);
      return;
    }

    if (data) {
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
        address: e.address || '',
        membershipRole: membershipByEnvironmentId.get(e.id)?.role ?? null,
        membershipAccessType: membershipByEnvironmentId.get(e.id)?.access_type ?? null,
        requiresModeratorApproval: Boolean(e.requires_moderator_approval),
        requiresRadiusValidation: Boolean(e.requires_radius_validation),
      }));

      setSelectedEnvironments(formatted);
      if (
        formatted.length > 0 &&
        (!selectedEnvironment || !formatted.some((env) => env.id === selectedEnvironment.id))
      ) {
        setSelectedEnvironment(formatted[0]);
      }
    }
  }, [selectedEnvironment, user?.id]);

  const isFresh = <T,>(entry: CacheEntry<T> | null | undefined): entry is CacheEntry<T> => {
    if (!entry) return false;
    // Disable in-memory fetch caching so the UI always reflects the latest DB state.
    return false;
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
      ? { ...(identityData || {}), ...(authUser.user_metadata || {}) }
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
            membershipAccessType: prev?.membershipAccessType || null,
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
            membershipAccessType: prev?.membershipAccessType || null,
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
          membershipAccessType: null,
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
         membershipAccessType: null,
         managedEnvironmentIds,
       });
    }
  };

  useEffect(() => {
    async function loadEnvironments() {
      await refreshSelectedEnvironments();
    }
    loadEnvironments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, membershipVersion, refreshSelectedEnvironments]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`environment-members:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'environment_members',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          signalMembershipChange();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [signalMembershipChange, user?.id]);

  useEffect(() => {
    void fetchServices();
    if (selectedEnvironment) {
      refreshMembership();
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
      .select('status, role, access_type')
      .eq('user_id', user.id)
      .eq('environment_id', selectedEnvironment.id)
      .maybeSingle();

    if (!error) {
       setUser(prev => prev ? { 
         ...prev, 
         membershipStatus: data?.status || null,
         membershipRole: data?.role || null,
         membershipAccessType: data?.access_type || null,
       } : null);
    } else {
       setUser(prev => prev ? { 
         ...prev, 
         membershipStatus: null,
         membershipRole: null,
         membershipAccessType: null,
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
        .select('id, user_id, status, role, access_type, user_public_profiles(name, avatar_url)')
        .eq('environment_id', selectedEnvironment.id);
        
      if (data && !error) {
         const mapped = data.map((m: any) => ({
            id: m.id,
            userId: m.user_id,
            name: m.user_public_profiles?.name || 'Usuário',
            email: '', 
            avatar: normalizeAvatarUrl(m.user_public_profiles?.avatar_url || ''),
            isPending: m.status === 'pending',
            role: m.role,
            accessType: m.access_type ?? null,
         }));
         setMembers(mapped);
         fetchCacheRef.current.members.set(selectedEnvironment.id, {
           data: mapped,
           fetchedAt: Date.now(),
         });
      }
  };

  const isMissingServiceEnvironmentLinksError = (error: any) => {
    const message = String(error?.message || '').toLowerCase();
    return (
      error?.code === '42P01' ||
      message.includes('service_environment_links')
    );
  };

  const fetchServiceLinkEnvironmentMap = async (rows: any[]) => {
    const serviceIds = Array.from(
      new Set(
        (rows || [])
          .map((service: any) => service?.id)
          .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0),
      ),
    );

    const emptyMap = new Map<string, Array<{
      id: string;
      slug: string;
      name: string;
      type: string;
      latitude?: number;
      longitude?: number;
      address: string;
      image: string;
    }>>();

    if (serviceIds.length === 0) {
      return emptyMap;
    }

    const buildLinkedMap = (linkRows: any[], environmentById?: Map<string, any>) => {
      const linkedMap = new Map<string, Array<{
        id: string;
        slug: string;
        name: string;
        type: string;
        latitude?: number;
        longitude?: number;
        address: string;
        image: string;
      }>>();

      (linkRows || []).forEach((row: any) => {
        const serviceId = row?.service_id;
        if (typeof serviceId !== 'string' || serviceId.length === 0) return;

        const relatedEnvironment = normalizeRelatedRecord<{
          id?: string;
          name?: string;
          slug?: string;
          latitude?: number;
          longitude?: number;
          address?: string;
          type?: string;
          image_url?: string;
        }>(row?.environments);

        const fallbackEnvironment =
          environmentById?.get(row?.environment_id) ??
          environmentById?.get(relatedEnvironment?.id);

        const environment = relatedEnvironment || fallbackEnvironment || null;
        const environmentId =
          (typeof row?.environment_id === 'string' && row.environment_id.length > 0
            ? row.environment_id
            : environment?.id) || '';

        if (!environmentId) return;

        const linkedEnvironment = {
          id: environmentId,
          slug: environment?.slug || generateSlug(environment?.name || environmentId),
          name: environment?.name || '',
          type: environment?.type || '',
          latitude: environment?.latitude,
          longitude: environment?.longitude,
          address: environment?.address || '',
          image: environment?.image_url || '',
        };

        const current = linkedMap.get(serviceId) || [];
        if (!current.some((env) => env.id === linkedEnvironment.id)) {
          current.push(linkedEnvironment);
        }
        linkedMap.set(serviceId, current);
      });

      return linkedMap;
    };

    console.log('[fetchServiceLinkEnvironmentMap] Querying links for', serviceIds.length, 'services');

    const BATCH_SIZE = 50;
    let mainQueryFailed = false;
    const allLinkData: any[] = [];

    for (let i = 0; i < serviceIds.length; i += BATCH_SIZE) {
      const batch = serviceIds.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from('service_environment_links')
        .select('service_id, environment_id, environments(id, name, slug, latitude, longitude, address, type, image_url)')
        .in('service_id', batch);

      if (error) {
        mainQueryFailed = true;
        break;
      }
      if (data) {
        allLinkData.push(...data);
      }
    }

    if (!mainQueryFailed) {
      console.log('[fetchServiceLinkEnvironmentMap] Success, rows:', allLinkData.length);
      if (allLinkData.length > 0) {
        console.log('[fetchServiceLinkEnvironmentMap] Sample:', allLinkData.slice(0, 3).map(r => ({
          service_id: r.service_id,
          environment_id: r.environment_id,
          env_slug: r.environments?.slug,
          env_name: r.environments?.name,
        })));
      }
      const result = buildLinkedMap(allLinkData);
      console.log('[fetchServiceLinkEnvironmentMap] Built map entries:', result.size);
      let sampleCount = 0;
      for (const [serviceId, envs] of result) {
        if (sampleCount < 3) {
          console.log('[fetchServiceLinkEnvironmentMap] Service linked envs:', { serviceId, envs: envs.map(e => ({ id: e.id, slug: e.slug, name: e.name })) });
          sampleCount++;
        }
      }
      return result;
    }

    console.warn('[fetchServiceLinkEnvironmentMap] Batched query failed, will try fallback');

    console.log('[fetchServiceLinkEnvironmentMap] Using fallback (no join, batched)');

    let fallbackFailed = false;
    const fallbackLinkData: any[] = [];

    for (let i = 0; i < serviceIds.length; i += BATCH_SIZE) {
      const batch = serviceIds.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from('service_environment_links')
        .select('service_id, environment_id')
        .in('service_id', batch);

      if (error) {
        console.warn('[fetchServiceLinkEnvironmentMap] Fallback batch failed:', error);
        fallbackFailed = true;
        break;
      }
      if (data) {
        fallbackLinkData.push(...data);
      }
    }

    if (fallbackFailed) {
      console.warn('fetchServiceLinkEnvironmentMap fallback failed');
      return emptyMap;
    }

    console.log('[fetchServiceLinkEnvironmentMap] Fallback rows:', fallbackLinkData.length);

    const environmentIds = Array.from(
      new Set(
        (fallbackLinkData || [])
          .map((row: any) => row?.environment_id)
          .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0),
      ),
    );

    const environmentById = new Map<string, any>();

    if (environmentIds.length > 0) {
      const { data: environmentsData, error: environmentsError } = await supabase
        .from('environments')
        .select('id, name, slug, latitude, longitude, address, type, image_url')
        .in('id', environmentIds);

      if (environmentsError) {
        console.warn('fetchServiceLinkEnvironmentMap fallback environments failed:', environmentsError);
      } else {
        (environmentsData || []).forEach((environment: any) => {
          environmentById.set(environment.id, environment);
        });
        console.log('[fetchServiceLinkEnvironmentMap] Fetched environments:', environmentById.size);
      }
    }

    const result = buildLinkedMap(fallbackLinkData || [], environmentById);
    console.log('[fetchServiceLinkEnvironmentMap] Built map from fallback, entries:', result.size);
    return result;
  };

  const fetchServices = async () => {
    setServicesLoading(true);

    if (isFresh(fetchCacheRef.current.services)) {
      setServices(fetchCacheRef.current.services.data);
      setServicesLoading(false);
      return;
    }

    const MAX_RETRIES = 2;
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const PAGE_SIZE = 1000;
        let allRows: any[] = [];
        let paginationError: any = null;

        for (let offset = 0; ; offset += PAGE_SIZE) {
          const { data, error } = await supabase
            .from('services')
.select('*, environments!service_environment_links(id, name, slug, latitude, longitude, address, type, image_url)')
            .order('created_at', { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

          if (error) {
            paginationError = error;
            break;
          }

          if (data) {
            allRows.push(...data);
            if (data.length < PAGE_SIZE) break;
          } else {
            break;
          }
        }

        let rows: any[] = allRows;
        if (paginationError) {
          console.warn(`fetchServices (relation query) failed (attempt ${attempt + 1}):`, paginationError);

          let allLegacyRows: any[] = [];
          let legacyPaginationError: any = null;

          for (let offset = 0; ; offset += PAGE_SIZE) {
            const { data, error } = await supabase
              .from('services')
              .select('*')
              .order('created_at', { ascending: false })
              .range(offset, offset + PAGE_SIZE - 1);

            if (error) {
              legacyPaginationError = error;
              break;
            }

            if (data) {
              allLegacyRows.push(...data);
              if (data.length < PAGE_SIZE) break;
            } else {
              break;
            }
          }

          if (legacyPaginationError) {
            lastError = legacyPaginationError;
            if (attempt < MAX_RETRIES) {
              const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
              console.warn(`fetchServices legacy fallback also failed, retrying in ${delay}ms...`);
              await new Promise(r => setTimeout(r, delay));
              continue;
            }
            throw legacyPaginationError;
          }

          const { data: fallbackLinks } = await supabase
            .from('service_environment_links')
            .select('service_id, environment_id, environments!inner(id, name, slug, latitude, longitude, address, type, image_url)')
            .in('service_id', (allLegacyRows || []).map((s: any) => s.id));

          const envByServiceId = new Map<string, any[]>();
          (fallbackLinks || []).forEach((link: any) => {
            const list = envByServiceId.get(link.service_id) || [];
            if (link.environments) list.push(link.environments);
            envByServiceId.set(link.service_id, list);
          });

          rows = (allLegacyRows || []).map((service: any) => ({
            ...service,
            environments: envByServiceId.get(service.id) || [],
          }));
        }

        const formatted = rows.map((s: any) => {
          const environmentsList: Array<{
            id?: string; name?: string; slug?: string; latitude?: number;
            longitude?: number; address?: string; type?: string; image_url?: string;
          }> = Array.isArray(s.environments) ? s.environments : [];
          const environment = environmentsList[0] || null;
          const linkedEnvs = environmentsList.map((e: any) => ({
            id: e.id || '',
            slug: e.slug || '',
            name: e.name || '',
            type: e.type || '',
            latitude: e.latitude,
            longitude: e.longitude,
            address: e.address || '',
            image: e.image_url || '',
          }));

          return {
            environmentName: environment?.name || '',
            environmentSlug: environment?.slug || '',
            environmentType: environment?.type || '',
            environmentLatitude: environment?.latitude,
            environmentLongitude: environment?.longitude,
            environmentAddress: environment?.address || '',
            environmentImage: environment?.image_url || '',
            latitude: s.latitude,
            longitude: s.longitude,
            id: s.id,
            slug: s.slug || generateSlug(s.title),
            title: s.title,
            description: s.description,
            category: s.category,
            image: s.image_url || '',
            images: normalizeArrayValue<string>(s.images_urls),
            provider: s.provider || 'Prestador',
            provider_id: s.provider_id,
            publisherType: s.publisher_type as 'resident' | 'service_provider' | null,
            status: s.status as any,
            isActive: s.is_active,
            environmentId: environment?.id || null,
            environments: linkedEnvs.map((env) => ({
              id: env.id,
              slug: env.slug,
            })),
            linkedEnvironments: linkedEnvs,
            WhatsApp: s.whatsapp,
            instagram: s.instagram,
            website: s.website_url,
            cnpj: s.cnpj || '',
            frequency: s.frequency,
            menu: normalizeArrayValue<any>(s.menu),
            rating: s.rating ?? 0,
            reviews_count: s.reviews_count ?? 0,
            views: s.views ?? 0,
          };
        });

        console.log('[fetchServices] Success:', {
          total: formatted.length,
          active: formatted.filter(s => s.isActive && s.status === 'active').length,
          sample: formatted.slice(0, 3).map(s => ({
            id: s.id,
            title: s.title,
            status: s.status,
            isActive: s.isActive,
            environmentSlug: s.environmentSlug,
            environmentId: s.environmentId,
          })),
        });
        setServices(formatted);
        fetchCacheRef.current.services = {
          data: formatted,
          fetchedAt: Date.now(),
        };
        setServicesLoading(false);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
          console.warn(`fetchServices attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        console.error('fetchServices failed after all retries:', error);
      }
    }

    setServicesLoading(false);
    if (lastError) {
      console.error('fetchServices final error:', lastError);
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
      role?: EnvironmentMembershipRole | null;
      accessType?: EnvironmentMembershipAccessType;
      status?: 'active' | 'pending' | 'banned';
    },
  ) => {
      if (!user?.id) throw new Error("Usuário não logado");

      const { data: existingMemberships, error: membershipsError } = await supabase
        .from('environment_members')
        .select('environment_id, status, role, access_type')
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

      const existingMembership = Array.isArray(existingMemberships)
        ? existingMemberships.find((membership: any) => membership?.environment_id === envId && membership?.status !== 'banned')
        : null;
      const requestedAccessType = options?.accessType ?? null;
      const preservedAccessType =
        requestedAccessType ??
        (existingMembership?.access_type as EnvironmentMembershipAccessType | null) ??
        'service_provider';
      const nextRole = existingMembership?.role === 'moderator' || options?.role === 'moderator'
        ? 'moderator'
        : 'member';

      const { error } = await supabase
        .from('environment_members')
        .upsert([{
           environment_id: envId,
           user_id: user.id,
           role: nextRole,
           access_type: preservedAccessType,
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

    try {
      const PAGE_SIZE = 1000;
      let allRows: any[] = [];
      let mainError: any = null;

      for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data, error } = await supabase
          .from('services')
          .select('*, environments!service_environment_links(id, name, slug, latitude, longitude, address, type, image_url)')
          .eq('provider_id', userId)
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
          mainError = error;
          break;
        }

        if (data) {
          allRows.push(...data);
          if (data.length < PAGE_SIZE) break;
        } else {
          break;
        }
      }

      let rows: any[] = allRows;
      if (mainError) {
        console.warn('fetchUserServices (relation query) failed:', mainError);

        let allLegacyRows: any[] = [];
        let legacyError_: any = null;

        for (let offset = 0; ; offset += PAGE_SIZE) {
          const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('provider_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + PAGE_SIZE - 1);

          if (error) {
            legacyError_ = error;
            break;
          }

          if (data) {
            allLegacyRows.push(...data);
            if (data.length < PAGE_SIZE) break;
          } else {
            break;
          }
        }

        if (legacyError_) {
          throw legacyError_;
        }

        const { data: fallbackLinks } = await supabase
          .from('service_environment_links')
          .select('service_id, environment_id, environments!inner(id, name, slug, latitude, longitude, address, type, image_url)')
          .in('service_id', (allLegacyRows || []).map((s: any) => s.id));

        const envByServiceId = new Map<string, any[]>();
        (fallbackLinks || []).forEach((link: any) => {
          const list = envByServiceId.get(link.service_id) || [];
          if (link.environments) list.push(link.environments);
          envByServiceId.set(link.service_id, list);
        });

        rows = (allLegacyRows || []).map((service: any) => ({
          ...service,
          environments: envByServiceId.get(service.id) || [],
        }));
      }

      const formatted = rows.map((s: any) => {
        const environmentsList: Array<{
          id?: string; name?: string; slug?: string; latitude?: number;
          longitude?: number; address?: string; type?: string; image_url?: string;
        }> = Array.isArray(s.environments) ? s.environments : [];
        const environment = environmentsList[0] || null;
        const linkedEnvs = environmentsList.map((e: any) => ({
          id: e.id || '',
          slug: e.slug || '',
          name: e.name || '',
          type: e.type || '',
          latitude: e.latitude,
          longitude: e.longitude,
          address: e.address || '',
          image: e.image_url || '',
        }));

        return {
          environmentName: environment?.name || '',
          environmentSlug: environment?.slug || '',
          environmentType: environment?.type || '',
          environmentLatitude: environment?.latitude,
          environmentLongitude: environment?.longitude,
          environmentAddress: environment?.address || '',
          environmentImage: environment?.image_url || '',
          latitude: s.latitude,
          longitude: s.longitude,
          id: s.id,
          slug: s.slug || generateSlug(s.title),
          title: s.title,
          description: s.description,
          category: s.category,
          image: s.image_url || '',
          images: normalizeArrayValue<string>(s.images_urls),
          provider: s.provider || 'Prestador',
          provider_id: s.provider_id,
          status: s.status as any,
          isActive: s.is_active,
          environmentId: environment?.id || null,
          environments: linkedEnvs.map((env) => ({
            id: env.id,
            slug: env.slug,
          })),
          linkedEnvironments: linkedEnvs,
          WhatsApp: s.whatsapp,
          instagram: s.instagram,
          cnpj: s.cnpj || '',
          frequency: s.frequency,
          menu: normalizeArrayValue<any>(s.menu),
          rating: s.rating ?? 0,
          reviews_count: s.reviews_count ?? 0,
          views: s.views ?? 0,
        };
      });

      setUserServices(formatted);
      fetchCacheRef.current.userServices.set(userId, {
        data: formatted,
        fetchedAt: Date.now(),
      });
    } catch (error) {
      console.error('fetchUserServices failed:', error);
    }
  };

  const refreshServices = async () => {
    fetchCacheRef.current.services = null;
    await fetchServices();

    if (user?.id) {
      fetchCacheRef.current.userServices.delete(user.id);
      await fetchUserServices(user.id);
    }
  };

  const addService = async (service: any) => {
    console.log('addService called', { service, user: !!user });
    if (!user) throw new Error("User not found");

    let resolvedEnvironmentId =
      typeof service.environmentId === 'string' && service.environmentId.length > 0
        ? service.environmentId
        : null;

    if (!resolvedEnvironmentId) {
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('environment_members')
        .select('environment_id, created_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (membershipsError) {
        throw membershipsError;
      }

      const membershipEnvironmentIds = Array.from(
        new Set(
          (membershipsData || [])
            .map((membership: any) => membership?.environment_id)
            .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0),
        ),
      );

      if (membershipEnvironmentIds.length === 0) {
        throw new Error('Voce precisa ter pelo menos 1 ambiente ativo em "Meus Ambientes" para publicar.');
      }

      const { data: activeEnvironments, error: activeEnvironmentsError } = await supabase
        .from('environments')
        .select('id')
        .in('id', membershipEnvironmentIds)
        .eq('status', 'active');

      if (activeEnvironmentsError) {
        throw activeEnvironmentsError;
      }

      const activeEnvironmentIds = new Set(
        (activeEnvironments || [])
          .map((env: any) => env?.id)
          .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0),
      );

      resolvedEnvironmentId =
        membershipEnvironmentIds.find((id) => activeEnvironmentIds.has(id)) ?? null;

if (!resolvedEnvironmentId) {
        throw new Error('Nenhum dos seus ambientes esta ativo para publicacao. Verifique "Meus Ambientes".');
      }
    }

    const normalizedNewTitle = (service.title || '').trim().toLowerCase();
    const normalizedNewDescription = (service.description || '').trim().toLowerCase();
    const normalizedNewCategory = (service.category || '').trim().toLowerCase();

    const { data: existingServices } = await supabase
      .from('services')
      .select('id, title, description, category, status')
      .eq('provider_id', user.id)
      .eq('is_active', true);

    if (existingServices && existingServices.length > 0) {
      const similarServices = existingServices.filter((s: any) => {
        const existingTitle = (s.title || '').trim().toLowerCase();
        const existingDescription = (s.description || '').trim().toLowerCase();
        const existingCategory = (s.category || '').trim().toLowerCase();
        
        const titleMatch = existingTitle === normalizedNewTitle;
        const descMatch = existingDescription === normalizedNewDescription;
        const categoryMatch = existingCategory === normalizedNewCategory;
        
        return titleMatch && descMatch && categoryMatch;
      });

      if (similarServices.length > 0) {
        console.warn('AVISO: Você já possui serviço(s) similar(es) criado(s):', 
          similarServices.map((s: any) => ({
            id: s.id,
            title: s.title,
            category: s.category,
            status: s.status
          }))
        );
      }
    }

    const { data: insertedService, error } = await supabase
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
        website_url: service.website || null,
        cnpj: service.cnpj || null,
        frequency: service.frequency,
        status: service.status || 'active',
        is_active: true,
        latitude:
          typeof service.latitude === 'number' && Number.isFinite(service.latitude)
            ? service.latitude
            : null,
        longitude:
          typeof service.longitude === 'number' && Number.isFinite(service.longitude)
            ? service.longitude
            : null,
        provider_id: user.id,
        provider: user.name || 'Prestador',
        publisher_type: service.publisherType || 'service_provider',
      }])
.select('id')
      .single();

    console.log('Service insert result:', { error });
    if (error) throw error;

    if (insertedService?.id && resolvedEnvironmentId) {
      const { error: linkError } = await supabase
        .from('service_environment_links')
        .insert({
          service_id: insertedService.id,
          environment_id: resolvedEnvironmentId,
          created_by: user.id,
        });

      if (
        linkError &&
        linkError?.code !== '23505' &&
        !isMissingServiceEnvironmentLinksError(linkError)
      ) {
        console.warn('addService default service_environment_links insert failed:', linkError);
      }
    }

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
    if (updatedFields.website !== undefined) payload.website_url = updatedFields.website || null;
    if (updatedFields.cnpj !== undefined) payload.cnpj = updatedFields.cnpj || null;
    if (updatedFields.frequency !== undefined) payload.frequency = updatedFields.frequency;
    if (updatedFields.status !== undefined) payload.status = updatedFields.status;
    if (updatedFields.isActive !== undefined) payload.is_active = updatedFields.isActive;
    if (updatedFields.latitude !== undefined) payload.latitude = updatedFields.latitude;
    if (updatedFields.longitude !== undefined) payload.longitude = updatedFields.longitude;
    const { error } = await supabase
      .from('services')
      .update(payload)
      .eq('id', id);

    if (error) throw error;

    if (updatedFields.environmentId !== undefined) {
      const newEnvId = typeof updatedFields.environmentId === 'string' && updatedFields.environmentId.length > 0
        ? updatedFields.environmentId
        : null;

      if (newEnvId) {
        const { error: linkError } = await supabase
          .from('service_environment_links')
          .upsert({ service_id: id, environment_id: newEnvId, created_by: user?.id },
            { onConflict: 'service_id,environment_id', ignoreDuplicates: true });
        if (linkError && linkError.code !== '23505') {
          console.warn('updateService: link upsert failed:', linkError);
        }
      }
    }
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
    const updateLocalViews = (newViews: number) => {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, views: newViews } : s)));
      setUserServices((prev) => prev.map((s) => (s.id === id ? { ...s, views: newViews } : s)));
    };

    const { data: rpcViews, error: rpcError } = await supabase.rpc('increment_service_views', {
      p_service_id: id,
    });

    if (!rpcError) {
      const newViews = typeof rpcViews === 'number' ? rpcViews : Number(rpcViews);
      if (rpcViews !== null && rpcViews !== undefined && Number.isFinite(newViews)) {
        updateLocalViews(newViews);
        return;
      }
    }

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
      updateLocalViews(newViews);
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
      const includeOwnerReplyColumns = reviewsHasOwnerReplyColumnRef.current !== false;
      let data: any;
      let error: any;
      try {
        ({ data, error } = (await withTimeout(
          supabase
            .from('reviews')
            .select(
              includeAvatarColumn
                ? includeOwnerReplyColumns
                  ? 'id, service_id, user_id, user_name, user_avatar, stars, comment, created_at, is_anonymous, approved, owner_reply, owner_reply_at, owner_reply_by'
                  : 'id, service_id, user_id, user_name, user_avatar, stars, comment, created_at, is_anonymous, approved'
                : includeOwnerReplyColumns
                  ? 'id, service_id, user_id, user_name, stars, comment, created_at, is_anonymous, approved, owner_reply, owner_reply_at, owner_reply_by'
                  : 'id, service_id, user_id, user_name, stars, comment, created_at, is_anonymous, approved'
            )
             .eq('service_id', serviceId)
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
               .select(
                 reviewsHasOwnerReplyColumnRef.current === false
                   ? 'id, service_id, user_id, user_name, stars, comment, created_at, is_anonymous, approved'
                   : 'id, service_id, user_id, user_name, stars, comment, created_at, is_anonymous, approved, owner_reply, owner_reply_at, owner_reply_by'
               )
               .eq('service_id', serviceId)
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

      if (error && isMissingColumnError(error, 'owner_reply')) {
        reviewsHasOwnerReplyColumnRef.current = false;
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
      if (!error && includeOwnerReplyColumns) {
        reviewsHasOwnerReplyColumnRef.current = true;
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
          owner_reply: r.owner_reply,
          owner_reply_at: r.owner_reply_at,
          owner_reply_by: r.owner_reply_by,
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
        ? 'id, service_id, user_id, user_name, user_avatar, stars, comment, created_at, is_anonymous, approved, owner_reply, owner_reply_at, owner_reply_by'
        : 'id, service_id, user_id, user_name, stars, comment, created_at, is_anonymous, approved, owner_reply, owner_reply_at, owner_reply_by';
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

    if (error && isMissingColumnError(error, 'owner_reply')) {
      reviewsHasOwnerReplyColumnRef.current = false;
      const selectWithoutReply = (includeAvatar: boolean) =>
        includeAvatar
          ? 'id, service_id, user_id, user_name, user_avatar, stars, comment, created_at, is_anonymous, approved'
          : 'id, service_id, user_id, user_name, stars, comment, created_at, is_anonymous, approved';
      const tryInsertWithoutReply = (payload: typeof basePayload, includeAvatar: boolean) =>
        supabase.from('reviews').insert(payload).select(selectWithoutReply(includeAvatar)).single();

      insertResult = await withTimeout(
        tryInsertWithoutReply(
          reviewsHasUserAvatarColumnRef.current === false ? basePayload : { ...basePayload, user_avatar: user.avatar },
          reviewsHasUserAvatarColumnRef.current !== false
        ),
        15000,
        'Tempo esgotado ao enviar avaliação'
      );
      ({ data, error } = insertResult as { data: any; error: any });
    }

    if (!error && reviewsHasUserAvatarColumnRef.current !== false) {
      reviewsHasUserAvatarColumnRef.current = true;
    }
    if (!error && reviewsHasOwnerReplyColumnRef.current !== false) {
      reviewsHasOwnerReplyColumnRef.current = true;
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
          owner_reply: data.owner_reply,
          owner_reply_at: data.owner_reply_at,
          owner_reply_by: data.owner_reply_by,
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

  const replyToReview = async (reviewId: string, reply: string): Promise<Review | null> => {
    if (!user) throw new Error('User must be logged in');

    const normalizedReply = reply.trim();
    if (!normalizedReply) {
      throw new Error('A resposta não pode ficar vazia.');
    }

    const { data, error } = (await withTimeout(
      supabase.rpc('reply_to_review', {
        p_review_id: reviewId,
        p_reply: normalizedReply,
      }),
      15000,
      'Tempo esgotado ao salvar resposta'
    )) as { data: any; error: any };

    if (error) {
      console.warn('replyToReview failed:', error);
      throw toUserFriendlyReviewError(error);
    }

    const updatedReview: Review | null = data
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
          owner_reply: data.owner_reply,
          owner_reply_at: data.owner_reply_at,
          owner_reply_by: data.owner_reply_by,
        }
      : null;

    if (updatedReview?.service_id) {
      setServiceReviews((prev) => {
        const serviceId = updatedReview.service_id as string;
        const current = Array.isArray(prev[serviceId]) ? prev[serviceId] : [];
        const nextForService = current.map((review) =>
          review.id === updatedReview.id ? updatedReview : review
        );
        return { ...prev, [serviceId]: nextForService };
      });
    }

    return updatedReview;
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
      servicesLoading,
      refreshServices,
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
      replyToReview,
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



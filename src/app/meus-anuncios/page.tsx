'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useApp } from '@/hooks/useApp';
import { usePublishModal } from '@/contexts/PublishModalContext';
import { supabase } from '@/lib/supabase';
import {
  AUTO_APPROVAL_RADIUS_KM,
  calculateDistanceKm,
  isWithinAutoApprovalRadius,
  getEnvironmentAvailabilityState,
  resolveEnvironmentAccessDecision,
} from '@/lib/environment-rules';
import type { Environment } from '@/types';

const TYPE_LABELS: Record<Environment['type'], string> = {
  residential: 'Residencial',
  church: 'Igreja',
  club: 'Clube',
  association: 'Associação',
};

const formatDistanceValue = (distance: number | null) => {
  if (distance === null) return 'Localização pendente';
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  return `${distance.toFixed(1)}km`;
};

type AffiliationRecord = {
  id: string;
  environmentId: string;
  role: 'member' | 'moderator' | null;
  status: 'active' | 'pending' | 'banned';
  createdAt?: string;
};

const getStatusRank = (status?: AffiliationRecord['status']) => {
  switch (status) {
    case 'active':
      return 0;
    case 'pending':
      return 1;
    case 'banned':
      return 2;
    default:
      return 3;
  }
};

export default function MyAdsPage() {
  const router = useRouter();
  const {
    userServices,
    fetchUserServices,
    toggleServiceStatus,
    removeService,
    user,
    setSelectedEnvironments,
    setSelectedEnvironment,
  } = useApp();
  const { open } = usePublishModal();
  const [mounted, setMounted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<typeof userServices[0] | null>(null);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [tempSelectedEnvs, setTempSelectedEnvs] = useState<string[]>([]);
  const [modalEnvSearch, setModalEnvSearch] = useState('');
  const [environmentSearch, setEnvironmentSearch] = useState('');
  const [affiliations, setAffiliations] = useState<Record<string, AffiliationRecord>>({});
  const [affiliationLoading, setAffiliationLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [requestingEnvId, setRequestingEnvId] = useState<string | null>(null);
  const [allEnvironments, setAllEnvironments] = useState<Environment[]>([]);
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user?.id) {
      fetchUserServices(user.id);
    }
  }, [mounted, user?.id, fetchUserServices]);

  const fetchAffiliations = useCallback(async () => {
    if (!user?.id) {
      setAffiliations({});
      return;
    }
    setAffiliationLoading(true);
    const { data, error } = await supabase
      .from('environment_members')
      .select('id, status, role, environment_id')
      .eq('user_id', user.id);

    if (data && !error) {
      const payload: Record<string, AffiliationRecord> = {};
      data.forEach((record: any) => {
        payload[record.environment_id] = {
          id: record.id,
          environmentId: record.environment_id,
          role: record.role,
          status: record.status,
          createdAt: record.created_at,
        };
      });
      setAffiliations(payload);
    } else if (error) {
      console.error('Erro ao carregar afiliações', error);
    }
    setAffiliationLoading(false);
  }, [user?.id]);

  const fetchAllEnvironments = useCallback(async () => {
    setEnvironmentsLoading(true);

    const { data, error } = await supabase
      .from('environments')
      .select('*')
      .order('name');

    if (data && !error) {
      const formatted = data.map((e: any) => ({
        id: e.id,
        name: e.name,
        slug: e.slug || e.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
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
      setAllEnvironments(formatted);
    } else if (error) {
      console.error('Erro ao carregar ambientes', error);
      setAllEnvironments([]);
    }

    setEnvironmentsLoading(false);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setAffiliations({});
      return;
    }
    fetchAffiliations();
  }, [user?.id, fetchAffiliations]);

  useEffect(() => {
    fetchAllEnvironments();
  }, [fetchAllEnvironments]);

  useEffect(() => {
    const handleVisibilityRefresh = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState !== 'visible' || !user?.id) return;
      void fetchAffiliations();
      void fetchAllEnvironments();
    };

    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('focus', handleVisibilityRefresh);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);

    return () => {
      window.removeEventListener('focus', handleVisibilityRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    };
  }, [fetchAffiliations, fetchAllEnvironments, user?.id]);

  const syncEnvironmentMembership = useCallback(
    async (envId: string, status: 'active' | 'pending') => {
      if (!user?.id) {
        throw new Error('Usuário não logado');
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
    [user?.id],
  );

  const handleRefreshLocation = () => {
    if (locationLoading) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocalização indisponível neste dispositivo.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(null);
        setLocationLoading(false);
      },
      (err) => {
        setLocationError(err.message || 'Não foi possível obter sua localização.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000 },
    );
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      handleRefreshLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!statusNotice) return;
    const timer = setTimeout(() => setStatusNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [statusNotice]);

  const getEnvDistance = useCallback(
    (env: Environment) => {
      if (!env.latitude || !env.longitude || !userLocation) return null;
      return calculateDistanceKm(userLocation.lat, userLocation.lng, env.latitude, env.longitude);
    },
    [userLocation],
  );

  const membershipSummary = useMemo(() => {
    const summary = { active: 0, pending: 0, banned: 0 };
    Object.values(affiliations).forEach((entry) => {
      if (entry.status === 'active') summary.active += 1;
      else if (entry.status === 'pending') summary.pending += 1;
      else if (entry.status === 'banned') summary.banned += 1;
    });
    return summary;
  }, [affiliations]);

  const environmentById = useMemo(() => {
    const map: Record<string, Environment> = {};
    allEnvironments.forEach((env) => {
      if (env.id) {
        map[env.id] = env;
      }
    });
    return map;
  }, [allEnvironments]);

  const filteredEnvironments = useMemo(() => {
    const term = environmentSearch.trim().toLowerCase();
    if (!term) return allEnvironments;
    return allEnvironments.filter((env) => {
      const label = TYPE_LABELS[env.type] ?? 'Ambiente';
      return env.name.toLowerCase().includes(term) || label.toLowerCase().includes(term);
    });
  }, [allEnvironments, environmentSearch]);

  const sortedEnvironments = useMemo(() => {
    return [...filteredEnvironments].sort((a, b) => {
      const rankA = getStatusRank(affiliations[a.id]?.status);
      const rankB = getStatusRank(affiliations[b.id]?.status);
      if (rankA !== rankB) return rankA - rankB;
      const distanceA = getEnvDistance(a);
      const distanceB = getEnvDistance(b);
      if (distanceA === null && distanceB === null) return 0;
      if (distanceA === null) return 1;
      if (distanceB === null) return -1;
      return distanceA - distanceB;
    });
  }, [affiliations, filteredEnvironments, getEnvDistance]);

  const myEnvironments = useMemo(() => {
    return allEnvironments
      .filter((env) => {
        const membership = affiliations[env.id];
        return membership?.role === 'member';
      })
      .sort((a, b) => {
        const rankA = getStatusRank(affiliations[a.id]?.status);
        const rankB = getStatusRank(affiliations[b.id]?.status);
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
      });
  }, [allEnvironments, affiliations]);

  const locationStatusText = locationLoading
    ? 'Atualizando localização...'
    : locationError
      ? locationError
      : userLocation
        ? 'Distâncias recalculadas com base na sua posição.'
        : 'Permita o acesso à localização para ver as distâncias.';

  const handleJoinEnvironment = async (env: Environment) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setRequestingEnvId(env.id);
    try {
      const accessDecision = resolveEnvironmentAccessDecision(env);
      const distance = getEnvDistance(env);
      const inRadius = isWithinAutoApprovalRadius(distance);

      if (accessDecision.mode === 'moderator') {
        await syncEnvironmentMembership(env.id, 'pending');
        setStatusNotice(`Solicitação enviada para ${env.name}. Aguarde a aprovação da liderança.`);
      } else if (accessDecision.mode === 'radius') {
        if (!inRadius) {
          setStatusNotice(`Você precisa estar dentro de ${AUTO_APPROVAL_RADIUS_KM * 1000}m para liberar este ambiente.`);
          return;
        }

        await syncEnvironmentMembership(env.id, 'active');
        setStatusNotice(`Acesso liberado para ${env.name}. Você está dentro do raio de ${AUTO_APPROVAL_RADIUS_KM * 1000}m.`);
      } else {
        await syncEnvironmentMembership(env.id, 'active');
        setStatusNotice(`Acesso liberado automaticamente para ${env.name}.`);
      }

      await fetchAffiliations();
    } catch (error: any) {
      console.error(error);
      setStatusNotice(error?.message || 'Erro ao solicitar afiliação.');
    } finally {
      setRequestingEnvId(null);
    }
  };

  const handleNewService = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (environmentsLoading) {
      return;
    }
    if (allEnvironments.length === 0) {
      router.push('/places');
      return;
    }
    open();
  };

  const toggleTempEnv = (envId: string) => {
    if (tempSelectedEnvs.includes(envId)) {
      setTempSelectedEnvs(tempSelectedEnvs.filter((id) => id !== envId));
    } else {
      setTempSelectedEnvs([...tempSelectedEnvs, envId]);
    }
  };

  const confirmEnvSelection = () => {
    const selected = allEnvironments.filter((e) => tempSelectedEnvs.includes(e.id));
    setSelectedEnvironments(selected);
    setShowEnvModal(false);
    router.push('/register-service');
  };

  const modalFilteredEnvs = allEnvironments.filter((e) =>
    e.name.toLowerCase().includes(modalEnvSearch.toLowerCase()),
  );

  const activeServices = userServices.filter((s) => s.isActive).length;
  const totalViews = userServices.reduce((acc, s) => acc + (s.views || 0), 0);

  const handleToggleStatus = (serviceId: string) => {
    toggleServiceStatus(serviceId);
    if (user?.id) {
      fetchUserServices(user.id);
    }
  };

  const handleDeleteClick = (service: typeof userServices[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      removeService(serviceToDelete.id);
      setShowDeleteModal(false);
      setServiceToDelete(null);
      if (user?.id) {
        fetchUserServices(user.id);
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      <header className="fixed top-0 w-full z-50 bg-white/85 backdrop-blur-xl flex items-center justify-between px-4 h-16 md:border-b md:border-slate-200">
        <div className="flex items-center gap-3 max-w-7xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="hover:bg-slate-100/50 rounded-full transition-colors p-2 active:scale-95 duration-200 text-primary"
          >
            <Icon icon="arrow_back" size={24} />
          </button>
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">Meus Anúncios</h1>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {mounted && user ? (
            <button
              onClick={() => router.push('/profile')}
              className="hover:scale-105 transition-transform active:scale-95 ml-1"
            >
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

      <main className="pt-20 px-4 md:px-8 max-w-3xl mx-auto space-y-6 pb-[140px] md:pb-[110px]">
        <section className="space-y-4">
          <div className="space-y-4 rounded-3xl border border-outline-variant/10 bg-surface-container-lowest p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-on-surface">Escolha o ambiente para publicar.</h2>
              </div>
              <button
                onClick={handleNewService}
                className="primary-gradient text-white text-xs rounded-full px-4 py-2 font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                Adicionar Ambiente
              </button>
            </div>

            {statusNotice && (
              <div className="rounded-2xl border border-primary/20 bg-surface-container-high p-3 text-sm text-primary">
                {statusNotice}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-on-surface-variant">Meus Ambientes</h2>
            <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">
              {myEnvironments.length} itens
            </span>
          </div>

          {environmentsLoading || affiliationLoading ? (
            <div className="rounded-3xl border border-dashed border-outline-variant/30 bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
              Carregando seus ambientes...
            </div>
          ) : myEnvironments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-outline-variant/30 bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
              Nenhum ambiente solicitado ainda. Quando você pedir acesso a uma igreja ou outro local, ele vai aparecer aqui.
            </div>
          ) : (
            <div className="space-y-3">
              {myEnvironments.map((env) => {
                const envFlags = env as Environment & {
                  requiresModeratorApproval?: boolean;
                  requiresRadiusValidation?: boolean;
                };
                const membership = affiliations[env.id];
                const isPending = membership?.status === 'pending';
                const isActive = membership?.status === 'active';
                const isBanned = membership?.status === 'banned';
                const badgeClass = isPending
                  ? 'bg-amber-100 text-amber-700'
                  : isActive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700';
                const badgeLabel = isPending
                  ? 'Aguardando aprovação'
                  : isActive
                    ? 'Ativo'
                    : 'Bloqueado';
                const statusMessage = isPending
                  ? envFlags.requiresModeratorApproval || env.type === 'church'
                    ? 'Seu pedido está aguardando a aprovação do moderador.'
                    : 'Seu pedido está aguardando a validação do raio.'
                  : isActive
                    ? 'Esse ambiente já está liberado para publicar.'
                    : 'Seu acesso foi bloqueado neste ambiente.';

                return (
                  <article
                    key={env.id}
                    className="rounded-3xl border border-outline-variant/20 bg-white/70 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                          {env.image ? (
                            <img src={env.image} alt={env.name} className="w-full h-full object-cover" />
                          ) : (
                            <Icon icon="domain" size={24} className="text-on-surface-variant" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-on-surface truncate">{env.name}</h3>
                          <p className="text-xs text-on-surface-variant">
                            {TYPE_LABELS[env.type] ?? 'Ambiente'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeClass}`}
                      >
                        {badgeLabel}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-on-surface-variant">{statusMessage}</p>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                       <div className="text-xs text-on-surface-variant">
                         <span className="font-semibold text-on-surface">Aprovação:</span>{' '}
                         {envFlags.requiresModeratorApproval || env.type === 'church'
                           ? 'Moderador'
                           : envFlags.requiresRadiusValidation
                             ? 'Raio automático'
                             : 'Acesso livre'}
                       </div>

                      {isActive && (
                        <button
                          onClick={() => {
                            setSelectedEnvironment(env);
                            router.push('/register-service');
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white active:scale-95 transition"
                        >
                          <Icon icon="add" size={18} />
                          Publicar aqui
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-on-surface-variant px-1">Gerenciar Catálogo</h2>

          {userServices.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-outline-variant/30 p-8 text-center text-on-surface-variant">
              Nenhum serviço cadastrado. Use o botão "+" na barra inferior para anunciar.
            </div>
          ) : (
            <>
              {userServices.map((service) => {
                const serviceEnvironment = service.environmentId ? environmentById[service.environmentId] : null;

                const serviceAvailability = serviceEnvironment
                  ? getEnvironmentAvailabilityState(serviceEnvironment, {
                      membershipStatus: service.status === 'active' ? 'active' : 'pending',
                      hasLocation: !!userLocation,
                      distanceKm: getEnvDistance(serviceEnvironment),
                    })
                  : {
                      status: service.status === 'active' ? 'active' : 'pending',
                      label: service.status === 'active' ? 'Ativo' : 'Aguardando aprovação',
                      reason:
                        service.status === 'active'
                          ? 'Este serviço está ativo no ambiente selecionado.'
                          : 'Este serviço está aguardando aprovação.',
                    };

                const isAwaitingServiceApproval = service.status === 'pending';
                const serviceBadgeLabel = isAwaitingServiceApproval
                  ? 'Aguardando aprovação'
                  : service.isActive
                    ? 'Ativo'
                    : 'Pausado';

                const serviceBadgeClass = isAwaitingServiceApproval
                  ? 'bg-amber-100 text-amber-700'
                  : service.isActive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-surface-container-highest text-on-surface-variant';

                const serviceReason = isAwaitingServiceApproval
                  ? serviceAvailability.reason
                  : service.isActive
                    ? serviceAvailability.reason
                    : 'Este serviço está pausado manualmente.';

                return (
                  <div
                    key={service.id}
                    className={`bg-surface-container-lowest rounded-3xl p-4 flex flex-col gap-4 border border-outline-variant/10 ${
                      !service.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface-container flex-shrink-0">
                        <img
                          className={`w-full h-full object-cover ${!service.isActive ? 'grayscale' : ''}`}
                          src={service.image || 'https://via.placeholder.com/150'}
                          alt={service.title}
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-on-surface leading-tight">{service.title}</h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter flex-shrink-0 ${serviceBadgeClass}`}
                            >
                              {serviceBadgeLabel}
                            </span>
                          </div>

                          {service.isActive && serviceEnvironment && !isAwaitingServiceApproval && (
                            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/20 px-3 py-1 text-[11px] font-semibold text-primary">
                              <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                              {serviceEnvironment.name}
                            </p>
                          )}

                          <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">{service.description}</p>
                          <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant">
                            {serviceReason}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-on-surface-variant font-medium">Ativar / Pausar</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={service.isActive || false}
                              onChange={() => handleToggleStatus(service.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => router.push(`/register-service?id=${service.id}`)}
                        className="flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-2xl text-on-surface font-semibold text-sm hover:bg-surface-container transition-colors active:scale-95"
                      >
                        <Icon icon="edit" weight={400} size={20} />
                        Editar
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(service, e)}
                        className="flex items-center justify-center gap-2 py-3 bg-error-container/20 rounded-2xl text-error font-semibold text-sm hover:bg-error-container/30 transition-colors active:scale-95"
                      >
                        <Icon icon="delete" weight={400} size={20} />
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </section>
      </main>

      {showEnvModal && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full md:max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-outline-variant/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-on-surface text-lg">Publicar em</h3>
                <button
                  onClick={() => setShowEnvModal(false)}
                  className="p-2 hover:bg-surface-container rounded-full"
                >
                  <Icon icon="close" size={24} />
                </button>
              </div>
              <p className="text-on-surface-variant text-sm">Selecione um ou mais ambientes para publicar seu serviço</p>
            </div>

            <div className="p-4 border-b border-outline-variant/10">
              <div className="relative">
                <Icon
                  icon="search"
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="text"
                  placeholder="Buscar ambientes..."
                  value={modalEnvSearch}
                  onChange={(e) => setModalEnvSearch(e.target.value)}
                  className="w-full bg-surface-container-highest rounded-full py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {modalFilteredEnvs.length === 0 ? (
                <p className="text-center text-on-surface-variant py-8">Nenhum ambiente encontrado</p>
              ) : (
                modalFilteredEnvs.map((env) => (
                  <div
                    key={env.id}
                    onClick={() => toggleTempEnv(env.id)}
                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors ${
                      tempSelectedEnvs.includes(env.id)
                        ? 'bg-primary/5 border border-primary/20'
                        : 'bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                        tempSelectedEnvs.includes(env.id)
                          ? 'border-primary bg-primary'
                          : 'border-outline-variant'
                      }`}
                    >
                      {tempSelectedEnvs.includes(env.id) && (
                        <Icon icon="check" size={14} className="text-white" weight={700} />
                      )}
                    </div>

                    {env.image ? (
                      <img src={env.image} alt={env.name} className="w-10 h-10 rounded-full object-cover mr-3" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center mr-3">
                        <Icon icon="domain" size={20} className="text-on-surface-variant" />
                      </div>
                    )}

                    <div className="flex-1">
                      <p className="font-semibold text-on-surface text-sm">{env.name}</p>
                      <p className="text-xs text-on-surface-variant">{env.members} membros</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-outline-variant/10">
              <button
                onClick={confirmEnvSelection}
                disabled={tempSelectedEnvs.length === 0}
                className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 ${
                  tempSelectedEnvs.length > 0
                    ? 'primary-gradient text-white shadow-lg shadow-primary/20'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <Icon icon="arrow_forward" size={20} />
                Continuar ({tempSelectedEnvs.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && serviceToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-error-container/30 flex items-center justify-center">
                <Icon icon="delete" weight={400} size={32} className="text-error" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Excluir Serviço</h3>
                <p className="text-on-surface-variant text-sm">{serviceToDelete.title}</p>
              </div>
            </div>
            <p className="text-on-surface-variant mb-6">
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-full border-2 border-surface-variant text-on-surface-variant font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-full bg-error text-white font-bold"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

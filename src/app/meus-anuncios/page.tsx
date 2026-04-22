"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopAppBar } from "@/components/TopAppBar";
import { Icon } from "@/components/Icon";
import { useApp } from "@/hooks/useApp";
import { usePublishModal } from "@/contexts/PublishModalContext";
import { supabase } from "@/lib/supabase";
import type { Environment, Service } from "@/types";
import type { PublicationMode } from "@/lib/plan-rules";

type LinkedMembership = {
  id: string;
  environmentId: string;
  role: "member" | "moderator" | null;
  accessType: PublicationMode | null;
  status: "active" | "pending" | "banned";
};

type LinkedEnvironment = {
  environment: Environment;
  membership: LinkedMembership;
};

const TYPE_LABELS: Record<string, string> = {
  residential: "Residencial",
  church: "Igreja",
  club: "Clube",
  association: "Associacao",
};

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeEnvironmentRecord = (env: any): Environment => ({
  id: env.id,
  name: env.name,
  slug: env.slug || normalizeSlug(env.name ?? env.id ?? ""),
  type: env.type,
  members: Number(env.members_count ?? 0),
  image: env.image_url || "",
  latitude: env.latitude,
  longitude: env.longitude,
  requiresModeratorApproval: Boolean(env.requires_moderator_approval),
  requiresRadiusValidation: Boolean(env.requires_radius_validation),
});

const getStatusBadge = (status: LinkedMembership["status"]) => {
  if (status === "active") {
    return "border-[#30CC36]/20 bg-[#30CC36]/10 text-[#30CC36]";
  }

  if (status === "pending") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700";
  }

  return "border-error/20 bg-error/10 text-error";
};

const isMissingRelationError = (error: any) => {
  const message = String(error?.message || "").toLowerCase();
  return error?.code === "42P01" || message.includes("service_environment_links");
};

export default function MyAdsPage() {
  const router = useRouter();
  const { open } = usePublishModal();
  const {
    user,
    services,
    servicesLoading,
    removeService,
    updateService,
    selectedEnvironments,
  } = useApp();

  const [mounted, setMounted] = useState(false);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [linkedLoading, setLinkedLoading] = useState(false);
  const [linkedLoaded, setLinkedLoaded] = useState(false);
  const [linkedEnvironments, setLinkedEnvironments] = useState<LinkedEnvironment[]>([]);
  const [serviceLinkedEnvironmentIds, setServiceLinkedEnvironmentIds] = useState<Record<string, string[]>>({});
  const [linkingKey, setLinkingKey] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedEnvironmentMap = useMemo(() => {
    const map: Record<string, Environment> = {};
    selectedEnvironments.forEach((env) => {
      map[env.id] = env;
    });
    return map;
  }, [selectedEnvironments]);

  const userServices = useMemo(() => {
    if (!user?.id) return [];
    return services
      .filter((service) => service.provider_id === user.id)
      .sort((a, b) => {
        const dateA = new Date((a as any).created_at || 0).getTime();
        const dateB = new Date((b as any).created_at || 0).getTime();
        return dateB - dateA;
      });
  }, [services, user?.id]);

  const activeServices = useMemo(
    () => userServices.filter((service) => service.status === "active").length,
    [userServices],
  );

  const pendingServices = useMemo(
    () => userServices.filter((service) => service.status === "pending").length,
    [userServices],
  );

  const createFallbackLinkMap = useCallback(() => {
    const next: Record<string, string[]> = {};
    userServices.forEach((service) => {
      if (service.environmentId) {
        next[service.id] = [service.environmentId];
      }
    });
    return next;
  }, [userServices]);

  const fetchLinkedEnvironments = useCallback(async () => {
    if (!user?.id) {
      setLinkedEnvironments([]);
      return;
    }

    const { data: membersData, error: membersError } = await supabase
      .from("environment_members")
      .select("id, status, role, access_type, environment_id")
      .eq("user_id", user.id)
      .in("status", ["active", "pending"]);

    if (membersError) {
      console.error("fetchLinkedEnvironments failed:", membersError);
      setLinkedEnvironments([]);
      return;
    }

    const envCache: Record<string, Environment> = {
      ...selectedEnvironmentMap,
    };
    const missingEnvIds = new Set<string>();
    const memberships: LinkedMembership[] = [];

    (membersData ?? []).forEach((record: any) => {
      if (!record?.environment_id) return;

      memberships.push({
        id: record.id,
        environmentId: record.environment_id,
        role: record.role,
        accessType: record.access_type ?? null,
        status: record.status,
      });

      if (!envCache[record.environment_id]) {
        missingEnvIds.add(record.environment_id);
      }
    });

    if (missingEnvIds.size > 0) {
      const { data: missingEnvRecords } = await supabase
        .from("environments")
        .select("*")
        .in("id", Array.from(missingEnvIds));

      missingEnvRecords?.forEach((env) => {
        const normalizedEnv = normalizeEnvironmentRecord(env);
        envCache[env.id] = normalizedEnv;
      });
    }

    const linkedPayload: LinkedEnvironment[] = memberships
      .map((membership) => {
        const environment = envCache[membership.environmentId];
        if (!environment) return null;
        return {
          environment,
          membership,
        };
      })
      .filter((item): item is LinkedEnvironment => Boolean(item))
      .sort((a, b) => a.environment.name.localeCompare(b.environment.name));

    setLinkedEnvironments(linkedPayload);
  }, [selectedEnvironmentMap, user?.id]);

  const fetchServiceEnvironmentLinks = useCallback(async () => {
    const fallback = createFallbackLinkMap();
    const serviceIds = userServices.map((service) => service.id);

    if (serviceIds.length === 0) {
      setServiceLinkedEnvironmentIds({});
      setLinkedLoaded(true);
      return;
    }

    const { data, error } = await supabase
      .from("service_environment_links")
      .select("service_id, environment_id")
      .in("service_id", serviceIds);

    if (error) {
      if (!isMissingRelationError(error)) {
        console.error("fetchServiceEnvironmentLinks failed:", error);
      }
      setServiceLinkedEnvironmentIds(fallback);
      setLinkedLoaded(true);
      return;
    }

    const next: Record<string, string[]> = { ...fallback };
    (data || []).forEach((row: any) => {
      const serviceId = row?.service_id;
      const environmentId = row?.environment_id;
      if (typeof serviceId !== "string" || typeof environmentId !== "string") return;
      if (!next[serviceId]) next[serviceId] = [];
      if (!next[serviceId].includes(environmentId)) {
        next[serviceId].push(environmentId);
      }
    });

    setServiceLinkedEnvironmentIds(next);
    setLinkedLoaded(true);
  }, [createFallbackLinkMap, userServices]);

  useEffect(() => {
    setServiceLinkedEnvironmentIds((prev) => {
      const fallback = createFallbackLinkMap();
      const merged: Record<string, string[]> = { ...fallback };

      Object.entries(prev).forEach(([serviceId, envIds]) => {
        if (!merged[serviceId]) return;
        const nextIds = Array.from(new Set([...(merged[serviceId] || []), ...envIds]));
        merged[serviceId] = nextIds;
      });

      return merged;
    });
  }, [createFallbackLinkMap]);

  const handleToggleLinkedForService = async (serviceId: string) => {
    const nextServiceId = expandedServiceId === serviceId ? null : serviceId;
    setExpandedServiceId(nextServiceId);

    if (!nextServiceId) return;

    setLinkedLoading(true);
    try {
      await Promise.all([fetchLinkedEnvironments(), fetchServiceEnvironmentLinks()]);
    } finally {
      setLinkedLoading(false);
    }
  };

  const handleToggleServiceEnvironment = async (
    service: Service,
    targetEnvironmentId: string,
    isCurrentlyLinked: boolean,
  ) => {
    if (!user?.id) return;

    const currentLinks = serviceLinkedEnvironmentIds[service.id] ?? (service.environmentId ? [service.environmentId] : []);
    const actionKey = `${service.id}:${targetEnvironmentId}`;
    setLinkingKey(actionKey);

    try {
      if (isCurrentlyLinked) {
        if (currentLinks.length <= 1) {
          setStatusNotice("Cada anuncio precisa manter pelo menos 1 ambiente vinculado.");
          setTimeout(() => setStatusNotice(null), 2500);
          return;
        }

        let nextPrimaryEnvironmentId = service.environmentId ?? null;
        if (service.environmentId === targetEnvironmentId) {
          nextPrimaryEnvironmentId = currentLinks.find((id) => id !== targetEnvironmentId) ?? null;
          if (!nextPrimaryEnvironmentId) {
            setStatusNotice("Nao foi possivel definir um novo ambiente principal.");
            setTimeout(() => setStatusNotice(null), 2500);
            return;
          }
          await updateService(service.id, { environmentId: nextPrimaryEnvironmentId });
        }

        const { error: deleteError } = await supabase
          .from("service_environment_links")
          .delete()
          .eq("service_id", service.id)
          .eq("environment_id", targetEnvironmentId);

        if (deleteError && !isMissingRelationError(deleteError)) {
          throw deleteError;
        }

        setServiceLinkedEnvironmentIds((prev) => {
          const next = { ...prev };
          next[service.id] = (next[service.id] || []).filter((id) => id !== targetEnvironmentId);
          if (next[service.id].length === 0 && nextPrimaryEnvironmentId) {
            next[service.id] = [nextPrimaryEnvironmentId];
          }
          return next;
        });

        setStatusNotice("Ambiente desvinculado do anuncio.");
      } else {
        const { error: upsertError } = await supabase
          .from("service_environment_links")
          .upsert(
            {
              service_id: service.id,
              environment_id: targetEnvironmentId,
              created_by: user.id,
            },
            { onConflict: "service_id,environment_id" },
          );

        if (upsertError) {
          if (isMissingRelationError(upsertError)) {
            await updateService(service.id, { environmentId: targetEnvironmentId });
            setServiceLinkedEnvironmentIds((prev) => ({
              ...prev,
              [service.id]: [targetEnvironmentId],
            }));
            setStatusNotice("Seu banco ainda esta em modo 1 ambiente. Ambiente principal atualizado.");
            return;
          }
          throw upsertError;
        }

        setServiceLinkedEnvironmentIds((prev) => {
          const next = { ...prev };
          const current = next[service.id] || (service.environmentId ? [service.environmentId] : []);
          next[service.id] = Array.from(new Set([...current, targetEnvironmentId]));
          return next;
        });

        setStatusNotice("Ambiente vinculado ao anuncio.");
      }
    } catch (error) {
      console.error("Error toggling service environment link:", error);
      setStatusNotice("Nao foi possivel atualizar os ambientes do anuncio.");
    } finally {
      setLinkingKey(null);
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    const confirmed = confirm("Deseja excluir este anuncio?");
    if (!confirmed) return;

    try {
      await removeService(serviceId);
      setStatusNotice("Anuncio removido com sucesso.");
    } catch (error) {
      console.error("Error removing service:", error);
      setStatusNotice("Nao foi possivel remover este anuncio.");
    } finally {
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden pb-24">
      <TopAppBar />

      <main className="pt-24 px-4 md:px-8 max-w-6xl mx-auto space-y-8 pb-32">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-primary/10 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-[#30cc36]/[0.08] p-6 shadow-sm md:p-8">
          <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-24 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                Painel de anúncios
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-on-surface md:text-5xl">
                Meus anúncios
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant md:text-base">
                Agora cada anúncio pode ser vinculado a varios ambientes.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-outline-variant/10 bg-background/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant shadow-sm">
                  {userServices.length} anúncios
                </span>
                <span className="inline-flex items-center rounded-full border border-outline-variant/10 bg-background/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant shadow-sm">
                  {activeServices} ativos
                </span>
                {pendingServices > 0 && (
                  <span className="inline-flex items-center rounded-full border border-outline-variant/10 bg-background/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant shadow-sm">
                    {pendingServices} pendentes
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/register-service")}
              className="w-full md:w-auto rounded-full px-6 py-4 text-sm font-black uppercase tracking-wide text-white shadow-2xl shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-95 primary-gradient"
            >
              Novo anúncio
            </button>
          </div>
        </section>

        {!user ? (
          <section className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-8 text-center space-y-4">
            <Icon icon="lock" size={40} className="mx-auto text-on-surface-variant/50" />
            <h3 className="text-xl font-black text-on-surface">Entre para ver seus anuncios</h3>
            <p className="text-sm text-on-surface-variant">
              Faca login para gerenciar seus anúncios e vincular ambientes.
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 bg-[#30cc36] text-white text-sm font-black"
            >
              <Icon icon="login" size={18} />
              Entrar
            </button>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-primary/70">Meus anuncios</h3>
              <span className="text-[9px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest border border-primary/10">
                {userServices.length} total
              </span>
            </div>

            {servicesLoading ? (
              <div className="py-20 flex justify-center flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#30cc36] border-t-transparent"></div>
                <p className="text-xs font-black uppercase tracking-widest text-primary/40">
                  Carregando seus anuncios...
                </p>
              </div>
            ) : userServices.length === 0 ? (
              <div className="rounded-[2rem] border-2 border-dashed border-outline-variant/10 py-16 text-center bg-surface-container-low/20">
                <Icon icon="post_add" size={56} className="mx-auto mb-4 opacity-10 text-primary" />
                <h4 className="text-xl font-black text-on-surface/50">Voce ainda nao tem anuncios</h4>
                <p className="text-sm text-on-surface-variant/70 font-medium max-w-md mx-auto mt-2">
                  Clique em "Novo anuncio" para publicar seu primeiro servico.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {userServices.map((service) => {
                  const linkedIds = serviceLinkedEnvironmentIds[service.id] ?? (service.environmentId ? [service.environmentId] : []);
                  const linkedSet = new Set(linkedIds);

                  return (
                    <article
                      key={service.id}
                      className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 shadow-sm overflow-hidden flex flex-col"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
                        {service.image ? (
                          <img
                            src={service.image}
                            alt={service.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                            <Icon icon="image" size={28} />
                          </div>
                        )}

                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              service.status === "active"
                                ? "bg-[#30CC36] text-white shadow-lg shadow-[#30CC36]/20"
                                : "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                            }`}
                          >
                            {service.status === "active" ? "ATIVO" : "PENDENTE"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col">
                        <span className="text-[10px] font-bold text-primary tracking-widest uppercase">
                          {service.category || "Sem categoria"}
                        </span>
                        <h4 className="font-bold text-on-surface mt-1 line-clamp-2">{service.title}</h4>

                        {service.environmentName && (
                          <p className="text-xs text-on-surface-variant mt-1">
                            Ambiente principal: {service.environmentName}
                          </p>
                        )}

                        <p className="text-xs text-on-surface-variant/80 mt-1">
                          Ambientes vinculados: {linkedIds.length}
                        </p>

                        <div className="mt-4 space-y-2 border-t border-outline-variant/10 pt-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => router.push(`/register-service?id=${service.id}`)}
                              className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container-highest transition-colors"
                            >
                              <Icon icon="edit" size={16} />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteService(service.id)}
                              className="p-2 rounded-xl bg-surface-container-high text-error hover:bg-error/10 transition-colors"
                            >
                              <Icon icon="delete" size={18} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleLinkedForService(service.id)}
                            className="w-full rounded-xl py-2 px-3 text-xs font-black uppercase tracking-wide border border-[#30cc36]/30 text-[#30cc36] hover:bg-[#30cc36]/10 transition-colors flex items-center justify-center gap-2"
                          >
                            <Icon icon="add_location_alt" size={16} />
                            VINCULAR AMBIENTES
                          </button>

                          {expandedServiceId === service.id && (
                            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-3 space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70">
                                Ambientes vinculados a voce
                              </p>

                              {linkedLoading && !linkedLoaded ? (
                                <div className="py-4 flex justify-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-4 border-[#30cc36] border-t-transparent"></div>
                                </div>
                              ) : linkedEnvironments.length === 0 ? (
                                <div className="space-y-2">
                                  <p className="text-xs text-on-surface-variant">
                                    Voce nao esta vinculado a nenhum ambiente.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => open("link")}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 bg-[#30cc36] text-white text-[11px] font-black uppercase tracking-wide"
                                  >
                                    <Icon icon="search" size={14} />
                                    PROCURAR AMBIENTE
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {linkedEnvironments.map(({ environment, membership }) => {
                                    const isActiveMembership = membership.status === "active";
                                    const isLinked = linkedSet.has(environment.id);
                                    const isPrimary = service.environmentId === environment.id;
                                    const isLastLinked = isLinked && linkedIds.length <= 1;
                                    const actionKey = `${service.id}:${environment.id}`;
                                    const isLinking = linkingKey === actionKey;

                                    return (
                                      <div
                                        key={`${service.id}-${environment.id}`}
                                        className="rounded-lg border border-outline-variant/15 bg-surface-container-high/50 p-2"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="min-w-0">
                                            <p className="text-xs font-bold text-on-surface truncate">
                                              {environment.name}
                                            </p>
                                            <p className="text-[10px] text-on-surface-variant truncate">
                                              {TYPE_LABELS[environment.type] || environment.type || "Ambiente"}
                                            </p>
                                          </div>
                                          <span
                                            className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${getStatusBadge(
                                              membership.status,
                                            )}`}
                                          >
                                            {membership.status === "active" ? "ATIVO" : "PENDENTE"}
                                          </span>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between gap-2">
                                          <span className="text-[10px] font-bold text-on-surface-variant">
                                            {isPrimary ? "Principal" : isLinked ? "Vinculado" : "Nao vinculado"}
                                          </span>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleToggleServiceEnvironment(
                                                service,
                                                environment.id,
                                                isLinked,
                                              )
                                            }
                                            disabled={!isActiveMembership || isLinking || isLastLinked}
                                            className={`rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wide transition-colors ${
                                              !isActiveMembership
                                                ? "bg-surface-container text-on-surface-variant/60 cursor-not-allowed"
                                                : isLinking
                                                  ? "bg-[#30cc36]/15 text-[#30cc36]"
                                                  : isLinked
                                                    ? isLastLinked
                                                      ? "bg-[#30cc36]/15 text-[#30cc36] cursor-not-allowed"
                                                      : "bg-orange-500/15 text-orange-700 hover:bg-orange-500/20"
                                                    : "bg-[#30cc36] text-white hover:brightness-110"
                                            }`}
                                          >
                                            {!isActiveMembership
                                              ? "Aguardando aprovacao"
                                              : isLinking
                                                ? isLinked
                                                  ? "Desvinculando..."
                                                  : "Vinculando..."
                                                : isLinked
                                                  ? isLastLinked
                                                    ? "Vinculado"
                                                    : "Desvincular"
                                                  : "Vincular"}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {statusNotice && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-surface-container-lowest px-6 py-3 rounded-full shadow-2xl border border-outline-variant/10 flex items-center gap-2 animate-fade-in z-50">
            <Icon icon="check_circle" size={18} className="text-[#30cc36]" />
            <span className="text-sm font-bold text-on-surface">{statusNotice}</span>
          </div>
        )}
      </main>
    </div>
  );
}

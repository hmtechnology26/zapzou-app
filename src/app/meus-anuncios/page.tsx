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
import { ImageModal } from "@/components/ImageModal";

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

const getMembershipStatusLabel = (status: LinkedMembership["status"]) => {
  if (status === "active") return "Ativo";
  if (status === "pending") return "Pendente";
  return "Bloqueado";
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
    refreshServices,
    selectedEnvironments,
  } = useApp();

  const [mounted, setMounted] = useState(false);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(
    null,
  );
  const [linkedLoading, setLinkedLoading] = useState(false);
  const [linkedLoaded, setLinkedLoaded] = useState(false);
  const [linkedEnvironments, setLinkedEnvironments] = useState<
    LinkedEnvironment[]
  >([]);
  const [serviceLinkedEnvironmentIds, setServiceLinkedEnvironmentIds] =
    useState<Record<string, string[]>>({});
  const [linkingKey, setLinkingKey] = useState<string | null>(null);
  const [mobileLinkedServiceId, setMobileLinkedServiceId] = useState<
    string | null
  >(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalImages, setImageModalImages] = useState<string[]>([]);
  const [imageModalInitialIndex, setImageModalInitialIndex] = useState(0);

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

  const mobileLinkedService = useMemo(() => {
    if (!mobileLinkedServiceId) return null;
    return userServices.find((service) => service.id === mobileLinkedServiceId) || null;
  }, [mobileLinkedServiceId, userServices]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("support-fab-visibility", {
        detail: { hidden: Boolean(mobileLinkedService) },
      }),
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("support-fab-visibility", {
          detail: { hidden: false },
        }),
      );
    };
  }, [mobileLinkedService]);

  useEffect(() => {
    if (!mobileLinkedServiceId) return;
    if (!userServices.some((service) => service.id === mobileLinkedServiceId)) {
      setMobileLinkedServiceId(null);
    }
  }, [mobileLinkedServiceId, userServices]);

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
        const normalized = normalizeEnvironmentRecord(env);
        envCache[env.id] = normalized;
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
      setServiceLinkedEnvironmentIds({});
      setLinkedLoaded(true);
      return;
    }

    const next: Record<string, string[]> = {};

    (data || []).forEach((row: any) => {
      if (!next[row.service_id]) next[row.service_id] = [];
      next[row.service_id].push(row.environment_id);
    });

    setServiceLinkedEnvironmentIds(next);
    setLinkedLoaded(true);
  }, [userServices]);

  const showStatusNotice = useCallback((message: string) => {
    setStatusNotice(message);
    setTimeout(() => setStatusNotice(null), 3200);
  }, []);

  const getLinkedIdsForService = useCallback(
    (service: Service) => {
      const fromMap = serviceLinkedEnvironmentIds[service.id];
      if (Array.isArray(fromMap) && fromMap.length > 0) {
        return Array.from(new Set(fromMap));
      }

      const fromServiceLinks = Array.isArray(service.linkedEnvironments)
        ? service.linkedEnvironments
            .map((env) => env?.id)
            .filter((id): id is string => typeof id === "string" && id.length > 0)
        : [];
      if (fromServiceLinks.length > 0) {
        return Array.from(new Set(fromServiceLinks));
      }

      if (
        typeof service.environmentId === "string" &&
        service.environmentId.trim().length > 0
      ) {
        return [service.environmentId.trim()];
      }

      return [];
    },
    [serviceLinkedEnvironmentIds],
  );

  const mobileLinkedIds = useMemo(() => {
    if (!mobileLinkedService) return [];
    return getLinkedIdsForService(mobileLinkedService);
  }, [getLinkedIdsForService, mobileLinkedService]);

  const handleToggleLinkedForService = async (serviceId: string) => {
    const isMobileViewport =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches;

    if (isMobileViewport) {
      setMobileLinkedServiceId(serviceId);
      setLinkedLoading(true);
      try {
        await Promise.all([
          fetchLinkedEnvironments(),
          fetchServiceEnvironmentLinks(),
        ]);
      } finally {
        setLinkedLoading(false);
      }
      return;
    }

    const nextServiceId = expandedServiceId === serviceId ? null : serviceId;

    setExpandedServiceId(nextServiceId);

    if (!nextServiceId) return;

    setLinkedLoading(true);

    try {
      await Promise.all([
        fetchLinkedEnvironments(),
        fetchServiceEnvironmentLinks(),
      ]);
    } finally {
      setLinkedLoading(false);
    }
  };

  const closeMobileLinkedModal = useCallback(() => {
    setMobileLinkedServiceId(null);
  }, []);

  const handleToggleServiceEnvironmentLink = async (
    service: Service,
    linkedEnvironment: LinkedEnvironment,
  ) => {
    if (!user?.id) {
      showStatusNotice("Faça login para vincular ambientes.");
      return;
    }

    const environmentId = linkedEnvironment.environment.id;
    const membershipStatus = linkedEnvironment.membership.status;

    if (membershipStatus !== "active") {
      showStatusNotice("Este ambiente ainda está pendente e não pode ser vinculado.");
      return;
    }

    const currentLinkedIds = getLinkedIdsForService(service);
    const isCurrentlyLinked = currentLinkedIds.includes(environmentId);

    if (isCurrentlyLinked && currentLinkedIds.length <= 1) {
      showStatusNotice("Mantenha pelo menos 1 ambiente vinculado ao anúncio.");
      return;
    }

    const nextLinkingKey = `${service.id}:${environmentId}`;
    setLinkingKey(nextLinkingKey);

    try {
      if (isCurrentlyLinked) {
        const { error: unlinkError } = await supabase
          .from("service_environment_links")
          .delete()
          .eq("service_id", service.id)
          .eq("environment_id", environmentId);

        if (unlinkError) {
          throw unlinkError;
        }
      } else {
        const { error: linkError } = await supabase
          .from("service_environment_links")
          .insert({
            service_id: service.id,
            environment_id: environmentId,
            created_by: user.id,
          });

        if (linkError && linkError.code !== "23505") {
          throw linkError;
        }
      }

      const nextLinkedIds = isCurrentlyLinked
        ? currentLinkedIds.filter((id) => id !== environmentId)
        : Array.from(new Set([...currentLinkedIds, environmentId]));

      setServiceLinkedEnvironmentIds((prev) => ({
        ...prev,
        [service.id]: nextLinkedIds,
      }));

      const currentPrimaryEnvironmentId =
        typeof service.environmentId === "string" ? service.environmentId : null;
      const nextPrimaryEnvironmentId =
        nextLinkedIds[0] ||
        (typeof linkedEnvironment.environment.id === "string"
          ? linkedEnvironment.environment.id
          : null);

      if (
        (isCurrentlyLinked &&
          currentPrimaryEnvironmentId &&
          currentPrimaryEnvironmentId === environmentId &&
          nextPrimaryEnvironmentId &&
          nextPrimaryEnvironmentId !== currentPrimaryEnvironmentId) ||
        (!currentPrimaryEnvironmentId && nextPrimaryEnvironmentId)
      ) {
        await updateService(service.id, {
          environmentId: nextPrimaryEnvironmentId,
        });
      }

      await refreshServices();

      showStatusNotice(
        isCurrentlyLinked
          ? `Anúncio desvinculado de ${linkedEnvironment.environment.name}.`
          : `Anúncio vinculado em ${linkedEnvironment.environment.name}.`,
      );
    } catch (error: any) {
      if (isMissingRelationError(error)) {
        showStatusNotice("Tabela de vínculos não encontrada no banco.");
      } else {
        showStatusNotice("Não foi possível atualizar os vínculos deste anúncio.");
      }
    } finally {
      setLinkingKey(null);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    const confirmed = confirm("Deseja excluir este anuncio?");
    if (!confirmed) return;

    try {
      await removeService(serviceId);
      showStatusNotice("Anuncio removido com sucesso.");
    } catch {
      showStatusNotice("Nao foi possivel remover este anuncio.");
    }
  };

  const renderLinkPanel = (
    service: Service,
    linkedIds: string[],
    canUnlink: boolean,
  ) => {
    return (
      <div className="mt-3 space-y-2 rounded-xl border border-white/20 bg-white/65 p-3 backdrop-blur dark:border-white/10 dark:bg-white/[0.03]">
        {linkedLoading ? (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-zinc-500 dark:text-white/60">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#30cc36] border-t-transparent" />
            Carregando ambientes...
          </div>
        ) : !linkedLoaded ? (
          <p className="py-1 text-center text-xs font-semibold text-zinc-500 dark:text-white/60">
            Abra novamente para carregar os vínculos.
          </p>
        ) : linkedEnvironments.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 dark:text-white/60">
              Você ainda não possui ambientes disponíveis para vínculo.
            </p>
            <button
              type="button"
              onClick={() => open("link")}
              className="inline-flex items-center gap-2 rounded-lg bg-[#30cc36] px-3 py-2 text-[11px] font-black uppercase text-white"
            >
              <Icon icon="add" size={14} />
              Adicionar ambiente
            </button>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:text-white/55">
              Ambientes do anúncio
            </p>
            <div className="space-y-2">
              {linkedEnvironments.map((linkedEnv) => {
                const envId = linkedEnv.environment.id;
                const membershipIsActive =
                  linkedEnv.membership.status === "active";
                const isLinked = linkedIds.includes(envId);
                const isBusy = linkingKey === `${service.id}:${envId}`;
                const unlinkDisabled = isLinked && !canUnlink;

                return (
                  <div
                    key={`${service.id}:${envId}`}
                    className="rounded-xl border border-white/30 bg-white/70 p-2 dark:border-white/10 dark:bg-white/[0.02]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-zinc-800 dark:text-white">
                          {linkedEnv.environment.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md border border-white/30 bg-white/80 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50">
                            {TYPE_LABELS[linkedEnv.environment.type] || "Ambiente"}
                          </span>
                          <span
                            className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${getStatusBadge(
                              linkedEnv.membership.status,
                            )}`}
                          >
                            {getMembershipStatusLabel(linkedEnv.membership.status)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isBusy || !membershipIsActive || unlinkDisabled}
                        onClick={() =>
                          handleToggleServiceEnvironmentLink(service, linkedEnv)
                        }
                        className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase transition ${
                          isLinked
                            ? "border border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20 disabled:opacity-40"
                            : "border border-[#30cc36]/20 bg-[#30cc36]/10 text-[#30cc36] hover:bg-[#30cc36]/20 disabled:opacity-40"
                        }`}
                      >
                        {isBusy
                          ? "Salvando..."
                          : !membershipIsActive
                            ? "Pendente"
                            : unlinkDisabled
                              ? "Obrigatório"
                              : isLinked
                                ? "Desvincular"
                                : "Vincular"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => open("link")}
              className="inline-flex items-center gap-2 rounded-lg border border-[#30cc36]/20 bg-[#30cc36]/10 px-3 py-1.5 text-[10px] font-black uppercase text-[#30cc36]"
            >
              <Icon icon="add" size={14} />
              Novo ambiente
            </button>
          </>
        )}
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen overflow-hidden bg-background md:pb-10">
      <TopAppBar />

      <main className="mx-auto max-w-6xl space-y-8 px-4 pb-32 pt-24 md:px-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#30cc36]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-12 h-52 w-52 rounded-full bg-[#30cc36]/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#30cc36]/20 bg-[#30cc36]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#1eb34b]">
                <Icon icon="storefront" size={14} weight={700} />
                Painel de anúncios
              </span>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 dark:text-white md:text-6xl">
                Gerencie seus anúncios com estilo.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-white/55 md:text-base">
                Controle publicações, edite seus serviços e vincule em múltiplas
                comunidades.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/20 bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 shadow-sm dark:bg-white/[0.05] dark:text-white/55">
                  {userServices.length} anúncios
                </span>

                <span className="rounded-full border border-white/20 bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 shadow-sm dark:bg-white/[0.05] dark:text-white/55">
                  {activeServices} ativos
                </span>

                {pendingServices > 0 && (
                  <span className="rounded-full border border-white/20 bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 shadow-sm dark:bg-white/[0.05] dark:text-white/55">
                    {pendingServices} pendentes
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  router.push("/login/create-ad");
                } else {
                  router.push("/register-service");
                }
              }}
              className="mx-auto flex w-auto items-center justify-center gap-2 rounded-full bg-[#30cc36] px-6 py-4 text-sm font-black uppercase tracking-wide text-white shadow-2xl shadow-[#30cc36]/25 transition-transform hover:scale-[1.02] active:scale-95 md:mx-0"
            >
              <Icon icon="add" size={18} />
              Novo anúncio
            </button>
          </div>
        </section>

        <section className="space-y-5">
            {/* LOADING */}
            {servicesLoading ? (
              <div className="py-20 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#30cc36] border-t-transparent" />
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-[#30cc36]/60">
                  Carregando anúncios...
                </p>
              </div>
            ) : userServices.length === 0 ? (
              <div className="rounded-[2rem] border-2 border-dashed border-white/20 bg-white/70 py-16 text-center backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
                <Icon
                  icon="post_add"
                  size={56}
                  className="mx-auto text-[#30cc36]/25"
                />

                <h4 className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
                  Você ainda não tem anúncios
                </h4>

                <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-white/55">
                  Clique em novo anúncio para publicar seu primeiro serviço.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {userServices.map((service) => {
                  const isExpanded = expandedServiceId === service.id;
                  const linkedIds = getLinkedIdsForService(service);
                  const canUnlink = linkedIds.length > 1;

                  return (
                    <article
                      key={service.id}
                      className="group overflow-hidden rounded-[2rem] border border-white/20 bg-white/80 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-white/[0.04]"
                    >
                    <div 
                      className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-white/5 cursor-pointer"
                      onClick={() => {
                        const images = Array.isArray(service.images) && service.images.length > 0 
                          ? service.images 
                          : service.image 
                            ? [service.image] 
                            : [];
                        if (images.length > 0) {
                          setImageModalImages(images);
                          setImageModalInitialIndex(0);
                          setImageModalOpen(true);
                        }
                      }}
                    >
                      {service.image ? (
                        <img
                          src={service.image}
                          alt={service.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Icon
                            icon="image"
                            size={30}
                            className="text-zinc-400"
                          />
                        </div>
                      )}

                      <div className="absolute left-3 top-3">
                        <span
                          className={`rounded-xl px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white ${
                            service.status === "active"
                              ? "bg-[#30CC36]"
                              : "bg-amber-500"
                          }`}
                        >
                          {service.status === "active"
                            ? "ATIVO"
                            : "PENDENTE"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#30cc36]">
                        {service.category || "Sem categoria"}
                      </span>

                      <h4 className="mt-1 line-clamp-2 text-lg font-black tracking-tight text-zinc-950 dark:text-white">
                        {service.title}
                      </h4>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/register-service?id=${service.id}`,
                            )
                          }
                          className="flex-1 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-black text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-white/10 dark:text-white"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteService(service.id)
                          }
                          className="rounded-xl bg-red-500/10 px-3 py-2 text-red-600 transition-colors hover:bg-red-500/20"
                        >
                          <Icon icon="delete" size={18} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleLinkedForService(service.id)
                        }
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#30cc36]/20 bg-[#30cc36]/10 px-3 py-2 text-xs font-black uppercase text-[#30cc36]"
                      >
                        <Icon
                          icon={isExpanded ? "expand_less" : "add_location_alt"}
                          size={16}
                        />
                        {isExpanded ? "Fechar vínculos" : "Vincular ambientes"}
                      </button>

                      {isExpanded && (
                        <div className="hidden md:block">
                          {renderLinkPanel(service, linkedIds, canUnlink)}
                        </div>
                      )}
                    </div>
                  </article>
                  );
                })}
              </div>
            )}
          </section>

        {mobileLinkedService && (
          <div className="fixed inset-0 z-[70] md:hidden">
            <button
              type="button"
              aria-label="Fechar vínculos"
              onClick={closeMobileLinkedModal}
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            />

            <div className="absolute inset-x-0 bottom-0 max-h-[84vh] overflow-y-auto rounded-t-[1.6rem] border border-white/20 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-zinc-950">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#30cc36]">
                    Vincular ambientes
                  </p>
                  <h3 className="truncate text-base font-black text-zinc-900 dark:text-white">
                    {mobileLinkedService.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeMobileLinkedModal}
                  className="rounded-full border border-zinc-200 p-1.5 text-zinc-500 dark:border-white/10 dark:text-white/70"
                >
                  <Icon icon="close" size={18} />
                </button>
              </div>

              {renderLinkPanel(
                mobileLinkedService,
                mobileLinkedIds,
                mobileLinkedIds.length > 1,
              )}
            </div>
          </div>
        )}

        {statusNotice && (
          <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/20 bg-white/80 px-6 py-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80">
            <div className="flex items-center gap-2">
              <Icon
                icon="check_circle"
                size={18}
                className="text-[#30cc36]"
              />
              <span className="text-sm font-bold text-zinc-800 dark:text-white">
                {statusNotice}
              </span>
            </div>
          </div>
        )}

        <ImageModal
          isOpen={imageModalOpen}
          images={imageModalImages}
          initialIndex={imageModalInitialIndex}
          onClose={() => setImageModalOpen(false)}
        />
      </main>
    </div>
  );
}

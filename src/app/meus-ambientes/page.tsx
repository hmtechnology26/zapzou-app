"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useApp } from "@/hooks/useApp";
import { TopAppBar } from "@/components/TopAppBar";
import { usePublishModal } from "@/contexts/PublishModalContext";
import { supabase } from "@/lib/supabase";
import { isForcedPendingApprovalEnvironment } from "@/lib/environment-rules";
import type { PublicationMode } from "@/lib/plan-rules";
import type { Environment } from "@/types";

const TYPE_LABELS: Record<Environment["type"], string> = {
  residential: "Residencial",
  church: "Igreja",
  club: "Clube",
  association: "AssociaÃ§Ã£o",
};

type AffiliationRecord = {
  id: string;
  environmentId: string;
  role: "member" | "moderator" | null;
  accessType: PublicationMode | null;
  status: "active" | "pending" | "banned";
  createdAt?: string;
};

const getStatusRank = (status?: AffiliationRecord["status"]) => {
  switch (status) {
    case "active":
      return 0;
    case "pending":
      return 1;
    case "banned":
      return 2;
    default:
      return 3;
  }
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

export default function MyAdsPage() {
  const router = useRouter();
  const {
    user,
    membershipVersion,
    selectedEnvironments,
    setSelectedEnvironments,
    selectedEnvironment,
    setSelectedEnvironment,
    signalMembershipChange,
  } = useApp();
  const { open } = usePublishModal();
  const [affiliations, setAffiliations] = useState<
    Record<string, AffiliationRecord>
  >({});
  const [affiliationLoading, setAffiliationLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [myContexts, setMyContexts] = useState<Environment[]>([]);
  const [loadingContexts, setLoadingContexts] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [environmentToDelete, setEnvironmentToDelete] =
    useState<Environment | null>(null);
  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null);
  const [togglingRoleTarget, setTogglingRoleTarget] = useState<
    Record<string, PublicationMode | null>
  >({});
  const [mounted, setMounted] = useState(false);

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

  const fetchUserContexts = useCallback(async () => {
    if (!user?.id) return;
    setLoadingContexts(true);
    setAffiliationLoading(true);
    try {
      const { data: membersData, error: membersError } = await supabase
        .from("environment_members")
        .select("id, status, role, access_type, environment_id")
        .eq("user_id", user.id)
        .in("status", ["active", "pending"]);

      if (membersError) {
        console.error("fetchUserContexts failed:", membersError);
        return;
      }

      const affiliationsPayload: Record<string, AffiliationRecord> = {};
      const contextsPayload: Environment[] = [];
      const missingEnvIds = new Set<string>();
      const seenEnvIds = new Set<string>();
      const envCache: Record<string, Environment> = {
        ...selectedEnvironmentMap,
      };

      (membersData ?? []).forEach((record: any) => {
        const envId = record.environment_id;
        if (!envId) return;

        affiliationsPayload[envId] = {
          id: record.id,
          environmentId: envId,
          role: record.role,
          accessType: record.access_type ?? null,
          status: record.status,
        };

        const shouldShowContext =
          record.status === "pending" ||
          record.role === "moderator" ||
          record.access_type === "resident" ||
          record.access_type === "service_provider" ||
          isForcedPendingApprovalEnvironment(envId);

        if (shouldShowContext) {
          const cachedEnv = envCache[envId];
          if (cachedEnv) {
            if (!seenEnvIds.has(envId)) {
              contextsPayload.push(cachedEnv);
              seenEnvIds.add(envId);
            }
          } else {
            missingEnvIds.add(envId);
          }
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
          if (!seenEnvIds.has(env.id)) {
            contextsPayload.push(normalizedEnv);
            seenEnvIds.add(env.id);
          }
        });
      }

      setAffiliations(affiliationsPayload);
      setMyContexts(
        contextsPayload.sort((a, b) => {
          const rankA = getStatusRank(affiliationsPayload[a.id]?.status);
          const rankB = getStatusRank(affiliationsPayload[b.id]?.status);
          if (rankA !== rankB) return rankA - rankB;
          return a.name.localeCompare(b.name);
        }),
      );
    } catch (err) {
      console.error("fetchUserContexts exception:", err);
    } finally {
      setLoadingContexts(false);
      setAffiliationLoading(false);
    }
  }, [user?.id, selectedEnvironmentMap]);

  useEffect(() => {
    if (user?.id) {
      fetchUserContexts();
    }
  }, [user?.id, fetchUserContexts, membershipVersion]);

  const handleDeleteClick = (env: Environment) => {
    setEnvironmentToDelete(env);
    setDeleteModalOpen(true);
  };

  const handleToggleRole = async (
    envId: string,
    nextAccessType: PublicationMode,
  ) => {
    if (!user?.id) return;

    const currentAccessType = affiliations[envId]?.accessType ?? null;
    if (currentAccessType === nextAccessType) return;

    if (nextAccessType === "resident") {
      const residentEnvId = Object.entries(affiliations).find(
        ([id, aff]) => id !== envId && aff.accessType === "resident",
      )?.[0];

      if (residentEnvId) {
        const residentEnvName = myContexts.find(
          (e) => e.id === residentEnvId,
        )?.name;
        setStatusNotice(
          `VocÃª jÃ¡ Ã© morador de "${residentEnvName}". Altere para prestador primeiro.`,
        );
        setTimeout(() => setStatusNotice(null), 4000);
        return;
      }
    }

    setTogglingRoleId(envId);
    setTogglingRoleTarget((prev) => ({
      ...prev,
      [envId]: nextAccessType,
    }));

    try {
      const currentMembership = affiliations[envId];
      const { error } = await supabase.from("environment_members").upsert(
        {
          environment_id: envId,
          user_id: user.id,
          role:
            currentMembership?.role === "moderator" ? "moderator" : "member",
          access_type: nextAccessType,
          status: currentMembership?.status ?? "active",
        },
        { onConflict: "environment_id,user_id" },
      );

      if (error) {
        console.error("Error toggling role:", error);
        setStatusNotice("Erro ao alterar funÃ§Ã£o");
      } else {
        setAffiliations((prev) => ({
          ...prev,
          [envId]: { ...prev[envId], accessType: nextAccessType },
        }));
        setStatusNotice(
          nextAccessType === "resident"
            ? "Agora vocÃª Ã© morador neste ambiente"
            : "Agora vocÃª Ã© prestador neste ambiente",
        );
        signalMembershipChange();
      }
    } catch (err) {
      console.error("Error toggling role:", err);
    } finally {
      setTogglingRoleId(null);
      setTogglingRoleTarget((prev) => ({
        ...prev,
        [envId]: null,
      }));
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!environmentToDelete || !user?.id) return;

    setDeletingId(environmentToDelete.id);

    const { error } = await supabase
      .from("environment_members")
      .delete()
      .eq("environment_id", environmentToDelete.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error leaving environment:", error);
      setStatusNotice("NÃ£o foi possÃ­vel sair deste ambiente.");
      setDeletingId(null);
      setTimeout(() => setStatusNotice(null), 4000);
      return;
    }

    const envIdToDelete = environmentToDelete.id;

    setMyContexts((prev) => prev.filter((env) => env.id !== envIdToDelete));
    setAffiliations((prev) => {
      const next = { ...prev };
      delete next[envIdToDelete];
      return next;
    });
    const nextSelectedEnvironments = selectedEnvironments.filter(
      (env) => env.id !== envIdToDelete,
    );
    setSelectedEnvironments(nextSelectedEnvironments);
    if (selectedEnvironment?.id === envIdToDelete) {
      const nextEnvironment = nextSelectedEnvironments[0] ?? null;
      setSelectedEnvironment(nextEnvironment);
    }

    setStatusNotice("Ambiente removido com sucesso");
    setTimeout(() => setStatusNotice(null), 3000);

    signalMembershipChange();

    setDeletingId(null);
    setDeleteModalOpen(false);
    setEnvironmentToDelete(null);
  };

  if (!mounted) return null;

  const activeContextsCount = myContexts.filter(
    (env) => affiliations[env.id]?.status === "active",
  ).length;
  const pendingContextsCount = myContexts.filter(
    (env) => affiliations[env.id]?.status === "pending",
  ).length;

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden pb-24">
      <TopAppBar />

      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto space-y-12 pb-32">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-primary/10 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-[#30cc36]/[0.08] p-6 shadow-sm md:p-8">
          <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-24 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                Painel de comunidades
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-on-surface md:text-5xl">
                Minhas Comunidades
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant md:text-base">
                Gerencie suas comunidades vinculados, altere seu tipo de acesso
                e acompanhe aprovações.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-outline-variant/10 bg-background/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant shadow-sm">
                  {myContexts.length} comunidades
                </span>

                <span className="inline-flex items-center rounded-full border border-outline-variant/10 bg-background/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant shadow-sm">
                  {activeContextsCount} ativos
                </span>

                {pendingContextsCount > 0 && (
                  <span className="inline-flex items-center rounded-full border border-outline-variant/10 bg-background/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant shadow-sm">
                    {pendingContextsCount} pendentes
                  </span>
                )}
              </div>
            </div>

            <div className="w-full md:max-w-sm">
              {/* CARD SOMENTE DESKTOP */}
              <div className="hidden md:flex items-center gap-3 rounded-[1.5rem] border border-outline-variant/10 bg-background/70 px-4 py-4 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon icon="add_location_alt" size={28} weight={700} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black text-on-surface">
                    Procurar uma nova comunidade
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                    Solicite vínculo quando quiser anunciar em outro local.
                  </p>
                </div>
              </div>

              <button
                onClick={() => open("link")}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-black uppercase tracking-wide text-white shadow-2xl shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-95 primary-gradient"
              >
                {/* ÍCONE SOMENTE MOBILE */}
                <span className="md:hidden">
                  <Icon icon="add_location_alt" size={20} weight={700} />
                </span>
                Procurar Comunidade
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {/* <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-primary/70">
              comunidades de Atuação
            </h3>
            <span className="text-[8px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest border border-primary/10">
              {myContexts.length} Vinculados
            </span>
          </div> */}

          {loadingContexts || affiliationLoading ? (
            <div className="py-24 flex justify-center flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#30cc36] border-t-transparent"></div>
              <p className="text-xs font-black uppercase tracking-widest text-primary/40">
                Carregando seus locais...
              </p>
            </div>
          ) : myContexts.length === 0 ? (
            <div className="rounded-[3rem] border-2 border-dashed border-outline-variant/10 py-24 text-center bg-surface-container-low/20">
              <Icon
                icon="explore"
                size={56}
                className="mx-auto mb-6 opacity-10 text-primary"
              />
              <h4 className="text-xl font-black text-on-surface/40">
                Nenhum vÃ­nculo ativo
              </h4>
              <p className="text-sm text-on-surface-variant/60 font-medium max-w-xs mx-auto mt-2">
                VocÃª ainda nÃ£o solicitou entrada em nenhum ambiente para
                anunciar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {myContexts.map((env) => {
                const membership = affiliations[env.id];
                const isActive = membership?.status === "active";
                const isPending = membership?.status === "pending";
                const needsModeratorApproval =
                  env.type === "church" || env.requiresModeratorApproval;
                const pendingLabel = needsModeratorApproval
                  ? "AGUARDANDO APROVAÇÃO"
                  : "PENDENTE";
                const displayedRole =
                  togglingRoleTarget[env.id] ?? membership?.accessType ?? null;
                const isResidentRole = displayedRole === "resident";
                const isServiceProviderRole =
                  displayedRole === "service_provider";

                return (
                  <article
                    key={env.id}
                    className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest shadow-sm transition-all"
                  >
                    <button
                      onClick={() => handleDeleteClick(env)}
                      disabled={deletingId === env.id}
                      className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                    >
                      {deletingId === env.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-error/30 border-t-error" />
                      ) : (
                        <Icon icon="close" size={16} />
                      )}
                    </button>

                    {/* <div className="h-44 w-full overflow-hidden bg-surface-container">
                      {env.image ? (
                        <img
                          src={env.image}
                          alt={env.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
                          <Icon icon="domain" size={32} />
                        </div>
                      )}
                    </div> */}

                    <div className="flex flex-1 flex-col gap-4 p-5">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2 pr-10">
                          <h4 className="truncate font-bold text-on-surface">
                            {env.name}
                          </h4>
                          <span
                            className={`rounded-lg border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${
                              isActive
                                ? "border-[#30CC36]/20 bg-[#30CC36]/10 text-[#30CC36]"
                                : isPending
                                  ? "border-amber-500/20 bg-amber-500/10 text-amber-700"
                                  : "border-error/20 bg-error/10 text-error"
                            }`}
                          >
                            {isActive
                              ? "ATIVO"
                              : isPending
                                ? pendingLabel
                                : "BLOQUEADO"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                            <Icon icon="category" size={12} />
                            {TYPE_LABELS[env.type]}
                          </span>

                          {env.members > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant/60">
                              <Icon icon="groups" size={14} />
                              {env.members}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {isActive && membership?.role && (
                          <div className="rounded-[1.6rem] border border-outline-variant/30 bg-surface-container-low p-1 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-[#30cc36]/28 dark:shadow-[0_8px_24px_rgba(48,204,54,0.08)]">
                            <div className="flex items-center justify-between px-3 pb-1 pt-2">
                              <span className="text-[9px] font-black uppercase tracking-[0.28em] text-on-surface-variant/60">
                                Tipo de acesso
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                                {displayedRole === "resident"
                                  ? "Morador"
                                  : displayedRole === "service_provider"
                                    ? "Prestador"
                                    : "Sem acesso"}
                              </span>
                            </div>

                            <div className="relative grid grid-cols-2 overflow-hidden rounded-full border border-outline-variant/15 bg-surface-container-high/70 p-1 dark:border-[#30cc36]/15">
                              <div
                                className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-primary shadow-lg shadow-primary/25 transition-transform duration-300 ease-out ${
                                  isServiceProviderRole
                                    ? "translate-x-full"
                                    : "translate-x-0"
                                }`}
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleRole(env.id, "resident")
                                }
                                disabled={togglingRoleId === env.id}
                                aria-pressed={isResidentRole}
                                className={`relative z-10 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[9px] font-black uppercase transition-colors ${
                                  togglingRoleTarget[env.id] === "resident"
                                    ? "text-white"
                                    : isResidentRole
                                      ? "text-white"
                                      : "text-on-surface-variant/80 hover:text-on-surface"
                                }`}
                              >
                                {togglingRoleTarget[env.id] === "resident" ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <Icon icon="home" size={14} />
                                )}
                                Morador
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleRole(env.id, "service_provider")
                                }
                                disabled={togglingRoleId === env.id}
                                aria-pressed={isServiceProviderRole}
                                className={`relative z-10 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[9px] font-black uppercase transition-colors ${
                                  togglingRoleTarget[env.id] ===
                                  "service_provider"
                                    ? "text-white"
                                    : isServiceProviderRole
                                      ? "text-white"
                                      : "text-on-surface-variant/80 hover:text-on-surface"
                                }`}
                              >
                                {togglingRoleTarget[env.id] ===
                                "service_provider" ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <Icon icon="work" size={14} />
                                )}
                                Prestador
                              </button>
                            </div>
                          </div>
                        )}

                        {/* {isActive && (
                          <button
                            onClick={() => router.push(`/meus-comunidades/${env.id}`)}
                            className="flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-outline-variant/35 bg-surface-container-high/80 text-[10px] font-black uppercase text-on-surface shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-300 ease-out active:scale-95 hover:border-primary/25 hover:bg-surface-container-high hover:text-primary dark:border-[#30cc36]/28 dark:bg-[#223626] dark:text-[#e8f8ea] dark:shadow-[0_8px_20px_rgba(48,204,54,0.08)] dark:hover:border-[#30cc36]/45 dark:hover:bg-[#2b4a2f] dark:hover:text-white md:text-sm"
                          >
                            <Icon icon="store" size={18} />
                            Gerenciar Anúncios
                          </button>
                        )} */}

                        {!isActive && isPending && (
                          <div className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-[10px] font-black uppercase tracking-[0.1em] text-amber-700">
                            <Icon
                              icon={
                                needsModeratorApproval
                                  ? "admin_panel_settings"
                                  : "hourglass_empty"
                              }
                              size={16}
                            />
                            {needsModeratorApproval
                              ? "Aguardando AprovaÃ§Ã£o"
                              : "Aguardando AprovaÃ§Ã£o"}
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

        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container-lowest rounded-[2rem] p-6 max-w-sm w-full shadow-2xl border border-outline-variant/10">
              <div className="text-center">
                <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon icon="warning" size={32} className="text-error" />
                </div>
                <h3 className="text-xl font-black text-on-surface mb-2">
                  Sair do Ambiente?
                </h3>
                <p className="text-sm text-on-surface-variant mb-6">
                  Ao confirmar, todos os seus anúncios neste ambiente serão
                  excluídos permanentemente.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl border border-outline-variant/20 text-on-surface font-black text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 py-3 rounded-2xl bg-error text-white font-black text-sm"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {statusNotice && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-surface-container-lowest px-6 py-3 rounded-full shadow-2xl border border-outline-variant/10 flex items-center gap-2 animate-fade-in z-50">
            <Icon icon="check_circle" size={18} className="text-[#30cc36]" />
            <span className="text-sm font-bold text-on-surface">
              {statusNotice}
            </span>
          </div>
        )}
      </main>
    </div>
  );
}

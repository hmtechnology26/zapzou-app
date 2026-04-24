"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MaterialSymbol as Icon } from "react-material-symbols";
import { Avatar } from "@/components/Avatar";
import { TopAppBar } from "@/components/TopAppBar";
import { useApp } from "@/hooks/useApp";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    setUser,
    loading,
    setSelectedEnvironments,
    setSelectedEnvironment,
    selectedEnvironments,
    userServices,
  } = useApp();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const activeServicesCount = userServices.filter(
    (service) => service.isActive && service.status === "active",
  ).length;
  const totalServicesCount = userServices.length;
  const linkedEnvironmentsCount = selectedEnvironments.length;
  const planLabel = user.plan === "free" ? "FREE" : user.plan === "pro" ? "PRO" : "PLUS";
  const planTone =
    user.plan === "pro"
      ? "from-blue-500 to-blue-700"
      : user.plan === "plus"
        ? "from-[#30cc36] to-[#1f8a2b]"
        : "from-slate-500 to-slate-700";

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout failed:", error);
      }
    } catch (err) {
      console.error("Unexpected logout error:", err);
    } finally {
      setUser(null);
      setSelectedEnvironments([]);
      setSelectedEnvironment(null);
      router.replace("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(48,204,54,0.14),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0)_0%,_rgba(15,23,42,0.03)_100%)] pb-24">
      <TopAppBar />

      <main className="mx-auto max-w-6xl space-y-5 px-4 pb-6 pt-16 md:space-y-8 md:px-8 md:pt-20">
        <section className="relative mt-4 overflow-hidden rounded-[1.8rem] border border-primary/10 bg-surface-container-lowest shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:rounded-[2rem]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-[#30cc36]/10 blur-3xl" />

          <div className="relative grid gap-5 p-4 sm:p-5 md:grid-cols-[1.15fr_0.85fr] md:gap-6 md:p-8 lg:p-10">
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left md:gap-5">
                <div className="relative shrink-0">
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    alt={user.name}
                    className="h-22 w-22 rounded-[1.6rem] border border-white/70 shadow-[0_18px_40px_rgba(15,23,42,0.18)] sm:h-24 sm:w-24 md:h-28 md:w-28"
                    fallbackClassName="text-xl sm:text-2xl md:text-3xl"
                  />
                  <div className="absolute -bottom-2 -right-2 rounded-full bg-[#30cc36] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-[#30cc36]/25">
                    {planLabel}
                  </div>
                </div>

                <div className="min-w-0 flex-1 pt-1 sm:pt-0">
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
                    <h2 className="truncate text-2xl font-black tracking-tight text-on-surface md:text-4xl">
                      {user.name}
                    </h2>
                    
                  </div>

                  

                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/15 bg-background/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      <Icon icon="mail" size={14} />
                      {user.email}
                    </span>
                    {user.role === "admin" && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#30cc36]/20 bg-[#30cc36]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f8a2b]">
                        <Icon icon="admin_panel_settings" size={14} />
                        Administrador
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant/10 bg-background/80 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  
                  <div>
                    <h3 className="text-[14px] font-black uppercase tracking-[0.22em] text-[#30cc36]">
                      seu resumo
                    </h3> 
                  </div>
                  
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest/80 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                      E-mail verificado
                    </p>
                    <p className="mt-2 text-sm font-black text-[#30cc36]">Ativo</p>
                  </div>

                  <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest/80 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                      Plano atual
                    </p>
                    <p className="mt-2 text-sm font-black uppercase text-[#30cc36]">
                      {planLabel}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest/80 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                      Ambientes vinculados
                    </p>
                    <p className="mt-2 text-sm font-black text-[#30cc36]">
                      {linkedEnvironmentsCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest/80 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/60">
                      Serviços publicados
                    </p>
                    <p className="mt-2 text-sm font-black text-[#30cc36]">
                      {activeServicesCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[1.8rem] border border-outline-variant/10 bg-surface-container-low p-4 sm:p-5 md:p-6">
              <div className="grid gap-3">
                <button
                  onClick={() => router.push("/meus-anuncios")}
                  className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-background/80 p-3 text-left transition-all hover:border-primary/25 hover:bg-primary/5 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#30cc36]/10 text-[#30cc36]">
                    <Icon icon="storefront" weight={400} grade={0} size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-on-surface">Meus anúncios</p>
                    <p className="text-sm text-on-surface-variant">
                      Gerencie seus ambientes e altere seu acesso rapidamente.
                    </p>
                  </div>
                  <Icon
                    icon="chevron_right"
                    weight={400}
                    grade={0}
                    size={24}
                    className=" text-end text-on-surface-variant"
                  />
                </button>

                {user.plan === "plus" ? (
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-background/80 p-4 text-left transition-all hover:border-primary/25 hover:bg-primary/5 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon icon="insights" weight={400} grade={0} size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-on-surface">Dashboard</p>
                      <p className="text-sm text-on-surface-variant">
                        Veja visualizações e cliques dos seus serviços.
                      </p>
                    </div>
                    <Icon
                      icon="chevron_right"
                      weight={400}
                      grade={0}
                      size={24}
                      className=" text-end text-on-surface-variant"
                    />
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/plans/plus?returnTo=/dashboard")}
                    className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-background/80 p-4 text-left transition-all hover:border-primary/25 hover:bg-primary/5 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon icon="workspace_premium" weight={400} grade={0} size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-on-surface">Dashboard Plus</p>
                      <p className="text-sm text-on-surface-variant">
                        Faça upgrade para liberar métricas avançadas.
                      </p>
                    </div>
                    <Icon
                      icon="chevron_right"
                      weight={400}
                      grade={0}
                      size={24}
                      className=" text-end text-on-surface-variant"
                    />
                  </button>
                )}
                
                <button
                disabled
                  onClick={() => router.push("/plans?returnTo=/profile")}
                  className="flex flex-col cursor-not-allowed gap-3 rounded-2xl border border-primary/10 bg-background/80 p-4 text-left transition-all sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon icon="workspace_premium" weight={400} grade={0} size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-on-surface">Ver planos</p>
                    <p className="text-sm text-on-surface-variant">
                      Compare benefícios e recursos para sua conta.
                    </p>
                  </div>
                  <Icon
                    icon="chevron_right"
                    weight={400}
                    grade={0}
                    size={24}
                    className=" text-end text-on-surface-variant"
                  />
                </button>

              </div>

              <button
                onClick={handleLogout}
                className="flex flex-col gap-3 rounded-2xl border border-error/10 bg-error/5 p-4 text-left transition-all hover:bg-error/10 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-error/10 text-error">
                  <Icon icon="logout" weight={400} grade={0} size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-error">Sair da conta</p>
                  <p className="text-sm text-on-surface-variant">
                    Finalize sua sessão com segurança.
                  </p>
                </div>
                <Icon
                  icon="chevron_right"
                  weight={400}
                  grade={0}
                  size={24}
                  className="text-error text-end"
                />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

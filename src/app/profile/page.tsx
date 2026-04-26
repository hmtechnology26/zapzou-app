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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const activeServicesCount = userServices.filter(
    (service) => service.isActive && service.status === "active",
  ).length;

  const linkedEnvironmentsCount = selectedEnvironments.length;

  const planLabel =
    user.plan === "free" ? "FREE" : user.plan === "pro" ? "PRO" : "PLUS";

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

  const stats = [
    {
      label: "Plano atual",
      value: planLabel,
      icon: "workspace_premium",
    },
    {
      label: "Ambientes",
      value: linkedEnvironmentsCount,
      icon: "location_on",
    },
    {
      label: "Serviços ativos",
      value: activeServicesCount,
      icon: "storefront",
    },
    {
      label: "Conta",
      value: "Ativa",
      icon: "verified",
    },
  ];

  const actions = [
  {
    title: "Meus anúncios",
    description: "Gerencie seus serviços publicados.",
    icon: "storefront",
    onClick: () => router.push("/meus-anuncios"),
  },
  {
    title: "Suporte",
    description: "Fale com nosso time e tire dúvidas rapidamente.",
    icon: "support_agent",
    onClick: () => router.push("/contact"),
  },
  {
    title: user.plan === "plus" ? "Dashboard" : "Dashboard Plus",
    description:
      user.plan === "plus"
        ? "Veja visualizações e cliques dos seus serviços."
        : "Desbloqueie métricas avançadas do seu negócio.",
    icon: user.plan === "plus" ? "insights" : "workspace_premium",
    onClick: () =>
      user.plan === "plus"
        ? router.push("/dashboard")
        : router.push("/plans/plus?returnTo=/dashboard"),
    featured: true,
  },
  {
    title: "Ver planos",
    description: "Compare recursos e escolha o melhor plano.",
    icon: "diamond",
    onClick: () => router.push("/plans?returnTo=/profile"),
  },
];

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(48,204,54,0.16),_transparent_36%),linear-gradient(180deg,_#ffffff_0%,_#f7faf8_100%)] pb-24 dark:bg-[radial-gradient(circle_at_top,_rgba(48,204,54,0.14),_transparent_36%),linear-gradient(180deg,_#080a0c_0%,_#101215_100%)]">
      <TopAppBar />

      <main className="mx-auto max-w-6xl px-4 pb-6 pt-20 md:px-8 md:pt-24">
        <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0f1115] sm:p-8 md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#30cc36]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#30cc36]/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
                <div className="relative shrink-0">
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    alt={user.name}
                    className="h-24 w-24 rounded-[1.75rem] border border-white/80 shadow-[0_18px_44px_rgba(15,23,42,0.18)] sm:h-28 sm:w-28"
                    fallbackClassName="text-3xl"
                  />

                  <div className="absolute -bottom-2 -right-2 rounded-full bg-[#30cc36] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_12px_28px_rgba(48,204,54,0.35)]">
                    {planLabel}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#30cc36]/20 bg-[#30cc36]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#1eb34b]">
                    <Icon icon="verified" size={14} />
                    Perfil ativo
                  </div>

                  <h1 className="mt-4 truncate text-4xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
                    {user.name}
                  </h1>

                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                      <Icon icon="mail" size={14} />
                      <span className="truncate">{user.email}</span>
                    </span>

                    {user.role === "admin" && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#30cc36]/20 bg-[#30cc36]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1eb34b]">
                        <Icon icon="admin_panel_settings" size={14} />
                        Administrador
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#30cc36]/10 text-[#30cc36]">
                      <Icon icon={item.icon} size={20} />
                    </div>

                    <p className="text-xl font-black tracking-tight text-[#30cc36]">
                      {item.value}
                    </p>

                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[1.75rem] border border-zinc-200/80 bg-white/90 p-5 text-zinc-950 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 dark:text-white/40">
                    Central da conta
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                    Ações rápidas
                  </h2>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#30cc36]/10 text-[#30cc36] dark:bg-white/10 dark:text-white">
                  <Icon icon="bolt" size={26} />
                </div>
              </div>

              <div className="space-y-3">
                {actions.map((item) => (
                  <button
                    key={item.title}
                    onClick={item.onClick}
                    className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                      item.featured
                        ? "border-[#30cc36]/25 bg-[#30cc36]/8 hover:bg-[#30cc36]/12 dark:border-[#30cc36]/30 dark:bg-[#30cc36]/10 dark:hover:bg-[#30cc36]/15"
                        : "border-zinc-200/80 bg-zinc-50 hover:border-[#30cc36]/25 hover:bg-[#30cc36]/5 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.09]"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        item.featured
                          ? "bg-[#30cc36] text-white shadow-[0_10px_24px_rgba(48,204,54,0.22)]"
                          : "bg-zinc-100 text-zinc-600 group-hover:bg-[#30cc36]/10 group-hover:text-[#30cc36] dark:bg-white/10 dark:text-white"
                      }`}
                    >
                      <Icon icon={item.icon} size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-black text-zinc-950 dark:text-white">
                        {item.title}
                      </p>

                      <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-white/55">
                        {item.description}
                      </p>
                    </div>

                    <Icon
                      icon="arrow_forward"
                      size={20}
                      className="text-zinc-300 transition group-hover:text-[#30cc36] dark:text-white/35 dark:group-hover:text-white"
                    />
                  </button>
                ))}

                <button
                  onClick={handleLogout}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-rose-200/80 bg-rose-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:hover:bg-rose-500/15"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300">
                    <Icon icon="logout" size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-black text-rose-600 dark:text-rose-200">
                      Sair da conta
                    </p>

                    <p className="mt-1 text-sm leading-5 text-rose-400 dark:text-white/45">
                      Finalize sua sessão com segurança.
                    </p>
                  </div>

                  <Icon
                    icon="arrow_forward"
                    size={20}
                    className="text-rose-300 transition group-hover:text-rose-500 dark:text-rose-200/40 dark:group-hover:text-rose-200"
                  />
                </button>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

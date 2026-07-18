"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { TopAppBar } from "@/components/TopAppBar";
import { useApp } from "@/hooks/useApp";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.name || "");
    setAvatarUrl(user.avatar || "");
  }, [user]);

  const normalizedDisplayName = displayName.trim();
  const normalizedAvatarUrl = avatarUrl.trim();
  const profileHasChanges = useMemo(() => {
    if (!user) return false;
    return (
      normalizedDisplayName !== user.name.trim() ||
      normalizedAvatarUrl !== (user.avatar || "").trim()
    );
  }, [normalizedAvatarUrl, normalizedDisplayName, user]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || profileSaving) return;

    if (normalizedDisplayName.length < 2) {
      setProfileMessage({
        type: "error",
        text: "Informe um nome com pelo menos 2 caracteres.",
      });
      return;
    }

    setProfileSaving(true);
    setProfileMessage(null);

    try {
      const nextAvatar = normalizedAvatarUrl || null;

      const { error: profileError } = await supabase
        .from("users")
        .update({
          name: normalizedDisplayName,
          avatar: nextAvatar,
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: normalizedDisplayName,
          full_name: normalizedDisplayName,
          avatar_url: nextAvatar,
          picture: nextAvatar,
        },
      });

      if (authError) {
        throw authError;
      }

      setUser({
        ...user,
        name: normalizedDisplayName,
        avatar: nextAvatar || "",
      });
      setAvatarUrl(nextAvatar || "");
      setProfileMessage({
        type: "success",
        text: "Perfil atualizado com sucesso.",
      });
    } catch (err) {
      console.error("Profile update failed:", err);
      setProfileMessage({
        type: "error",
        text: "Nao foi possivel atualizar o perfil agora.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const resolveAvatarUploadEndpoint = () => {
    let edgeFunctionUrl = process.env.NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL;
    if (!edgeFunctionUrl) {
      throw new Error("Configuracao de upload nao encontrada.");
    }

    if (!edgeFunctionUrl.includes("r2-signed-upload")) {
      edgeFunctionUrl = edgeFunctionUrl.endsWith("/")
        ? `${edgeFunctionUrl}r2-signed-upload`
        : `${edgeFunctionUrl}/r2-signed-upload`;
    }

    return edgeFunctionUrl;
  };

  const getFileExtension = (file: File) => {
    const fromName = file.name.split(".").pop()?.toLowerCase();
    if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
    const fromMime = file.type.split("/").pop()?.toLowerCase();
    return fromMime?.replace(/[^a-z0-9]/g, "") || "webp";
  };

  const uploadAvatarFileToR2 = async (file: File) => {
    if (!user?.id) {
      throw new Error("Voce precisa estar logado para alterar o avatar.");
    }

    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const edgeFunctionUrl = resolveAvatarUploadEndpoint();

    if (!r2PublicUrl || !supabaseAnonKey) {
      throw new Error("Configuracao de storage incompleta.");
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Sessao expirada. Faca login novamente.");
    }

    const extension = getFileExtension(file);
    const filePath = `avatars/${user.id}-${Date.now()}.${extension}`;
    const contentType = file.type || "image/webp";

    const signResponse = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        path: filePath,
        contentType,
      }),
    });

    if (!signResponse.ok) {
      const payload = await signResponse.json().catch(() => null);
      throw new Error(payload?.error || "Nao foi possivel preparar o upload.");
    }

    const { uploadUrl } = await signResponse.json();
    if (!uploadUrl || typeof uploadUrl !== "string") {
      throw new Error("URL de upload invalida.");
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Falha no envio da imagem.");
    }

    return `${r2PublicUrl.replace(/\/+$/, "")}/${filePath}`;
  };

  const handleAvatarFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileMessage({
        type: "error",
        text: "Selecione um arquivo de imagem.",
      });
      return;
    }

    setAvatarUploading(true);
    setProfileMessage(null);

    try {
      const uploadedUrl = await uploadAvatarFileToR2(file);
      setAvatarUrl(uploadedUrl);
      setProfileMessage({
        type: "success",
        text: "Imagem enviada. Clique em Salvar para aplicar no perfil.",
      });
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setProfileMessage({
        type: "error",
        text: "Nao foi possivel enviar a imagem agora.",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

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
      window.location.href = "/";
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
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(48,204,54,0.16),_transparent_36%),linear-gradient(180deg,_#ffffff_0%,_#f7faf8_100%)] pb-24">
      <TopAppBar />

      <main className="mx-auto max-w-6xl px-4 pb-6 pt-20 md:px-8 md:pt-24">
        <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8 md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#04193D]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#04193D]/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
                <div className="relative shrink-0">
                  <Avatar
                    src={normalizedAvatarUrl || user.avatar}
                    name={normalizedDisplayName || user.name}
                    alt={normalizedDisplayName || user.name}
                    className="h-24 w-24 rounded-[1.75rem] border border-white/80 shadow-[0_18px_44px_rgba(15,23,42,0.18)] sm:h-28 sm:w-28"
                    fallbackClassName="text-3xl"
                  />

                  <div className="absolute -bottom-2 -right-2 rounded-full bg-[#04193D] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_12px_28px_rgba(48,204,54,0.35)]">
                    {planLabel}
                  </div>

                  <label className="absolute -left-2 -top-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-white/80 bg-white text-[#04193D] shadow-[0_12px_28px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-[#04193D] hover:text-white">
                    <Icon
                      icon={avatarUploading ? "progress_activity" : "photo_camera"}
                      size={20}
                      className={avatarUploading ? "animate-spin" : ""}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={avatarUploading || profileSaving}
                      onChange={handleAvatarFileChange}
                    />
                  </label>
                </div>

                <div className="min-w-0 flex-1">
                  
                  <h1 className="mt-4 truncate text-4xl font-black tracking-tight text-zinc-950 md:text-5xl">
                    {normalizedDisplayName || user.name}
                  </h1>

                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                      <Icon icon="mail" size={14} />
                      <span className="truncate">{user.email}</span>
                    </span>

                    {user.role === "admin" && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#04193D]/20 bg-[#04193D]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1eb34b]">
                        <Icon icon="admin_panel_settings" size={14} />
                        Administrador
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleProfileSubmit}
                className="mt-8 rounded-[1.75rem] border border-zinc-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-xl sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                  <label className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                      Nome publico
                    </span>
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      maxLength={150}
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-bold text-zinc-900 outline-none transition focus:border-[#04193D] focus:bg-white focus:ring-4 focus:ring-[#04193D]/10"
                    />
                  </label>

                  <label className="min-w-0 flex-[1.35]">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                      URL da imagem ou upload no avatar
                    </span>
                    <input
                      value={avatarUrl}
                      onChange={(event) => setAvatarUrl(event.target.value)}
                      placeholder="https://..."
                      className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-bold text-zinc-900 outline-none transition focus:border-[#04193D] focus:bg-white focus:ring-4 focus:ring-[#04193D]/10"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={!profileHasChanges || profileSaving || avatarUploading}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#04193D] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(48,204,54,0.24)] transition hover:-translate-y-0.5 hover:bg-[#27b82e] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <Icon
                      icon={profileSaving ? "progress_activity" : "save"}
                      size={18}
                      className={profileSaving ? "animate-spin" : ""}
                    />
                    {profileSaving ? "Salvando" : "Salvar"}
                  </button>
                </div>

                {profileMessage && (
                  <p
                    className={`mt-3 rounded-2xl px-4 py-3 text-sm font-bold ${
                      profileMessage.type === "success"
                        ? "bg-[#04193D]/10 text-[#1f9f25]"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {profileMessage.text}
                  </p>
                )}
              </form>

              <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#04193D]/10 text-[#04193D]">
                      <Icon icon={item.icon} size={20} />
                    </div>

                    <p className="text-xl font-black tracking-tight text-[#04193D]">
                      {item.value}
                    </p>

                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[1.75rem] border border-zinc-200/80 bg-white/90 p-5 text-zinc-950 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">
                    Central da conta
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
                    Ações rápidas
                  </h2>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#04193D]/10 text-[#04193D]">
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
                        ? "border-[#04193D]/25 bg-[#04193D]/8 hover:bg-[#04193D]/12"
                        : "border-zinc-200/80 bg-zinc-50 hover:border-[#04193D]/25 hover:bg-[#04193D]/5"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        item.featured
                          ? "bg-[#04193D] text-white shadow-[0_10px_24px_rgba(48,204,54,0.22)]"
                          : "bg-zinc-100 text-zinc-600 group-hover:bg-[#04193D]/10 group-hover:text-[#04193D]"
                      }`}
                    >
                      <Icon icon={item.icon} size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-black text-zinc-950">
                        {item.title}
                      </p>

                      <p className="mt-1 text-sm leading-5 text-zinc-500">
                        {item.description}
                      </p>
                    </div>

                    <Icon
                      icon="arrow_forward"
                      size={20}
                      className="text-zinc-300 transition group-hover:text-[#04193D]"
                    />
                  </button>
                ))}

                <button
                  onClick={handleLogout}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-rose-200/80 bg-rose-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-rose-100"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
                    <Icon icon="logout" size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-black text-rose-600">
                      Sair da conta
                    </p>

                    <p className="mt-1 text-sm leading-5 text-rose-400">
                      Finalize sua sessão com segurança.
                    </p>
                  </div>

                  <Icon
                    icon="arrow_forward"
                    size={20}
                    className="text-rose-300 transition group-hover:text-rose-500"
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

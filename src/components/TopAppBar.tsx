"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "../hooks/useApp";
import { useExitModal } from "@/contexts/ExitModalContext";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";


interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: "search" | "menu" | "share" | "more";
  onRightAction?: () => void;
  variant?: "default" | "primary";
  userAvatar?: string;
  onMenuClick?: () => void;
  onAvatarClick?: () => void;
  activePath?: string;
  leftAvatar?: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const baseNavItems: NavItem[] = [
  { path: "/", label: "Anúncios", icon: "home" },
  { path: "/places", label: "Comunidades", icon: "explore" },
  { path: "/meus-anuncios", label: "Meus Anúncios", icon: "storefront" },
  // { path: '/meus-ambientes', label: 'Minhas Comunidades', icon: 'apartment' },
  { path: "/favorites", label: "Favoritos", icon: "favorite" },
];

export function TopAppBar({
  title,
  showBack = false,
  onBack,
  rightAction,
  onRightAction,
  variant = "default",
  userAvatar: propAvatar,
  onMenuClick,
  onAvatarClick: propAvatarClick,
  leftAvatar,
}: TopAppBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useApp();
  const { checkAndShowExitModal } = useExitModal();

  const hasManagedEnvironments = (user?.managedEnvironmentIds?.length ?? 0) > 0;
  const navItems = hasManagedEnvironments
    ? [
        ...baseNavItems,
        {
          path: "/moderation",
          label: "Moderação",
          icon: "admin_panel_settings",
        },
      ]
    : baseNavItems;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const routes = [
      "/",
      "/places",
      "/meus-anuncios",
      "/meus-ambientes",
      "/favorites",
      "/contact",
      "/profile",
      "/login",
    ];

    if (hasManagedEnvironments) {
      routes.push("/moderation");
    }

    if (typeof window !== "undefined") {
      const connection = (
        navigator as Navigator & {
          connection?: { saveData?: boolean; effectiveType?: string };
        }
      ).connection;
      const saveData = Boolean(connection?.saveData);
      const effectiveType = String(connection?.effectiveType || "");
      const isSlowConnection =
        effectiveType.includes("2g") || effectiveType === "3g";
      const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;

      if (saveData || isSlowConnection || isMobileViewport) {
        return;
      }
    }

    routes.forEach((route) => {
      void router.prefetch(route);
    });
  }, [router, hasManagedEnvironments]);

  const userAvatar = mounted ? propAvatar || user?.avatar : null;
  const onAvatarClick = propAvatarClick || (() => router.push("/profile"));
  const currentPath = pathname ?? "";

  const finalRightAction =
    onRightAction ||
    (() => {
      if (!user) {
        router.push("/login");
      }
    });

  const handleNavClick = (path: string) => {
    if (checkAndShowExitModal(path)) {
      return;
    }
    router.push(path);
  };

  return (
    <header
      className="
    fixed inset-x-4 top-[calc(env(safe-area-inset-top)+0.5rem)]
    z-50
    mx-auto
    max-w-[1700px]
    overflow-hidden
    rounded-3xl md:rounded-[28px]
    border border-white/45
    bg-white/78
    backdrop-blur-[28px]
    supports-[backdrop-filter]:bg-white/70
    shadow-[0_12px_40px_rgba(15,23,42,0.08),0_2px_8px_rgba(15,23,42,0.04)]
    transition-all
    duration-500
  "
    >
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/70 via-white/15 to-transparent" />
      <div className="pointer-events-none absolute inset-[1px] rounded-[27px] border border-white/30" />

      <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:grid md:h-[68px] md:grid-cols-[auto_1fr_auto] md:px-6 lg:px-8">
        {/* Logo + Saudação */}
        <div className="flex items-center gap-2 md:gap-8">
          <Link href="/" prefetch>
            <img src="/conectae_logo.png" className="h-9 hover:transition hover:duration-300 hover:scale-105 transition-transform duration-300" />
          </Link>
          {mounted && (
            <span className="hidden whitespace-nowrap text-xs font-medium text-slate-500 md:inline">
              Olá, {user?.name ? user.name.split(" ")[0] : "Visitante"}!
            </span>
          )}
        </div>

        {/* Espaço central (mobile: saudação) */}
        {mounted && (
          <span className="truncate whitespace-nowrap text-xs font-medium text-slate-500 md:hidden">
            Olá, {user?.name ? user.name.split(" ")[0] : "Visitante"}!
          </span>
        )}

        {/* Nav + Avatar/Entrar */}
        <div className="flex items-center justify-end gap-2 md:gap-4">
          <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const isActive =
              item.path === "/"
                ? currentPath === "/"
                : currentPath === item.path ||
                  currentPath.startsWith(item.path + "/");

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavClick(item.path)}
                className={`
              group relative flex items-center gap-2
              rounded-xl
              px-4 py-2.5
              text-[13px]
              font-semibold
              transition-all
              duration-500
              ${
                isActive
                  ? "border border-[#04193D] bg-white text-[#04193D]"
                  : "border border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-[#04193D]"
              }
            `}
              >
                <Icon
                  icon={item.icon}
                  size={18}
                  weight={isActive ? 700 : 400}
                />

                <span className="hidden whitespace-nowrap lg:block">
                  {item.label}
                </span>

                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
                )}
              </button>
            );
          })}
        </nav>
          {user ? (
            <button
              onClick={onAvatarClick as any}
              className="
          group
          rounded-full
          p-1
          transition-all
          duration-500
          hover:scale-[1.03]
        "
            >
              <div className="relative">
                <Avatar
                  src={userAvatar || undefined}
                  name={user?.name || ""}
                  alt="User"
                  className="
              h-10
              w-10
              md:h-11
              md:w-11 
              ring-1
              ring-white/30
              shadow-[0_8px_24px_rgba(15,23,42,.08)]
              transition-all
              duration-500
              group-hover:ring-[#04193D]/40
              group-hover:shadow-[0_0_30px_rgba(4,25,61,.18)]
            "
                />

                {user.plan === "plus" && (
                  <div
                    className="
                absolute
                -right-1
                -top-1
                flex
                h-5
                w-5
                items-center
                justify-center
                rounded-full
                border-2
                border-white
                bg-gradient-to-br
                from-[#0F2E73]
                to-[#04193D]
                shadow-lg
              "
                  >
                    <Icon
                      icon="check"
                      size={10}
                      className="text-white"
                      weight={900}
                    />
                  </div>
                )}
              </div>
            </button>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="
group
flex
items-center
gap-2

rounded-full

bg-gradient-to-r
from-[#04193D]
to-[#0B2B66]

px-4
py-2

md:px-6
md:py-2.5

text-[12px]
md:text-[13px]

font-semibold

text-white

shadow-[0_10px_30px_rgba(4,25,61,.20)]

transition-all
duration-500

hover:-translate-y-[1px]
hover:shadow-[0_18px_40px_rgba(4,25,61,.28)]
"
            >
              <Icon icon="login" size={18} weight={700} />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>

    
  );
}

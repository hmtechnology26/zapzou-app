"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { useApp } from "@/hooks/useApp";
import { useExitModal } from "@/contexts/ExitModalContext";

interface NavItem {
  path: string;
  label: string;
  icon: string;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { path: "/", label: "Início", icon: "home" },
  { path: "/places", label: "Comunidades", icon: "explore" },
  { path: "/meus-anuncios", label: "Meus anúncios", icon: "storefront" },
  // { path: '/meus-ambientes', label: 'Minhas comunidades', icon: 'apartment' },
  { path: "/favorites", label: "Favoritos", icon: "favorite" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const { user } = useApp();
  const { checkAndShowExitModal } = useExitModal();

  useEffect(() => {
    [
      "/",
      "/places",
      "/meus-anuncios",
      "/meus-ambientes",
      "/favorites",
      "/login",
    ].forEach((route) => {
      void router.prefetch(route);
    });
  }, [router]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    item: NavItem,
  ) => {
    if (checkAndShowExitModal(item.path)) return;

    router.push(item.path);
  };

  return (
    <nav
      className="
    fixed
    inset-x-4
    bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]
    z-[60]
    md:hidden
    overflow-hidden
    rounded-[28px]
    border border-white/45
    dark:border-white/10
    bg-white/78
    backdrop-blur-[28px]
    supports-[backdrop-filter]:bg-white/70
    shadow-[0_12px_40px_rgba(15,23,42,.08),0_2px_8px_rgba(15,23,42,.04)]
    px-2
    py-2
    transition-all
    duration-500
  "
    >
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-b from-white/70 via-white/15 to-transparent dark:from-white/10 dark:via-transparent dark:to-transparent" />
      <div className="pointer-events-none absolute inset-[1px] rounded-[27px] border border-white/30 dark:border-white/5" />
      <div className="relative flex items-center justify-between gap-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== "/" && pathname.startsWith(item.path));

          return (
            <button
              key={item.path}
              type="button"
              aria-label={item.label}
              title={item.label}
              onClick={(e) => handleNavClick(e, item)}
              className={`
                          group
                          relative
                          flex
                          flex-1
                          flex-col
                          items-center
                          justify-center
                          gap-1
                          py-2
                          rounded-2xl
                          transition-all
                          duration-500
                          active:scale-95
                          ${!isActive ? "hover:bg-slate-100 dark:hover:bg-white/5" : ""}
                        `}
            >
              <span
                className={`
                            relative
                            flex
                            h-10
                            w-10
                            items-center
                            justify-center
                            rounded-full
                            transition-all
                            duration-500
                            ${
                              isActive
                                ? "bg-[#04193D] text-white shadow-[0_10px_30px_rgba(4,25,61,.18)]"
                                : "text-slate-600 dark:text-slate-300"
                            }
                          `}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
                )}

                <Icon
                  icon={item.icon}
                  size={20}
                  weight={isActive ? 700 : 400}
                  grade={isActive ? 0 : -25}
                  className="relative z-10"
                />
              </span>

              <span
                className={`
                            text-[10px]
                            font-medium
                            leading-none
                            transition-colors
                            duration-300
                            ${
                              isActive
                                ? "text-[#04193D] dark:text-white"
                                : "text-slate-500 dark:text-slate-400"
                            }
                          `}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

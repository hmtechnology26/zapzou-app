"use client";

import { useRouter } from "next/navigation";
import { MaterialSymbol as Icon } from "react-material-symbols";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import Link from "next/link";
export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError("Erro ao iniciar login com Google.");
        setLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err?.message || "Erro inesperado.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(48,204,54,0.16),_transparent_36%),linear-gradient(180deg,_#ffffff_0%,_#f7faf8_100%)]">
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        {" "}
        <div className="relative w-full max-w-lg">
          {" "}
          <div className="relative w-full max-w-lg">
            <div className="absolute inset-0 rounded-[2rem] bg-[#04193D]/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white/95 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8">
              {/* Mobile logo */}
              <div className="mb-8 flex flex-col items-center lg:hidden">
                <img
                  src="/conectae_logo_vert.png"
                  alt="Conectae"
                  className="h-28"
                />
              </div>

              {/* Desktop logo */}
              <div className="mb-10 hidden lg:flex flex-col items-center">
                <img
                  src="/conectae_logo_vert.png"
                  alt="Conectae"
                  className="h-36 w-auto drop-shadow-[0_18px_40px_rgba(4,25,61,0.25)]"
                />
              </div>

              <div className="mb-8">
                <h2 className="text-3xl text-center font-black tracking-tight text-zinc-950">
                  Entrar na plataforma
                </h2>

                <p className="mt-3 text-center text-sm leading-6 text-zinc-500">
                  Continue com sua conta Google.
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  <Icon icon="error" size={16} />
                  {error}
                </div>
              )}

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-[#04193D] px-6 py-4 text-sm font-black text-white shadow-[0_20px_45px_rgba(4,25,61,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_60px_rgba(4,25,61,0.25)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {/* brilho premium */}
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-120%] transition-transform duration-1000 group-hover:translate-x-[120%]" />

                {/* ícone */}
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center bg-white rounded-full shadow-[0_8px_20px_rgba(255,255,255,0.25)]">
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#04193D] border-t-transparent" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                </div>

                {/* texto */}
                <div className="relative z-10 flex flex-col items-start">
                  <span className="text-sm tracking-tight">
                    {loading ? "Redirecionando..." : "Continuar com Google"}
                  </span>
                </div>
              </button>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {/* Card 1 */}
                <div className="group rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#04193D]/20 hover:bg-white hover:shadow-lg">
                  <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-[#04193D]/10 text-[#04193D] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#04193D] group-hover:text-white">
                    <Icon icon="lock" size={20} />
                  </div>

                  <h3 className="text-[13px] font-bold text-zinc-900">
                    Login seguro
                  </h3>

                  <p className="mt-1 text-[11px] leading-4 text-zinc-500">
                    Autenticação Google protegida
                  </p>
                </div>

                {/* Card 2 */}
                <div className="group rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#04193D]/20 hover:bg-white hover:shadow-lg">
                  <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-[#04193D]/10 text-[#04193D] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#04193D] group-hover:text-white">
                    <Icon icon="bolt" size={20} />
                  </div>

                  <h3 className="text-[13px] font-bold text-zinc-900">
                    Acesso rápido
                  </h3>

                  <p className="mt-1 text-[11px] leading-4 text-zinc-500">
                    Entre em segundos
                  </p>
                </div>
              </div>

              <footer className="mt-8 border-t border-zinc-200/70 pt-6">
                <p className="text-center text-[11px] leading-6 text-zinc-500">
                  Ao continuar, você concorda com nossos{" "}
                  <Link
                    href="/terms"
                    className="font-bold text-[#04193D] hover:underline"
                  >
                    Termos de Uso
                  </Link>{" "}
                  e{" "}
                  <Link
                    href="/privacy"
                    className="font-bold text-[#04193D] hover:underline"
                  >
                    Política de Privacidade
                  </Link>
                  .
                </p>

                <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                  ConectaE © 2026 • HM Technology
                </p>
              </footer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

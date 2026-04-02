'use client';

import { useRouter } from 'next/navigation';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        console.error('OAuth error:', authError);
        setError('Erro ao iniciar login com Google. Tente novamente.');
        setLoading(false);
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Erro desconhecido');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-background">
      <main className="w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="mt-16 mb-8 flex flex-col items-center">
          <img src="/conectae_logo_vert.png" alt="Conectae" className="h-48" />
          
          {/* <div className="h-1 w-12 bg-primary-container rounded-full"></div> */}
        </div>

        {/* Card */}
        <div className="w-full bg-surface-container-lowest rounded-3xl p-8 flex flex-col items-center shadow-sm">
          <div className="text-center mb-10">
            <h2 className="text-on-surface font-semibold text-2xl mb-3">Seja bem-vindo ao Conect<spam className="text-[#30cc36]">ae</spam></h2>
            <p className="text-on-surface-variant text-base leading-relaxed">
              Faça login para acessar os serviços da sua comunidade
            </p>
          </div>

          {error && (
            <div className="w-full mb-6 px-4 py-3 bg-error/10 text-error rounded-xl text-sm text-center flex items-center gap-2 justify-center">
              <Icon icon="error" size={16} />
              {error}
            </div>
          )}

          <button
            id="login-google"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full group flex items-center justify-center gap-2 md:gap-4 bg-surface-container-low hover:bg-[#30cc36] text-on-surface hover:text-white transition-all duration-300 py-3 md:py-4 px-4 md:px-6 rounded-full border-2 border-[#34A853]/30 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="w-5 md:w-6 h-5 md:h-6 flex items-center justify-center group-hover:invert group-hover:brightness-0 group-hover:contrast-200">
                <svg className="w-full h-full" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
            )}
            <span className="text-on-surface font-semibold text-base md:text-lg whitespace-nowrap group-hover:text-white">
              {loading ? 'Redirecionando...' : 'Continuar com Google'}
            </span>
          </button>

          <div className="mt-8 flex flex-col gap-4 w-full">
            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
              <span className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">seguro</span>
              <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
            </div>
            <div className="flex items-center justify-center gap-6 text-on-surface-variant/60">
              <div className="flex items-center gap-1.5 text-xs">
                <Icon icon="lock" size={14} />
                <span>Autenticação segura</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Icon icon="verified_user" size={14} />
                <span>Dados protegidos</span>
              </div>
            </div>
          </div>
        </div>

         <footer className="mt-12 text-center px-4">
           <p className="text-on-surface-variant text-[11px] leading-relaxed max-w-[280px]">
             Ao continuar, você concorda com nossos{' '}
             <Link className="text-primary font-semibold hover:underline" href="/terms">Termos de Uso</Link>{' '}
             e reconhece que leu nossa{' '}
             <Link className="text-primary font-semibold hover:underline" href="/privacy">Política de Privacidade</Link>.
           </p>
           <div className="mt-8 flex justify-center gap-6">
             <span className="text-on-surface-variant/40 text-[10px] font-bold tracking-tighter uppercase">Conectae © 2026</span>
           </div>
           <span className="text-on-surface-variant/40 text-[10px] font-bold tracking-tighter">Desenvolvido por HM Technology</span>
         </footer>
      </main>
    </div>
  );
}

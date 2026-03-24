import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { useApp } from '../hooks/useApp';

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useApp();

  const handleGoogleLogin = () => {
    setUser({
      name: 'Maria Silva',
      email: 'maria.silva@email.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      role: 'user'
    });
    navigate('/');
  };

  const handleAdminLogin = () => {
    setUser({
      name: 'João Administrador',
      email: 'joao.admin@zapzou.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      role: 'admin'
    });
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-background">
      <main className="w-full max-w-md flex flex-col items-center">
        <div className="mb-12 flex flex-col items-center">
          <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Icon icon="chat" weight={400} grade={0} size={48} className="text-on-primary-container text-5xl" />
          </div>
          <h1 className="text-primary font-extrabold text-3xl tracking-tight mb-2">ZapZou</h1>
          <div className="h-1 w-12 bg-primary-container rounded-full"></div>
        </div>

        <div className="w-full bg-surface-container-lowest rounded-3xl p-8 flex flex-col items-center">
          <div className="text-center mb-10">
            <h2 className="text-on-surface font-semibold text-2xl mb-3">Seja bem-vindo ao ZapZou</h2>
            <p className="text-on-surface-variant text-base leading-relaxed">
              Escolha uma conta para continuar
            </p>
          </div>

          <div className="w-full space-y-4">
            <button 
              onClick={handleGoogleLogin}
              className="w-full group flex items-center justify-center gap-4 bg-surface-container-low hover:bg-surface-container-highest transition-all duration-300 py-4 px-6 rounded-full border border-outline-variant/20 active:scale-95"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <span className="text-on-surface font-semibold text-lg">Entrar como Maria</span>
            </button>

            <button 
              onClick={handleAdminLogin}
              className="w-full group flex items-center justify-center gap-4 bg-primary text-white hover:opacity-90 transition-all duration-300 py-4 px-6 rounded-full shadow-lg shadow-primary/20 active:scale-95"
            >
              <Icon icon="admin_panel_settings" size={24} />
              <span className="font-semibold text-lg">Entrar como Moderador</span>
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-4 w-full">
            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
              <span className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">ou</span>
              <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
            </div>
            <button className="w-full text-primary font-medium text-sm py-2 hover:opacity-70 transition-opacity">
              Precisa de ajuda para acessar?
            </button>
          </div>
        </div>

        <footer className="mt-12 text-center px-4">
          <p className="text-on-surface-variant text-[11px] leading-relaxed max-w-[280px]">
            Ao continuar, você concorda com nossos{' '}
            <a className="text-primary font-semibold hover:underline" href="#">Termos de Uso</a>{' '}
            e reconhece que leu nossa{' '}
            <a className="text-primary font-semibold hover:underline" href="#">Política de Privacidade</a>.
          </p>
          <div className="mt-8 flex justify-center gap-6">
            <span className="text-on-surface-variant/40 text-[10px] font-bold tracking-tighter uppercase">ZapZou Messenger</span>
            <span className="text-on-surface-variant/40 text-[10px] font-bold tracking-tighter uppercase">© 2024</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

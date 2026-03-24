import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';

interface AdminSetting {
  id: string;
  title: string;
  icon: any; // Using any for icon name to satisfy TypeScript for now
  description: string;
  path?: string;
}

const adminSettings: AdminSetting[] = [
  { id: '1', title: 'Regras de Visibilidade', icon: 'visibility', description: 'Quem pode ver os serviços', path: '/admin/visibility' },
  { id: '2', title: 'Moderação de Posts', icon: 'security', description: 'Requer aprovação para novos posts', path: '/moderation' },
  { id: '3', title: 'Configurar Logo', icon: 'image', description: 'Adicionar brasão do ambiente', path: '/admin/logo' },
  { id: '4', title: 'Logs de Atividade', icon: 'history', description: 'Ver quem acessou o portal', path: '/admin/logs' },
];

export function AdminSettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar 
        title="Ajustes de Ambiente" 
        showBack 
        onBack={() => navigate(-1)}
        variant="primary"
      />
      
      <main className="pt-20 px-4 max-w-2xl mx-auto">
        <div className="mt-4 mb-8">
          <p className="text-on-surface-variant text-sm px-2">
            Configurações avançadas do Residencial Aurora.
          </p>
        </div>

        <section className="space-y-4">
          {adminSettings.map((item) => (
            <div 
              key={item.id} 
              onClick={() => item.path && navigate(item.path)}
              className={`bg-surface-container-lowest p-5 rounded-2xl flex items-center justify-between border border-outline-variant/10 shadow-sm transition-all active:scale-[0.98] ${item.path ? 'cursor-pointer hover:bg-surface-container-low' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                  <Icon icon={item.icon} weight={400} grade={0} size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface text-base">{item.title}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{item.description}</p>
                </div>
              </div>
              <Icon icon="chevron_right" weight={400} grade={0} size={24} className="text-on-surface-variant" />
            </div>
          ))}
        </section>

        <section className="mt-12">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-2 mb-4">Área de Perigo</h3>
          <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-error-container/20 border border-error/10 text-error active:bg-error-container/30 transition-colors">
            <div className="flex items-center gap-4 text-left">
              <Icon icon="delete_forever" weight={400} grade={0} size={24} />
              <div>
                <h4 className="font-bold text-sm">Remover este Ambiente</h4>
                <p className="text-[10px] opacity-70">Exclui todos os dados e serviços vinculados</p>
              </div>
            </div>
          </button>
        </section>
      </main>

      <nav className="fixed bottom-0 w-full z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/10 h-20 flex justify-around items-center px-2 pb-safe-bottom rounded-t-3xl">
        <button onClick={() => navigate('/members')} className="flex flex-col items-center justify-center text-slate-500 px-5 py-1 hover:text-emerald-600 active:scale-90 transition-transform duration-150">
          <Icon icon="group" weight={400} grade={0} size={24} />
          <span className="text-[11px] font-medium tracking-wide">Membros</span>
        </button>
        <button onClick={() => navigate('/bulletins')} className="flex flex-col items-center justify-center text-slate-500 px-5 py-1 hover:text-emerald-600 active:scale-90 transition-transform duration-150">
          <Icon icon="campaign" weight={400} grade={0} size={24} />
          <span className="text-[11px] font-medium tracking-wide">Avisos</span>
        </button>
        <button onClick={() => navigate('/finances')} className="flex flex-col items-center justify-center text-slate-500 px-5 py-1 hover:text-emerald-600 active:scale-90 transition-transform duration-150">
          <Icon icon="payments" weight={400} grade={0} size={24} />
          <span className="text-[11px] font-medium tracking-wide">Financeiro</span>
        </button>
        <button onClick={() => navigate('/admin-settings')} className="flex flex-col items-center justify-center bg-emerald-100 text-emerald-800 rounded-full px-5 py-1 active:scale-90 transition-transform duration-150">
          <Icon icon="settings" weight={400} grade={0} size={24} />
          <span className="text-[11px] font-medium tracking-wide">Ajustes</span>
        </button>
      </nav>
    </div>
  );
}

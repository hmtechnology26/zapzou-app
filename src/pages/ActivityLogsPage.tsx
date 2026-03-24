import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';

const logs = [
  { id: '1', user: 'Julia Santos', action: 'Cadastrou serviço "Marmitas"', date: 'Hoje, 10:45', icon: 'add_business' },
  { id: '2', user: 'Ricardo Silveira', action: 'Solicitou entrada no ambiente', date: 'Hoje, 09:12', icon: 'person_add' },
  { id: '3', user: 'Beatriz Souza', action: 'Avaliou "Marmitas da Julia"', date: 'Ontem, 20:30', icon: 'star' },
  { id: '4', user: 'Liderança', action: 'Aprovou serviço "Marmitas"', date: 'Ontem, 16:00', icon: 'check_circle' },
  { id: '5', user: 'Ana Martins', action: 'Visualizou perfil do ambiente', date: 'Ontem, 14:15', icon: 'visibility' },
  { id: '6', user: 'Liderança', action: 'Editou regras de visibilidade', date: 'Há 2 dias', icon: 'security' },
];

export function ActivityLogsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 bg-surface-container-lowest">
      <TopAppBar title="Logs de Atividade" showBack onBack={() => navigate(-1)} variant="primary" />
      
      <main className="pt-24 px-6 max-w-md mx-auto space-y-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-on-surface">Histórico Local</h2>
            <button className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1">
              Exportar
              <Icon icon="file_download" size={16} />
            </button>
          </div>
          
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-outline-variant/10 shadow-sm transition-all hover:bg-white/80 active:scale-[0.98]">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary/60">
                  <Icon icon={log.icon as any} size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-sm text-on-surface">{log.user}</p>
                    <p className="text-[10px] text-on-surface-variant opacity-60 font-medium">{log.date}</p>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">{log.action}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-secondary-container/10 p-5 rounded-3xl border border-secondary-container/20 flex items-center gap-4">
          <Icon icon="insights" size={48} className="text-primary opacity-20" />
          <div>
            <h4 className="font-bold text-on-surface text-sm">Monitoramento Ativo</h4>
            <p className="text-xs text-on-surface-variant leading-tight">O ZapZou registra apenas ações essenciais para garantir a segurança da comunidade.</p>
          </div>
        </section>

        <button 
          onClick={() => navigate(-1)}
          className="w-full bg-surface-container-high py-4 rounded-full text-on-surface font-bold text-sm hover:bg-surface-container transition-colors"
        >
          Limpar Logs (Admin)
        </button>
      </main>
    </div>
  );
}

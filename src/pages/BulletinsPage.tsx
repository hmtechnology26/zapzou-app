import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';

const bulletins = [
  {
    id: '1',
    title: 'Manutenção Preventiva',
    content: 'A dedetização das áreas comuns ocorrerá na próxima quarta-feira, dia 25/03.',
    date: '20 Mar',
    author: 'Administração',
    type: 'warning'
  },
  {
    id: '2',
    title: 'Assembleia Geral',
    content: 'Participe da votação para a nova pintura do bloco C às 19:30 via Zoom.',
    date: '18 Mar',
    author: 'Síndico',
    type: 'info'
  },
  {
    id: '3',
    title: 'Novo Horário da Academia',
    content: 'A partir de abril, a academia funcionará das 06h às 23h todos os dias.',
    date: '15 Mar',
    author: 'Comitê Esportivo',
    type: 'success'
  }
];

export function BulletinsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar 
        title="Quadro de Avisos" 
        showBack 
        onBack={() => navigate(-1)}
        variant="primary"
      />
      
      <main className="pt-20 px-4 max-w-2xl mx-auto">
        <div className="mt-4 mb-8">
          <p className="text-on-surface-variant text-sm px-2 italic">
            Fique por dentro das comunicações oficiais do seu ambiente.
          </p>
        </div>

        <section className="space-y-4">
          {bulletins.map((item) => (
            <div key={item.id} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                item.type === 'warning' ? 'bg-amber-400' : item.type === 'info' ? 'bg-blue-400' : 'bg-emerald-400'
              }`}></div>
              
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{item.author}</span>
                <span className="text-xs font-medium text-outline">{item.date}</span>
              </div>
              
              <h3 className="text-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
                {item.content}
              </p>
              
              <button className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                Ler comunicado completo
                <Icon icon="arrow_forward" weight={400} grade={0} size={16} />
              </button>
            </div>
          ))}
        </section>

        <button className="fixed bottom-24 right-6 w-14 h-14 rounded-full primary-gradient text-white shadow-lg flex items-center justify-center active:scale-90 transition-transform duration-150 z-40">
          <Icon icon="add_comment" weight={400} grade={0} size={28} />
        </button>
      </main>

      <nav className="fixed bottom-0 w-full z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/10 h-20 flex justify-around items-center px-2 pb-safe-bottom rounded-t-3xl">
        <button onClick={() => navigate('/members')} className="flex flex-col items-center justify-center text-slate-500 px-5 py-1 hover:text-emerald-600 active:scale-90 transition-transform duration-150">
          <Icon icon="group" weight={400} grade={0} size={24} />
          <span className="text-[11px] font-medium tracking-wide">Membros</span>
        </button>
        <button onClick={() => navigate('/bulletins')} className="flex flex-col items-center justify-center bg-emerald-100 text-emerald-800 rounded-full px-5 py-1 active:scale-90 transition-transform duration-150">
          <Icon icon="campaign" weight={400} grade={0} size={24} />
          <span className="text-[11px] font-medium tracking-wide">Avisos</span>
        </button>
        <button onClick={() => navigate('/finances')} className="flex flex-col items-center justify-center text-slate-500 px-5 py-1 hover:text-emerald-600 active:scale-90 transition-transform duration-150">
          <Icon icon="payments" weight={400} grade={0} size={24} />
          <span className="text-[11px] font-medium tracking-wide">Financeiro</span>
        </button>
        <button onClick={() => navigate('/admin-settings')} className="flex flex-col items-center justify-center text-slate-500 px-5 py-1 hover:text-emerald-600 active:scale-90 transition-transform duration-150">
          <Icon icon="settings" weight={400} grade={0} size={24} />
          <span className="text-[11px] font-medium tracking-wide">Ajustes</span>
        </button>
      </nav>
    </div>
  );
}

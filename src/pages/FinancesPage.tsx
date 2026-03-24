import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';

const transactions = [
  { id: '1', description: 'Taxa Condominial Mar/24', amount: 'R$ 450,00', status: 'pago', date: '05 Mar', category: 'Taxa' },
  { id: '2', description: 'Reserva Salão de Festas', amount: 'R$ 150,00', status: 'pago', date: '12 Mar', category: 'Reserva' },
  { id: '3', description: 'Gás Individual', amount: 'R$ 85,42', status: 'pendente', date: '21 Mar', category: 'Gás' },
  { id: '4', description: 'Cota Extra Elevador', amount: 'R$ 300,00', status: 'pendente', date: '30 Mar', category: 'Extras' },
];

export function FinancesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar 
        title="Financeiro" 
        showBack 
        onBack={() => navigate(-1)}
        variant="primary"
      />
      
      <main className="pt-20 px-4 max-w-2xl mx-auto">
        <div className="mt-4 mb-8 bg-surface-container-high p-6 rounded-3xl text-center">
          <p className="text-on-surface-variant text-[11px] uppercase font-bold tracking-widest mb-1">Total Pendente</p>
          <h3 className="text-3xl font-extrabold text-on-surface tracking-tight mb-4">R$ 385,42</h3>
          <div className="flex gap-2 justify-center">
            <button className="bg-primary text-white text-xs font-bold px-5 py-2 rounded-full active:scale-95 transition-transform">
              Pagar Tudo
            </button>
            <button className="bg-white text-on-surface-variant text-xs font-bold px-5 py-2 rounded-full border border-outline-variant/30 active:scale-95 transition-transform">
              Baixar PDF
            </button>
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-2 mb-4 italic">Histórico de Movimentações</h3>
          {transactions.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm active:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.status === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  <Icon icon={item.category === 'Taxa' ? 'domain' : item.category === 'Reserva' ? 'celebration' : 'receipt_long'} weight={400} grade={0} size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface text-sm">{item.description}</h4>
                  <p className="text-[10px] text-on-surface-variant font-medium">{item.date} • {item.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-on-surface">{item.amount}</p>
                <div className="flex items-center justify-end gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'pago' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  <span className={`text-[10px] font-bold uppercase ${item.status === 'pago' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
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
        <button onClick={() => navigate('/finances')} className="flex flex-col items-center justify-center bg-emerald-100 text-emerald-800 rounded-full px-5 py-1 active:scale-90 transition-transform duration-150">
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

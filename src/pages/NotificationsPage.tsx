import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';

const notifications = [
  {
    id: '1',
    title: 'Novo Membro',
    message: 'Marcos Oliveira solicitou acesso ao Residencial Aurora.',
    time: 'Há 5 minutos',
    type: 'member',
    isUnread: true
  },
  {
    id: '2',
    title: 'Aviso Importante',
    message: 'A manutenção do elevador está agendada para amanhã às 10h.',
    time: 'Há 2 horas',
    type: 'alert',
    isUnread: true
  },
  {
    id: '3',
    title: 'Novo Serviço',
    message: 'Trufas da Ana agora está disponível no seu condomínio!',
    time: 'Há 1 dia',
    type: 'service',
    isUnread: false
  }
];

export function NotificationsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar title="Notificações" showBack onBack={() => navigate(-1)} />
      
      <main className="pt-20 px-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest px-1">Recentes</h2>
          <button className="text-primary text-xs font-bold hover:underline">Marcar todas como lidas</button>
        </div>

        <section className="space-y-3">
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`p-4 rounded-2xl flex gap-4 items-start transition-all active:scale-[0.98] ${
                notif.isUnread 
                  ? 'bg-primary-container/10 border border-primary-container/20' 
                  : 'bg-surface-container-low border border-transparent'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                notif.type === 'member' 
                  ? 'bg-secondary-container text-on-secondary-container' 
                  : notif.type === 'alert' 
                    ? 'bg-error-container/20 text-error' 
                    : 'bg-primary-container/20 text-primary'
              }`}>
                <Icon 
                  icon={notif.type === 'member' ? 'person_add' : notif.type === 'alert' ? 'warning' : 'shopping_bag'} 
                  weight={400} 
                  grade={0} 
                  size={24} 
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-on-surface text-base">{notif.title}</h3>
                  <span className="text-[10px] text-on-surface-variant font-medium">{notif.time}</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {notif.message}
                </p>
              </div>
              {notif.isUnread && (
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              )}
            </div>
          ))}
        </section>

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <Icon icon="notifications_off" weight={300} grade={0} size={64} className="mb-4" />
            <p className="text-on-surface-variant">Você não tem notificações no momento.</p>
          </div>
        )}
      </main>

    </div>
  );
}

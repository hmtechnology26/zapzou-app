import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';

export function PostPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar title="Criar Serviço" showBack onBack={() => navigate(-1)} />
      
      <main className="pt-20 px-6 max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Icon icon="add_business" weight={400} grade={0} size={48} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-3">Divulgue seus Serviços</h2>
          <p className="text-on-surface-variant mb-8 max-w-xs">
            Anuncie seus serviços para a comunidade local e aumente suas vendas.
          </p>
          <button 
            onClick={() => navigate('/select-environments')}
            className="primary-gradient text-white px-8 py-4 rounded-full font-semibold text-lg active:scale-95 transition-transform shadow-lg shadow-primary/20"
          >
            Começar Anúncio
          </button>
        </div>

        <div className="space-y-4 mt-8">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Como funciona</h3>
          
          <div className="flex items-start gap-4 p-4 bg-surface-container-low rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold flex-shrink-0">1</div>
            <div>
              <h4 className="font-semibold text-on-surface">Selecione Ambientes</h4>
              <p className="text-sm text-on-surface-variant">Escolha onde quer divulgar (condomínios, igrejas, clubes)</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-surface-container-low rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold flex-shrink-0">2</div>
            <div>
              <h4 className="font-semibold text-on-surface">Cadastre seu Serviço</h4>
              <p className="text-sm text-on-surface-variant">Adicione fotos, descrição e suas informações de contato</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-surface-container-low rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold flex-shrink-0">3</div>
            <div>
              <h4 className="font-semibold text-on-surface">Receba Contatos</h4>
              <p className="text-sm text-on-surface-variant">Clientes interessados entrarão em contato via WhatsApp</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

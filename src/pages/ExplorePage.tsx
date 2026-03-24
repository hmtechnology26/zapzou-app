import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';

const environments = [
  {
    id: '1',
    name: 'Paróquia Santo Antônio',
    location: 'Bairro Jardins, São Paulo',
    type: 'church',
    image: 'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?w=200'
  },
  {
    id: '2',
    name: 'Condomínio Solar das Palmeiras',
    location: 'Vila Olímpia, São Paulo',
    type: 'residential',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200'
  },
];

const categories = ['Tudo', 'Igrejas', 'Condomínios', 'Clubes', 'Associações'];

export function ExplorePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar />
      
      <main className="pt-20 px-6 max-w-2xl mx-auto">
        <section className="mt-8 mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-2">Encontre por comunidade</h2>
          <p className="text-on-surface-variant text-base">
            Busque por igrejas, condomínios ou clubes para encontrar profissionais recomendados.
          </p>
        </section>

        <section className="mb-8">
          <div className="relative group">
            <Icon 
              icon="search" 
              weight={400} 
              grade={0} 
              size={24} 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" 
            />
            <input 
              className="w-full bg-surface-container-highest border-none rounded-full py-4 pl-12 pr-6 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none"
              placeholder="Buscar ambiente (ex: Paróquia Santo Antônio)"
              type="text"
            />
          </div>
        </section>

        <section className="mb-10">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((category, index) => (
              <button 
                key={category}
                className={`flex-shrink-0 px-6 py-2 rounded-full text-sm font-medium transition-transform active:scale-95 ${
                  index === 0
                    ? 'primary-gradient text-white'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          {environments.map((env) => (
            <div 
              key={env.id}
              className="bg-surface-container-lowest rounded-xl rounded-br-sm p-4 flex gap-4 transition-transform active:scale-[0.98] border-l-4 border-primary"
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  className="w-full h-full object-cover" 
                  src={env.image} 
                  alt={env.name}
                />
              </div>
              <div className="flex flex-col justify-between flex-grow">
                <div>
                  <h3 className="font-bold text-on-surface text-lg leading-tight">{env.name}</h3>
                  <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                    <Icon icon="location_on" weight={400} grade={0} size={16} className="text-xs" />
                    {env.location}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={() => navigate('/search')}
                    className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                  >
                    Ver profissionais
                    <Icon icon="arrow_forward" weight={400} grade={0} size={16} className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-16 text-center py-10 px-4 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/30">
          <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Icon icon="groups" weight={400} grade={0} size={32} className="text-primary text-3xl" />
          </div>
          <p className="text-on-surface-variant text-base font-medium max-w-xs mx-auto">
            Você ainda não faz parte de nenhuma comunidade? Explore as opções acima.
          </p>
        </section>
      </main>

    </div>
  );
}

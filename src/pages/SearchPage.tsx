import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';

const searchResults = [
  {
    id: '1',
    slug: 'marmitas-semanais',
    title: 'Marmitas semanais sob encomenda',
    description: 'Entrega 2x por semana • Caseiro',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'
  },
  {
    id: '2',
    slug: 'diarista-profissional',
    title: 'Diarista profissional',
    description: 'Limpeza residencial e comercial',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300'
  },
  {
    id: '3',
    slug: 'aulas-de-yoga',
    title: 'Aulas de Yoga',
    description: 'Yoga para todos os níveis',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=300'
  },
  {
    id: '4',
    slug: 'bolos-personalizados',
    title: 'Bolos personalizados',
    description: 'Bolos para festas e eventos',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300'
  }
];

export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filteredResults = searchResults.filter(s => 
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    s.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar showBack onBack={() => navigate(-1)} />
      
      <main className="pt-20 px-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="relative group">
            <Icon 
              icon="search" 
              weight={400} 
              grade={0} 
              size={24} 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" 
            />
            <input 
              className="w-full bg-surface-container-highest border-none rounded-full py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all"
              placeholder="Buscar serviços..."
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {query === '' ? (
          <div className="text-center py-20">
            <Icon icon="search" weight={300} grade={0} size={48} className="text-outline text-6xl mb-4" />
            <p className="text-on-surface-variant">
              Digite para buscar serviços
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              {filteredResults.length} resultado{filteredResults.length !== 1 ? 's' : ''} encontrado{filteredResults.length !== 1 ? 's' : ''}
            </p>

            {filteredResults.map((service) => (
              <div 
                key={service.id}
                onClick={() => navigate(`/service/${service.slug}`)}
                className="bg-surface-container-lowest p-3 rounded-2xl flex gap-4 items-center cursor-pointer hover:bg-white transition-all"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <img 
                    className="w-full h-full object-cover" 
                    src={service.image} 
                    alt={service.title}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-on-surface leading-tight">{service.title}</h3>
                  <p className="text-on-surface-variant text-sm mt-1">{service.description}</p>
                  <div className="mt-1 flex items-center gap-1 text-primary">
                    <Icon icon="star" weight={400} grade={0} size={16} className="text-sm" style={{ fontVariationSettings: "'FILL' 1" }} />
                    <span className="text-xs font-bold">{service.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {!query && (
          <section className="mt-8">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">
              Categorias Populares
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Alimentação', 'Limpeza', 'Manutenção', 'Beleza', 'Educação', 'Pet Care'].map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setQuery(cat)}
                  className="px-4 py-2 bg-surface-container-low rounded-full text-sm text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

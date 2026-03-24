import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';
import { useApp } from '../hooks/useApp';
import { useState } from 'react';

const categories = ['Tudo', 'Alimentação', 'Limpeza', 'Manutenção', 'Pet Sitting', 'Beleza', 'Tecnologia', 'Outros'];


export function HomePage() {
  const navigate = useNavigate();
  const { user, selectedEnvironments, services } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tudo');

  const activeServices = services.filter(s => {
    const isBasicActive = s.isActive && s.status === 'active';
    const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const sTerm = normalize(search);
    
    // Busca em múltiplos campos
    const matchesSearch = 
      normalize(s.title).includes(sTerm) || 
      normalize(s.description).includes(sTerm) ||
      normalize(s.category).includes(sTerm) ||
      (s.provider && normalize(s.provider).includes(sTerm));

    const matchesCategory = selectedCategory === 'Tudo' || s.category === selectedCategory;
    
    return isBasicActive && matchesSearch && matchesCategory;
  });

  return (
    <div className={`min-h-screen ${user ? 'pb-32' : 'pb-10'}`}>
      <TopAppBar />
      
      <main className="px-6 space-y-8 mt-4">
        {/* ... environment section ... */}
        <section className="flex items-center gap-2 bg-surface-container-low rounded-xl shadow-sm border border-outline-variant/5">
          <Icon icon="location_on" weight={100} grade={0} size={24} className="text-primary" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-bold text-primary/60">Seu Ambiente</span>
            <span className="text-on-surface font-black text-sm uppercase">
              {selectedEnvironments[0]?.name || 'Selecione um ambiente'}
            </span>
          </div>
        </section>

        {/* ... search and categories ... */}
        <section className="space-y-4">
          <div className="relative group">
            <Icon 
              icon="search" 
              weight={400} 
              grade={0} 
              size={24} 
              className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary" 
            />
            <input 
              className="w-full bg-surface-container-highest border-none rounded-full py-4 pl-14 pr-6 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-on-surface-variant/60 shadow-inner"
              placeholder="Buscar no ambiente..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((category) => (
              <button 
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap active:scale-95 transition-all ${
                  selectedCategory === category 
                    ? 'primary-gradient text-white shadow-md shadow-primary/20 scale-105' 
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-on-surface tracking-tight uppercase text-xs tracking-widest opacity-40">Recomendados para você</h2>
            <button 
              onClick={() => {
                if (user) {
                  setSearch('');
                  setSelectedCategory('Tudo');
                } else {
                  navigate('/login');
                }
              }} 
              className="text-primary font-bold text-sm"
            >
              Exibir Tudo
            </button>
          </div>
          
          <div className="grid gap-4">
            {activeServices.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <Icon icon="search_off" weight={400} grade={0} size={48} className="mb-2 text-outline" />
                <p className="text-sm">Nenhum serviço disponível neste ambiente.</p>
              </div>
            ) : (
              activeServices.map((service) => (
                <div 
                  key={service.id}
                  className="bg-white p-2 rounded-[2rem] flex gap-4 items-center group cursor-pointer hover:bg-surface-container-lowest transition-all shadow-sm border border-outline-variant/5"
                  onClick={() => navigate(`/service/${service.slug}`)}
                >
                  <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden flex-shrink-0 shadow-inner">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      src={service.image} 
                      alt={service.title}
                    />
                  </div>
                  <div className="pr-4 py-2 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">{service.category}</span>
                      <div className="flex items-center gap-1 text-primary">
                        <Icon icon="star" weight={400} grade={0} size={14} style={{ fontVariationSettings: "'FILL' 1" }} />
                        <span className="text-[10px] font-extrabold">{service.rating || 'N/A'}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-on-surface leading-tight text-base mb-1">{service.title}</h3>
                    <p className="text-on-surface-variant text-xs line-clamp-1">{service.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <button 
        onClick={() => navigate(user ? '/notifications' : '/login')}
        className={`fixed right-6 ${user ? 'bottom-28' : 'bottom-10'} primary-gradient text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all z-40`}
      >
        <Icon icon="chat_bubble" weight={400} grade={0} size={28} className="text-2xl" />
      </button>
    </div>
  );
}

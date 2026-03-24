import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';
import { useApp } from '../hooks/useApp';
import type { Environment } from '../types';

const allEnvironments: Environment[] = [
  {
    id: '1',
    name: 'Residencial Aurora',
    type: 'residential',
    members: 240,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150',
    status: 'Ativo agora'
  },
  {
    id: '2',
    name: 'Igreja Batista Central',
    type: 'church',
    members: 1200,
    image: '',
    status: '1.2k membros'
  },
  {
    id: '3',
    name: 'Clube Atlético',
    type: 'club',
    members: 500,
    image: 'https://images.unsplash.com/photo-1517623999262-0bdf4c13f12b?w=150',
    status: 'Sócios e convidados'
  },
  {
    id: '4',
    name: 'Condomínio Terra Nova',
    type: 'residential',
    members: 150,
    image: '',
    status: '150 casas'
  },
  {
    id: '5',
    name: 'Espaço Zen Yoga',
    type: 'residential',
    members: 85,
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=150',
    status: '85 alunos'
  }
];

export function SelectEnvironmentsPage() {
  const navigate = useNavigate();
  const { selectedEnvironments, setSelectedEnvironments } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const isSelected = (id: string) => selectedEnvironments.some(e => e.id === id);

  const toggleEnvironment = (env: Environment) => {
    if (isSelected(env.id)) {
      setSelectedEnvironments(selectedEnvironments.filter(e => e.id !== env.id));
    } else {
      setSelectedEnvironments([...selectedEnvironments, { ...env, isSelected: true }]);
    }
  };

  const filteredEnvironments = allEnvironments.filter(env => 
    env.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-24">
      <TopAppBar 
        title="Selecionar Ambientes" 
        showBack 
        onBack={() => navigate(-1)} 
      />
      
      <main className="pt-20 px-4 space-y-6">
        <section className="mt-4">
          <p className="text-on-surface-variant text-base leading-relaxed opacity-90 px-2">
            Escolha onde você quer divulgar seu serviço. Você pode selecionar um ou mais ambientes.
          </p>
        </section>

        <section className="px-2">
          <div className="relative group">
            <Icon 
              icon="search" 
              weight={400} 
              grade={0} 
              size={24} 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl" 
            />
            <input 
              className="w-full h-12 pl-12 pr-4 bg-surface-container-highest border-none rounded-full focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline/70"
              placeholder="Pesquisar ambientes..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-3 pb-4">
          {filteredEnvironments.map((env) => (
            <div 
              key={env.id}
              onClick={() => toggleEnvironment(env)}
              className={`flex items-center p-4 bg-surface-container-lowest rounded-xl cursor-pointer transition-colors border border-transparent ${
                isSelected(env.id) ? 'hover:border-primary-container/30' : ''
              }`}
            >
              <div className="relative">
                {env.image ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container">
                    <img 
                      className="w-full h-full object-cover" 
                      src={env.image} 
                      alt={env.name}
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
                    <Icon icon="domain" weight={400} grade={0} size={24} className="text-outline text-3xl" />
                  </div>
                )}
                {isSelected(env.id) && (
                  <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 border-2 border-surface-container-lowest">
                    <Icon icon="check" weight={700} grade={0} size={16} className="text-[14px]" />
                  </div>
                )}
              </div>
              <div className="ml-4 flex-grow">
                <h3 className="font-semibold text-on-surface text-base">{env.name}</h3>
                <p className="text-sm text-on-surface-variant">
                  {env.members} membros • {env.status}
                </p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                isSelected(env.id) 
                  ? 'border-primary bg-primary' 
                  : 'border-outline-variant bg-transparent'
              }`}>
                {isSelected(env.id) && (
                  <Icon icon="check" weight={700} grade={0} size={16} className="text-white text-[16px]" />
                )}
              </div>
            </div>
          ))}
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 w-full flex justify-center items-center p-4 pb-safe bg-white/85 backdrop-blur-md border-t border-slate-200/10 rounded-t-2xl z-50">
        <button 
          onClick={() => {
            if (selectedEnvironments.length === 0) {
              alert('Por favor, selecione ao menos um ambiente para anunciar seu serviço.');
              return;
            }
            navigate('/register-service');
          }}
          disabled={selectedEnvironments.length === 0}
          className={`flex flex-row items-center justify-center primary-gradient text-white rounded-full px-8 py-4 w-full mx-4 my-2 active:scale-[0.98] duration-150 hover:opacity-90 transition-opacity ${
            selectedEnvironments.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''
          }`}
        >
          <Icon icon="check_circle" weight={400} grade={0} size={24} className="mr-2" />
          <span className="font-medium text-sm">Continuar</span>
        </button>
      </nav>
    </div>
  );
}

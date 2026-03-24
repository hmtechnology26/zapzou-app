import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';
import { useApp } from '../hooks/useApp';

export function MembersPage() {
  const navigate = useNavigate();
  const { members, approveMember, removeMember } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const pendingMembers = members.filter(m => m.isPending);
  const activeMembers = members.filter(m => !m.isPending);

  const filteredMembers = activeMembers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.unit?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-32">
      <TopAppBar 
        title="Gerenciar Membros" 
        showBack 
        onBack={() => navigate(-1)}
        variant="primary"
      />
      
      <main className="pt-20 px-4 max-w-2xl mx-auto">
        <div className="mt-4 mb-6">
          <div className="relative group">
            <Icon 
              icon="search" 
              weight={400} 
              grade={0} 
              size={24} 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" 
            />
            <input 
              className="w-full bg-surface-container-highest border-none rounded-full py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-on-surface-variant/60"
              placeholder="Procurar por nome ou unidade..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-8 relative overflow-hidden bg-primary rounded-xl p-6 text-white shadow-lg">
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-1">Membros Ativos</h2>
            <p className="text-emerald-100/80 text-sm mb-4">
              Gerencie as permissões e o acesso dos moradores do Residencial Aurora.
            </p>
            <div className="flex gap-4 items-end">
              <div className="bg-white/20 rounded-lg px-3 py-2">
                <span className="block text-2xl font-bold">{activeMembers.length}</span>
                <span className="text-[10px] uppercase font-bold text-emerald-100">Residentes</span>
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-2">
                <span className="block text-2xl font-bold">42</span>
                <span className="text-[10px] uppercase font-bold text-emerald-100">Unidades</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary-container/20 rounded-full blur-2xl"></div>
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Icon icon="corporate_fare" weight={400} grade={0} size={48} className="text-6xl" />
          </div>
        </div>

        {pendingMembers.length > 0 && (
          <div className="mb-8 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Solicitações Pendentes</h3>
              <span className="bg-primary-container text-on-primary-container text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingMembers.length} Novas
              </span>
            </div>

            {pendingMembers.map((member) => (
              <div key={member.id} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-primary/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold">
                      {member.initials ? (
                        <span className="text-lg font-bold">{member.initials}</span>
                      ) : (
                        <Icon icon="person" weight={400} grade={0} size={24} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-on-surface">{member.name}</h4>
                      <p className="text-sm text-on-surface-variant">{member.email}</p>
                      {member.unit && (
                        <p className="text-[10px] text-primary font-medium mt-1">
                          Solicitou acesso: {member.unit}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => approveMember(member.id)}
                    className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors active:scale-95"
                  >
                    Aceitar
                  </button>
                  <button 
                    onClick={() => removeMember(member.id)}
                    className="flex-1 bg-surface-container-high text-on-surface-variant py-2 rounded-lg text-sm font-semibold hover:bg-error-container hover:text-error transition-colors active:scale-95"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">
            Recentemente Adicionados
          </h3>

          {filteredMembers.map((member) => (
            <div 
              key={member.id}
              className="bg-surface-container-lowest p-4 flex items-center justify-between rounded-xl group transition-all hover:bg-surface-container-low"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  {member.avatar ? (
                    <img 
                      className="w-12 h-12 rounded-full object-cover" 
                      src={member.avatar} 
                      alt={member.name}
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      member.initials ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container/20 text-primary'
                    }`}>
                      {member.initials || <Icon icon="person" weight={400} grade={0} size={24} />}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary-container border-2 border-surface-container-lowest rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-on-surface">{member.name}</h4>
                  <p className="text-sm text-on-surface-variant">{member.unit}</p>
                </div>
              </div>
              <button 
                onClick={() => removeMember(member.id)}
                className="text-error opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-error-container rounded-full"
                title="Remover"
              >
                <Icon icon="person_remove" weight={400} grade={0} size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center pb-12">
          <button className="text-primary font-medium text-sm px-6 py-2 rounded-full hover:bg-primary/5 transition-colors">
            Ver todos os membros
          </button>
        </div>
      </main>

      <button className="fixed bottom-24 right-6 w-14 h-14 rounded-full primary-gradient text-white shadow-lg flex items-center justify-center active:scale-90 transition-transform duration-150 z-40">
        <Icon icon="person_add" weight={400} grade={0} size={28} className="text-3xl" />
      </button>

      <nav className="fixed bottom-0 w-full z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/10 h-20 flex justify-around items-center px-2 pb-safe-bottom rounded-t-3xl">
        <button onClick={() => navigate('/members')} className="flex flex-col items-center justify-center bg-emerald-100 text-emerald-800 rounded-full px-5 py-1 active:scale-90 transition-transform duration-150">
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
        <button onClick={() => navigate('/admin-settings')} className="flex flex-col items-center justify-center text-slate-500 px-5 py-1 hover:text-emerald-600 active:scale-90 transition-transform duration-150">
          <Icon icon="settings" weight={400} grade={0} size={24} />
          <span className="text-[11px] font-medium tracking-wide">Ajustes</span>
        </button>
      </nav>
    </div>
  );
}

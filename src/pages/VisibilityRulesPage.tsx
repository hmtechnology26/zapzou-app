import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';
import { useState } from 'react';

export function VisibilityRulesPage() {
  const navigate = useNavigate();
  const [rules, setRules] = useState({
    public: true,
    membersOnly: false,
    requireApproval: true,
  });

  return (
    <div className="min-h-screen pb-24 bg-surface-container-lowest">
      <TopAppBar title="Visibilidade" showBack onBack={() => navigate(-1)} variant="primary" />
      
      <main className="pt-24 px-6 max-w-md mx-auto space-y-8">
        <section>
          <h2 className="text-xl font-bold text-on-surface mb-2">Regras de Exibição</h2>
          <p className="text-sm text-on-surface-variant mb-6">Defina quem pode visualizar os serviços deste ambiente.</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-outline-variant/10 shadow-sm">
              <div className="flex items-center gap-3">
                <Icon icon="public" size={24} className="text-primary" />
                <div>
                  <h4 className="font-bold text-sm">Visibilidade Pública</h4>
                  <p className="text-[10px] text-on-surface-variant">Qualquer pessoa pode buscar este ambiente</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={rules.public}
                onChange={(e) => setRules({...rules, public: e.target.checked})}
                className="w-5 h-5 accent-primary"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-outline-variant/10 shadow-sm">
              <div className="flex items-center gap-3">
                <Icon icon="group" size={24} className="text-primary" />
                <div>
                  <h4 className="font-bold text-sm">Apenas Membros</h4>
                  <p className="text-[10px] text-on-surface-variant">Somente membros aprovados veem serviços</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={rules.membersOnly}
                onChange={(e) => setRules({...rules, membersOnly: e.target.checked})}
                className="w-5 h-5 accent-primary"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-outline-variant/10 shadow-sm">
              <div className="flex items-center gap-3">
                <Icon icon="security" size={24} className="text-primary" />
                <div>
                  <h4 className="font-bold text-sm">Aprovação Obrigatória</h4>
                  <p className="text-[10px] text-on-surface-variant">Liderança deve pré-aprovar cada anúncio</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={rules.requireApproval}
                onChange={(e) => setRules({...rules, requireApproval: e.target.checked})}
                className="w-5 h-5 accent-primary"
              />
            </div>
          </div>
        </section>

        <section className="bg-primary-container/10 p-5 rounded-2xl border border-primary-container/20">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="info" size={20} className="text-primary" />
            <h4 className="font-bold text-primary text-sm">Como funciona nas igrejas?</h4>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Para igrejas, a recomendação é manter a "Aprovação Obrigatória" ativada para garantir que os serviços estejam alinhados com os princípios da comunidade.
          </p>
        </section>

        <button 
          onClick={() => navigate(-1)}
          className="w-full primary-gradient text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
        >
          Salvar Regras
        </button>
      </main>
    </div>
  );
}

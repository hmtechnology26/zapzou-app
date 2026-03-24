import { useNavigate, useParams } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';
import { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';

export function LogoConfigPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedEnvironments, updateEnvironment } = useApp();
  
  const envId = id || selectedEnvironments[0]?.id;
  const currentEnv = selectedEnvironments.find(e => e.id === envId);

  const [name, setName] = useState(currentEnv?.name || '');
  const [logo, setLogo] = useState<string | null>(currentEnv?.image || null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (currentEnv) {
      setName(currentEnv.name);
      setLogo(currentEnv.image || null);
    }
  }, [currentEnv]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (envId) {
      updateEnvironment(envId, {
        name,
        image: logo || undefined
      });
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-surface-container-lowest">
      <TopAppBar title="Configurar Ambiente" showBack onBack={() => navigate(-1)} variant="primary" />
      
      <main className="pt-24 px-6 max-w-md mx-auto space-y-10">
        <section className="flex flex-col items-center">
          <h2 className="text-xl font-bold text-on-surface mb-2">Identidade do Lugar</h2>
          <p className="text-sm text-on-surface-variant mb-8 text-center">Personalize o nome e o logo para que todos os membros identifiquem corretamente.</p>
          
          <div className="relative group mb-12">
            <div className="w-48 h-48 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl bg-surface-container-high flex items-center justify-center">
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-outline gap-2">
                  <Icon icon="apartment" weight={400} grade={0} size={64} />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-40">Sem Foto</span>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <Icon icon="sync" weight={400} grade={0} size={48} className="text-white animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute -bottom-4 left-1/2 -translate-x-1/2 primary-gradient text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-primary/30 cursor-pointer hover:scale-105 active:scale-95 transition-all text-sm font-bold whitespace-nowrap">
              <Icon icon="add_a_photo" weight={400} grade={0} size={20} />
              <span>{logo ? 'Trocar Foto' : 'Adicionar Foto'}</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="w-full space-y-6">
            <div className="group">
              <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2 ml-1">
                Nome do Ambiente
              </label>
              <div className="relative">
                <Icon icon="edit" weight={400} grade={0} size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input 
                  className="w-full bg-white border-none rounded-2xl pl-12 pr-5 py-4 shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-on-surface font-bold"
                  placeholder="Ex: Condomínio Aurora"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="p-5 bg-primary-container/5 rounded-3xl border border-primary-container/10 space-y-4">
            <h4 className="font-bold text-on-surface text-sm">Como os membros verão</h4>
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shadow-inner">
                {logo ? <img src={logo} className="w-full h-full object-cover" /> : <Icon icon="apartment" size={24} className="text-primary" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-extrabold text-on-surface">{name || 'Nome do Lugar'}</p>
                <p className="text-[10px] text-on-surface-variant opacity-70">Aprovação de serviços ativa</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-xl border-t border-slate-200/10 z-50">
        <button 
          onClick={handleSave}
          className="w-full primary-gradient text-white py-4 rounded-full font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Icon icon="check_circle" size={20} />
          Salvar Alterações
        </button>
      </div>
    </div>
  );
}

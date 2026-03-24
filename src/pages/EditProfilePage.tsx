import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';
import { useApp } from '../hooks/useApp';

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useApp();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      name,
      email,
      avatar
    });
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-24">
      <TopAppBar title="Editar Perfil" showBack onBack={() => navigate(-1)} />
      
      <main className="pt-24 px-6 max-w-md mx-auto">
        <form onSubmit={handleSave} className="space-y-8">
          <section className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-surface-container-high">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-outline">
                    <Icon icon="person" weight={400} grade={0} size={64} />
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <Icon icon="sync" weight={400} grade={0} size={32} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-1 right-1 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all">
                <Icon icon="add_a_photo" weight={400} grade={0} size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>
            <p className="mt-4 text-xs font-bold text-primary uppercase tracking-widest">Foto do Perfil</p>
          </section>

          <div className="space-y-6">
            <div className="group">
              <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2 ml-1">
                Nome Completo
              </label>
              <div className="relative">
                <Icon icon="person" weight={400} grade={0} size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input 
                  className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface"
                  placeholder="Seu nome"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2 ml-1">
                E-mail
              </label>
              <div className="relative">
                <Icon icon="mail" weight={400} grade={0} size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input 
                  className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface"
                  placeholder="seu@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="group opacity-50 cursor-not-allowed">
              <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2 ml-1">
                Vínculo Principal
              </label>
              <div className="relative">
                <Icon icon="domain" weight={400} grade={0} size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input 
                  className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-5 py-4 transition-all text-on-surface"
                  value="Residencial Aurora"
                  disabled
                  type="text"
                />
              </div>
              <p className="mt-2 text-[10px] text-on-surface-variant italic ml-1">Para alterar seu ambiente principal, entre em contato com o suporte.</p>
            </div>
          </div>

          <div className="p-4 bg-primary-container/10 border border-primary-container/20 rounded-2xl">
            <h4 className="flex items-center gap-2 font-bold text-primary text-sm mb-1">
              <Icon icon="security" weight={400} grade={0} size={20} />
              Segurança dos Dados
            </h4>
            <p className="text-xs text-on-surface-variant">Suas informações são usadas apenas para identificação nos ambientes que você participa.</p>
          </div>
        </form>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 py-4 pb-safe bg-white/90 backdrop-blur-xl border-t border-slate-200/10">
        <button 
          onClick={() => navigate('/profile')}
          className="flex-1 px-6 py-4 text-on-surface-variant rounded-full bg-surface-container-low hover:bg-surface-container font-bold text-sm active:scale-95 transition-all"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          className="flex-[2] primary-gradient text-white rounded-full px-8 py-4 font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
        >
          <Icon icon="check_circle" weight={400} grade={0} size={20} />
          Salvar Alterações
        </button>
      </nav>
    </div>
  );
}

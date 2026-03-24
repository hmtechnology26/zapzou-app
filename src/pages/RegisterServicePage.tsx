import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';
import { useApp } from '../hooks/useApp';

const categories = [
  { value: 'food', label: 'Alimentação' },
  { value: 'cleaning', label: 'Limpeza' },
  { value: 'pet', label: 'Pet Sitting' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'beauty', label: 'Cuidados Pessoais' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'other', label: 'Outros' },
];

const frequencies = [
  { id: 'daily', label: 'Diário', icon: 'calendar_today' },
  { id: 'recurring', label: 'Recorrente', icon: 'event_repeat' },
  { id: 'weekends', label: 'Fim de Semana', icon: 'weekend' },
  { id: 'custom', label: 'Custom', icon: 'schedule' },
];

export function RegisterServicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedEnvironments, addService, updateService, services, user } = useApp();
  const isEditing = Boolean(id);

  const [selectedFrequency, setSelectedFrequency] = useState('recurring');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      const service = services.find(s => s.id === id);
      if (service) {
        setTitle(service.title);
        setDescription(service.description);
        setWhatsapp(service.WhatsApp || '');
        setInstagram(service.instagram || '');
        setPhotos(service.images || [service.image]);
        
        // Find category value from label
        const cat = categories.find(c => c.label === service.category);
        if (cat) setCategory(cat.value);

        // Find frequency id from label
        const freq = frequencies.find(f => f.label === service.frequency);
        if (freq) setSelectedFrequency(freq.id);
      }
    }
  }, [id, isEditing, services]);

  const hasChurch = selectedEnvironments.some(e => e.type === 'church');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    let loadedCount = 0;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotos(prev => [...prev, base64String]);
        loadedCount++;
        if (loadedCount === files.length) {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const categoryLabel = categories.find(c => c.value === category)?.label || 'Outros';

    const serviceData = {
      title: title || 'Novo Serviço',
      description,
      category: categoryLabel,
      image: photos[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300',
      images: photos,
      provider: user?.name || 'Anônimo',
      WhatsApp: whatsapp,
      instagram,
      frequency: frequencies.find(f => f.id === selectedFrequency)?.label || selectedFrequency,
      status: hasChurch && !isEditing ? ('pending' as const) : ('active' as const),
      isActive: isEditing ? undefined : !hasChurch,
      environmentId: selectedEnvironments[0]?.id
    };

    if (isEditing && id) {
      updateService(id, serviceData);
    } else {
      addService(serviceData);
      if (hasChurch) {
        alert('Sua solicitação foi enviada para a liderança da igreja. Aguarde a aprovação para que seu anúncio seja publicado.');
      }
    }
    
    navigate('/my-services');
  };

  return (
    <div className="min-h-screen pb-32">
      <TopAppBar 
        title="Novo Serviço" 
        showBack 
        onBack={() => navigate(-1)} 
      />
      
      <main className="pt-20 pb-32 px-6 max-w-md mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface mb-2">Configure seu serviço</h2>
          <p className="text-on-surface-variant text-sm">
            Conte à sua comunidade o que você oferece e como podem te encontrar.
          </p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <section>
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-4 ml-1">
              Fotos do Serviço ({photos.length})
            </label>
            <div className="flex flex-wrap gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden group border border-outline-variant/20 shadow-sm transition-all hover:scale-105">
                  <img src={photo} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-black/60 text-white w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-error"
                  >
                    <Icon icon="close" weight={400} grade={0} size={16} />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-1 hover:border-primary cursor-pointer transition-all text-primary bg-primary/5 active:scale-95">
                <Icon icon={isUploading ? "sync" : "add_a_photo"} weight={400} grade={0} size={28} className={isUploading ? "animate-spin" : ""} />
                <span className="text-[10px] font-bold">{isUploading ? 'Lendo...' : 'Adicionar'}</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </section>

          <div className="space-y-6">
            <div className="group">
              <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2 ml-1">
                Título do Serviço
              </label>
              <input 
                className="w-full bg-surface-container-highest border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline"
                placeholder="ex: Marmitas da Julia"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="group">
              <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2 ml-1">
                Categoria
              </label>
              <div className="relative">
                <select 
                  className="appearance-none w-full bg-surface-container-highest border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-on-surface pr-12"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <Icon icon="expand_more" weight={400} grade={0} size={24} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
              </div>
            </div>
          </div>

          <section>
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2 ml-1">
              Descrição e Como Funciona
            </label>
            <div className="bg-surface-container-lowest rounded-tr-2xl rounded-br-2xl rounded-bl-2xl p-5 border-l-4 border-primary-container">
              <textarea 
                className="w-full border-none focus:ring-0 p-0 text-on-surface bg-transparent placeholder:text-outline-variant resize-none"
                placeholder="Refeições frescas preparadas e entregues todas as terças e quintas..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <p className="mt-2 text-[11px] text-on-surface-variant italic ml-1">
              Seja claro sobre seu processo de entrega ou atendimento.
            </p>
          </section>

          <section>
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2 ml-1">
              Frequência / Disponibilidade
            </label>
            <div className="grid grid-cols-2 gap-3">
              {frequencies.map(freq => (
                <button
                  key={freq.id}
                  type="button"
                  onClick={() => setSelectedFrequency(freq.id)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all text-sm font-medium ${
                    selectedFrequency === freq.id
                      ? 'bg-primary-container/10 border border-primary-container text-primary'
                      : 'bg-surface-container-low border border-transparent hover:border-primary-container'
                  }`}
                >
                  <Icon icon={freq.icon as any} weight={400} grade={0} size={24} className="text-lg" />
                  {freq.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2 ml-1">
              Contato
            </label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center bg-surface-container-highest rounded-full px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Icon icon="chat" weight={400} grade={0} size={24} className="text-green-600 mr-3" />
                <input 
                  className="bg-transparent border-none p-0 w-full text-sm focus:ring-0"
                  placeholder="Número WhatsApp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
              <div className="flex items-center bg-surface-container-highest rounded-full px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Icon icon="alternate_email" weight={400} grade={0} size={24} className="text-pink-600 mr-3" />
                <input 
                  className="bg-transparent border-none p-0 w-full text-sm focus:ring-0"
                  placeholder="Instagram Handle"
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>
            </div>
          </section>
        </form>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 py-3 pb-safe bg-white/90 backdrop-blur-xl rounded-t-3xl border-t border-slate-200/10">
        <button 
          onClick={() => navigate('/my-services')}
          className="flex flex-col items-center justify-center text-slate-500 px-6 py-2 hover:opacity-90 active:scale-98 transition-transform"
        >
          <Icon icon="close" weight={400} grade={0} size={24} className="mb-1" />
          <span className="text-[11px] font-medium">{isEditing ? 'Cancelar' : 'Descartar'}</span>
        </button>
        <button 
          onClick={handleSubmit}
          className="flex-1 flex flex-col items-center justify-center primary-gradient text-white rounded-full px-8 py-3 mx-2 my-1 shadow-lg shadow-green-500/20 hover:opacity-90 active:scale-98 transition-transform"
        >
          <Icon icon={(isEditing ? 'save' : (hasChurch ? 'hourglass_empty' : 'check_circle')) as any} weight={400} grade={0} size={24} className="mb-1" style={{ fontVariationSettings: "'FILL' 1" }} />
          <span className="text-[11px] font-medium">{isEditing ? 'Salvar Alterações' : (hasChurch ? 'Solicitar Liberação' : 'Ativar Serviço')}</span>
        </button>
      </nav>
    </div>
  );
}

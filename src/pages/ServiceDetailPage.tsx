import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MaterialSymbol as Icon } from 'react-material-symbols';
import { TopAppBar } from '../components/TopAppBar';
import { useApp } from '../hooks/useApp';

export function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { services, selectedEnvironments, user, rateService } = useApp();

  const service = services.find(s => s.id === id) || services[0];
  const environment = selectedEnvironments.find(e => e.id === service.environmentId) || selectedEnvironments[0];

  const [hoveredStar, setHoveredStar] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tempStars, setTempStars] = useState(0);
  const [comment, setComment] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const images = service.images && service.images.length > 0 ? service.images : [service.image];

  const handleRate = () => {
    rateService(service.id, tempStars, comment);
    setHasSubmitted(true);
    setTempStars(0);
    setComment('');
  };

  return (
    <div className={`min-h-screen ${user ? 'pb-32' : 'pb-10'}`}>
      <TopAppBar 
        showBack 
        onBack={() => navigate(-1)}
        rightAction="share"
        onRightAction={() => navigate(user ? '#' : '/login')}
        variant="primary"
        userAvatar={user?.avatar}
        onAvatarClick={() => navigate('/profile')}
      />
      
      <main className="pt-20">
        <section className="px-6 relative">
          <div className="relative group aspect-square max-h-[360px] mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/10 border-4 border-white">
            <div 
              className="flex transition-transform duration-500 ease-out h-full"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {images.map((img, idx) => (
                <img 
                  key={idx}
                  alt={`${service.title} - ${idx + 1}`} 
                  className="w-full h-full object-cover flex-shrink-0" 
                  src={img}
                />
              ))}
            </div>
            
            {/* Dots indicadores */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                {images.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}

            {/* Setas de Navegação */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-primary shadow-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                >
                  <Icon icon="chevron_left" weight={400} grade={0} size={24} />
                </button>
                <button 
                  onClick={() => setCurrentImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-primary shadow-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                >
                  <Icon icon="chevron_right" weight={400} grade={0} size={24} />
                </button>
              </>
            )}

            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm z-10 border border-primary/10">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{service.category}</span>
            </div>
          </div>
        </section>

        <section className="px-8 pt-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-on-surface leading-tight tracking-tight">
                  {service.title}
                </h1>
                <Icon icon="verified" weight={400} grade={0} size={24} className="text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }} />
              </div>
              <div className="flex items-center gap-3 text-on-surface-variant font-medium text-xs">
                <div className="flex items-center text-primary font-bold">
                  <Icon icon="star" weight={700} grade={0} size={16} className="text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }} />
                  <span>{service.rating || 'Novo'}</span>
                </div>
                {service.reviews && (
                  <>
                    <span className="opacity-30">•</span>
                    <span>{service.reviews} avaliações</span>
                  </>
                )}
                <span className="opacity-30">•</span>
                <span className="bg-surface-container-high px-2 py-0.5 rounded-md font-bold">{environment?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-3xl border border-primary/10 mb-8">
            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-black text-lg shadow-inner">
              {service.provider.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Oferecido por</p>
              <h4 className="font-bold text-on-surface text-base">{service.provider}</h4>
            </div>
            <div className="ml-auto flex gap-2">
              {service.instagram && (
                <a href={`https://instagram.com/${service.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-pink-600 shadow-sm transition-transform active:scale-90">
                  <Icon icon="photo_camera" weight={400} grade={0} size={20} />
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="px-6 space-y-8">
          <div className="space-y-4 px-2">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-[0.2em]">Sobre o Serviço</h3>
            <p className="text-on-surface-variant leading-relaxed text-base">
              {service.description}
            </p>
          </div>

          {/* Avaliação do Usuário */}
          {user && service.provider !== user.name && !hasSubmitted && (
            <div className="mx-2 bg-primary/5 p-6 rounded-[2.5rem] border border-primary/20 flex flex-col items-center gap-4 text-center">
              <div>
                <h4 className="font-extrabold text-on-surface text-lg">Gostou do serviço?</h4>
                <p className="text-xs text-on-surface-variant">Sua avaliação ajuda outros vizinhos!</p>
              </div>
              
              {!tempStars ? (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setTempStars(star)}
                      className="p-1 active:scale-90 transition-transform text-primary"
                    >
                      <Icon 
                        icon="star" 
                        weight={400} 
                        grade={0} 
                        size={40} 
                        className="text-4xl" 
                        style={{ fontVariationSettings: `'FILL' ${star <= (hoveredStar || tempStars) ? 1 : 0}` }}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Icon 
                        key={star}
                        icon="star" 
                        weight={400} 
                        grade={0} 
                        size={24} 
                        style={{ fontVariationSettings: `'FILL' ${star <= tempStars ? 1 : 0}` }}
                      />
                    ))}
                    <button onClick={() => setTempStars(0)} className="text-[10px] ml-2 underline uppercase font-bold opacity-50">Alterar</button>
                  </div>
                  <textarea 
                    className="w-full bg-white rounded-2xl p-4 text-sm border-none focus:ring-2 focus:ring-primary/20 placeholder:text-outline/50"
                    placeholder="Escreva um comentário sobre sua experiência (opcional)..."
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <button 
                    onClick={handleRate}
                    className="w-full py-3 primary-gradient text-white rounded-full font-bold shadow-md shadow-primary/20 active:scale-95 transition-all"
                  >
                    Enviar Avaliação
                  </button>
                </div>
              )}
            </div>
          )}

          {hasSubmitted && (
            <div className="mx-2 bg-green-50 p-6 rounded-[2.5rem] border border-green-100 flex flex-col items-center gap-2 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg mb-2">
                <Icon icon="check" weight={700} grade={0} size={24} />
              </div>
              <h4 className="font-extrabold text-green-900">Avaliação Enviada!</h4>
              <p className="text-xs text-green-700">Obrigado por contribuir com a comunidade.</p>
            </div>
          )}

          {!user && (
            <div className="mx-2 bg-surface-container-low p-6 rounded-[2.5rem] border border-outline-variant/10 flex flex-col items-center gap-3 text-center">
              <Icon icon="lock" weight={400} grade={0} size={24} className="text-outline" />
              <p className="text-sm font-bold text-on-surface-variant">Entre para avaliar este serviço</p>
              <button 
                onClick={() => navigate('/profile')} 
                className="text-xs font-bold text-primary uppercase tracking-widest hover:underline"
              >
                Fazer Login
              </button>
            </div>
          )}

          {/* Dados Reais do Cadastro */}
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="bg-surface-container-low p-5 rounded-[2rem] border border-outline-variant/10">
              <Icon icon="schedule" weight={400} grade={0} size={24} className="text-primary mb-3" />
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Frequência</p>
              <p className="font-bold text-on-surface text-sm">{service.frequency || 'Sob consulta'}</p>
            </div>
            <div className="bg-surface-container-low p-5 rounded-[2rem] border border-outline-variant/10">
              <Icon icon="payments" weight={400} grade={0} size={24} className="text-primary mb-3" />
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Pagamento</p>
              <p className="font-bold text-on-surface text-sm">Direto com profissional</p>
            </div>
          </div>

          {/* Seção de Contato e Link Real */}
          <div className="space-y-4">
  <div className="flex items-center justify-between px-2">
    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-[0.2em]">
      Canais de Contato
    </h3>
  </div>

  <div className="grid grid-cols-2 gap-2">
    <a 
      href={`https://wa.me/${service.WhatsApp}`}
      className="w-full flex items-center justify-between p-5 bg-[#25D366]/10 rounded-[2rem] border border-[#25D366]/20 transition-all active:scale-[0.98]"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg shrink-0">
          <Icon icon="chat" weight={400} grade={0} size={24} />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-on-surface text-sm">WhatsApp</h4>
          <p className="text-xs text-on-surface-variant truncate">
            Clique para conversar agora
          </p>
        </div>
      </div>
      <Icon icon="open_in_new" weight={400} grade={0} size={20} className="text-[#25D366] shrink-0" />
    </a>

    {service.instagram && (
      <a 
        href={`https://instagram.com/${service.instagram.replace('@', '')}`}
        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-[2rem] border border-pink-500/20 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white shadow-lg shrink-0">
            <Icon icon="camera" weight={400} grade={0} size={20} />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-on-surface text-sm">Instagram</h4>
            <p className="text-xs text-on-surface-variant truncate">
              {service.instagram}
            </p>
          </div>
        </div>
        <Icon icon="open_in_new" weight={400} grade={0} size={20} className="text-pink-600 shrink-0" />
      </a>
    )}
  </div>
</div>
        </section>

        {/* Selo de Confiança ZapZou */}
        <section className="mt-12 px-6">
          <div className="bg-primary-container/20 p-6 rounded-[2.5rem] relative overflow-hidden flex flex-col items-center text-center gap-6 border border-primary/10">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg relative z-10">
              <Icon icon="security" weight={400} grade={0} size={32} className="text-primary" />
            </div>
            <div className="relative z-10 space-y-2">
              <h4 className="font-extrabold text-on-primary-container text-lg leading-tight">Comunidade Validada</h4>
              <p className="text-sm text-balance text-on-primary-container/70 leading-relaxed font-medium">
                Este profissional faz parte do <b>{environment?.name}</b> e teve sua identidade validada pela plataforma.
              </p>
            </div>
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          </div>
        </section>
      </main>

      {/* Botão Flutuante de Ação */}
      {/* <div className="fixed bottom-0 left-0 w-full z-50 p-6 bg-gradient-to-t from-white via-white to-transparent pb-8">
        <a 
          href={`https://wa.me/${service.WhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-16 primary-gradient text-on-primary rounded-full font-black text-lg flex items-center justify-center gap-4 active:scale-95 transition-all shadow-[0_12px_36px_-12px_rgba(16,185,129,0.5)] border-4 border-white"
        >
          <Icon icon="chat" weight={400} grade={0} size={28} />
          Contratar via WhatsApp
        </a>
      </div> */}
    </div>
  );
}

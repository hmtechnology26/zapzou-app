'use client';

import { useRouter, useParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useApp } from '@/hooks/useApp';
import { useState, useEffect } from 'react';

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();

  const {
    services = [],
    user,
    selectedEnvironments = [],
    toggleServiceStatus,
    removeService,
  } = useApp() || {};

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [service, setService] = useState<any>(null);
  const minSwipeDistance = 50;

  const placeSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const serviceSlug = Array.isArray(params?.serviceSlug) ? params.serviceSlug[0] : params?.serviceSlug;

  const generateSlug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  useEffect(() => {
    if (services.length > 0) {
      const servicesWithSlug = services.map((s: any) => ({
        ...s,
        slug: s.slug || generateSlug(s.title)
      }));
      const found = servicesWithSlug.find((s: any) => s.slug === serviceSlug || s.id === serviceSlug);
      setService(found);
    }
    if (!mounted) {
      setMounted(true);
    }
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [services, serviceSlug, mounted]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && service) {
      setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
    }
    if (isRightSwipe && service) {
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <Icon icon="error_outline" size={48} className="text-outline" />
        <p className="text-on-surface-variant">Serviço não encontrado</p>
        <button onClick={() => router.back()} className="text-primary font-bold">
          Voltar
        </button>
      </div>
    );
  }

  const menuItems = Array.isArray(service.menu) ? service.menu : [];
  const serviceImages = service.images || [];
  const allImages = serviceImages.length > 0 ? serviceImages : [service.image];

  const environment = selectedEnvironments.find(
    (e: any) => e.id === service.environmentId
  );

  const formatWhatsApp = (phone: string) => {
    return (phone || '').replace(/\D/g, '');
  };

  const WhatsAppMessage = encodeURIComponent(
    `Olá! Vim pelo Conectae e tenho interesse no serviço:\n\n${service.title}.\nGostaria de mais informações!`
  );

  const handleWhatsApp = () => {
    if (!service?.WhatsApp) return;

    window.open(
      `https://wa.me/${formatWhatsApp(service.WhatsApp)}?text=${WhatsAppMessage}`,
      '_blank'
    );
  };

  const isOwner = user && service.provider === user.name;

  const handleToggleStatus = () => {
    toggleServiceStatus(service.id);
    setShowOptionsMenu(false);
  };

  const handleDelete = () => {
    removeService(service.id);
    setShowDeleteConfirm(false);
    setShowOptionsMenu(false);
    router.push('/');
  };

  const handleEdit = () => {
    setShowOptionsMenu(false);
    router.push(`/register-service?id=${service.id}`);
  };

  return (
    <div className="min-h-screen pb-32 md:pb-12 bg-background text-on-surface">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/85 backdrop-blur-xl flex items-center justify-between px-4 h-16 md:border-b md:border-outline-variant/20">
        <div className="flex items-center gap-3 max-w-7xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="hover:bg-surface-container-high/70 rounded-full transition-colors p-2 active:scale-95 duration-200 text-primary"
          >
            <Icon icon="arrow_back" size={24} />
          </button>
          <h1 className="text-lg font-semibold tracking-tight text-on-surface">
            Detalhes do Serviço
          </h1>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button className="hover:bg-surface-container-high/70 rounded-full transition-colors p-2 active:scale-95 duration-200 text-primary">
            <Icon icon="share" size={24} />
          </button>

          {(isOwner || user?.role === 'admin') && (
            <div className="relative">
              <button 
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="hover:bg-surface-container-high/70 rounded-full transition-colors p-2 active:scale-95 duration-200 text-primary"
              >
                <Icon icon="more_vert" size={24} />
              </button>
              
              {showOptionsMenu && (
                <div className="absolute right-0 top-12 w-48 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/10 py-2 z-50 animate-in fade-in zoom-in duration-200">
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-container-low transition-colors text-left"
                  >
                    <Icon icon="edit" size={20} className="text-primary" />
                    <span className="text-sm font-medium text-on-surface">Editar</span>
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-container-low transition-colors text-left"
                  >
                    <Icon icon={service.isActive ? 'pause' : 'play_arrow'} size={20} className="text-orange-500" />
                    <span className="text-sm font-medium text-on-surface">
                      {service.isActive ? 'Pausar' : 'Ativar'}
                    </span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-container-low transition-colors text-left"
                  >
                    <Icon icon="delete" size={20} className="text-error" />
                    <span className="text-sm font-medium text-error">Excluir</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {mounted && user ? (
            <button onClick={() => router.push('/profile')} className="hover:scale-105 transition-transform active:scale-95 ml-1">
              <Avatar
                src={user.avatar}
                name={user.name}
                alt="Avatar"
                className="w-10 h-10 border-2 border-primary shadow-sm"
              />
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 px-4 py-2 rounded-full primary-gradient text-white text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              <Icon icon="login" size={20} />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </header>

      <main className="mt-16 md:mt-16">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4">
          <section className="relative">
            {allImages.length > 1 ? (
              <div 
                className="relative"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div className="overflow-hidden rounded-2xl h-72">
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                  >
                    {allImages.map((img: string, idx: number) => (
                      <div
                        key={idx}
                        className="w-full flex-shrink-0 h-72"
                      >
                        <img
                          alt={`${service.title} ${idx + 1}`}
                          className="w-full h-full object-cover"
                          src={img}
                        loading="lazy" decoding="async" />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev > 0 ? prev - 1 : allImages.length - 1
                    )
                  }
                  className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-surface-container-lowest/90 backdrop-blur-md rounded-full items-center justify-center shadow-lg"
                >
                  <Icon icon="chevron_left" size={24} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev < allImages.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-surface-container-lowest/90 backdrop-blur-md rounded-full items-center justify-center shadow-lg"
                >
                  <Icon icon="chevron_right" size={24} />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                  {allImages.map((_: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-72 rounded-2xl overflow-hidden">
                <img
                  alt={service.title}
                  className="w-full h-full object-cover"
                  src={service.image}
                loading="lazy" decoding="async" />
              </div>
            )}

            <div className="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm z-10 border border-primary/10">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{service.category}</span>
            </div>
          </section>

          <section className="px-2 pt-6">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-extrabold text-on-surface leading-tight tracking-tight">
                {service.title}
              </h2>
              {service.verified && (
                <Icon icon="verified" weight={400} size={24} className="text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }} />
              )}
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant font-medium text-sm">
              <div className="flex items-center text-primary">
                <Icon icon="star" weight={700} size={16} className="text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }} />
                <span>{service.rating || 'Novo'}</span>
              </div>
              <span>•</span>
              <span>{service.reviews_count || 0} avaliações</span>
              <span>•</span>
              <span className="bg-surface-container-high px-2 py-0.5 rounded-md font-bold">{environment?.name || 'Ambiente'}</span>
            </div>
          </section>

          <section className="px-0 mt-6">
            <div className="bg-surface-container-lowest p-5 rounded-2xl chat-bubble-left shadow-[0_4px_20px_rgba(0,0,0,0.02)] border-l-4 border-primary-container">
              <p className="text-on-surface-variant leading-relaxed text-[15px]">
                {service.description}
              </p>
              {service.tags && service.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {service.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-surface-container-low rounded-full text-xs font-semibold text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="mt-8 flex gap-3">
            <button 
              onClick={handleWhatsApp}
              className="flex-1 h-12 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center gap-2 text-on-primary font-bold active:scale-95 transition-transform shadow-md"
            >
              <Icon icon="chat" weight={400} size={24} />
              Contratar
            </button>
            {service.instagram && (
              <a 
                href={service.instagram.startsWith('http') ? service.instagram : `https://instagram.com/${service.instagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 h-12 rounded-full gap-2 bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] text-white font-bold flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-pink-500/20"
              >
                <Icon icon="photo_camera" weight={400} size={24} />
                Instagram
              </a>
            )}
          </section>

          {menuItems.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-on-surface tracking-tight">Cardápio / Serviços</h3>
              </div>
              <div className="space-y-3">
                {menuItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 bg-surface-container-lowest p-3 rounded-2xl shadow-sm border border-outline-variant/10">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-high">
                      {item.image ? (
                        <img alt={item.name} className="w-full h-full object-cover" src={item.image} loading="lazy" decoding="async" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                          <Icon icon="restaurant" size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-on-surface">{item.name}</h4>
                      <p className="text-xs text-on-surface-variant">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-primary font-extrabold">{item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-12 px-0 mb-8">
            <h3 className="mb-4 text-lg font-bold text-on-surface tracking-tight">Por que pedir no Conectae?</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-1 bg-secondary-container/30 p-4 rounded-3xl flex flex-col gap-3">
                <Icon icon="verified_user" weight={400} size={32} className="text-secondary" />
                <div>
                  <p className="font-bold text-secondary text-sm">Segurança</p>
                  <p className="text-xs text-on-secondary-container/80">Pagamento direto e seguro no delivery.</p>
                </div>
              </div>
              <div className="col-span-1 space-y-3">
                <div className="bg-tertiary-fixed p-4 rounded-3xl flex items-center gap-3">
                  <Icon icon="local_mall" weight={400} size={24} className="text-tertiary" />
                  <p className="font-bold text-tertiary text-sm">Curadoria</p>
                </div>
                <div className="bg-surface-container-high p-4 rounded-3xl flex items-center gap-3">
                  <Icon icon="group" weight={400} size={24} className="text-on-surface-variant" />
                  <p className="font-bold text-on-surface-variant text-sm">Vizinhos Reais</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200 border border-outline-variant/10">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-error/10 mx-auto mb-4">
              <Icon icon="warning" size={32} className="text-error" />
            </div>
            <h3 className="text-lg font-bold text-on-surface text-center mb-2">Excluir Serviço?</h3>
            <p className="text-sm text-on-surface-variant text-center mb-6">
              Esta ação não pode ser desfeita. O serviço será removido permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-error text-white font-bold"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showOptionsMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowOptionsMenu(false)}
        />
      )}
    </div>
  );
}

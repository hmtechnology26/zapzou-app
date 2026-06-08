'use client';

import type { ReactNode } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useApp } from '@/hooks/useApp';
import { StarRating } from '@/components/StarRating';
import { ReviewsList } from '@/components/ReviewsList';
import { ReviewForm } from '@/components/ReviewForm';
import { useState, useEffect, useRef } from 'react';
import type { Review } from '@/types';
import { hasCnpj } from '@/lib/cnpj';
import { normalizeWebsiteUrl } from '@/lib/website';
import { trackServiceInteraction } from '@/lib/service-interactions';

interface ServiceDetailPageProps {
  seoContent?: ReactNode;
}

export default function ServiceDetailPage({ seoContent }: ServiceDetailPageProps) {
  const router = useRouter();
  const params = useParams();

  const {
    services = [],
    servicesLoading,
    user,
    selectedEnvironments = [],
    toggleServiceStatus,
    removeService,
    incrementServiceViews,
    fetchServiceReviews,
    addReview,
    replyToReview,
  } = useApp() || {};

  const [mounted, setMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [service, setService] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const lastViewIncrementedServiceIdRef = useRef<string | null>(null);
  const minSwipeDistance = 50;
  const serviceSlug = Array.isArray(params?.serviceSlug) ? params.serviceSlug[0] : params?.serviceSlug;
  const serviceId = service?.id;

  const generateSlug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  useEffect(() => {
    if (!mounted) {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      const servicesWithSlug = services.map((s: any) => ({
        ...s,
        slug: s.slug || generateSlug(s.title)
      }));
      const found = servicesWithSlug.find((s: any) => s.slug === serviceSlug || s.id === serviceSlug);
      setService(found);
    }
  }, [services, serviceSlug]);

  useEffect(() => {
    if (!serviceId) return;
    if (lastViewIncrementedServiceIdRef.current === serviceId) return;
    lastViewIncrementedServiceIdRef.current = serviceId;
    void incrementServiceViews(serviceId);
    void trackServiceInteraction({
      serviceId,
      interactionType: 'service_view',
      source: 'place_service_detail_page',
    });
  }, [serviceId, incrementServiceViews]);

  useEffect(() => {
    if (serviceId) {
      void fetchServiceReviews(serviceId).then(setReviews).catch(() => setReviews([]));
    }
  }, [serviceId, fetchServiceReviews]);

  useEffect(() => {
    if (!serviceId) return;
    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((acc, r) => acc + (r.stars || 0), 0) / count : 0;
    setService((prev: any) => (prev ? { ...prev, rating: avg, reviews_count: count } : prev));
  }, [reviews, serviceId]);

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

  if (!mounted || servicesLoading) {
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
  const serviceImages = Array.isArray(service.images) ? service.images : [];
  const allImages = serviceImages.length > 0
    ? serviceImages
    : typeof service.image === 'string' && service.image
      ? [service.image]
      : [];

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
    void trackServiceInteraction({
      serviceId: service.id,
      interactionType: 'whatsapp_click',
      source: 'place_service_detail_page',
    });

    window.open(
      `https://wa.me/${formatWhatsApp(service.WhatsApp)}?text=${WhatsAppMessage}`,
      '_blank'
    );
  };

  const handleInstagramClick = () => {
    if (!service?.id) return;
    void trackServiceInteraction({
      serviceId: service.id,
      interactionType: 'instagram_click',
      source: 'place_service_detail_page',
    });
  };

  const websiteHref = normalizeWebsiteUrl(service.website);
  const actionGridClass = websiteHref ? 'mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3' : 'mt-8 grid grid-cols-2 gap-3';

  const handleSubmitReview = async (stars: number, comment: string, isAnonymous = false) => {
    if (!service?.id || !user) return;
    setIsSubmittingReview(true);
    try {
      const created = await addReview(service.id, stars, comment, isAnonymous);
      if (created) {
        setReviews((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      }
      setShowReviewForm(false);

      void fetchServiceReviews(service.id, { force: true })
        .then(setReviews)
        .catch(() => {});
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitReply = async (reviewId: string, reply: string) => {
    if (!service?.id || !user || !isOwner) return;
    const updated = await replyToReview(reviewId, reply);
    if (updated) {
      setReviews((prev) => prev.map((review) => (review.id === updated.id ? updated : review)));
    }
  };

  const isOwner = user && (service.provider_id === user.id || service.provider === user.name);
  const hasUserReviewed = user && reviews.some((r) => r.user_id === user.id);
  const reviewsCount = reviews.length;
  const averageRating =
    reviewsCount > 0
      ? reviews.reduce((acc, r) => acc + (r.stars || 0), 0) / reviewsCount
      : 0;

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
            Detalhes
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

      {seoContent}

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
                <div className="aspect-square w-full overflow-hidden rounded-2xl max-h-[32rem] mx-auto">
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                  >
                    {allImages.map((img: string, idx: number) => (
                      <div
                        key={idx}
                        className="w-full flex-shrink-0 h-full"
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
              <div className="aspect-square w-full rounded-2xl overflow-hidden max-h-[32rem] mx-auto">
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
            <div className="mb-2">
              <span
                className={`inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  hasCnpj(service.cnpj)
                    ? 'text-white bg-[#30cc36] dark:text-black/80 dark:bg-[#30cc36]'
                    : 'text-white bg-orange-600 dark:text-white dark:bg-orange-700'
                }`}
              >
                {hasCnpj(service.cnpj) ? 'PROFISSIONAL' : 'AUTÔNOMO'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant font-medium text-sm">
              <div className="flex items-center text-primary">
                <StarRating rating={averageRating} size={18} />
                <span className="font-bold text-on-surface ml-1">{averageRating > 0 ? averageRating.toFixed(1) : 'Novo'}</span>
              </div>
              <span>{reviewsCount} avaliações</span>
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

          <section className={actionGridClass}>
              <button 
                onClick={handleWhatsApp}
                className="col-span-1 h-12 w-full min-w-0 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center gap-2 text-on-primary font-bold active:scale-95 transition-transform shadow-md"
              >
                <img
                  src="/whatsapp_logo.png"
                  alt="WhatsApp"
                  className="w-6 h-6 object-contain"
                />
                Contatar
              </button>
              {websiteHref && (
                <a 
                  href={websiteHref}
                  target="_blank"
                  rel="noreferrer"
                  className="col-span-2 sm:col-span-1 h-12 w-full min-w-0 rounded-full gap-2 bg-surface-container-lowest text-on-surface font-bold flex items-center justify-center active:scale-95 transition-transform shadow-sm border border-outline-variant/10"
                >
                  <Icon icon="language" size={18} />
                  Site
                </a>
              )}
              {service.instagram && (
                <a 
                  href={service.instagram.startsWith('http') ? service.instagram : `https://instagram.com/${service.instagram.replace('@', '')}`}
                  onClick={handleInstagramClick}
                  target="_blank"
                  rel="noreferrer"
                  className="col-span-1 h-12 w-full min-w-0 rounded-full gap-2 bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] text-white font-bold flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-pink-500/20"
                >
                  <img
                    src="/instagram_logo.png"
                    alt="Instagram"
                    className="w-6 h-6 object-contain"
                  />
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
                      <span className="text-primary font-extrabold">{item.price || 'Sem valor'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="font-bold text-on-surface mb-3">Avaliações</h3>
            <section className="bg-surface-container-lowest rounded-2xl p-4">
              {user && !hasUserReviewed && !isOwner && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Icon icon="star" size={18} />
                  Avaliar Serviço
                </button>
              )}

              {hasUserReviewed && (
                <div className="text-center py-2 text-primary text-sm font-medium">
                  Você já avaliou este serviço
                </div>
              )}

              {showReviewForm && (
                <div className="mt-3 pt-3 border-t border-outline-variant/10">
                  <ReviewForm
                    onSubmit={handleSubmitReview}
                    onCancel={() => setShowReviewForm(false)}
                    isSubmitting={isSubmittingReview}
                  />
                </div>
              )}
            </section>

            <div className="mt-4">
              <ReviewsList reviews={reviews} canReply={Boolean(isOwner)} onReply={handleSubmitReply} />
            </div>
          </section>

          {/* <section className="mt-12 px-0 mb-8">
            <h3 className="mb-4 text-lg font-bold text-on-surface tracking-tight">Por que pedir no Conect<span className="text-primary">ae</span>?</h3>
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
          </section> */}
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

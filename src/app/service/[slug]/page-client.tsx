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

interface ServiceDetailPageProps {
  seoContent?: ReactNode;
}

export default function ServiceDetailPage({ seoContent }: ServiceDetailPageProps) {
  const router = useRouter();
  const params = useParams();

  const {
    services = [],
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
  const [loading, setLoading] = useState(true);
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

  const serviceSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const generateSlug = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      const servicesWithSlug = services.map((s: any) => ({
        ...s,
        slug: s.slug || generateSlug(s.title),
      }));
      const found = servicesWithSlug.find((s: any) => s.slug === serviceSlug || s.id === serviceSlug);
      setService(found);
    }
  }, [services, serviceSlug]);

  useEffect(() => {
    if (!service?.id) return;
    if (lastViewIncrementedServiceIdRef.current === service.id) return;
    lastViewIncrementedServiceIdRef.current = service.id;
    void incrementServiceViews(service.id);
  }, [service?.id, incrementServiceViews]);

  useEffect(() => {
    if (service?.id) {
      void fetchServiceReviews(service.id).then(setReviews).catch(() => setReviews([]));
    }
  }, [service?.id]);

  useEffect(() => {
    if (!service) return;
    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((acc, r) => acc + (r.stars || 0), 0) / count : 0;
    setService((prev: any) => (prev ? { ...prev, rating: avg, reviews_count: count } : prev));
  }, [reviews]);

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
    window.open(
      `https://wa.me/${formatWhatsApp(service.WhatsApp)}?text=${WhatsAppMessage}`,
      '_blank'
    );
  };

  const isOwner = user && service.provider_id === user.id;
  const hasUserReviewed = user && reviews.some(r => r.user_id === user.id);
  const reviewsCount = reviews.length;
  const averageRating = reviewsCount > 0 ? reviews.reduce((acc, r) => acc + (r.stars || 0), 0) / reviewsCount : 0;

  const handleSubmitReply = async (reviewId: string, reply: string) => {
    if (!service?.id || !user || !isOwner) return;
    const updated = await replyToReview(reviewId, reply);
    if (updated) {
      setReviews((prev) => prev.map((review) => (review.id === updated.id ? updated : review)));
    }
  };

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

  const handleShare = async () => {
    const shareData = {
      title: service.title,
      text: `Confira este serviço: ${service.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await copyToClipboard(window.location.href);
        }
      }
    } else {
      await copyToClipboard(window.location.href);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copiado!');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copiado!');
    }
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
          <button onClick={handleShare} className="hover:bg-surface-container-high/70 rounded-full transition-colors p-2 active:scale-95 duration-200 text-primary">
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
        <div className="max-w-3xl mx-auto">
          <section className="relative">
            {allImages.length > 1 ? (
              <div 
                className="relative"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div className="aspect-square w-full overflow-hidden max-h-[32rem] mx-auto">
                  <div
                    className="flex transition-transform duration-300 ease-in-out h-full"
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
                  onClick={() => setCurrentImageIndex((prev) => prev > 0 ? prev - 1 : allImages.length - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-surface-container-lowest/90 backdrop-blur-md rounded-full items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                  <Icon icon="chevron_left" size={20} />
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentImageIndex((prev) => prev < allImages.length - 1 ? prev + 1 : 0)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-surface-container-lowest/90 backdrop-blur-md rounded-full items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                  <Icon icon="chevron_right" size={20} />
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/10">
                  {allImages.map((_: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-white w-5' : 'bg-white/50 w-1.5'}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="aspect-square w-full overflow-hidden max-h-[32rem] mx-auto">
                <img alt={service.title} className="w-full h-full object-cover" src={service.image} loading="lazy" decoding="async" />
              </div>
            )}

          <div className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm z-10">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{service.category}</span>
            </div>
          </section>

          <div className="px-4 md:px-6 py-4 space-y-4">
            <section>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl md:text-2xl font-extrabold text-on-surface leading-tight">
                      {service.title}
                    </h2>
                    {service.verified && (
                      <Icon icon="verified" weight={400} size={22} className="text-primary" style={{ fontVariationSettings: "'FILL' 1" }} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        hasCnpj(service.cnpj)
                          ? 'text-emerald-700 bg-emerald-500/10'
                          : 'text-slate-600 bg-slate-500/10'
                      }`}
                    >
                      {hasCnpj(service.cnpj) ? 'PROFISSIONAL' : 'AUTÔNOMO'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{environment?.name || 'Ambiente'}</p>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <StarRating rating={averageRating} size={22} />
                    <span className="font-bold text-on-surface ml-1">{averageRating.toFixed(1)}</span>
                  </div>
                  <span className="text-on-surface-variant text-sm">({service.reviews_count || 0} avaliações)</span>
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant text-xs">
                  <Icon icon="visibility" size={14} />
                  <span>{service.views || 0}</span>
                </div>
              </div>

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

            <section>
              <h3 className="font-bold text-on-surface mb-3">Sobre</h3>
              <div className="bg-surface-container-lowest p-4 rounded-2xl">
                <p className="text-on-surface-variant leading-relaxed text-sm">
                  {service.description}
                </p>
                {service.tags && service.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {service.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-surface-container-low rounded-full text-xs font-semibold text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="flex gap-3">
              <button 
                onClick={handleWhatsApp}
                className="flex-1 h-12 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center gap-2 text-on-primary font-bold active:scale-95 transition-transform shadow-md"
              >
                <img
                  src="/whatsapp_logo.png"
                  alt="WhatsApp"
                  className="w-5 h-5 object-contain"
                />
                Contatar
              </button>
              {service.instagram && (
                <a 
                  href={service.instagram.startsWith('http') ? service.instagram : `https://instagram.com/${service.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 h-12 rounded-full gap-2 bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888] text-white font-bold flex items-center justify-center active:scale-95 transition-transform shadow-lg shadow-pink-500/20"
                >
                  <img
                    src="/instagram_logo.png"
                    alt="Instagram"
                    className="w-5 h-5 object-contain"
                  />
                  Instagram
                </a>
              )}
            </section>

            {menuItems.length > 0 && (
              <section>
                <h3 className="font-bold text-on-surface mb-3">Outros Serviços</h3>
                <div className="space-y-2">
                  {menuItems.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/10">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-high">
                        {item.image ? (
                          <img alt={item.name} className="w-full h-full object-cover" src={item.image} loading="lazy" decoding="async" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                            <Icon icon="restaurant" size={18} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-on-surface text-sm">{item.name}</h4>
                        <p className="text-xs text-on-surface-variant truncate">{item.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-primary font-extrabold text-sm">{item.price || 'Sem valor'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="font-bold text-on-surface mb-3">Avaliações</h3>
              <ReviewsList reviews={reviews} canReply={Boolean(isOwner)} onReply={handleSubmitReply} />
            </section>

            <section className="pb-8">
              <div className="bg-secondary-container/30 p-5 rounded-3xl relative overflow-hidden">
                <div className="relative z-10">
                  {/* <div className="flex items-center gap-2 mb-2">
                    <Icon icon="verified_user" weight={400} size={24} className="text-secondary" />
                    <p className="font-bold text-secondary">Conectae</p>
                  </div> */}
                  <p className="text-sm text-on-secondary-container/80 leading-relaxed">
                    Conectamos você com profissionais verificados da sua comunidade. Contrate com segurança!
                  </p>
                </div>
                <Icon icon="handshake" weight={400} size={80} className="absolute -right-2 -bottom-4 text-secondary-container/30 pointer-events-none" />
              </div>
            </section>
          </div>
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
              Esta ação não pode ser desfeita.
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
        <div className="fixed inset-0 z-40" onClick={() => setShowOptionsMenu(false)} />
      )}
    </div>
  );
}

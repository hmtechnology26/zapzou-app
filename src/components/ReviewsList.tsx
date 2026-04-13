'use client';

import { useState } from 'react';
import { Icon } from './Icon';
import { StarRating } from './StarRating';
import type { Review } from '@/types';

interface ReviewsListProps {
  reviews: Review[];
  canReply?: boolean;
  onReply?: (reviewId: string, reply: string) => Promise<void>;
}

export function ReviewsList({ reviews, canReply = false, onReply }: ReviewsListProps) {
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [replyError, setReplyError] = useState('');
  const [replySubmittingId, setReplySubmittingId] = useState<string | null>(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const openReplyForm = (review: Review) => {
    setReplyingReviewId(review.id);
    setReplyDraft(review.owner_reply || '');
    setReplyError('');
  };

  const closeReplyForm = () => {
    setReplyingReviewId(null);
    setReplyDraft('');
    setReplyError('');
  };

  const submitReply = async (reviewId: string) => {
    if (!onReply) return;

    const normalizedReply = replyDraft.trim();
    if (!normalizedReply) {
      setReplyError('Escreva uma resposta antes de salvar.');
      return;
    }

    setReplyError('');
    setReplySubmittingId(reviewId);
    try {
      await onReply(reviewId, normalizedReply);
      closeReplyForm();
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Não foi possível salvar a resposta.');
    } finally {
      setReplySubmittingId(null);
    }
  };

  if (reviews.length === 0) {
    return (
    <div className="text-center py-8">
      <Icon icon="rate_review" size={48} className="text-outline-variant mx-auto mb-2" />
        <p className="text-on-surface-variant text-sm">Nenhuma avaliação ainda</p>
        <p className="text-on-surface-variant/60 text-xs">Seja o primeiro a avaliar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div 
          key={review.id} 
          className={`bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/10 ${review.isAnonymous ? 'bg-amber-50/50 border-amber-200/30' : ''}`}
        >
          <div className="flex items-start gap-3">
            {review.isAnonymous ? (
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0 border border-outline-variant/20">
                <Icon icon="visibility_off" size={18} className="text-on-surface-variant" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {review.user_avatar ? (
                  <img 
                    src={review.user_avatar} 
                    alt={review.userName || 'Usuário'} 
                    className="w-full h-full object-cover"
                  loading="lazy" decoding="async" />
                ) : (
                  <span className="text-primary font-bold text-sm">
                    {(review.userName || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-on-surface text-sm truncate flex items-center gap-2">
                  {review.isAnonymous ? (
                    <>
                      <Icon icon="visibility_off" size={14} className="text-amber-600" />
                      Anônimo
                    </>
                  ) : (
                    review.userName || 'Usuário'
                  )}
                </p>
                <span className="text-xs text-on-surface-variant flex-shrink-0">
                  {formatDate(review.created_at)}
                </span>
              </div>
              <div className="mt-1">
                <StarRating rating={review.stars} size={16} />
              </div>
              {review.comment && (
                <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                  {review.comment}
                </p>
              )}

              {review.owner_reply && (
                <div className="mt-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 shadow-sm">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-sm">
                    <Icon icon="reply" size={13} />
                    Resposta do proprietário
                  </div>
                  <p className="text-sm leading-relaxed text-on-surface">
                    {review.owner_reply}
                  </p>
                  {review.owner_reply_at && (
                    <p className="mt-2 text-[11px] font-medium text-on-surface-variant/70">
                      {formatDate(review.owner_reply_at)}
                    </p>
                  )}
                </div>
              )}

              {canReply && onReply && (
                <div className="mt-3">
                  {replyingReviewId === review.id ? (
                    <div className="rounded-xl border border-outline-variant/10 bg-surface-container-high p-3">
                      <textarea
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        placeholder="Escreva sua resposta ao comentário..."
                        className="w-full min-h-[96px] resize-none rounded-lg bg-surface-container-lowest p-3 text-sm text-on-surface outline-none border border-outline-variant/10 focus:border-primary/30"
                        maxLength={500}
                      />
                      {replyError && (
                        <p className="mt-2 text-xs text-error">{replyError}</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={closeReplyForm}
                          className="rounded-full border border-outline-variant px-4 py-2 text-xs font-bold text-on-surface-variant"
                          disabled={replySubmittingId === review.id}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => void submitReply(review.id)}
                          className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                          disabled={replySubmittingId === review.id}
                        >
                          {replySubmittingId === review.id ? 'Salvando...' : 'Salvar resposta'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openReplyForm(review)}
                      className="text-xs font-bold text-primary hover:opacity-80"
                    >
                      {review.owner_reply ? 'Editar resposta' : 'Responder'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

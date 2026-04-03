'use client';

import { Icon } from './Icon';
import { StarRating } from './StarRating';
import type { Review } from '@/types';

interface ReviewsListProps {
  reviews: Review[];
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Icon } from './Icon';
import { StarRating } from './StarRating';

interface ReviewFormProps {
  onSubmit: (stars: number, comment: string) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function ReviewForm({ onSubmit, onCancel, isSubmitting = false }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (rating === 0) {
      setError('Por favor, selecione uma nota');
      return;
    }

    try {
      await onSubmit(rating, comment);
      setRating(0);
      setComment('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar avaliação. Tente novamente.';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10">
      <h4 className="font-bold text-on-surface mb-4">Avaliar Serviço</h4>
      
      <div className="flex flex-col items-center mb-4">
        <p className="text-sm text-on-surface-variant mb-2">Sua nota</p>
        <StarRating 
          rating={rating} 
          size={36} 
          interactive 
          onChange={setRating} 
        />
      </div>

      <div className="mb-4">
        <label className="text-sm text-on-surface-variant block mb-2">
          Comentário (opcional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Conte sua experiência com este serviço..."
          className="w-full bg-surface-container-high rounded-xl p-3 text-on-surface text-sm placeholder:text-on-surface-variant/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-on-surface-variant/60 text-right mt-1">
          {comment.length}/500
        </p>
      </div>

      {error && (
        <p className="text-error text-sm mb-3">{error}</p>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-full border-2 border-outline-variant text-on-surface-variant font-bold text-sm"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="flex-1 py-3 rounded-full primary-gradient text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
        </button>
      </div>
    </form>
  );
}

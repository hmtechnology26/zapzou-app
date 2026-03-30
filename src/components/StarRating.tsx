'use client';

import { Icon } from './Icon';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({ 
  rating, 
  maxStars = 5, 
  size = 20,
  interactive = false,
  onChange 
}: StarRatingProps) {
  const handleClick = (star: number) => {
    if (interactive && onChange) {
      onChange(star);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= Math.round(rating);
        
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(starValue)}
            className={`transition-transform ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          >
            <Icon 
              icon={isFilled ? 'star' : 'star_border'} 
              weight={700} 
              size={size} 
              className={isFilled ? 'text-amber-400' : 'text-slate-300'}
              style={{ fontVariationSettings: "'FILL' 1" }}
            />
          </button>
        );
      })}
    </div>
  );
}

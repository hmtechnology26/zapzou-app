'use client';

import { useEffect, useMemo, useState } from 'react';

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  alt?: string;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
}

function normalizeSrc(src: unknown): string {
  if (typeof src !== 'string') return '';
  const trimmed = src.trim();
  if (!trimmed) return '';
  if (trimmed === 'null' || trimmed === 'undefined') return '';
  return trimmed;
}

function initialsFromName(name: unknown): string {
  if (typeof name !== 'string') return '?';
  const cleaned = name.trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function Avatar({
  src,
  name,
  alt,
  className = '',
  imgClassName = '',
  fallbackClassName = '',
}: AvatarProps) {
  const normalizedSrc = useMemo(() => normalizeSrc(src), [src]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [normalizedSrc]);

  const showImage = !!normalizedSrc && !hasError;
  const fallbackText = initialsFromName(name);

  return (
    <div
      className={`relative overflow-hidden rounded-full bg-surface-container-high flex items-center justify-center select-none ${className}`}
      aria-label={alt || 'Avatar'}
    >
      {showImage ? (
        <img
          src={normalizedSrc}
          alt={alt || 'Avatar'}
          className={`w-full h-full object-cover ${imgClassName}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={`font-bold text-primary ${fallbackClassName}`}>{fallbackText}</span>
      )}
    </div>
  );
}

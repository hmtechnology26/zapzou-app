'use client';

import type { CSSProperties } from 'react';

interface IconProps {
  icon: string;
  weight?: number;
  grade?: number;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ icon, weight = 400, grade = 0, size = 24, className = '', style }: IconProps) {
  return (
    <span 
      className={`material-symbols ${className}`}
      style={{ 
        fontSize: size, 
        fontVariationSettings: `'wght' ${weight}, 'GRAD' ${grade}`,
        ...style 
      }}
    >
      {icon}
    </span>
  );
}

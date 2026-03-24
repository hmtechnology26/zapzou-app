'use client';

import { MaterialSymbol } from 'react-material-symbols';

interface IconProps {
  icon: string;
  weight?: number;
  grade?: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ icon, weight = 400, grade = 0, size = 24, className = '', style }: IconProps) {
  return (
    <span 
      className={`material-symbols-rounded ${className}`}
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

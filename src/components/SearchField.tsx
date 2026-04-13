'use client';

import { Icon } from '@/components/Icon';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
  iconSize?: number;
  compact?: boolean;
};

export function SearchField({
  value,
  onChange,
  placeholder,
  className = '',
  inputClassName = '',
  iconClassName = '',
  iconSize = 18,
  compact = false,
}: SearchFieldProps) {
  return (
    <div
      className={`flex items-center bg-surface-container-highest ${
        compact ? 'rounded-2xl px-3 py-2.5' : 'rounded-[2.5rem] px-4 py-3'
      } gap-2 focus-within:bg-surface-container-lowest focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-md border border-outline-variant/10 group min-w-0 ${className}`}
    >
      <Icon
        icon="search"
        size={iconSize}
        className={`text-[#30cc36] group-focus-within:scale-110 transition-transform shrink-0 ${iconClassName}`}
        weight={500}
      />
      <input
        className={`bg-transparent border-none outline-none focus:outline-none focus:ring-0 flex-1 min-w-0 text-on-surface placeholder:text-on-surface-variant/70 font-medium text-sm ${inputClassName}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

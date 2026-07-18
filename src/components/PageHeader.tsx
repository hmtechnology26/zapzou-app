'use client';

import { Icon } from './Icon';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon,
  action,
  className = '',
}: PageHeaderProps) {
  return (
    <section
      className={`mx-auto w-full max-w-7xl px-4 pt-20 pb-4 md:px-6 md:pt-24 ${className}`}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          {icon && (
            <div
              className="
                flex h-14 w-14 shrink-0 items-center justify-center
                rounded-3xl
                border border-[#04193D]/10
                bg-gradient-to-br
                from-[#04193D]/10
                to-[#04193D]/5
                shadow-sm
              "
            >
              <Icon
                icon={icon}
                size={28}
                className="text-[#04193D]"
              />
            </div>
          )}

          <div>
            <h1
              className="
                text-2xl
                font-semibold
                tracking-tight
                text-slate-900
                md:text-2xl
              "
            >
              {title}
            </h1>

            {subtitle && (
              <p
                className="
                  mt-2
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-500
                  md:text-base
                "
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {action && (
          <div className="hidden md:block">
            {action}
          </div>
        )}
      </div>
    </section>
  );
}
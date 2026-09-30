import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  badge,
  action,
  noPadding = false,
}) => {
  return (
    <div
      className={clsx(
        'bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col',
        className
      )}
    >
      {(title || action || badge) && (
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {typeof title === 'string' ? (
              <h3 className="font-semibold text-slate-900 text-sm tracking-tight truncate">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <span className="text-xs text-slate-500 hidden sm:inline">
                {subtitle}
              </span>
            )}
            {badge}
          </div>
          {action && <div className="flex-shrink-0 flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={clsx(noPadding ? 'p-0' : 'p-5', 'flex-1')}>
        {children}
      </div>
    </div>
  );
};

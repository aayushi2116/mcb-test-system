import React from 'react';
import { clsx } from 'clsx';

interface StatusDotProps {
  status: 'online' | 'offline' | 'warning' | 'active' | 'armed';
  pulse?: boolean;
  className?: string;
  label?: string;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  pulse = false,
  className,
  label,
}) => {
  const colors = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-300',
    warning: 'bg-amber-500',
    active: 'bg-teal-500',
    armed: 'bg-red-500',
  };

  const ringColors = {
    online: 'border-emerald-300',
    offline: 'border-slate-200',
    warning: 'border-amber-300',
    active: 'border-teal-300',
    armed: 'border-red-300',
  };

  return (
    <span className={clsx('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex h-2.5 w-2.5">
        {pulse && (
          <span
            className={clsx(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              colors[status]
            )}
          />
        )}
        <span
          className={clsx(
            'relative inline-flex rounded-full h-2.5 w-2.5 border',
            colors[status],
            ringColors[status]
          )}
        />
      </span>
      {label && <span className="text-xs text-slate-700 font-medium">{label}</span>}
    </span>
  );
};

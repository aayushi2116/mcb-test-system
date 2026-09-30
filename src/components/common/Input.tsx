import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  unit?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, unit, helperText, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          <input
            id={inputId}
            ref={ref}
            className={clsx(
              'block w-full rounded-md border text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors',
              unit ? 'pr-12' : '',
              error
                ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50/20'
                : 'border-slate-300 text-slate-900 bg-white placeholder-slate-400 focus:border-teal-500',
              className
            )}
            {...props}
          />
          {unit && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-xs font-mono font-medium text-slate-500">{unit}</span>
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

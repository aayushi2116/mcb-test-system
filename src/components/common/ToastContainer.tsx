import React from 'react';
import { useToastStore, ToastItem } from '../../store/toastStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const icons = {
    SUCCESS: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    WARNING: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
    ERROR: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
    INFO: <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />,
  };

  const borders = {
    SUCCESS: 'border-emerald-200 bg-emerald-50/90 text-emerald-950',
    WARNING: 'border-amber-200 bg-amber-50/90 text-amber-950',
    ERROR: 'border-red-200 bg-red-50/90 text-red-950',
    INFO: 'border-sky-200 bg-sky-50/90 text-sky-950',
  };

  return (
    <div
      className={clsx(
        'pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg backdrop-blur-sm transition-all transform animate-in slide-in-from-bottom-5',
        borders[toast.type]
      )}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold">{toast.title}</p>
        {toast.message && (
          <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

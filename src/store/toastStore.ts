import { create } from 'zustand';

export type ToastType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  info: (title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newItem: ToastItem = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newItem] }));

    const duration = toast.durationMs ?? 4000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);

    return id;
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  info: (title, message) => get().addToast({ type: 'INFO', title, message }),
  success: (title, message) => get().addToast({ type: 'SUCCESS', title, message }),
  warning: (title, message) => get().addToast({ type: 'WARNING', title, message }),
  error: (title, message) => get().addToast({ type: 'ERROR', title, message }),
}));

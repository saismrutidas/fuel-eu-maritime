import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
type Listener = (toasts: ToastMessage[]) => void;
const listeners: Set<Listener> = new Set();
let toasts: ToastMessage[] = [];

function notify(listeners: Set<Listener>, next: ToastMessage[]) {
  toasts = next;
  listeners.forEach(l => l(next));
}

export function showToast(message: string, type: ToastType = 'success') {
  const id = ++toastId;
  notify(listeners, [...toasts, { id, message, type }]);
  setTimeout(() => {
    notify(listeners, toasts.filter(t => t.id !== id));
  }, 3500);
}

const COLORS: Record<ToastType, string> = {
  success: 'bg-emerald-600',
  error:   'bg-red-600',
  info:    'bg-blue-600',
};

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
};

export function ToastContainer() {
  const [current, setCurrent] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener: Listener = msgs => setCurrent([...msgs]);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  if (current.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {current.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium min-w-64 animate-in ${COLORS[t.type]}`}
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 font-bold text-xs flex-shrink-0">
            {ICONS[t.type]}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

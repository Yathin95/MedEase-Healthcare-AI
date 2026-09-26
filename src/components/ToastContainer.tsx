// ─────────────────────────────────────────────
//  Toast notification component
// ─────────────────────────────────────────────
import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import type { Toast } from '../types';

interface ToastProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const iconMap = {
  success: <CheckCircle2 className="w-5 h-5 text-teal-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
  info: <Info className="w-5 h-5 text-blue-600" />,
  error: <XCircle className="w-5 h-5 text-red-600" />,
};

const bgMap = {
  success: 'border-teal-500/60 bg-teal-50 text-teal-900',
  warning: 'border-amber-400/60 bg-amber-50 text-amber-900',
  info: 'border-blue-500/60 bg-blue-50 text-blue-900',
  error: 'border-red-400/60 bg-red-50 text-red-900',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-xl animate-slide-in-up max-w-sm ${bgMap[toast.type]}`}
    >
      <div className="flex-shrink-0 mt-0.5">{iconMap[toast.type]}</div>
      <p className="text-sm text-slate-800 leading-relaxed flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

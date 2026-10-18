import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface CategoryToastProps {
  toast: { type: 'success' | 'error'; message: string } | null;
}

export default function CategoryToast({ toast }: CategoryToastProps) {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-5 right-5 z-50 p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-top-3 ${
        toast.type === 'error'
          ? 'bg-rose-950/90 border-rose-500/50 text-rose-100'
          : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
      }`}
    >
      {toast.type === 'error' ? (
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
      ) : (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      )}
      <span className="text-xs font-semibold">{toast.message}</span>
    </div>
  );
}

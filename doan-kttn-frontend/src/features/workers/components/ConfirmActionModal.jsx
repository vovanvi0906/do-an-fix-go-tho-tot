import React from 'react';
import { AlertTriangle, CheckCircle2, X, Loader2, ShieldAlert } from 'lucide-react';

/**
 * Enterprise Glassmorphism Confirmation Modal (ConfirmActionModal.jsx)
 * Replaces native browser window.confirm / alert dialogs with high-end Vercel/Linear aesthetics.
 */
export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác Nhận Hành Động',
  message,
  targetName,
  confirmText = 'Xác Nhận',
  cancelText = 'Hủy Bỏ',
  variant = 'danger', // 'danger' | 'success' | 'warning'
  isSubmitting = false,
}) {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isSuccess = variant === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                : isSuccess
                ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
            }`}
          >
            {isDanger ? (
              <ShieldAlert className="w-6 h-6" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1 pr-6">
            <h3 className="text-base font-bold text-white tracking-tight leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {message || 'Bạn có chắc chắn muốn thực hiện hành động này đối với:'}
            </p>
            {targetName && (
              <div className="text-xs font-semibold text-slate-200 mt-1 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 truncate">
                Đối tác thợ: <span className="text-blue-400 font-bold">{targetName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer disabled:opacity-40"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25 border border-rose-500/30'
                : isSuccess
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 border border-emerald-500/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25 border border-blue-500/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

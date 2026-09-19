import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isSubmitting = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0f172a] border border-rose-500/30 shadow-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Xác Nhận Xóa Người Dùng
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa tài khoản <span className="text-slate-900 dark:text-white font-bold">{userName || 'này'}</span> khỏi hệ thống? Thao tác này sẽ xóa an toàn toàn bộ dữ liệu liên quan và không thể hoàn tác.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-60 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

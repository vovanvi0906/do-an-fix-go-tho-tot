import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Loader2, AlertTriangle } from 'lucide-react';

/**
 * DeleteCategoryModal Component
 * Modal xác nhận xóa danh mục ngành nghề an toàn.
 */
export default function DeleteCategoryModal({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  serviceCount = 0,
  isSubmitting = false,
}) {
  const [forceDelete, setForceDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForceDelete(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Danger Icon */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1 pr-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
              Xác Nhận Xóa Danh Mục
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa nhóm ngành nghề này?
            </p>
            {categoryName && (
              <div className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-1 p-2 rounded-lg bg-rose-50/50 dark:bg-slate-950/80 border border-rose-200/60 dark:border-slate-800/80 truncate">
                Danh mục: {categoryName} {serviceCount > 0 ? `(${serviceCount} dịch vụ trực thuộc)` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Force Delete Option */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-2.5">
          <input
            id="force-delete-cat-checkbox"
            type="checkbox"
            checked={forceDelete}
            onChange={(e) => setForceDelete(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500 cursor-pointer"
          />
          <label
            htmlFor="force-delete-cat-checkbox"
            className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
          >
            <span className="font-bold text-rose-600 dark:text-rose-400 block">
              Xóa vĩnh viễn (Force Delete)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
              Xóa triệt để danh mục và toàn bộ các gói dịch vụ trực thuộc khỏi cơ sở dữ liệu.
            </span>
          </label>
        </div>

        {/* Safety Note */}
        {!forceDelete && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/50 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Mặc định: Nếu danh mục đang có dịch vụ liên kết, hệ thống sẽ chuyển sang trạng thái <strong>Tạm Ngưng (Soft Delete)</strong>.
            </span>
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer disabled:opacity-40"
          >
            Hủy thao tác
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onConfirm(forceDelete)}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>{forceDelete ? 'Xóa Vĩnh Viễn' : 'Xác nhận xóa'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

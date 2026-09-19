/**
 * @file ErrorState.tsx
 * @description Component hiển thị trạng thái lỗi kết nối hoặc tải dữ liệu kèm nút Thử lại (Retry).
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

/**
 * Component `ErrorState`
 */
export default function ErrorState({
  message = 'Không thể kết nối đến máy chủ FixGo. Vui lòng kiểm tra lại đường truyền.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`p-5 rounded-3xl bg-rose-50/80 border border-rose-200/80 text-center space-y-3 shadow-sm ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-rose-900">Đã xảy ra sự cố</h4>
        <p className="text-xs text-rose-700/90 mt-1 max-w-xs mx-auto leading-relaxed">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all shadow-sm shadow-rose-600/20"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Thử lại ngay
      </button>
    </div>
  );
}

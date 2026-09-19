import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';

/**
 * Custom Glassmorphism Confirmation Modal for Cancelling / Deleting an Order.
 * Replaces native browser window.confirm / alert dialogs.
 */
export default function CancelOrderModal({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  isSubmitting = false,
}) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const quickReasons = [
    'Spam / Tạo đơn ảo không xác thực',
    'Khách hàng & thợ thỏa thuận hủy đơn',
    'Đơn hàng có tranh chấp nghiêm trọng',
    'Vi phạm điều khoản sử dụng nền tảng',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason.trim() || 'Hủy theo yêu cầu của Quản trị viên');
  };

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

        {/* Header with Danger Icon */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1 pr-6">
            <h3 className="text-base font-bold text-white tracking-tight leading-snug">
              Xác Nhận Hủy Đơn Hàng
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bạn có chắc chắn muốn hủy đơn hàng này khỏi quy trình phục vụ của hệ thống?
            </p>
            {orderId && (
              <div className="text-xs font-mono font-bold text-rose-300 mt-1 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 truncate">
                Mã đơn: #{orderId.slice(0, 8).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Cancellation Reason Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Lý do hủy đơn (Lưu lịch sử hệ thống):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do hủy hoặc xử lý khiếu nại..."
              required
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none"
            />

            {/* Quick Suggestions */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-slate-500 font-medium">Gợi ý lý do nhanh:</span>
              <div className="flex flex-wrap gap-1.5">
                {quickReasons.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReason(q)}
                    className="text-[10px] px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
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
              Hủy thao tác
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Xác nhận hủy đơn</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

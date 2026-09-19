import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

export default function RejectWorkerModal({ isOpen, onClose, onConfirm, workerName, isSubmitting }) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason.trim() || 'Hồ sơ chưa đạt tiêu chuẩn phê duyệt của hệ thống');
  };

  const quickReasons = [
    'Hình ảnh CCCD mờ hoặc không hợp lệ',
    'Chưa cung cấp chứng chỉ hành nghề liên quan',
    'Thông tin liên lạc không thể xác thực',
    'Kinh nghiệm thực tế chưa đáp ứng yêu cầu',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Từ Chối Hồ Sơ Đối Tác
            </h3>
            <p className="text-xs text-slate-400">
              Đối tác: <span className="text-slate-200 font-semibold">{workerName}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">
              LÝ DO TỪ CHỐI (GỬI THÔNG BÁO CHO THỢ)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do cụ thể..."
              required
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none"
            />

            {/* Quick Reason Pills */}
            <div className="space-y-1 pt-1">
              <span className="text-[10.5px] text-slate-500 block font-medium">
                Gợi ý lý do nhanh:
              </span>
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

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Xác nhận từ chối</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

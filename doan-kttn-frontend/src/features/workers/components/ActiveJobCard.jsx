import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  Clock,
  Wrench,
  Loader2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

const STEPS = [
  { key: 'ASSIGNED', label: 'Đã nhận đơn' },
  { key: 'WORKER_ARRIVING', label: 'Đang di chuyển' },
  { key: 'ARRIVED', label: 'Đã đến nơi' },
  { key: 'IN_PROGRESS', label: 'Đang sửa chữa' },
  { key: 'AWAITING_CONFIRMATION', label: 'Chờ nghiệm thu' },
];

export default function ActiveJobCard({ job, onUpdateStep }) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!job) return null;

  const currentStatus = job.status || 'ASSIGNED';
  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStatus);
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  const handleNextStep = async (action) => {
    try {
      setIsUpdating(true);
      await onUpdateStep(job.id, action);
    } finally {
      setIsUpdating(false);
    }
  };

  const getActionConfig = () => {
    switch (currentStatus) {
      case 'ASSIGNED':
        return {
          action: 'arriving',
          label: 'BẮT ĐẦU DI CHUYỂN ĐẾN ĐIỂM HẸN',
          nextDesc: 'Chuyển sang trạng thái đang di chuyển để khách hàng theo dõi',
          gradient: 'from-blue-600 via-indigo-600 to-blue-700',
        };
      case 'WORKER_ARRIVING':
        return {
          action: 'arrived',
          label: 'ĐÃ ĐẾN ĐIỂM HẸN VỚI KHÁCH',
          nextDesc: 'Thông báo cho khách hàng bạn đã có mặt trước cửa nhà',
          gradient: 'from-cyan-600 to-blue-600',
        };
      case 'ARRIVED':
        return {
          action: 'start',
          label: 'BẮT ĐẦU THỰC HIỆN CÔNG VIỆC',
          nextDesc: 'Bắt đầu tính thời gian và quy trình xử lý kỹ thuật',
          gradient: 'from-indigo-600 to-purple-600',
        };
      case 'IN_PROGRESS':
        return {
          action: 'finish',
          label: 'HOÀN THÀNH & BÁO CÁO NGHIỆM THU',
          nextDesc: 'Gửi yêu cầu kiểm tra và nghiệm thu đến khách hàng',
          gradient: 'from-emerald-600 to-teal-600',
        };
      case 'AWAITING_CONFIRMATION':
      default:
        return null;
    }
  };

  const actionConfig = getActionConfig();

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-blue-500/40 rounded-2xl p-6 shadow-2xl shadow-blue-950/40 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ĐƠN HÀNG ĐANG THỰC HIỆN (ACTIVE JOB)</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {job.service?.name || 'Sửa chữa thiết bị gia đình'}
          </h2>
          <p className="text-xs font-mono text-blue-400 mt-0.5">
            Mã đơn: {job.orderCode || job.id?.slice(0, 13) || 'FG-ACTIVE'}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-slate-400 block">Số tiền thanh toán:</span>
          <span className="text-2xl font-black font-mono text-emerald-400">
            {Number(job.totalPrice || 150000).toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>

      {/* 5-Step Lifecycle Progress Tracker */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div
                key={step.key}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold shadow-xs'
                    : isCompleted
                    ? 'bg-slate-800/80 border-emerald-500/30 text-emerald-400 font-medium'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider mb-0.5">
                  {isCompleted ? '✓ Bước ' + (idx + 1) : 'Bước ' + (idx + 1)}
                </div>
                <div className="text-xs truncate">{step.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer & Location Cards (2 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Customer Information */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Thông tin khách hàng
          </span>
          <div className="font-bold text-slate-100 text-sm">
            {job.customer?.fullName || 'Khách hàng FixGo'}
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-slate-400 font-mono">
              {job.customer?.phone || '0987.xxx.xxx'}
            </span>
            <a
              href={`tel:${job.customer?.phone || '0987654321'}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-semibold transition-all cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Gọi điện</span>
            </a>
          </div>
        </div>

        {/* Pickup Address & Navigation */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Địa chỉ điểm hẹn
          </span>
          <div className="text-slate-200 leading-relaxed truncate">
            {job.pickupAddress || '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM'}
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-slate-500 font-mono">
              GPS: {Number(job.pickupLat || 10.7626).toFixed(4)},{' '}
              {Number(job.pickupLng || 106.6601).toFixed(4)}
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                job.pickupAddress || '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 font-semibold transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Chỉ đường</span>
            </a>
          </div>
        </div>
      </div>

      {/* Issue Note */}
      {job.description && (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300">
          <span className="text-slate-500 font-semibold">Mô tả sự cố từ khách: </span>
          "{job.description}"
        </div>
      )}

      {/* Action Transition Step Button */}
      {actionConfig ? (
        <div className="pt-2 space-y-2">
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => handleNextStep(actionConfig.action)}
            className={`w-full py-4 px-6 rounded-xl bg-gradient-to-r ${actionConfig.gradient} hover:brightness-110 text-white font-bold text-sm tracking-wider uppercase shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ĐANG CẬP NHẬT TRẠNG THÁI...</span>
              </>
            ) : (
              <>
                <span>{actionConfig.label}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-slate-400">
            {actionConfig.nextDesc}
          </p>
        </div>
      ) : (
        /* Awaiting confirmation banner */
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-white text-sm">Đã hoàn thành công việc!</p>
            <p className="mt-0.5 text-slate-300">
              Hệ thống đã gửi thông báo đến khách hàng để nghiệm thu kết quả và thanh toán.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

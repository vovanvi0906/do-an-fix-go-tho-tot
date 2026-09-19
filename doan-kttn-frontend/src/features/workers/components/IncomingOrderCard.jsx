import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Wrench,
  Droplet,
  Zap,
  Wind,
  Key,
  Radio,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const getServiceIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('nước') || lower.includes('ống')) return Droplet;
  if (lower.includes('điện') || lower.includes('chập')) return Zap;
  if (lower.includes('lạnh') || lower.includes('điều hòa')) return Wind;
  if (lower.includes('khóa')) return Key;
  return Wrench;
};

export default function IncomingOrderCard({ order, onAccept, onExpired, isAccepting }) {
  const initialSeconds = order.countdownSeconds || 30;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpired) onExpired(order.id || order.orderId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [order.id, onExpired]);

  const ServiceIcon = getServiceIcon(order.service?.name || order.serviceName || '');
  const percentLeft = Math.max(0, (timeLeft / initialSeconds) * 100);

  return (
    <div className="relative bg-slate-900/90 backdrop-blur-md border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 transition-all duration-200 shadow-xl space-y-4 overflow-hidden group">
      {/* 30-Second Countdown Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            percentLeft > 40
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
              : percentLeft > 15
              ? 'bg-amber-500'
              : 'bg-rose-500'
          }`}
          style={{ width: `${percentLeft}%` }}
        />
      </div>

      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <ServiceIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 mb-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>ĐƠN MỚI TRỰC TIẾP</span>
            </div>
            <h3 className="text-base font-bold text-white leading-snug tracking-tight">
              {order.service?.name || order.serviceName || 'Dịch vụ sửa chữa tại nhà'}
            </h3>
          </div>
        </div>

        {/* Countdown Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold shrink-0">
          <Clock
            className={`w-3.5 h-3.5 ${
              timeLeft < 10 ? 'text-rose-400 animate-spin' : 'text-amber-400'
            }`}
          />
          <span className={timeLeft < 10 ? 'text-rose-400' : 'text-slate-300'}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Details Row: Address & Distance */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-start gap-2 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            {order.pickupAddress || '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM'}
          </span>
        </div>

        <div className="flex items-center gap-2 pl-5.5 text-[11px] text-slate-400">
          <span className="font-semibold text-blue-400">
            📍 Cách vị trí của bạn: {order.distanceKm || '0.8'} km
          </span>
          <span>•</span>
          <span>Ước tính di chuyển 5 - 10 phút</span>
        </div>
      </div>

      {/* Description / Customer Note */}
      {order.description && (
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 italic">
          <span className="text-slate-500 not-italic font-medium">Ghi chú sự cố: </span>
          "{order.description}"
        </div>
      )}

      {/* Footer: Price Preview + Accept Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/70">
        <div>
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
            Thu nhập dự kiến:
          </span>
          <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
            {Number(order.totalPrice || 150000).toLocaleString('vi-VN')} đ
          </span>
        </div>

        <button
          type="button"
          disabled={isAccepting || timeLeft <= 0}
          onClick={() => onAccept(order.id || order.orderId)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-400/20"
        >
          {isAccepting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>ĐANG XÁC NHẬN...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>NHẬN ĐƠN NGAY</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

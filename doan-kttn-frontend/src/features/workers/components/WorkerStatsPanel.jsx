import React from 'react';
import {
  DollarSign,
  CheckCircle2,
  Star,
  TrendingUp,
  ShieldCheck,
  Radio,
  Sparkles,
} from 'lucide-react';

export default function WorkerStatsPanel({ profile, onSimulateOrder }) {
  const stats = [
    {
      title: 'Thu nhập hôm nay',
      value: `${Number(profile?.todayEarnings || 650000).toLocaleString('vi-VN')} đ`,
      change: '+18% vs hôm qua',
      icon: DollarSign,
      color: 'emerald',
    },
    {
      title: 'Đơn đã hoàn thành',
      value: `${profile?.completedOrdersCount || 48} đơn`,
      change: '100% đúng hẹn',
      icon: CheckCircle2,
      color: 'blue',
    },
    {
      title: 'Đánh giá trung bình',
      value: `${profile?.ratingAvg || 4.9} ⭐`,
      change: 'Từ 52 lượt đánh giá',
      icon: Star,
      color: 'amber',
    },
    {
      title: 'Tỷ lệ nhận đơn',
      value: '98%',
      change: 'Phản hồi trong 15s',
      icon: TrendingUp,
      color: 'indigo',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Compact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-1.5 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{item.title}</span>
                <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-bold font-mono text-white tracking-tight">
                {item.value}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {item.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Verified Profile Badge */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Trạng thái hồ sơ:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10.5px] font-bold">
            <ShieldCheck className="w-3 h-3" />
            <span>ĐÃ PHÊ DUYỆT</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Phạm vi phục vụ:</span>
          <span className="text-white font-medium">Bán kính 5.0 km</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Thời gian phản hồi:</span>
          <span className="text-emerald-400 font-medium">&lt; 30 giây</span>
        </div>
      </div>

      {/* Demo Broadcast Button */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-500/20 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
          <Sparkles className="w-4 h-4" />
          <span>Kiểm Thử Sóng Real-Time</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Tạo đơn hàng giả lập để thử nghiệm luồng nhận sóng WebSocket và đồng hồ đếm ngược 30s.
        </p>
        <button
          type="button"
          onClick={onSimulateOrder}
          className="w-full py-2.5 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
        >
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          <span>Phát sóng đơn mẫu (Demo)</span>
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { Award, Star, TrendingUp, CheckCircle2, Trophy } from 'lucide-react';

export default function TopWorkersCard({ workers = [] }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(amount) || 0);
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-900 font-bold text-[10px] flex items-center justify-center">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-5 h-5 rounded-full bg-amber-700 text-white font-bold text-[10px] flex items-center justify-center">
          3
        </span>
      );
    }
    return (
      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px] flex items-center justify-center">
        {rank}
      </span>
    );
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Top Đối Tác Thợ Xuất Sắc
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Đánh giá cao & hoàn thành nhiều đơn nhất
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
          BXH THÁNG
        </span>
      </div>

      {/* Workers List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
        {workers.map((worker, idx) => (
          <div
            key={worker.id || idx}
            className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 -mx-2 px-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {getRankBadge(idx + 1)}

              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold text-xs uppercase shrink-0">
                  {worker.fullName ? worker.fullName.charAt(0) : 'W'}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${
                    worker.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
              </div>

              <div className="min-w-0">
                <div className="font-bold text-slate-900 dark:text-white truncate">
                  {worker.fullName}
                </div>
                <div className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate">
                  {worker.specialty}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 space-y-0.5">
              <div className="flex items-center justify-end gap-1 text-amber-500 font-bold text-xs">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{Number(worker.ratingAvg).toFixed(1)}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                <strong className="text-slate-700 dark:text-slate-300">
                  {worker.totalJobs}
                </strong>{' '}
                đơn hoàn tất
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

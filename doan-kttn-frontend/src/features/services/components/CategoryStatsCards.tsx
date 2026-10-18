import React from 'react';
import { Layers, CheckCircle2, Tag } from 'lucide-react';

interface CategoryStatsCardsProps {
  totalCount: number;
  activeCount: number;
  totalServices: number;
}

export default function CategoryStatsCards({
  totalCount,
  activeCount,
  totalServices,
}: CategoryStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Tổng số nhóm ngành
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
            {totalCount}
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
          <Layers className="w-4 h-4" />
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Đang hoạt động
          </span>
          <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
            {activeCount}
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      </div>

      <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Tổng dịch vụ trực thuộc
          </span>
          <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 block">
            {totalServices}
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Tag className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

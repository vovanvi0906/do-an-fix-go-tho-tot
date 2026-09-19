import React from 'react';
import { PieChart, Zap, Snowflake, Droplets, Key, Sparkles, Wrench } from 'lucide-react';

export default function CategoryDistributionCard({ distribution = [] }) {
  const getIcon = (name = '') => {
    const text = name.toLowerCase();
    if (text.includes('điện') && !text.includes('lạnh')) return <Zap className="w-3.5 h-3.5 text-amber-500" />;
    if (text.includes('lạnh')) return <Snowflake className="w-3.5 h-3.5 text-sky-400" />;
    if (text.includes('nước') || text.includes('ống')) return <Droplets className="w-3.5 h-3.5 text-blue-500" />;
    if (text.includes('khóa')) return <Key className="w-3.5 h-3.5 text-yellow-500" />;
    if (text.includes('vệ sinh')) return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />;
    return <Wrench className="w-3.5 h-3.5 text-indigo-400" />;
  };

  const topCategory = distribution[0]?.name || 'Điện dân dụng';

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Phân Bổ Dịch Vụ
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tỷ trọng doanh số theo danh mục
            </p>
          </div>
        </div>

        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60">
          Top: {topCategory}
        </span>
      </div>

      {/* Segmented Combined Progress Bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 p-0.5">
        {distribution.map((item, idx) => (
          <div
            key={idx}
            style={{
              width: `${item.percentage}%`,
              backgroundColor: item.color || '#3b82f6',
            }}
            className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
            title={`${item.name}: ${item.percentage}%`}
          />
        ))}
      </div>

      {/* Category Breakdown Rows */}
      <div className="space-y-2.5 pt-1 text-xs">
        {distribution.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                {getIcon(item.name)}
                <span className="font-semibold truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] font-mono">
                  {item.orders} đơn
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white min-w-[36px] text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Individual bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color || '#3b82f6',
                }}
                className="h-full rounded-full transition-all duration-300"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

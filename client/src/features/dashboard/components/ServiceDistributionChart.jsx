import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { ChartSkeleton, DashboardEmptyState } from './DashboardStates';

/**
 * Custom Tooltip cho Recharts Donut Chart (Linear / Vercel Style)
 */
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-md text-xs select-none">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-bold text-slate-900 dark:text-white">
            {data.name}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
          <span>Số đơn: <b className="text-slate-800 dark:text-slate-200">{data.count} đơn</b></span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-blue-600 dark:text-blue-400">
            {data.percentage}%
          </span>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * ServiceDistributionChart Component
 * Biểu đồ Donut thể hiện phân bổ danh mục dịch vụ sử dụng Recharts
 * Chuẩn Linear / Vercel style với metric ở trung tâm và legend phân bổ sắc sảo.
 *
 * @param {import('../../../types/dashboard').ServiceDistributionChartProps} props
 */
export default function ServiceDistributionChart({
  services = [],
  totalOrders = 0,
  isLoading = false,
}) {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!services || services.length === 0) {
    return (
      <DashboardEmptyState
        title="Chưa có dữ liệu phân bổ"
        description="Khi có đơn hàng phát sinh theo danh mục dịch vụ, biểu đồ phân bổ sẽ hiển thị tại đây."
        icon={PieChartIcon}
      />
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full py-1">
      {/* 1. Recharts Donut Chart with Centered Metric */}
      <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={services}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={52}
              stroke="none"
              paddingAngle={2}
            >
              {services.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || '#3b82f6'}
                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Metric Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-black font-mono tracking-tight text-slate-900 dark:text-white leading-none">
            {totalOrders}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            Tổng đơn
          </span>
        </div>
      </div>

      {/* 2. Distribution Legend List */}
      <div className="flex-1 w-full space-y-1.5 min-w-0">
        {services.map((service, idx) => (
          <div
            key={service.id || idx}
            className="p-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-colors duration-150 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: service.color || '#3b82f6' }}
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                {service.name}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                {service.count ?? 0} đơn
              </span>
              <span className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-md text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800">
                {service.percentage ?? 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

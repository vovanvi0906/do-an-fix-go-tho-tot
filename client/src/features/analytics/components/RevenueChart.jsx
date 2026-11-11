import React, { useState } from 'react';
import { TrendingUp, DollarSign, Calendar, BarChart3, LineChart } from 'lucide-react';

export default function RevenueChart({ points = [], totalRevenue = 0, timeRange = 'month' }) {
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(amount) || 0);
  };

  if (!points || points.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        Đang tải dữ liệu biểu đồ doanh thu...
      </div>
    );
  }

  const maxRevenue = Math.max(...points.map((p) => p.revenue), 1000000);
  const minRevenue = 0;

  // Chart dimensions
  const chartHeight = 180;
  const chartWidth = 500;
  const paddingX = 35;
  const paddingY = 20;

  const getX = (index) => {
    if (points.length <= 1) return chartWidth / 2;
    return paddingX + (index / (points.length - 1)) * (chartWidth - paddingX * 2);
  };

  const getY = (value) => {
    const range = maxRevenue - minRevenue;
    const ratio = (value - minRevenue) / (range || 1);
    return chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
  };

  // Build SVG Path for Area & Line
  const linePath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.revenue)}`)
    .join(' ');

  const areaPath = `${linePath} L ${getX(points.length - 1)} ${chartHeight - paddingY} L ${getX(0)} ${chartHeight - paddingY} Z`;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Biến Động Doanh Thu Toàn Nền Tảng
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              {totalRevenue > 0 ? (timeRange === 'year' ? '+28.4%' : '+15.8%') : '0%'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tổng thu trong kỳ:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(totalRevenue)}
            </strong>
          </p>
        </div>

        {/* Toggle Area / Bar view */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={`p-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              chartType === 'area'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Dạng đường cong sóng"
          >
            <LineChart className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`p-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              chartType === 'bar'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Dạng cột"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-48 overflow-visible"
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = paddingY + ratio * (chartHeight - paddingY * 2);
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800/80 stroke-[0.8]"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* AREA / LINE VIEW */}
          {chartType === 'area' && (
            <>
              {/* Area Fill */}
              <path d={areaPath} fill="url(#revenueGradient)" />

              {/* Line Curve */}
              <path
                d={linePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Points */}
              {points.map((p, idx) => {
                const cx = getX(idx);
                const cy = getY(p.revenue);
                const isHovered = hoveredIndex === idx;

                return (
                  <g
                    key={idx}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 3.5}
                      fill="#10b981"
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* BAR VIEW */}
          {chartType === 'bar' && (
            <g>
              {points.map((p, idx) => {
                const x = getX(idx) - 10;
                const y = getY(p.revenue);
                const height = chartHeight - paddingY - y;
                const isHovered = hoveredIndex === idx;

                return (
                  <rect
                    key={idx}
                    x={x}
                    y={y}
                    width={20}
                    height={Math.max(2, height)}
                    rx={4}
                    fill={isHovered ? '#10b981' : 'url(#barGradient)'}
                    className="cursor-pointer transition-all duration-200 hover:opacity-90"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </g>
          )}

          {/* X-Axis Labels */}
          {points.map((p, idx) => {
            const x = getX(idx);
            const isHovered = hoveredIndex === idx;

            return (
              <text
                key={idx}
                x={x}
                y={chartHeight - 4}
                textAnchor="middle"
                className={`text-[10px] font-mono select-none ${
                  isHovered
                    ? 'fill-emerald-400 font-bold'
                    : 'fill-slate-400 dark:fill-slate-500 font-medium'
                }`}
              >
                {p.label}
              </text>
            );
          })}
        </svg>

        {/* Hovered Point Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 p-2.5 rounded-xl bg-slate-900/95 border border-slate-700 text-white shadow-xl backdrop-blur-md pointer-events-none flex items-center gap-3 animate-in fade-in duration-150 z-20 text-xs"
          >
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {points[hoveredIndex].label}
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {formatCurrency(points[hoveredIndex].revenue)}
              </span>
            </div>
            <div className="border-l border-slate-700 pl-2">
              <span className="text-[10px] text-slate-400 block">Số đơn</span>
              <span className="font-mono font-bold text-blue-400">
                {points[hoveredIndex].orders} đơn
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

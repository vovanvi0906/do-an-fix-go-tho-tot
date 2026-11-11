import React from 'react';
import { AlertTriangle, RefreshCw, Inbox, Activity, PieChart } from 'lucide-react';
import Skeleton from '../../../components/ui/Skeleton';

/**
 * Skeleton Loader cho Metric KPI Cards (4 cột)
 * Chuẩn 8pt grid system, border sắc nét, không dùng spinner tròn
 */
export function MetricCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 my-2 shrink-0">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-4 rounded-xl bg-white dark:bg-[#1e293b]/60 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col justify-between h-[124px]"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="w-24 h-3.5" />
            <Skeleton className="w-7 h-7 rounded-lg" />
          </div>
          <div className="flex items-end justify-between my-2">
            <Skeleton className="w-20 h-7 rounded-md" />
            <Skeleton className="w-16 h-5 rounded-md" />
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <Skeleton className="w-28 h-3" />
            <Skeleton className="w-12 h-4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Loader cho Khối Hoạt Động Gần Đây (Activity Timeline)
 */
export function TimelineSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 p-2 rounded-xl">
          <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <Skeleton className="w-36 h-3.5" />
              <Skeleton className="w-14 h-3" />
            </div>
            <Skeleton className="w-48 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Loader cho Khối Biểu Đồ Phân Bổ Dịch Vụ
 */
export function ChartSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 w-full py-3">
      {/* Vòng tròn Donut Skeleton */}
      <div className="w-36 h-36 rounded-full border-8 border-slate-200/70 dark:border-slate-800/70 shrink-0 flex items-center justify-center animate-pulse">
        <Skeleton className="w-14 h-6 rounded" />
      </div>
      {/* Danh sách nhãn phân bổ Skeleton */}
      <div className="flex-1 w-full space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-2.5 h-2.5 rounded-full" />
              <Skeleton className="w-24 h-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-12 h-3" />
              <Skeleton className="w-10 h-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Khối Hiển Thị Lỗi (Error State)
 * Phong cách Linear / Vercel: Viền sắc nét, cảnh báo rõ ràng kèm nút thử lại
 */
export function DashboardErrorState({ message, onRetry }) {
  return (
    <div className="p-6 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold tracking-tight">Không thể đồng bộ số liệu hệ thống</h4>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
            {message || 'Kết nối tới API Backend bị gián đoạn. Vui lòng kiểm tra lại dịch vụ.'}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Thử kết nối lại</span>
        </button>
      )}
    </div>
  );
}

/**
 * Khối Trạng Thái Trống (Empty State)
 */
export function DashboardEmptyState({
  title = 'Chưa có dữ liệu phát sinh',
  description = 'Hệ thống chưa ghi nhận giao dịch hoặc hoạt động nào trong kỳ được chọn.',
  icon: Icon = Inbox,
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center select-none">
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-400 flex items-center justify-center mb-2.5">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-tight">{title}</p>
      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs">{description}</p>
    </div>
  );
}

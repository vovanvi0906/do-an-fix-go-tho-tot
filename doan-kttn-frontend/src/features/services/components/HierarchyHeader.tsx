import React from 'react';
import { Layers, Box, Wrench, CheckCircle2, RefreshCw, Plus } from 'lucide-react';

interface HierarchyHeaderProps {
  categoryCount: number;
  targetCount: number;
  serviceCount: number;
  activeCount: number;
  onRefresh: () => void;
  onAddCategory: () => void;
  onAddTarget: () => void;
  onAddService: () => void;
  refreshing?: boolean;
}

export const HierarchyHeader: React.FC<HierarchyHeaderProps> = ({
  categoryCount,
  targetCount,
  serviceCount,
  activeCount,
  onRefresh,
  onAddCategory,
  onAddTarget,
  onAddService,
  refreshing = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Quản Lý Danh Mục - Đối Tượng - Dịch Vụ
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
              HIERARCHY MANAGER
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Realtime
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý cấu trúc phân cấp dịch vụ theo Danh mục → Đối tượng → Dịch vụ, đảm bảo tổ chức khoa học và dễ dàng mở rộng.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={onAddCategory}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Thêm Danh Mục</span>
          </button>

          <button
            type="button"
            onClick={onAddTarget}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Thêm Đối Tượng</span>
          </button>

          <button
            type="button"
            onClick={onAddService}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Thêm Dịch Vụ</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Tổng danh mục</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">{categoryCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Tổng đối tượng</span>
            <span className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">{targetCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Box className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Tổng dịch vụ</span>
            <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">{serviceCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Đang hoạt động</span>
            <span className="text-lg font-bold font-mono text-teal-600 dark:text-teal-400 mt-0.5 block">{activeCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HierarchyHeader;

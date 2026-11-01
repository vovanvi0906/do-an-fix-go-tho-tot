import React from 'react';
import { Layers, Box, Wrench, CheckCircle2, FileText } from 'lucide-react';
import type { CategoryItem } from '../../../types/category';
import type { ServiceTargetItem, ServiceItem } from '../../../types/service';

interface HierarchyDetailFooterProps {
  category: CategoryItem | null;
  target: ServiceTargetItem | null;
  service: ServiceItem | null;
}

export const HierarchyDetailFooter: React.FC<HierarchyDetailFooterProps> = ({
  category,
  target,
  service,
}) => {
  if (!category && !target) return null;

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 p-4 shadow-2xs space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
          <Layers className="w-3.5 h-3.5" />
        </div>
        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
          Chi tiết cấu trúc đang chọn
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
        {/* Danh mục */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block font-semibold">Danh mục</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
              {category?.name || 'Chưa chọn'}
            </span>
          </div>
        </div>

        {/* Đối tượng */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center shrink-0">
            <Box className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block font-semibold">Đối tượng</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
              {target?.name || 'Tất cả đối tượng'}
            </span>
          </div>
        </div>

        {/* Số dịch vụ */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block font-semibold">Số dịch vụ</span>
            <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
              {target ? (target._count?.services || 0) : (category?._count?.services || 0)} gói
            </span>
          </div>
        </div>

        {/* Trạng thái */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-teal-100/70 dark:bg-teal-900/40 text-teal-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block font-semibold">Trạng thái</span>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 block">
              {target ? (target.isActive ? 'Hoạt động' : 'Tạm ngưng') : (category?.isActive ? 'Hoạt động' : 'Tạm ngưng')}
            </span>
          </div>
        </div>
      </div>

      {/* Mô tả chi tiết */}
      <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <p className="line-clamp-2">
          {target?.description || category?.description || 'Các dịch vụ liên quan đến đối tượng này trực thuộc phân hệ sửa chữa của FixGo Pro.'}
        </p>
      </div>
    </div>
  );
};

export default HierarchyDetailFooter;

import React from 'react';
import { Home, ChevronRight, Layers, Box, Wrench } from 'lucide-react';

interface HierarchyBreadcrumbProps {
  categoryName?: string;
  targetName?: string;
  onReset: () => void;
  onSelectCategoryOnly: () => void;
}

export const HierarchyBreadcrumb: React.FC<HierarchyBreadcrumbProps> = ({
  categoryName,
  targetName,
  onReset,
  onSelectCategoryOnly,
}) => {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Tất cả</span>
      </button>

      <ChevronRight className="w-3 h-3 text-slate-400" />

      {categoryName ? (
        <button
          type="button"
          onClick={onSelectCategoryOnly}
          className={`flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer ${
            !targetName ? 'font-bold text-blue-600 dark:text-blue-400' : ''
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span>{categoryName}</span>
        </button>
      ) : (
        <span className="text-slate-400">Chọn danh mục</span>
      )}

      {targetName && (
        <>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <div className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400">
            <Box className="w-3.5 h-3.5 text-indigo-500" />
            <span>{targetName}</span>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Wrench className="w-3.5 h-3.5" />
            <span>Dịch vụ liên quan</span>
          </span>
        </>
      )}
    </div>
  );
};

export default HierarchyBreadcrumb;


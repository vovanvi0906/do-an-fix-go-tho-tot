import React from 'react';
import { Tag } from 'lucide-react';
import type { ServiceTargetItem } from '../../../types/service';

interface TargetFilterPillsProps {
  targets: ServiceTargetItem[];
  selectedTarget: string;
  onSelectTarget: (targetId: string) => void;
  categoryName?: string;
}

/**
 * Thanh bộ lọc con: Đối tượng / Thiết bị sửa chữa (Target Filter Pills)
 */
export const TargetFilterPills: React.FC<TargetFilterPillsProps> = ({
  targets,
  selectedTarget,
  onSelectTarget,
  categoryName,
}) => {
  if (!targets || targets.length === 0) return null;

  const isAll = selectedTarget === 'ALL' || !selectedTarget;

  return (
    <div className="flex items-center gap-2 pt-1 pb-1 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1">
        <Tag className="w-3.5 h-3.5 text-blue-500" />
        <span>Thiết bị:</span>
      </div>

      {/* Chip Tất cả thiết bị thuộc danh mục này */}
      <button
        type="button"
        onClick={() => onSelectTarget('ALL')}
        className={`px-2.5 py-1 rounded-lg text-[11.5px] font-medium border transition-all cursor-pointer shrink-0 ${
          isAll
            ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold'
            : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        Tất cả thiết bị ({targets.length})
      </button>

      {/* Từng thiết bị con */}
      {targets.map((tgt) => {
        const isSelected = selectedTarget === tgt.id;
        const count = tgt._count?.services;

        return (
          <button
            key={tgt.id}
            type="button"
            onClick={() => onSelectTarget(tgt.id)}
            className={`px-2.5 py-1 rounded-lg text-[11.5px] font-medium border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                : 'bg-white dark:bg-[#0b0f19]/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <span>{tgt.name}</span>
            {typeof count === 'number' && (
              <span
                className={`px-1 py-0.1 rounded text-[10px] font-mono ${
                  isSelected
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TargetFilterPills;


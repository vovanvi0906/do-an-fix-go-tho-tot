import React from 'react';
import { Box, Plus, Power, Edit2, Trash2 } from 'lucide-react';
import type { ServiceTargetItem } from '../../../types/service';

interface TargetColumnProps {
  targets: ServiceTargetItem[];
  selectedTarget: ServiceTargetItem | null;
  onSelect: (tgt: ServiceTargetItem) => void;
  onAdd: () => void;
  onEdit: (tgt: ServiceTargetItem) => void;
  onToggle: (tgt: ServiceTargetItem) => void;
  onDelete: (tgt: ServiceTargetItem) => void;
  categoryName?: string;
}

export const TargetColumn: React.FC<TargetColumnProps> = ({
  targets,
  selectedTarget,
  onSelect,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
  categoryName,
}) => {
  return (
    <div className="flex-1 flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 overflow-hidden shadow-2xs min-h-[460px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            Đối tượng ({targets.length}) {categoryName ? `- ${categoryName}` : ''}
          </h3>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="w-6 h-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-xs"
          title="Thêm Đối Tượng Mới"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[420px] scrollbar-thin">
        {targets.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Chưa có đối tượng nào trong danh mục này
          </div>
        ) : (
          targets.map((tgt) => {
            const isSelected = selectedTarget?.id === tgt.id;
            return (
              <div
                key={tgt.id}
                onClick={() => onSelect(tgt)}
                className={`group px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-600/10 dark:bg-indigo-500/15 border-indigo-500/50 shadow-sm'
                    : 'bg-white dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <span className={`text-xs font-bold truncate block ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                    {tgt.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5 text-[10.5px]">
                    <span className="font-mono text-slate-400 dark:text-slate-500">#{tgt.slug}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{tgt._count?.services || 0} dịch vụ</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    tgt.isActive ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {tgt.isActive ? 'Hoạt động' : 'Tắt'}
                  </span>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onToggle(tgt); }}
                      className="p-1 rounded text-slate-400 hover:text-amber-500 cursor-pointer"
                      title="Bật/Tắt"
                    >
                      <Power className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onEdit(tgt); }}
                      className="p-1 rounded text-slate-400 hover:text-indigo-500 cursor-pointer"
                      title="Sửa"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDelete(tgt); }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TargetColumn;


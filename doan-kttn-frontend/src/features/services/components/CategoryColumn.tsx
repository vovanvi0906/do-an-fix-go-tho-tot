import React from 'react';
import { Layers, Plus, Power, Edit2, Trash2 } from 'lucide-react';
import type { CategoryItem } from '../../../types/category';

interface CategoryColumnProps {
  categories: CategoryItem[];
  selectedCategory: CategoryItem | null;
  onSelect: (cat: CategoryItem) => void;
  onAdd: () => void;
  onEdit: (cat: CategoryItem) => void;
  onToggle: (cat: CategoryItem) => void;
  onDelete: (cat: CategoryItem) => void;
}

export const CategoryColumn: React.FC<CategoryColumnProps> = ({
  categories,
  selectedCategory,
  onSelect,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
}) => {
  return (
    <div className="flex-1 flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 overflow-hidden shadow-2xs min-h-[460px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            Danh mục ({categories.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="w-6 h-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-xs"
          title="Thêm Danh Mục Mới"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[420px] scrollbar-thin">
        {categories.map((cat) => {
          const isSelected = selectedCategory?.id === cat.id;
          return (
            <div
              key={cat.id}
              onClick={() => onSelect(cat)}
              className={`group px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-blue-600/10 dark:bg-blue-500/15 border-blue-500/50 shadow-sm'
                  : 'bg-white dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10.5px]">
                  <span className="font-mono text-slate-400 dark:text-slate-500">#{cat.slug}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{cat._count?.targets || 0} đối tượng</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  cat.isActive ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {cat.isActive ? 'Hoạt động' : 'Tắt'}
                </span>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-1">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggle(cat); }}
                    className="p-1 rounded text-slate-400 hover:text-amber-500 cursor-pointer"
                    title="Bật/Tắt"
                  >
                    <Power className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEdit(cat); }}
                    className="p-1 rounded text-slate-400 hover:text-blue-500 cursor-pointer"
                    title="Sửa"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(cat); }}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryColumn;

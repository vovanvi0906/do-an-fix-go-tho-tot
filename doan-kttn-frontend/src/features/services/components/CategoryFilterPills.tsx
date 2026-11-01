import React from 'react';
import { Layers, Zap, Droplet, Wind, Refrigerator, Trees, Sparkles, Hammer } from 'lucide-react';
import type { Category } from '../../../types/service';

interface CategoryFilterPillsProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  totalServicesCount?: number;
}

/**
 * Lấy icon trực quan theo tên hoặc slug của Danh mục
 */
function getCategoryIcon(name = '', slug = '') {
  const text = `${name} ${slug}`.toLowerCase();
  if (text.includes('điện') && !text.includes('lạnh')) return Zap;
  if (text.includes('nước')) return Droplet;
  if (text.includes('lạnh')) return Wind;
  if (text.includes('thiết bị') || text.includes('gia dụng')) return Refrigerator;
  if (text.includes('vườn') || text.includes('cây')) return Trees;
  if (text.includes('giúp việc') || text.includes('vệ sinh')) return Sparkles;
  return Hammer;
}

/**
 * Thanh bộ lọc Danh mục ngành nghề dạng Pills / Chip bấm nhanh
 */
export const CategoryFilterPills: React.FC<CategoryFilterPillsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  totalServicesCount,
}) => {
  const isAllSelected = selectedCategory === 'ALL' || !selectedCategory;

  return (
    <div className="w-full overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
      <div className="flex items-center gap-1.5 min-w-max">
        {/* Chip Tất cả ngành nghề */}
        <button
          type="button"
          onClick={() => onSelectCategory('ALL')}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isAllSelected
              ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
              : 'bg-white dark:bg-[#0b0f19]/70 border-slate-200/90 dark:border-slate-800/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <Layers className={`w-3.5 h-3.5 ${isAllSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
          <span>Tất cả ngành nghề</span>
          {typeof totalServicesCount === 'number' && (
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                isAllSelected
                  ? 'bg-blue-700/80 text-blue-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {totalServicesCount}
            </span>
          )}
        </button>

        {/* Các chip từng danh mục */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const IconComp = getCategoryIcon(cat.name, cat.slug);
          const servicesCount = cat._count?.services;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                  : 'bg-white dark:bg-[#0b0f19]/70 border-slate-200/90 dark:border-slate-800/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <IconComp
                className={`w-3.5 h-3.5 ${
                  isSelected
                    ? 'text-white'
                    : 'text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                }`}
              />
              <span>{cat.name}</span>
              {typeof servicesCount === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                    isSelected
                      ? 'bg-blue-700/80 text-blue-100'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {servicesCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilterPills;


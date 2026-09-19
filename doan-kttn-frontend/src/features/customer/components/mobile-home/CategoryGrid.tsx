/**
 * @file CategoryGrid.tsx
 * @description Lưới 4 cột x 2 hàng (8 danh mục chuẩn) FixGo Pro.
 * Squircle icons bo mềm gradient hiện đại, nhãn văn bản sắc nét, phản hồi chạm mượt mà.
 */

import React from 'react';
import {
  Zap,
  Droplets,
  Wind,
  Tv,
  Trees,
  Sparkles,
  FileSpreadsheet,
  LayoutGrid,
  LucideIcon,
} from 'lucide-react';
import type { ServiceCategoryDTO } from '../../types/home.types';

interface CategoryGridProps {
  categories: ServiceCategoryDTO[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}

// Map icon string sang Lucide Icons
const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Droplets,
  Wind,
  Tv,
  Trees,
  Sparkles,
  FileSpreadsheet,
  LayoutGrid,
};

// Gradient màu từng danh mục tạo điểm nhấn thị giác phong phú
const CATEGORY_GRADIENTS: Record<string, string> = {
  'cat-01': 'from-amber-400 to-orange-500 shadow-orange-500/20', // Sửa điện
  'cat-02': 'from-cyan-400 to-blue-500 shadow-cyan-500/20',     // Sửa nước
  'cat-03': 'from-sky-400 to-indigo-600 shadow-sky-500/20',     // Điện lạnh
  'cat-04': 'from-indigo-500 to-purple-600 shadow-indigo-500/20', // Thiết bị
  'cat-05': 'from-emerald-400 to-teal-600 shadow-emerald-500/20', // Làm vườn
  'cat-06': 'from-pink-400 to-rose-500 shadow-rose-500/20',      // Giúp việc
  'cat-07': 'from-teal-400 to-emerald-600 shadow-teal-500/20',  // Bảng giá
  'cat-08': 'from-slate-600 to-slate-800 shadow-slate-600/20',  // Dịch vụ khác
};

/**
 * Component `CategoryGrid`
 */
export default function CategoryGrid({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryGridProps) {
  return (
    <section className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Danh mục dịch vụ
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">
          8 dịch vụ tiện ích
        </span>
      </div>

      {/* 4 Columns x 2 Rows Grid */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-3.5">
        {categories.slice(0, 8).map((cat) => {
          const IconComponent = ICON_MAP[cat.iconName] || LayoutGrid;
          const gradientStyle =
            CATEGORY_GRADIENTS[cat.id] ||
            'from-sky-400 to-blue-600 shadow-blue-500/20';
          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`group flex flex-col items-center text-center p-1 rounded-2xl transition-all focus:outline-none active:scale-90 ${
                isSelected ? 'bg-sky-50/80 ring-2 ring-sky-500/30' : ''
              }`}
            >
              {/* Squircle Icon Container */}
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientStyle} text-white flex items-center justify-center shadow-md transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-95`}
              >
                <IconComponent className="w-6 h-6 drop-shadow-sm" />
              </div>

              {/* Category Label */}
              <span className="mt-1.5 text-xs font-semibold text-slate-700 tracking-tight line-clamp-1 group-hover:text-sky-600 transition-colors">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

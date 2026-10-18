import React from 'react';
import { Power, Edit2, Trash2, Tag, Eye } from 'lucide-react';
import { getCategoryFallbackIcon } from '../utils/getCategoryFallbackIcon';
import type { CategoryItem } from '../../../types/category';

interface CategoryTableRowProps {
  category: CategoryItem;
  onToggle: (category: CategoryItem) => void;
  onEdit: (category: CategoryItem) => void;
  onDelete: (category: CategoryItem) => void;
  onViewServices?: (category: CategoryItem) => void;
}

export default function CategoryTableRow({
  category,
  onToggle,
  onEdit,
  onDelete,
  onViewServices,
}: CategoryTableRowProps) {
  const FallbackIcon = getCategoryFallbackIcon(category.name);
  const iconSource = category.iconUrl || category.icon;
  const serviceCount = category._count?.services || 0;

  return (
    <tr
      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group ${
        !category.isActive ? 'opacity-65' : ''
      }`}
    >
      {/* 1. Ngành nghề: Icon + Tên + Slug (Clickable để xem chi tiết dịch vụ) */}
      <td className="py-3 px-4">
        <div
          onClick={() => onViewServices?.(category)}
          className="flex items-center gap-3 cursor-pointer group/name"
          title="Nhấp để xem danh sách dịch vụ trong danh mục"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover/name:scale-105 group-hover/name:border-blue-400 transition-all">
            {iconSource ? (
              <img
                src={iconSource}
                alt={category.name}
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <FallbackIcon className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 dark:text-white text-xs truncate group-hover/name:text-blue-600 dark:group-hover/name:text-blue-400 transition-colors">
              {category.name}
            </div>
            <span className="inline-block mt-0.5 text-[10.5px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 rounded border border-blue-200/50 dark:border-blue-900/40">
              #{category.slug || 'category'}
            </span>
          </div>
        </div>
      </td>

      {/* 2. Mô tả */}
      <td className="py-3 px-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-sm">
          {category.description || 'Chưa có mô tả chi tiết cho ngành nghề này.'}
        </p>
      </td>

      {/* 3. Số dịch vụ trực thuộc */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <button
          type="button"
          onClick={() => onViewServices?.(category)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 transition-colors cursor-pointer"
          title="Xem danh sách dịch vụ thuộc danh mục này"
        >
          <Tag className="w-3 h-3 text-slate-400" />
          <strong className="font-mono text-slate-900 dark:text-white">{serviceCount}</strong>
          <span>gói</span>
        </button>
      </td>

      {/* 4. Trạng thái hoạt động */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            category.isActive
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              category.isActive ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
          <span>{category.isActive ? 'Hoạt động' : 'Tạm ngưng'}</span>
        </span>
      </td>

      {/* 5. Thao tác */}
      <td className="py-3 px-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onViewServices?.(category)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Xem danh sách dịch vụ trong danh mục"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onToggle(category)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              category.isActive
                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={category.isActive ? 'Tạm ngưng danh mục' : 'Kích hoạt danh mục'}
          >
            <Power className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(category)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Chỉnh sửa danh mục"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(category)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Xóa danh mục"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

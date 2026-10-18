import React from 'react';
import { Plus, RefreshCw, AlertCircle, Inbox } from 'lucide-react';
import CategoryTableRow from './CategoryTableRow';
import Skeleton from '../../../components/ui/Skeleton';
import type { CategoryItem } from '../../../types/category';

interface CategoryTableProps {
  categories: CategoryItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onToggle: (category: CategoryItem) => void;
  onEdit: (category: CategoryItem) => void;
  onDelete: (category: CategoryItem) => void;
  onCreate: () => void;
  onViewServices?: (category: CategoryItem) => void;
}

export default function CategoryTable({
  categories,
  loading,
  error,
  onRetry,
  onToggle,
  onEdit,
  onDelete,
  onCreate,
  onViewServices,
}: CategoryTableProps) {
  if (!loading && error) {
    return (
      <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Không thể tải danh sách danh mục ngành nghề
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Thử lại</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/40">
              <th className="py-3 px-4">Ngành Nghề</th>
              <th className="py-3 px-4">Mô Tả</th>
              <th className="py-3 px-4 text-center">Số Dịch Vụ</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading &&
              [1, 2, 3, 4, 5, 6].map((idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="w-28 h-3.5 rounded" />
                        <Skeleton className="w-16 h-2.5 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Skeleton className="w-48 h-3.5 rounded" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Skeleton className="w-14 h-5 rounded-md mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Skeleton className="w-20 h-5 rounded-full mx-auto" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Skeleton className="w-20 h-7 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))}

            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Không tìm thấy danh mục ngành nghề nào
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Thử thay đổi từ khóa tìm kiếm hoặc bấm &quot;Thêm danh mục&quot; để tạo mới.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onCreate}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm danh mục</span>
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              categories.map((category) => (
                <CategoryTableRow
                  key={category.id}
                  category={category}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewServices={onViewServices}
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

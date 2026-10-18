import React from 'react';
import { Search, X } from 'lucide-react';
import type { CategoryStatusFilter } from '../hooks/useCategories';

interface CategoryToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: CategoryStatusFilter;
  setStatusFilter: (filter: CategoryStatusFilter) => void;
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  onSearchSubmit: (e?: React.FormEvent) => void;
  onClearSearch: () => void;
}

export default function CategoryToolbar({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  totalCount,
  activeCount,
  inactiveCount,
  onSearchSubmit,
  onClearSearch,
}: CategoryToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#0b0f19]/70 border border-slate-200/90 dark:border-slate-800/90">
      <form onSubmit={onSearchSubmit} className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên danh mục, slug, mô tả..."
          className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 self-stretch sm:self-auto">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Tất cả ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Đang hoạt động ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('inactive')}
          className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'inactive'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Tạm ngưng ({inactiveCount})
        </button>
      </div>
    </div>
  );
}

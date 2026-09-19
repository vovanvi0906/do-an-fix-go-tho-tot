import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Power,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Filter,
  X,
  Zap,
  Droplet,
  Sparkles,
  Wind,
  Refrigerator,
  Trees,
  Hammer,
  FileText,
  Tag,
} from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import CategoryModal from '../components/CategoryModal';
import DeleteCategoryModal from '../components/DeleteCategoryModal';
import Skeleton from '../../../components/ui/Skeleton';
import type { CategoryItem } from '../../../types/category';

/**
 * Hàm lấy icon biểu trưng dự phòng cho ngành nghề
 */
function getCategoryFallbackIcon(name = '') {
  const text = name.toLowerCase();
  if (text.includes('điện') && !text.includes('lạnh')) return Zap;
  if (text.includes('nước') || text.includes('ống')) return Droplet;
  if (text.includes('lạnh') || text.includes('điều hòa') || text.includes('giặt')) return Wind;
  if (text.includes('tủ lạnh') || text.includes('thiết bị')) return Refrigerator;
  if (text.includes('vườn') || text.includes('cây')) return Trees;
  if (text.includes('nội thất') || text.includes('bàn') || text.includes('kệ')) return Hammer;
  if (text.includes('dọn dẹp') || text.includes('vệ sinh')) return Sparkles;
  return Layers;
}

/**
 * ============================================================================
 * CATEGORY MANAGEMENT PAGE (LINEAR / VERCEL DESIGN SYSTEM)
 * ============================================================================
 * Route: /admin/categories
 * Quản lý các nhóm ngành nghề chính của FixGo Pro.
 * Chuẩn 8pt Grid: padding, margin, khoảng cách tuân thủ (p-4, gap-4, space-y-4, h-12).
 * Typography: Sắc nét, font mono cho số lượng dịch vụ trực thuộc.
 */
export default function CategoryManagementPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = React.useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const {
    categories,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    editingCategory,
    deleteTarget,
    isSaving,
    isDeleting,
    fetchCategories,
    handleSearchSubmit,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleOpenDelete,
    handleCloseDelete,
    handleSaveCategory,
    handleToggleStatus,
    handleDeleteCategory,
  } = useCategories(showToast);

  // Thống kê tổng số lượng
  const totalServices = categories.reduce((sum, c) => sum + (c._count?.services || 0), 0);
  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.length - activeCount;

  return (
    <div className="h-full flex flex-col justify-between select-none space-y-3.5 overflow-y-auto no-scrollbar transition-colors duration-200">
      {/* ======================================================== */}
      {/* TOAST NOTIFICATION (TOP RIGHT) */}
      {/* ======================================================== */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-100'
              : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. HEADER SECTION (TIÊU ĐỀ & ACTIONS TOÀN TRANG) */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Quản Lý Danh Mục Ngành Nghề
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-500/25">
                MASTER CATEGORIES
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thiết lập và phân loại các nhóm ngành nghề chính phục vụ cho khách hàng và đối tác thợ FixGo Pro
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => fetchCategories()}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Làm mới danh sách danh mục"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            <span>Làm mới</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 border border-blue-500/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Danh Mục</span>
          </motion.button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. STATS & KPI MINI CARDS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Tổng số nhóm ngành
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
              {categories.length}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Đang hoạt động
            </span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
              {activeCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Tổng dịch vụ trực thuộc
            </span>
            <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 block">
              {totalServices}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Tag className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TOOLBAR: TÌM KIẾM & BỘ LỌC TRẠNG THÁI */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#0b0f19]/70 border border-slate-200/90 dark:border-slate-800/90">
        {/* Form tìm kiếm */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
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
              onClick={() => {
                setSearchTerm('');
                fetchCategories({ search: '' });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Tab Lọc Trạng Thái */}
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
            Tất cả ({categories.length})
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

      {/* ======================================================== */}
      {/* 4. LOADING STATE: SKELETON (TUYỆT ĐỐI CẤM DÙNG SPINNER) */}
      {/* ======================================================== */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19]/70 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-14 h-5 rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="w-3/4 h-4 rounded-md" />
                <Skeleton className="w-full h-3 rounded-md" />
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <Skeleton className="w-16 h-4 rounded-md" />
                <Skeleton className="w-12 h-4 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. ERROR STATE KÈM NÚT "THỬ LẠI" */}
      {/* ======================================================== */}
      {!loading && error && (
        <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Không thể tải danh sách danh mục ngành nghề
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                {error || 'Lỗi kết nối RESTful API /api/v1/admin/categories. Vui lòng thử lại.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchCategories()}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. EMPTY STATE */}
      {/* ======================================================== */}
      {!loading && !error && categories.length === 0 && (
        <div className="py-16 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3.5 bg-slate-50/40 dark:bg-slate-900/20">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Không tìm thấy danh mục ngành nghề nào
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              {searchTerm || statusFilter !== 'all'
                ? 'Không có kết quả khớp với bộ lọc hiện tại. Hãy thử thay đổi từ khóa hoặc xóa lọc.'
                : 'Chưa có nhóm ngành nghề nào trong hệ thống. Hãy tạo nhóm đầu tiên để bắt đầu quản lý dịch vụ.'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-2xs border border-blue-500/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo danh mục mới</span>
          </motion.button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. CARD GRID DANH MỤC (LINEAR / VERCEL STYLE) */}
      {/* ======================================================== */}
      {!loading && !error && categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4 no-scrollbar">
          <AnimatePresence>
            {categories.map((category) => {
              const FallbackIcon = getCategoryFallbackIcon(category.name);
              const iconSource = category.iconUrl || category.icon;
              const serviceCount = category._count?.services || 0;

              return (
                <motion.div
                  key={category.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -3 }}
                  className={`relative p-4 rounded-2xl border bg-white dark:bg-[#0b0f19]/70 transition-all duration-200 flex flex-col justify-between space-y-3.5 ${
                    category.isActive
                      ? 'border-slate-200/90 dark:border-slate-800/90 hover:border-blue-500/50 hover:shadow-xs'
                      : 'border-slate-200/60 dark:border-slate-800/60 opacity-60'
                  }`}
                >
                  {/* Top Row: Icon & Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center shrink-0">
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
                        <FallbackIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Trạng thái hoạt động Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
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
                    </div>
                  </div>

                  {/* Info: Name, Slug, Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                        {category.name}
                      </h3>
                    </div>
                    <span className="inline-block text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-900/40">
                      #{category.slug || 'category'}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {category.description || 'Chưa có mô tả chi tiết cho nhóm ngành nghề này.'}
                    </p>
                  </div>

                  {/* Sub-services count (Mono font theo quy chuẩn Vercel) */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Số dịch vụ:{' '}
                        <strong className="font-mono text-slate-900 dark:text-white">
                          {serviceCount}
                        </strong>
                      </span>
                    </div>

                    {/* Action buttons: Edit, Toggle, Delete */}
                    <div className="flex items-center gap-1">
                      {/* Toggle status */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(category)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          category.isActive
                            ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={category.isActive ? 'Tạm ngưng danh mục' : 'Kích hoạt danh mục'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(category)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Chỉnh sửa danh mục"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(category)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. MODALS (CREATE/EDIT & DELETE) */}
      {/* ======================================================== */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCategory}
        initialData={editingCategory}
        isSubmitting={isSaving}
      />

      <DeleteCategoryModal
        isOpen={Boolean(deleteTarget)}
        onClose={handleCloseDelete}
        onConfirm={handleDeleteCategory}
        categoryName={deleteTarget?.name}
        serviceCount={deleteTarget?._count?.services || 0}
        isSubmitting={isDeleting}
      />
    </div>
  );
}

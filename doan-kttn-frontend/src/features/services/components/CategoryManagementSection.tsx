import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Droplet,
  Sparkles,
  Wind,
  Refrigerator,
  Trees,
  Hammer,
  Inbox,
  Search,
  Check,
  X,
  Power,
} from 'lucide-react';
import Skeleton from '../../../components/ui/Skeleton';
import type {
  CategoryItem,
  CategoryManagementSectionProps,
} from '../../../types/category';

/**
 * Hàm lấy icon fallback biểu trưng cho nhóm ngành nghề FixGo Pro
 * @param {string} name - Tên danh mục ngành nghề
 * @returns {React.ComponentType}
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
 * CATEGORY MANAGEMENT SECTION (LINEAR / VERCEL DESIGN SYSTEM)
 * ============================================================================
 * Vị trí bố trí: Nằm ở phân cấp ĐẦU TIÊN (Above), ngay phía trên Quản lý Gói Dịch Vụ.
 * Chuẩn 8pt Grid: Toàn bộ padding, margin, khoảng cách tuân thủ (p-4, gap-4, space-y-4, h-12).
 * Typography: Sắc nét, sử dụng font-mono cho số lượng dịch vụ trực thuộc.
 * States:
 *   - Loading: Sử dụng <Skeleton/> Linear/Vercel (tuyệt đối không dùng spinner).
 *   - Empty: Khối rỗng trực quan kèm nút bấm khởi tạo nhanh.
 *   - Error: Khối thông báo lỗi trang nhã kèm nút "Thử lại".
 *   - Hover/Animation: Sử dụng Framer Motion phản hồi tức thì.
 */
export default function CategoryManagementSection({
  categories = [],
  selectedCategoryId = 'ALL',
  onSelectCategory,
  onOpenCreate,
  onOpenEdit,
  onOpenDelete,
  onToggleStatus,
  isLoading = false,
  error = null,
  onRetry,
}: CategoryManagementSectionProps) {
  const [filterKeyword, setFilterKeyword] = useState('');

  // 1. Tính tổng số gói dịch vụ trên toàn hệ thống
  const totalServicesCount = useMemo(() => {
    return categories.reduce((sum, item) => sum + (item._count?.services || 0), 0);
  }, [categories]);

  // 2. Lọc danh sách danh mục theo từ khóa tìm kiếm nhanh
  const filteredCategories = useMemo(() => {
    if (!filterKeyword.trim()) return categories;
    const term = filterKeyword.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.slug && c.slug.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term))
    );
  }, [categories, filterKeyword]);

  return (
    <section
      aria-label="Quản lý Danh mục Ngành nghề"
      className="bg-white dark:bg-[#0b0f19]/70 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 shadow-2xs space-y-4 select-none transition-colors duration-200"
    >
      {/* ======================================================== */}
      {/* 1. HEADER SECTION (TIÊU ĐỀ, BADGES & NÚT HÀNH ĐỘNG CHÍNH) */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Danh Mục Ngành Nghề
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                {categories.length} nhóm
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                {totalServicesCount} dịch vụ
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chọn một danh mục bên dưới để lọc nhanh các gói dịch vụ trực thuộc (Master-Detail)
            </p>
          </div>
        </div>

        {/* Action Controls & Quick Search */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {/* Ô tìm kiếm nhanh danh mục */}
          {categories.length > 3 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="Tìm danh mục..."
                className="w-32 sm:w-40 pl-8 pr-6 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {filterKeyword && (
                <button
                  type="button"
                  onClick={() => setFilterKeyword('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Nút Thêm Danh Mục Mới */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onOpenCreate}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-2xs border border-transparent transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            title="Tạo mới một nhóm ngành nghề chính"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Danh Mục</span>
          </motion.button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. LOADING STATE: SKELETON CARDS (LINEAR / VERCEL STYLE)  */}
      {/* TUYỆT ĐỐI CẤM DÙNG SPINNER THEO YÊU CẦU QUY CHUẨN          */}
      {/* ======================================================== */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <Skeleton className="w-12 h-5 rounded-md" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="w-4/5 h-4 rounded-md" />
                <Skeleton className="w-3/5 h-3 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ERROR STATE: THÔNG BÁO LỖI KÈM NÚT "THỬ LẠI"          */}
      {/* ======================================================== */}
      {!isLoading && error && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-800 dark:text-rose-200">
                Không thể tải danh sách danh mục ngành nghề
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                {error || 'Lỗi kết nối RESTful API /api/v1/admin/categories. Vui lòng kiểm tra lại dịch vụ.'}
              </p>
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. EMPTY STATE: CHƯA CÓ DANH MỤC NÀO TRONG HỆ THỐNG      */}
      {/* ======================================================== */}
      {!isLoading && !error && categories.length === 0 && (
        <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/30 dark:bg-slate-900/20">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Chưa có danh mục ngành nghề nào
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
              Tạo danh mục phân loại đầu tiên (như Điện - Nước, Vệ sinh & Dọn dẹp) để bắt đầu phân cấp và quản lý các gói dịch vụ.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onOpenCreate}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-2xs border border-blue-500/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo danh mục đầu tiên</span>
          </motion.button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. CATEGORY CARDS GRID (MASTER SELECTION & ACTIONS)       */}
      {/* ======================================================== */}
      {!isLoading && !error && categories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {/* Card: Tất cả ngành nghề */}
          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectCategory('ALL')}
            className={`group relative p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between space-y-3 ${
              selectedCategoryId === 'ALL'
                ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-500/80 shadow-xs ring-1 ring-blue-500/30'
                : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                  selectedCategoryId === 'ALL'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                {totalServicesCount}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Tất cả ngành nghề
                </span>
                {selectedCategoryId === 'ALL' && (
                  <Check className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Toàn bộ hệ thống
              </p>
            </div>
          </motion.div>

          {/* Cards: Từng Danh Mục Cụ Thể */}
          <AnimatePresence>
            {filteredCategories.map((category) => {
              const isSelected = selectedCategoryId === category.id;
              const FallbackIcon = getCategoryFallbackIcon(category.name);
              const serviceCount = category._count?.services || 0;
              const iconSource = category.iconUrl || category.icon;

              return (
                <motion.div
                  key={category.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectCategory(category.id)}
                  className={`group relative p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500/80 shadow-xs ring-1 ring-blue-500/30'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  } ${!category.isActive ? 'opacity-65' : ''}`}
                >
                  {/* Top Row: Icon & Status / Service Count */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {iconSource ? (
                        <img
                          src={iconSource}
                          alt={category.name}
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            // Fallback to SVG icon on image load error
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <FallbackIcon className="w-4 h-4" />
                      )}
                    </div>

                    {/* Service Count (Mono Font theo chuẩn Vercel) */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300"
                        title={`${serviceCount} dịch vụ trực thuộc`}
                      >
                        {serviceCount}
                      </span>
                      {/* Trạng thái hoạt động badge */}
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          category.isActive ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                        title={category.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
                      />
                    </div>
                  </div>

                  {/* Middle Row: Tên danh mục & Slug */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {category.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10.5px] font-mono text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      #{category.slug || 'category'}
                    </p>
                  </div>

                  {/* Bottom Row: Action Quick Buttons (Hiển thị khi hover hoặc khi selected) */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity"
                  >
                    {/* Toggle Status */}
                    <button
                      type="button"
                      onClick={() => onToggleStatus(category)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer text-[11px] flex items-center gap-1 ${
                        category.isActive
                          ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={category.isActive ? 'Tạm ngưng danh mục' : 'Kích hoạt danh mục'}
                    >
                      <Power className="w-3 h-3" />
                      <span className="text-[10px] font-medium">
                        {category.isActive ? 'Bật' : 'Tắt'}
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => onOpenEdit(category)}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Chỉnh sửa danh mục"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => onOpenDelete(category)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}

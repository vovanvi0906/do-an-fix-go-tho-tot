import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit2,
  Trash2,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Filter,
  X,
  Power,
  Clock,
  Tag,
  Zap,
  Droplet,
  Sparkles,
  Wind,
  Refrigerator,
  Trees,
  Hammer,
} from 'lucide-react';
import { useServices } from '../hooks/useServices';
import ServiceModal from '../components/ServiceModal';
import ServiceDetailModal from '../components/ServiceDetailModal';
import DeleteServiceModal from '../components/DeleteServiceModal';
import Skeleton from '../../../components/ui/Skeleton';
import type { ServiceItem } from '../../../types/service';

/**
 * Định dạng tiền tệ VNĐ chuẩn xác
 */
function formatVND(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '0 đ';
  return `${new Intl.NumberFormat('vi-VN').format(Number(amount))} đ`;
}

/**
 * Hàm lấy icon đặc trưng phù hợp với từng gói dịch vụ hoặc danh mục
 */
function getServiceIcon(serviceName = '', categoryName = '') {
  const text = `${serviceName} ${categoryName}`.toLowerCase();
  if (text.includes('điện') && !text.includes('lạnh')) return Zap;
  if (text.includes('nước') || text.includes('ống') || text.includes('bồn')) return Droplet;
  if (text.includes('lạnh') || text.includes('điều hòa') || text.includes('giặt')) return Wind;
  if (text.includes('tủ lạnh') || text.includes('lò vi sóng') || text.includes('thiết bị'))
    return Refrigerator;
  if (text.includes('vườn') || text.includes('cây') || text.includes('cỏ')) return Trees;
  if (text.includes('nội thất') || text.includes('bàn') || text.includes('kệ')) return Hammer;
  if (text.includes('dọn dẹp') || text.includes('vệ sinh')) return Sparkles;
  return Wrench;
}

/**
 * ============================================================================
 * SERVICE MANAGEMENT PAGE (LINEAR / VERCEL DESIGN SYSTEM)
 * ============================================================================
 * Route: /admin/services
 * Quản trị các gói dịch vụ chi tiết (Item Detail) của hệ sinh thái FixGo Pro.
 * Chuẩn 8pt Grid: padding, margin, khoảng cách tuân thủ (p-4, gap-4, space-y-4, h-12).
 * Typography: Sắc nét, giá tiền định dạng dạng mono font (90.000 đ).
 */
export default function ServiceManagementPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = React.useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const {
    services,
    categories,
    loading,
    refreshing,
    error,
    pagination,
    setPagination,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    activeStatusTab,
    setActiveStatusTab,
    isFormModalOpen,
    editingService,
    deleteTarget,
    detailTarget,
    isSaving,
    isDeleting,
    fetchServices,
    fetchCategories,
    handleRefresh,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseFormModal,
    handleOpenDetail,
    handleCloseDetail,
    handleOpenDelete,
    handleCloseDelete,
    handleSaveService,
    handleToggleStatus,
    handleDeleteService,
  } = useServices(showToast);

  // Tìm danh mục đang chọn để hiển thị badge
  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="h-full flex flex-col justify-between select-none space-y-3.5 overflow-hidden transition-colors duration-200">
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
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Quản Lý Gói Dịch Vụ
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-500/25">
                SERVICES DETAIL CRUD
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quản trị bảng giá niêm yết định mức, đơn vị tính và thời lượng thi công các gói dịch vụ FixGo Pro
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Làm mới toàn bộ danh sách gói dịch vụ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin text-blue-500' : ''}`} />
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
            <span>Thêm Dịch Vụ Mới</span>
          </motion.button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOOLBAR: TÌM KIẾM, DROPDOWN DANH MỤC & TABS TRẠNG THÁI */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Danh Sách Gói Dịch Vụ
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {pagination.total || services.length} gói
            </span>

            {/* Badge đang lọc danh mục */}
            {selectedCategory !== 'ALL' && activeCategoryObj && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <span>Ngành: {activeCategoryObj.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className="hover:text-blue-900 dark:hover:text-white cursor-pointer"
                  title="Bỏ lọc danh mục này"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Tabs Trạng thái hoạt động */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveStatusTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeStatusTab === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeStatusTab === 'ACTIVE'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Đang hoạt động
            </button>
            <button
              type="button"
              onClick={() => setActiveStatusTab('INACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeStatusTab === 'INACTIVE'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tạm ngưng
            </button>
          </div>
        </div>

        {/* Form lọc và tìm kiếm */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm dịch vụ theo tên, mã hoặc mô tả..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-[#0b0f19]/70 border border-slate-200/90 dark:border-slate-800/90 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Lọc Theo Danh Mục Ngành Nghề */}
          <div className="relative w-full sm:w-64 shrink-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Layers className="w-4 h-4" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-[#0b0f19]/70 border border-slate-200/90 dark:border-slate-800/90 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="ALL">Tất cả ngành nghề ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat._count?.services ? `(${cat._count.services} gói)` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. ERROR STATE KÈM NÚT "THỬ LẠI" */}
      {/* ======================================================== */}
      {!loading && error && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                Lỗi tải danh sách gói dịch vụ
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchServices}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer shrink-0"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. DATA TABLE QUẢN LÝ DỊCH VỤ (LINEAR / VERCEL STYLE) */}
      {/* ======================================================== */}
      <div className="border border-slate-200/90 dark:border-slate-800/90 rounded-2xl overflow-hidden bg-white dark:bg-[#0b0f19]/70 flex-1 min-h-0 flex flex-col justify-between">
        <div className="overflow-x-auto overflow-y-auto no-scrollbar flex-1 min-h-0">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Gói Dịch Vụ</th>
                <th className="py-3 px-4">Ngành Nghề</th>
                <th className="py-3 px-4 text-right">Giá Khởi Điểm</th>
                <th className="py-3 px-4 text-center">ĐVT</th>
                <th className="py-3 px-4 text-center">Thời Lượng</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {/* Loading State: Skeletons (Tuyệt đối không dùng spinner) */}
              {loading &&
                [1, 2, 3, 4, 5, 6].map((idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="w-3/4 h-3.5 rounded" />
                          <Skeleton className="w-1/2 h-2.5 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Skeleton className="w-20 h-5 rounded-md" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Skeleton className="w-16 h-4 rounded ml-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Skeleton className="w-10 h-4 rounded mx-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Skeleton className="w-12 h-4 rounded mx-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Skeleton className="w-16 h-5 rounded-full mx-auto" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Skeleton className="w-20 h-7 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))}

              {/* Empty State */}
              {!loading && services.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2.5 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Không tìm thấy gói dịch vụ nào
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {searchTerm || selectedCategory !== 'ALL' || activeStatusTab !== 'ALL'
                          ? 'Thử xóa từ khóa tìm kiếm hoặc bỏ chọn bộ lọc danh mục để hiển thị lại dữ liệu.'
                          : 'Hệ thống chưa có gói dịch vụ nào. Hãy bấm "Thêm Dịch Vụ Mới" để bắt đầu.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="mt-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-2xs"
                      >
                        Thêm Dịch Vụ Mới
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!loading &&
                services.map((service) => {
                  const categoryName = service.category?.name || 'Khác';
                  const ServiceIcon = getServiceIcon(service.name, categoryName);

                  return (
                    <tr
                      key={service.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Tên & Icon dịch vụ */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <ServiceIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">
                              {service.name}
                            </div>
                            <div className="text-[10.5px] text-slate-400 dark:text-slate-500 line-clamp-1 max-w-xs">
                              {service.description || 'Chưa có mô tả chi tiết'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Ngành nghề */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <span>{categoryName}</span>
                        </span>
                      </td>

                      {/* Giá khởi điểm (Font Mono chuẩn Vercel) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {formatVND(service.basePrice)}
                        </span>
                      </td>

                      {/* Đơn vị tính */}
                      <td className="py-3 px-4 text-center whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {service.unit || 'lần'}
                      </td>

                      {/* Thời lượng thi công */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{service.estimatedDurationMin || 60}p</span>
                        </div>
                      </td>

                      {/* Trạng thái hoạt động */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(service)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold cursor-pointer transition-all ${
                            service.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                          title="Nhấp để đổi trạng thái kích hoạt"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              service.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{service.isActive ? 'Hoạt động' : 'Tạm ngưng'}</span>
                        </button>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(service)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Chỉnh sửa */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(service)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Chỉnh sửa dịch vụ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Xóa */}
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(service)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Xóa dịch vụ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ======================================================== */}
        {/* PAGINATION FOOTER */}
        {/* ======================================================== */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Hiển thị{' '}
            <strong className="font-mono text-slate-900 dark:text-white">
              {services.length}
            </strong>{' '}
            / <strong className="font-mono">{pagination.total || services.length}</strong> gói dịch vụ
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2.5 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              Trang {pagination.page} / {pagination.totalPages || 1}
            </span>

            <button
              type="button"
              disabled={pagination.page >= (pagination.totalPages || 1)}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-slate-600 dark:text-slate-400"
              title="Trang tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. MODALS (FORM, DETAIL & DELETE) */}
      {/* ======================================================== */}
      <ServiceModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveService}
        categories={categories}
        initialData={editingService}
        isSubmitting={isSaving}
      />

      <ServiceDetailModal
        isOpen={Boolean(detailTarget)}
        onClose={handleCloseDetail}
        service={detailTarget}
      />

      <DeleteServiceModal
        isOpen={Boolean(deleteTarget)}
        onClose={handleCloseDelete}
        onConfirm={handleDeleteService}
        serviceName={deleteTarget?.name}
        isSubmitting={isDeleting}
      />
    </div>
  );
}

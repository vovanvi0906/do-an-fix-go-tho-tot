import React from 'react';
import {
  Plus,
  RefreshCw,
  Search,
  Eye,
  Edit2,
  Trash2,
  Zap,
  Droplet,
  Sparkles,
  Wind,
  Refrigerator,
  Trees,
  Hammer,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Filter,
  X,
} from 'lucide-react';
import { useServiceManagement } from '../hooks/useServiceManagement';
import { useCategoryManagement } from '../hooks/useCategoryManagement';
import CategoryManagementSection from '../components/CategoryManagementSection';
import CategoryModal from '../components/CategoryModal';
import DeleteCategoryModal from '../components/DeleteCategoryModal';
import ServiceModal from '../components/ServiceModal';
import DeleteServiceModal from '../components/DeleteServiceModal';
import ServiceDetailModal from '../components/ServiceDetailModal';
import Skeleton from '../../../components/ui/Skeleton';

/**
 * Hàm lấy icon đặc trưng phù hợp với từng gói dịch vụ hoặc danh mục
 */
function getServiceIcon(serviceName = '', categoryName = '') {
  const text = `${serviceName} ${categoryName}`.toLowerCase();
  if (text.includes('điện') && !text.includes('lạnh')) return Zap;
  if (text.includes('nước') || text.includes('ống') || text.includes('bồn')) return Droplet;
  if (text.includes('lạnh') || text.includes('điều hòa') || text.includes('giặt')) return Wind;
  if (text.includes('tủ lạnh') || text.includes('lò vi sóng') || text.includes('thiết bị')) return Refrigerator;
  if (text.includes('vườn') || text.includes('cây') || text.includes('cỏ')) return Trees;
  if (text.includes('nội thất') || text.includes('bàn') || text.includes('kệ')) return Hammer;
  if (text.includes('dọn dẹp') || text.includes('vệ sinh')) return Sparkles;
  return Layers;
}

/**
 * ServicesManagementPage Component
 * Quản lý Danh mục Ngành nghề & Gói Dịch Vụ (Category & Service Management CRUD)
 * Chuẩn Linear / Vercel Style, 8pt Grid System, phân cấp Master-Detail:
 * - CategorySection nằm ở vị trí TRÊN CÙNG (ABOVE)
 * - Data Table gói dịch vụ nằm ở PHÍA DƯỚI
 * - Tương tác Master-Detail: Chọn category lọc dịch vụ bên dưới tức thì.
 */
export default function ServicesManagementPage() {
  const serviceState = useServiceManagement();
  const categoryState = useCategoryManagement(serviceState.showToast);

  const {
    services,
    categories,
    loading: servicesLoading,
    refreshing: servicesRefreshing,
    pagination,
    setPagination,
    searchTerm,
    setSearchTerm,
    activeStatusTab,
    setActiveStatusTab,
    selectedCategory,
    setSelectedCategory,
    isFormModalOpen: isServiceModalOpen,
    editingService,
    deleteTarget: serviceDeleteTarget,
    detailTarget: serviceDetailTarget,
    isSaving: isServiceSaving,
    isDeleting: isServiceDeleting,
    toast,
    handleRefresh: handleRefreshServices,
    handleOpenCreate: handleOpenCreateService,
    handleOpenEdit: handleOpenEditService,
    handleCloseFormModal: handleCloseServiceModal,
    handleOpenDetail: handleOpenServiceDetail,
    handleCloseDetail: handleCloseServiceDetail,
    handleOpenDelete: handleOpenDeleteService,
    handleCloseDelete: handleCloseDeleteService,
    handleSaveService,
    handleToggleStatus: handleToggleServiceStatus,
    handleDeleteService,
  } = serviceState;

  // 1. Tương tác Master-Detail: Click thẻ danh mục ở trên lọc danh sách bên dưới
  const handleCategoryCardSelect = (catId) => {
    const nextId = categoryState.selectedCategoryId === catId ? 'ALL' : catId;
    categoryState.setSelectedCategoryId(nextId);
    setSelectedCategory(nextId);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // 2. Thay đổi Dropdown lọc ở Toolbar bên dưới -> Đồng bộ lại thẻ Master ở trên
  const handleDropdownCategoryChange = (e) => {
    const nextId = e.target.value;
    setSelectedCategory(nextId);
    categoryState.setSelectedCategoryId(nextId);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // 3. Reset bộ lọc danh mục
  const handleResetCategoryFilter = () => {
    categoryState.setSelectedCategoryId('ALL');
    setSelectedCategory('ALL');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // 4. Làm mới toàn bộ dữ liệu (cả Danh mục & Gói dịch vụ)
  const handleRefreshAll = () => {
    categoryState.fetchCategories();
    handleRefreshServices();
  };

  // 5. Lưu danh mục thành công -> Đồng bộ lại danh mục cho modal dịch vụ
  const handleSaveCategory = async (formData) => {
    await categoryState.handleSaveCategory(formData);
    serviceState.fetchCategories();
  };

  // 6. Xóa danh mục thành công -> Đồng bộ lại danh mục & bảng dịch vụ
  const handleDeleteCategory = async (force) => {
    await categoryState.handleDeleteCategory(force);
    serviceState.fetchCategories();
    handleRefreshServices();
  };

  // Tìm tên danh mục đang được lọc (nếu có)
  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Quản Lý Danh Mục & Gói Dịch Vụ
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-500/25">
              SERVICES & CATEGORIES CRUD
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản trị nhóm ngành nghề (Category Master) và thiết lập các gói dịch vụ trực thuộc (Item Detail) FixGo Pro
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {/* Nút Làm mới toàn bộ */}
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={servicesLoading || servicesRefreshing || categoryState.loading}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Làm mới toàn bộ danh mục và gói dịch vụ"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                servicesRefreshing || categoryState.loading ? 'animate-spin text-blue-500' : ''
              }`}
            />
            <span>Làm mới</span>
          </button>

          {/* Nút Thêm Danh Mục */}
          <button
            type="button"
            onClick={categoryState.handleOpenCreate}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-2xs border border-transparent transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Danh Mục</span>
          </button>

          {/* Nút Thêm Dịch Vụ Mới */}
          <button
            type="button"
            onClick={handleOpenCreateService}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 border border-blue-500/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Dịch Vụ</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CATEGORY MANAGEMENT SECTION (MASTER - PHÍA TRÊN CÙNG) */}
      {/* ======================================================== */}
      <CategoryManagementSection
        categories={categoryState.categories}
        selectedCategoryId={categoryState.selectedCategoryId}
        onSelectCategory={handleCategoryCardSelect}
        onOpenCreate={categoryState.handleOpenCreate}
        onOpenEdit={categoryState.handleOpenEdit}
        onOpenDelete={categoryState.handleOpenDelete}
        onToggleStatus={categoryState.handleToggleStatus}
        isLoading={categoryState.loading}
        error={categoryState.error}
        onRetry={categoryState.fetchCategories}
      />

      {/* ======================================================== */}
      {/* 3. SERVICES SECTION HEADER & TOOLBAR (PHÍA DƯỚI) */}
      {/* ======================================================== */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Danh Sách Gói Dịch Vụ
            </h2>
            <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {pagination.total || services.length} gói
            </span>

            {/* Hiển thị badge đang lọc theo danh mục nào */}
            {selectedCategory !== 'ALL' && activeCategoryObj && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <span>Ngành: {activeCategoryObj.name}</span>
                <button
                  type="button"
                  onClick={handleResetCategoryFilter}
                  className="hover:text-blue-900 dark:hover:text-white cursor-pointer"
                  title="Bỏ lọc danh mục này"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          {/* Left: Status Tabs */}
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-1 self-start">
            <button
              type="button"
              onClick={() => {
                setActiveStatusTab('ALL');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                activeStatusTab === 'ALL'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              Tất Cả Dịch Vụ ({pagination.total || services.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveStatusTab('ACTIVE');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                activeStatusTab === 'ACTIVE'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              Đang Hoạt Động
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveStatusTab('INACTIVE');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                activeStatusTab === 'INACTIVE'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              Tạm Ngưng
            </button>
          </div>

          {/* Right: Search Input & Category Dropdown */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên gói, mô tả dịch vụ..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Category Dropdown (Đồng bộ với CategorySection ở trên) */}
            <div className="shrink-0">
              <select
                value={selectedCategory}
                onChange={handleDropdownCategoryChange}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="ALL">Tất cả ngành nghề</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. DATA TABLE (BẢNG DANH SÁCH DỊCH VỤ CHUẨN LINEAR/VERCEL) */}
      {/* ======================================================== */}
      <div className="min-h-[300px] bg-white dark:bg-[#0b0f19]/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden flex flex-col shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            {/* Table Header */}
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xs text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              <tr>
                <th className="py-3 px-4 font-bold">1. Tên Dịch Vụ & Biểu Tượng</th>
                <th className="py-3 px-4 font-bold">2. Danh Mục (Category)</th>
                <th className="py-3 px-4 font-bold">3. Giá Khởi Điểm</th>
                <th className="py-3 px-4 font-bold text-center">4. Trạng Thái</th>
                <th className="py-3 px-4 font-bold text-right">5. Thao Tác</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {/* Skeleton Loading State */}
              {servicesLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                          <div className="space-y-1.5 flex-1">
                            <Skeleton className="w-36 h-4" />
                            <Skeleton className="w-56 h-3" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Skeleton className="w-24 h-5 rounded-full" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <Skeleton className="w-20 h-4" />
                          <Skeleton className="w-12 h-3" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Skeleton className="w-24 h-5 rounded-md mx-auto" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Skeleton className="w-7 h-7 rounded-lg" />
                          <Skeleton className="w-7 h-7 rounded-lg" />
                          <Skeleton className="w-7 h-7 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              ) : services.length === 0 ? (
                /* Empty State */
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Không tìm thấy gói dịch vụ nào
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        {selectedCategory !== 'ALL'
                          ? 'Chưa có gói dịch vụ nào thuộc danh mục đang chọn. Hãy bấm "Thêm Dịch Vụ" hoặc chọn danh mục khác.'
                          : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bấm nút "Thêm Dịch Vụ" ở trên để khởi tạo.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                /* Services Rows */
                services.map((service) => {
                  const Icon = getServiceIcon(service.name, service.category?.name);

                  return (
                    <tr
                      key={service.id}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150"
                    >
                      {/* Cột 1: Tên dịch vụ & Biểu tượng */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs group-hover:scale-105 transition-transform">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {service.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug mt-0.5">
                              {service.description || 'Không có mô tả chi tiết'}
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                              Ước tính: {service.estimatedDurationMin || 60} phút • Đã phục vụ:{' '}
                              <b className="text-slate-700 dark:text-slate-300 font-mono">
                                {service._count?.orders ?? 0} đơn
                              </b>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Danh mục (Pill Badge) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/50">
                          <Layers className="w-3 h-3 text-blue-500" />
                          <span>{service.category?.name || 'Chung'}</span>
                        </span>
                      </td>

                      {/* Cột 3: Giá khởi điểm (Font Mono) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                          {Number(service.basePrice).toLocaleString('vi-VN')} đ
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Đơn vị: /{service.unit || 'lần'}
                        </span>
                      </td>

                      {/* Cột 4: Trạng thái (Badge + Toggle Switch nhanh) */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-2">
                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${
                              service.isActive
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                service.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            <span>{service.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}</span>
                          </span>

                          {/* Quick Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleServiceStatus(service)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              service.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                            title={
                              service.isActive
                                ? 'Nhấp để tạm ngưng dịch vụ này'
                                : 'Nhấp để kích hoạt cung cấp dịch vụ này'
                            }
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                                service.isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Cột 5: Thao tác (Xem, Sửa, Xóa) */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Nút Xem Chi Tiết */}
                          <button
                            type="button"
                            onClick={() => handleOpenServiceDetail(service)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                            title="Xem chi tiết dịch vụ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút Sửa Dịch Vụ */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditService(service)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                            title="Sửa thông tin dịch vụ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút Xóa Dịch Vụ */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteService(service)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Xóa dịch vụ này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ======================================================== */}
        {/* 5. TABLE FOOTER & PAGINATION */}
        {/* ======================================================== */}
        <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span>
              Hiển thị{' '}
              <b className="font-mono text-slate-800 dark:text-slate-200">
                {services.length}
              </b>{' '}
              trên tổng số{' '}
              <b className="font-mono text-slate-800 dark:text-slate-200">
                {pagination.total || services.length}
              </b>{' '}
              dịch vụ
            </span>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold px-1">
              {pagination.page} / {pagination.totalPages || 1}
            </span>

            <button
              type="button"
              disabled={pagination.page >= (pagination.totalPages || 1)}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(prev.totalPages || 1, prev.page + 1),
                }))
              }
              className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 transition-colors cursor-pointer"
              title="Trang kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. MODALS (CATEGORY & SERVICE) */}
      {/* ======================================================== */}
      {/* Modal A: Thêm/Sửa Danh Mục Ngành Nghề */}
      <CategoryModal
        isOpen={categoryState.isModalOpen}
        onClose={categoryState.handleCloseModal}
        onSave={handleSaveCategory}
        initialData={categoryState.editingCategory}
        isSubmitting={categoryState.isSaving}
      />

      {/* Modal B: Xác Nhận Xóa Danh Mục Ngành Nghề */}
      <DeleteCategoryModal
        isOpen={Boolean(categoryState.deleteTarget)}
        onClose={categoryState.handleCloseDelete}
        onConfirm={handleDeleteCategory}
        categoryName={categoryState.deleteTarget?.name}
        serviceCount={categoryState.deleteTarget?._count?.services || 0}
        isSubmitting={categoryState.isDeleting}
      />

      {/* Modal 1: Thêm/Sửa Dịch Vụ */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={handleCloseServiceModal}
        onSave={handleSaveService}
        initialData={editingService}
        categories={categories}
        isSubmitting={isServiceSaving}
      />

      {/* Modal 2: Xác Nhận Xóa Dịch Vụ */}
      <DeleteServiceModal
        isOpen={Boolean(serviceDeleteTarget)}
        onClose={handleCloseDeleteService}
        onConfirm={handleDeleteService}
        serviceName={serviceDeleteTarget?.name}
        orderCount={serviceDeleteTarget?._count?.orders || 0}
        isSubmitting={isServiceDeleting}
      />

      {/* Modal 3: Xem Chi Tiết Dịch Vụ */}
      <ServiceDetailModal
        isOpen={Boolean(serviceDetailTarget)}
        onClose={handleCloseServiceDetail}
        service={serviceDetailTarget}
      />
    </div>
  );
}

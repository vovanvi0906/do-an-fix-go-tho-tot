import { useState, useEffect, useCallback, useRef } from 'react';
import { adminServicesService } from '../services/adminServices.service';
import type {
  ServiceItem,
  ServiceFormData,
  CategoryOption,
  ServiceFilterParams,
  ServicePagination,
} from '../../../types/service';

export type ServiceStatusTab = 'ALL' | 'ACTIVE' | 'INACTIVE';
export type ShowToastFn = (type: 'success' | 'error', message: string) => void;

/**
 * ============================================================================
 * CUSTOM HOOK: useServices (OPTIMIZED - ZERO BLINKING / NO INFINITE LOOP)
 * ============================================================================
 * Đóng gói toàn bộ logic gọi RESTful API, state management và business logic
 * cho trang Quản Lý Dịch Vụ (ServiceManagementPage.tsx - /admin/services).
 *
 * Tối ưu hiệu năng:
 * - Sử dụng useRef cho showToast callback để giữ hàm fetchServices ổn định.
 * - Tự động debounce 300ms cho ô tìm kiếm tên dịch vụ.
 * - Tách biệt page/limit khỏi object pagination trong dependencies để tránh re-render loop.
 * - Loading indicator được kiểm soát mượt mà, không bị chớp giật Skeleton.
 *
 * @param {ShowToastFn} [showToast] - Callback hiển thị thông báo toast
 */
export function useServices(showToast?: ShowToastFn) {
  // 1. Giữ tham chiếu ổn định cho callback showToast qua useRef
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // 2. States dữ liệu và trạng thái UI
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 3. Phân trang (Page & Limit được quản lý độc lập để kiểm soát dependency)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // 4. Bộ lọc & Tìm kiếm (Debounce 300ms)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeStatusTab, setActiveStatusTab] = useState<ServiceStatusTab>('ALL');

  // Debounce tìm kiếm dịch vụ
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1); // Reset về trang 1 khi đổi từ khóa
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 5. Quản lý Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<ServiceItem | null>(null);

  // 6. Trạng thái mutation (isSaving, isDeleting)
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  /**
   * ============================================================================
   * RESTFUL API: GET /api/v1/admin/services/categories
   * ============================================================================
   * Tải danh mục ngành nghề phục vụ cho bộ lọc Dropdown và Form Modal
   */
  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminServicesService.getCategories();
      if (Array.isArray(res)) {
        setCategories(res);
      } else if ((res as any)?.data && Array.isArray((res as any).data)) {
        setCategories((res as any).data);
      }
    } catch (err) {
      console.warn('[useServices] Không thể tải danh mục ngành nghề:', err);
    }
  }, []);

  /**
   * ============================================================================
   * RESTFUL API: GET /api/v1/admin/services
   * ============================================================================
   * Tải danh sách gói dịch vụ có phân trang, lọc theo danh mục, trạng thái và từ khóa.
   */
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: ServiceFilterParams = {
        page: currentPage,
        limit: pageSize,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (selectedCategory && selectedCategory !== 'ALL') {
        params.categoryId = selectedCategory;
      }

      if (activeStatusTab === 'ACTIVE') {
        params.status = 'active';
      } else if (activeStatusTab === 'INACTIVE') {
        params.status = 'inactive';
      }

      const res = (await adminServicesService.getServices(params)) as any;

      if (res && res.data && Array.isArray(res.data)) {
        setServices(res.data);
        const total = res.meta?.total !== undefined ? res.meta.total : res.data.length;
        const pages = res.meta?.totalPages || Math.ceil(total / pageSize) || 1;
        setTotalCount(total);
        setTotalPages(pages);
      } else if (Array.isArray(res)) {
        setServices(res);
        setTotalCount(res.length);
        setTotalPages(Math.ceil(res.length / pageSize) || 1);
      } else {
        setServices([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      console.error('[useServices] Lỗi khi tải danh sách dịch vụ:', err);
      const errorMsg =
        err.response?.data?.message || err.message || 'Lỗi khi kết nối danh sách dịch vụ.';
      setError(errorMsg);
      showToastRef.current?.('error', 'Lỗi khi tải danh sách gói dịch vụ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, pageSize, debouncedSearch, selectedCategory, activeStatusTab]);

  // 7. Khởi chạy fetchCategories 1 lần duy nhất khi mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 8. Tự động fetchServices khi filter hoặc page thay đổi
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  /**
   * Làm mới dữ liệu toàn trang
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
    fetchServices();
  }, [fetchCategories, fetchServices]);

  /**
   * Thay đổi trang (Pagination)
   */
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
      }
    },
    [totalPages]
  );

  /**
   * Thay đổi lọc danh mục
   */
  const handleCategoryChange = useCallback((catId: string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
  }, []);

  /**
   * Thay đổi tab trạng thái
   */
  const handleStatusTabChange = useCallback((tab: ServiceStatusTab) => {
    setActiveStatusTab(tab);
    setCurrentPage(1);
  }, []);

  /**
   * Modal Form Controls
   */
  const handleOpenCreate = useCallback(() => {
    setEditingService(null);
    setIsFormModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((service: ServiceItem) => {
    setEditingService(service);
    setIsFormModalOpen(true);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingService(null);
  }, []);

  /**
   * Modal Chi Tiết Controls
   */
  const handleOpenDetail = useCallback((service: ServiceItem) => {
    setDetailTarget(service);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailTarget(null);
  }, []);

  /**
   * Modal Xóa Controls
   */
  const handleOpenDelete = useCallback((service: ServiceItem) => {
    setDeleteTarget(service);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /**
   * ============================================================================
   * RESTFUL API: POST /api/v1/admin/services OR PUT /api/v1/admin/services/:id
   * ============================================================================
   * Lưu thông tin gói dịch vụ (Tạo mới hoặc Cập nhật)
   */
  const handleSaveService = useCallback(
    async (formData: ServiceFormData) => {
      try {
        setIsSaving(true);
        if (editingService) {
          // RESTful API: PUT /api/v1/admin/services/:id
          await adminServicesService.updateService(editingService.id, formData);
          showToastRef.current?.('success', `Cập nhật gói dịch vụ "${formData.name}" thành công.`);
        } else {
          // RESTful API: POST /api/v1/admin/services
          await adminServicesService.createService(formData);
          showToastRef.current?.('success', `Tạo mới gói dịch vụ "${formData.name}" thành công.`);
        }
        setIsFormModalOpen(false);
        setEditingService(null);
        await fetchServices();
      } catch (err: any) {
        console.error('[useServices] Lỗi khi lưu dịch vụ:', err);
        const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu gói dịch vụ.';
        showToastRef.current?.('error', msg);
      } finally {
        setIsSaving(false);
      }
    },
    [editingService, fetchServices]
  );

  /**
   * ============================================================================
   * RESTFUL API: PATCH /api/v1/admin/services/:id/toggle
   * ============================================================================
   * Bật / Tắt trạng thái kích hoạt của gói dịch vụ (Optimistic UI Update)
   */
  const handleToggleStatus = useCallback(
    async (service: ServiceItem) => {
      try {
        // Cập nhật giao diện ngay lập tức
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, isActive: !s.isActive } : s))
        );

        const res = (await adminServicesService.toggleServiceStatus(service.id)) as any;
        showToastRef.current?.(
          'success',
          res?.message ||
            `Đã ${!service.isActive ? 'kích hoạt' : 'tạm ngưng'} gói dịch vụ "${service.name}".`
        );
      } catch (err: any) {
        console.error('[useServices] Lỗi khi bật/tắt dịch vụ:', err);
        showToastRef.current?.('error', 'Lỗi khi thay đổi trạng thái gói dịch vụ.');
        await fetchServices();
      }
    },
    [fetchServices]
  );

  /**
   * ============================================================================
   * RESTFUL API: DELETE /api/v1/admin/services/:id
   * ============================================================================
   * Xóa gói dịch vụ khỏi hệ thống
   */
  const handleDeleteService = useCallback(
    async (force: boolean = false) => {
      if (!deleteTarget) return;
      try {
        setIsDeleting(true);
        const res = (await adminServicesService.deleteService(deleteTarget.id, force)) as any;
        showToastRef.current?.('success', res?.message || `Đã xóa gói dịch vụ "${deleteTarget.name}".`);
        setDeleteTarget(null);
        await fetchServices();
      } catch (err: any) {
        console.error('[useServices] Lỗi khi xóa dịch vụ:', err);
        const msg = err.response?.data?.message || err.message || 'Lỗi khi xóa gói dịch vụ.';
        showToastRef.current?.('error', msg);
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteTarget, fetchServices]
  );

  // Đối tượng pagination đồng bộ cho view
  const pagination: ServicePagination = {
    page: currentPage,
    limit: pageSize,
    total: totalCount,
    totalPages: totalPages,
  };

  const setPagination = useCallback(
    (updater: any) => {
      if (typeof updater === 'function') {
        const next = updater({
          page: currentPage,
          limit: pageSize,
          total: totalCount,
          totalPages: totalPages,
        });
        if (next && next.page !== undefined && next.page !== currentPage) {
          setCurrentPage(next.page);
        }
      } else if (updater && updater.page !== undefined) {
        setCurrentPage(updater.page);
      }
    },
    [currentPage, pageSize, totalCount, totalPages]
  );

  return {
    services,
    categories,
    loading,
    refreshing,
    error,
    pagination,
    setPagination,
    handlePageChange,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory: handleCategoryChange,
    handleCategoryChange,
    activeStatusTab,
    setActiveStatusTab: handleStatusTabChange,
    handleStatusTabChange,
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
  };
}

export default useServices;

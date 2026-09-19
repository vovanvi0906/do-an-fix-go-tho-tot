import { useState, useEffect, useCallback } from 'react';
import { adminServicesService } from '../services/adminServices.service';

/**
 * ============================================================================
 * CUSTOM HOOK: useServiceManagement
 * ============================================================================
 * Tách biệt hoàn toàn phần logic xử lý API, trạng thái lọc, tìm kiếm, phân trang,
 * lưu, xóa và thông báo Toast ra khỏi giao diện hiển thị (UI).
 */
export function useServiceManagement() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Bộ lọc & Phân trang
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // State quản lý Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // 1. Tải danh mục dịch vụ
  const fetchCategories = useCallback(async () => {
    try {
      const res = await adminServicesService.getCategories();
      if (Array.isArray(res)) {
        setCategories(res);
      } else if (res?.data && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('[useServiceManagement] Lỗi khi tải danh mục:', err);
    }
  }, []);

  // 2. Tải danh sách gói dịch vụ
  const fetchServices = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await adminServicesService.getServices({
        status: activeStatusTab === 'ALL' ? undefined : activeStatusTab,
        categoryId: selectedCategory === 'ALL' ? undefined : selectedCategory,
        search: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (res?.data) {
        setServices(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else if (Array.isArray(res)) {
        setServices(res);
        setPagination((prev) => ({
          ...prev,
          total: res.length,
          totalPages: Math.ceil(res.length / prev.limit) || 1,
        }));
      }
    } catch (err) {
      console.error('[useServiceManagement] Lỗi khi tải danh sách dịch vụ:', err);
      showToast('error', 'Không thể tải danh sách dịch vụ từ máy chủ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStatusTab, selectedCategory, searchTerm, pagination.page, pagination.limit, showToast]);

  // Tự động load Categories khi khởi tạo
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Debounced Search & Filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchServices]);

  // Hành động Làm mới
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchServices(true);
    fetchCategories();
  }, [fetchServices, fetchCategories]);

  // Mở Modal Tạo mới
  const handleOpenCreate = useCallback(() => {
    setEditingService(null);
    setIsFormModalOpen(true);
  }, []);

  // Mở Modal Sửa
  const handleOpenEdit = useCallback((service) => {
    setEditingService(service);
    setIsFormModalOpen(true);
  }, []);

  // Đóng Modal Form
  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingService(null);
  }, []);

  // Mở/Đóng Modal Xem chi tiết
  const handleOpenDetail = useCallback((service) => {
    setDetailTarget(service);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailTarget(null);
  }, []);

  // Mở/Đóng Modal Xóa
  const handleOpenDelete = useCallback((service) => {
    setDeleteTarget(service);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  // 3. Xử lý Lưu (Tạo mới hoặc Cập nhật)
  const handleSaveService = useCallback(async (formData) => {
    try {
      setIsSaving(true);
      if (editingService) {
        await adminServicesService.updateService(editingService.id, formData);
        showToast('success', `Đã cập nhật dịch vụ "${formData.name}" thành công.`);
      } else {
        await adminServicesService.createService(formData);
        showToast('success', `Đã tạo mới dịch vụ "${formData.name}" thành công.`);
      }
      setIsFormModalOpen(false);
      setEditingService(null);
      fetchServices(true);
    } catch (err) {
      console.error('[useServiceManagement] Lỗi khi lưu dịch vụ:', err);
      showToast('error', err.response?.data?.message || err.message || 'Lỗi khi lưu dịch vụ.');
    } finally {
      setIsSaving(false);
    }
  }, [editingService, fetchServices, showToast]);

  // 4. Xử lý Bật/Tắt trạng thái hoạt động (Toggle Switch nhanh)
  const handleToggleStatus = useCallback(async (service) => {
    try {
      // Optimistic update
      setServices((prev) =>
        prev.map((item) =>
          item.id === service.id ? { ...item, isActive: !item.isActive } : item
        )
      );

      const res = await adminServicesService.toggleServiceStatus(service.id);
      showToast(
        'success',
        res?.message ||
          `Đã chuyển dịch vụ "${service.name}" sang ${!service.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}.`
      );
    } catch (err) {
      console.error('[useServiceManagement] Lỗi khi đổi trạng thái:', err);
      showToast('error', 'Lỗi khi thay đổi trạng thái dịch vụ.');
      // Revert optimistic update
      fetchServices(true);
    }
  }, [fetchServices, showToast]);

  // 5. Xử lý Xóa dịch vụ (hỗ trợ Force delete)
  const handleDeleteService = useCallback(async (force = false) => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await adminServicesService.deleteService(deleteTarget.id, force);
      showToast('success', res?.message || `Đã xóa dịch vụ "${deleteTarget.name}".`);
      setDeleteTarget(null);
      fetchServices(true);
    } catch (err) {
      console.error('[useServiceManagement] Lỗi khi xóa dịch vụ:', err);
      showToast('error', err.response?.data?.message || err.message || 'Lỗi khi xóa dịch vụ.');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, fetchServices, showToast]);

  return {
    services,
    categories,
    loading,
    refreshing,
    pagination,
    setPagination,
    searchTerm,
    setSearchTerm,
    activeStatusTab,
    setActiveStatusTab,
    selectedCategory,
    setSelectedCategory,
    isFormModalOpen,
    editingService,
    deleteTarget,
    detailTarget,
    isSaving,
    isDeleting,
    toast,
    showToast,
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

export default useServiceManagement;

import { useState, useEffect, useCallback, useRef } from 'react';
import { adminCategoriesService } from '../services/adminCategories.service';
import type { CategoryItem, CategoryFormData } from '../../../types/category';

/**
 * Kiểu trạng thái lọc danh mục
 */
export type CategoryStatusFilter = 'all' | 'active' | 'inactive';

/**
 * Kiểu hàm hiển thị Toast thông báo
 */
export type ShowToastFn = (type: 'success' | 'error', message: string) => void;

/**
 * ============================================================================
 * CUSTOM HOOK: useCategories (OPTIMIZED - ZERO BLINKING / NO INFINITE LOOP)
 * ============================================================================
 * Đóng gói toàn bộ logic gọi RESTful API, state management và business logic
 * cho trang Quản Lý Danh Mục (CategoryManagementPage.tsx - /admin/categories).
 *
 * Tối ưu hiệu năng:
 * - Sử dụng useRef cho showToast callback để giữ hàm fetchCategories ổn định.
 * - Tự động debounce 300ms khi tìm kiếm từ khóa, loại bỏ triệt để giật nhấp nháy UI.
 * - dependencies của useCallback & useEffect được kiểm soát chặt chẽ, ngăn chặn loop.
 *
 * @param {ShowToastFn} [showToast] - Callback hiển thị toast thông báo kết quả
 */
export function useCategories(showToast?: ShowToastFn) {
  // 1. Giữ tham chiếu ổn định cho callback showToast qua useRef
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // 2. States dữ liệu và trạng thái UI
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 3. States bộ lọc (Tách biệt giá trị input tức thời và query đã debounce)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<CategoryStatusFilter>('all');

  // Debounce tìm kiếm 300ms để người dùng gõ mượt mà, không giật màn hình
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 4. Quản lý Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryItem | null>(null);

  // 5. Trạng thái mutation (isSaving, isDeleting)
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  /**
   * ============================================================================
   * RESTFUL API: GET /api/v1/admin/categories
   * ============================================================================
   * Tải danh sách danh mục ngành nghề kèm số lượng gói dịch vụ trực thuộc.
   * Hỗ trợ tìm kiếm từ khóa (search) và trạng thái (status: all | active | inactive).
   */
  const fetchCategories = useCallback(
    async (overrideParams?: { search?: string; status?: string }) => {
      try {
        setLoading(true);
        setError(null);

        const params: { search?: string; status?: string } = {
          search: overrideParams?.search !== undefined ? overrideParams.search : debouncedSearch,
          status: overrideParams?.status !== undefined ? overrideParams.status : statusFilter,
        };

        const res = await adminCategoriesService.getCategories(params);
        if (Array.isArray(res)) {
          setCategories(res);
        } else if ((res as any)?.data && Array.isArray((res as any).data)) {
          setCategories((res as any).data);
        } else {
          setCategories([]);
        }
      } catch (err: any) {
        console.error('[useCategories] Lỗi khi tải danh sách danh mục:', err);
        const errorMsg =
          err.response?.data?.message || err.message || 'Không thể kết nối đến máy chủ danh mục.';
        setError(errorMsg);
        showToastRef.current?.('error', 'Lỗi khi tải danh sách danh mục ngành nghề.');
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, statusFilter]
  );

  // Kích hoạt fetch khi debouncedSearch hoặc statusFilter thay đổi
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /**
   * Tìm kiếm tức thì khi người dùng submit form
   */
  const handleSearchSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      fetchCategories({ search: searchTerm.trim() });
    },
    [fetchCategories, searchTerm]
  );

  /**
   * Mở Modal tạo danh mục mới
   */
  const handleOpenCreate = useCallback(() => {
    setEditingCategory(null);
    setIsModalOpen(true);
  }, []);

  /**
   * Mở Modal chỉnh sửa danh mục
   */
  const handleOpenEdit = useCallback((category: CategoryItem) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  }, []);

  /**
   * Đóng Modal Thêm / Sửa
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCategory(null);
  }, []);

  /**
   * Mở Modal xác nhận xóa danh mục
   */
  const handleOpenDelete = useCallback((category: CategoryItem) => {
    setDeleteTarget(category);
  }, []);

  /**
   * Đóng Modal xác nhận xóa
   */
  const handleCloseDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  /**
   * ============================================================================
   * RESTFUL API: POST /api/v1/admin/categories OR PUT /api/v1/admin/categories/:id
   * ============================================================================
   * Lưu thông tin danh mục (Tạo mới nếu editingCategory null, Cập nhật nếu có id).
   */
  const handleSaveCategory = useCallback(
    async (formData: CategoryFormData) => {
      try {
        setIsSaving(true);
        if (editingCategory) {
          // RESTful API: PUT /api/v1/admin/categories/:id
          await adminCategoriesService.updateCategory(editingCategory.id, formData);
          showToastRef.current?.('success', `Cập nhật danh mục "${formData.name}" thành công.`);
        } else {
          // RESTful API: POST /api/v1/admin/categories
          await adminCategoriesService.createCategory(formData);
          showToastRef.current?.('success', `Tạo mới danh mục "${formData.name}" thành công.`);
        }
        setIsModalOpen(false);
        setEditingCategory(null);
        await fetchCategories();
      } catch (err: any) {
        console.error('[useCategories] Lỗi khi lưu danh mục:', err);
        const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu danh mục.';
        showToastRef.current?.('error', msg);
      } finally {
        setIsSaving(false);
      }
    },
    [editingCategory, fetchCategories]
  );

  /**
   * ============================================================================
   * RESTFUL API: PATCH /api/v1/admin/categories/:id/toggle
   * ============================================================================
   * Bật / Tắt trạng thái kích hoạt của danh mục (Optimistic UI Update).
   */
  const handleToggleStatus = useCallback(
    async (category: CategoryItem) => {
      try {
        // Cập nhật giao diện ngay lập tức (Optimistic Update)
        setCategories((prev) =>
          prev.map((c) => (c.id === category.id ? { ...c, isActive: !c.isActive } : c))
        );

        const res = (await adminCategoriesService.toggleCategoryStatus(category.id)) as any;
        showToastRef.current?.(
          'success',
          res?.message ||
            `Đã ${!category.isActive ? 'kích hoạt' : 'tạm ngưng'} danh mục "${category.name}".`
        );
      } catch (err: any) {
        console.error('[useCategories] Lỗi khi bật/tắt trạng thái:', err);
        showToastRef.current?.('error', 'Lỗi khi thay đổi trạng thái danh mục.');
        await fetchCategories();
      }
    },
    [fetchCategories]
  );

  /**
   * ============================================================================
   * RESTFUL API: DELETE /api/v1/admin/categories/:id?force=...
   * ============================================================================
   * Xóa vĩnh viễn (force=true) hoặc chuyển sang tạm ngưng nếu có dịch vụ trực thuộc.
   */
  const handleDeleteCategory = useCallback(
    async (force: boolean = false) => {
      if (!deleteTarget) return;
      try {
        setIsDeleting(true);
        const res = (await adminCategoriesService.deleteCategory(deleteTarget.id, force)) as any;
        showToastRef.current?.('success', res?.message || `Đã xóa danh mục "${deleteTarget.name}".`);
        setDeleteTarget(null);
        await fetchCategories();
      } catch (err: any) {
        console.error('[useCategories] Lỗi khi xóa danh mục:', err);
        const msg = err.response?.data?.message || err.message || 'Lỗi khi xóa danh mục.';
        showToastRef.current?.('error', msg);
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteTarget, fetchCategories]
  );

  return {
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
  };
}

export default useCategories;

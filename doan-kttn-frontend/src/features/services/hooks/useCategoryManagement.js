import { useState, useEffect, useCallback } from 'react';
import { adminCategoriesService } from '../services/adminCategories.service';

/**
 * ============================================================================
 * CUSTOM HOOK: useCategoryManagement
 * ============================================================================
 * Đóng gói toàn bộ logic gọi API, quản lý state loading, error, modal thêm/sửa,
 * xóa và lọc danh mục ngành nghề FixGo Pro.
 *
 * @param {(type: 'success' | 'error', message: string) => void} [showToast]
 */
export function useCategoryManagement(showToast) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Tải danh sách danh mục
  const fetchCategories = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminCategoriesService.getCategories(params);
      if (Array.isArray(res)) {
        setCategories(res);
      } else if (res?.data && Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('[useCategoryManagement] Lỗi khi tải danh mục:', err);
      setError(err.message || 'Không thể kết nối danh sách danh mục.');
      if (showToast) {
        showToast('error', 'Lỗi khi tải danh sách danh mục ngành nghề.');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 2. Chọn danh mục để lọc gói dịch vụ bên dưới
  const handleSelectCategory = useCallback((id) => {
    setSelectedCategoryId((prev) => (prev === id ? 'ALL' : id));
  }, []);

  // 3. Modal Controls
  const handleOpenCreate = useCallback(() => {
    setEditingCategory(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCategory(null);
  }, []);

  const handleOpenDelete = useCallback((category) => {
    setDeleteTarget(category);
  }, []);

  const handleCloseDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  // 4. Lưu danh mục (Tạo mới hoặc Cập nhật)
  const handleSaveCategory = useCallback(
    async (formData) => {
      try {
        setIsSaving(true);
        if (editingCategory) {
          await adminCategoriesService.updateCategory(editingCategory.id, formData);
          if (showToast) {
            showToast('success', `Đã cập nhật danh mục "${formData.name}" thành công.`);
          }
        } else {
          await adminCategoriesService.createCategory(formData);
          if (showToast) {
            showToast('success', `Đã tạo mới danh mục "${formData.name}" thành công.`);
          }
        }
        setIsModalOpen(false);
        setEditingCategory(null);
        fetchCategories();
      } catch (err) {
        console.error('[useCategoryManagement] Lỗi khi lưu danh mục:', err);
        const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu danh mục.';
        if (showToast) showToast('error', msg);
      } finally {
        setIsSaving(false);
      }
    },
    [editingCategory, fetchCategories, showToast]
  );

  // 5. Bật/Tắt trạng thái hoạt động
  const handleToggleStatus = useCallback(
    async (category) => {
      try {
        // Optimistic UI update
        setCategories((prev) =>
          prev.map((c) => (c.id === category.id ? { ...c, isActive: !c.isActive } : c))
        );

        const res = await adminCategoriesService.toggleCategoryStatus(category.id);
        if (showToast) {
          showToast(
            'success',
            res?.message ||
              `Đã chuyển danh mục "${category.name}" sang ${
                !category.isActive ? 'Đang hoạt động' : 'Tạm ngưng'
              }.`
          );
        }
      } catch (err) {
        console.error('[useCategoryManagement] Lỗi khi đổi trạng thái:', err);
        if (showToast) showToast('error', 'Lỗi khi đổi trạng thái danh mục.');
        fetchCategories();
      }
    },
    [fetchCategories, showToast]
  );

  // 6. Xóa danh mục
  const handleDeleteCategory = useCallback(
    async (force = false) => {
      if (!deleteTarget) return;
      try {
        setIsDeleting(true);
        const res = await adminCategoriesService.deleteCategory(deleteTarget.id, force);
        if (showToast) {
          showToast('success', res?.message || `Đã xóa danh mục "${deleteTarget.name}".`);
        }
        if (selectedCategoryId === deleteTarget.id) {
          setSelectedCategoryId('ALL');
        }
        setDeleteTarget(null);
        fetchCategories();
      } catch (err) {
        console.error('[useCategoryManagement] Lỗi khi xóa danh mục:', err);
        const msg = err.response?.data?.message || err.message || 'Lỗi khi xóa danh mục.';
        if (showToast) showToast('error', msg);
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteTarget, selectedCategoryId, fetchCategories, showToast]
  );

  return {
    categories,
    loading,
    error,
    selectedCategoryId,
    setSelectedCategoryId,
    isModalOpen,
    editingCategory,
    deleteTarget,
    isSaving,
    isDeleting,
    fetchCategories,
    handleSelectCategory,
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

export default useCategoryManagement;

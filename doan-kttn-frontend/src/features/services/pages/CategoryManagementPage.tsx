import React, { useState, useCallback } from 'react';
import { useCategories } from '../hooks/useCategories';
import CategoryToast from '../components/CategoryToast';
import CategoryPageHeader from '../components/CategoryPageHeader';
import CategoryStatsCards from '../components/CategoryStatsCards';
import CategoryToolbar from '../components/CategoryToolbar';
import CategoryTable from '../components/CategoryTable';
import CategoryModal from '../components/CategoryModal';
import DeleteCategoryModal from '../components/DeleteCategoryModal';
import CategoryServicesModal from '../components/CategoryServicesModal';
import type { CategoryItem } from '../../../types/category';

export default function CategoryManagementPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [viewingCategoryServices, setViewingCategoryServices] = useState<CategoryItem | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
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

  const totalServices = categories.reduce((sum, c) => sum + (c._count?.services || 0), 0);
  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.length - activeCount;

  return (
    <div className="h-full flex flex-col justify-between select-none space-y-3.5 overflow-y-auto no-scrollbar transition-colors duration-200">
      <CategoryToast toast={toast} />

      <CategoryPageHeader
        loading={loading}
        onRefresh={() => fetchCategories()}
        onCreate={handleOpenCreate}
      />

      <CategoryStatsCards
        totalCount={categories.length}
        activeCount={activeCount}
        totalServices={totalServices}
      />

      <CategoryToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalCount={categories.length}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={() => {
          setSearchTerm('');
          fetchCategories({ search: '' });
        }}
      />

      <CategoryTable
        categories={categories}
        loading={loading}
        error={error}
        onRetry={() => fetchCategories()}
        onToggle={handleToggleStatus}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onCreate={handleOpenCreate}
        onViewServices={(cat) => setViewingCategoryServices(cat)}
      />

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

      <CategoryServicesModal
        isOpen={Boolean(viewingCategoryServices)}
        onClose={() => setViewingCategoryServices(null)}
        category={viewingCategoryServices}
      />
    </div>
  );
}

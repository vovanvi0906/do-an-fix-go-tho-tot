import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCategories } from '../hooks/useCategories';
import { adminServicesService } from '../services/adminServices.service';
import CategoryToast from '../components/CategoryToast';
import { HierarchyHeader } from '../components/HierarchyHeader';
import { HierarchyBreadcrumb } from '../components/HierarchyBreadcrumb';
import { CategoryColumn } from '../components/CategoryColumn';
import { TargetColumn } from '../components/TargetColumn';
import { ServiceColumn } from '../components/ServiceColumn';
import { HierarchyDetailFooter } from '../components/HierarchyDetailFooter';
import CategoryModal from '../components/CategoryModal';
import { TargetModal } from '../components/TargetModal';
import ServiceModal from '../components/ServiceModal';
import DeleteCategoryModal from '../components/DeleteCategoryModal';
import DeleteServiceModal from '../components/DeleteServiceModal';
import type { CategoryItem } from '../../../types/category';
import type { ServiceTargetItem, ServiceItem } from '../../../types/service';

export default function CategoryManagementPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const {
    categories,
    loading: catLoading,
    fetchCategories,
    handleSaveCategory,
    handleToggleStatus: handleToggleCat,
    handleDeleteCategory,
  } = useCategories(showToast);

  // States chọn phân cấp
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<ServiceTargetItem | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Dữ liệu Targets và Services
  const [targets, setTargets] = useState<ServiceTargetItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  // Modals
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<ServiceTargetItem | null>(null);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  const [deleteCatTarget, setDeleteCatTarget] = useState<CategoryItem | null>(null);
  const [deleteServiceTarget, setDeleteServiceTarget] = useState<ServiceItem | null>(null);

  // Auto select default category khi có categories
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Load targets theo category đang chọn
  const fetchTargets = useCallback(async (catId?: string) => {
    if (!catId) return;
    try {
      setLoadingTargets(true);
      const res = await adminServicesService.getTargets(catId);
      const data = Array.isArray(res) ? res : (res as any)?.data || [];
      setTargets(data);
      // Auto select first target nếu có
      if (data.length > 0) {
        setSelectedTarget(data[0]);
      } else {
        setSelectedTarget(null);
      }
    } catch {
      setTargets([]);
      setSelectedTarget(null);
    } finally {
      setLoadingTargets(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchTargets(selectedCategory.id);
    }
  }, [selectedCategory, fetchTargets]);

  // Load services theo target hoặc category đang chọn
  const fetchServices = useCallback(async (catId?: string, tgtId?: string) => {
    try {
      setLoadingServices(true);
      const params: any = { page: 1, limit: 100 };
      if (catId) params.categoryId = catId;
      if (tgtId && tgtId !== 'ALL') params.targetId = tgtId;
      const res = (await adminServicesService.getServices(params)) as any;
      const data = Array.isArray(res) ? res : res?.data || [];
      setServices(data);
      setSelectedService(data[0] || null);
    } catch {
      setServices([]);
      setSelectedService(null);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchServices(selectedCategory.id, selectedTarget?.id);
    }
  }, [selectedCategory, selectedTarget, fetchServices]);

  // Actions Targets
  const handleSaveTarget = async (formData: any) => {
    try {
      if (editingTarget) {
        await adminServicesService.updateTarget(editingTarget.id, formData);
        showToast('success', 'Cập nhật đối tượng thành công');
      } else {
        await adminServicesService.createTarget(formData);
        showToast('success', 'Tạo mới đối tượng thành công');
      }
      setIsTargetModalOpen(false);
      setEditingTarget(null);
      if (selectedCategory) fetchTargets(selectedCategory.id);
      fetchCategories();
    } catch (e: any) {
      showToast('error', e.message || 'Lỗi lưu đối tượng');
    }
  };

  const handleToggleTarget = async (tgt: ServiceTargetItem) => {
    try {
      await adminServicesService.toggleTargetStatus(tgt.id);
      if (selectedCategory) fetchTargets(selectedCategory.id);
      showToast('success', 'Đã đổi trạng thái đối tượng');
    } catch (e: any) {
      showToast('error', e.message || 'Lỗi đổi trạng thái');
    }
  };

  const handleDeleteTarget = async (tgt: ServiceTargetItem) => {
    if (!window.confirm(`Bạn có chắc muốn xóa đối tượng "${tgt.name}"?`)) return;
    try {
      await adminServicesService.deleteTarget(tgt.id);
      if (selectedCategory) fetchTargets(selectedCategory.id);
      fetchCategories();
      showToast('success', 'Đã xóa đối tượng');
    } catch (e: any) {
      showToast('error', e.message || 'Lỗi xóa đối tượng');
    }
  };

  // Actions Services
  const handleSaveService = async (formData: any) => {
    try {
      if (editingService) {
        await adminServicesService.updateService(editingService.id, formData);
        showToast('success', 'Cập nhật dịch vụ thành công');
      } else {
        await adminServicesService.createService(formData);
        showToast('success', 'Tạo dịch vụ mới thành công');
      }
      setIsServiceModalOpen(false);
      setEditingService(null);
      if (selectedCategory) fetchServices(selectedCategory.id, selectedTarget?.id);
    } catch (e: any) {
      showToast('error', e.message || 'Lỗi lưu dịch vụ');
    }
  };

  const handleToggleService = async (svc: ServiceItem) => {
    try {
      await adminServicesService.toggleServiceStatus(svc.id);
      if (selectedCategory) fetchServices(selectedCategory.id, selectedTarget?.id);
      showToast('success', 'Đã đổi trạng thái dịch vụ');
    } catch (e: any) {
      showToast('error', e.message || 'Lỗi đổi trạng thái');
    }
  };

  const totalServicesCount = useMemo(() => categories.reduce((sum, c) => sum + (c._count?.services || 0), 0), [categories]);
  const totalTargetsCount = useMemo(() => categories.reduce((sum, c) => sum + (c._count?.targets || 0), 0), [categories]);
  const activeCount = useMemo(() => categories.filter((c) => c.isActive).length, [categories]);

  return (
    <div className="h-full flex flex-col justify-between select-none space-y-4 overflow-y-auto no-scrollbar transition-colors duration-200">
      <CategoryToast toast={toast} />

      {/* 1. Header & Stats */}
      <HierarchyHeader
        categoryCount={categories.length}
        targetCount={totalTargetsCount}
        serviceCount={totalServicesCount}
        activeCount={activeCount}
        onRefresh={() => { fetchCategories(); if (selectedCategory) fetchTargets(selectedCategory.id); }}
        onAddCategory={() => { setEditingCat(null); setIsCatModalOpen(true); }}
        onAddTarget={() => { setEditingTarget(null); setIsTargetModalOpen(true); }}
        onAddService={() => { setEditingService(null); setIsServiceModalOpen(true); }}
      />

      {/* 2. Breadcrumb Navigation */}
      <HierarchyBreadcrumb
        categoryName={selectedCategory?.name}
        targetName={selectedTarget?.name}
        onReset={() => { setSelectedCategory(categories[0] || null); setSelectedTarget(null); }}
        onSelectCategoryOnly={() => setSelectedTarget(null)}
      />

      {/* 3. 3 CỘT PHÂN CẤP TƯƠNG TÁC (3-COLUMN HIERARCHY LAYOUT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <CategoryColumn
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={(cat) => setSelectedCategory(cat)}
          onAdd={() => { setEditingCat(null); setIsCatModalOpen(true); }}
          onEdit={(cat) => { setEditingCat(cat); setIsCatModalOpen(true); }}
          onToggle={handleToggleCat}
          onDelete={(cat) => setDeleteCatTarget(cat)}
        />

        <TargetColumn
          targets={targets}
          selectedTarget={selectedTarget}
          onSelect={(tgt) => setSelectedTarget(tgt)}
          onAdd={() => { setEditingTarget(null); setIsTargetModalOpen(true); }}
          onEdit={(tgt) => { setEditingTarget(tgt); setIsTargetModalOpen(true); }}
          onToggle={handleToggleTarget}
          onDelete={handleDeleteTarget}
          categoryName={selectedCategory?.name}
        />

        <ServiceColumn
          services={services}
          selectedService={selectedService}
          onSelect={(svc) => setSelectedService(svc)}
          onAdd={() => { setEditingService(null); setIsServiceModalOpen(true); }}
          onEdit={(svc) => { setEditingService(svc); setIsServiceModalOpen(true); }}
          onToggle={handleToggleService}
          onDelete={(svc) => setDeleteServiceTarget(svc)}
          targetName={selectedTarget?.name}
        />
      </div>

      {/* 4. Footer Chi tiết */}
      <HierarchyDetailFooter
        category={selectedCategory}
        target={selectedTarget}
        service={selectedService}
      />

      {/* Modals */}
      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => { setIsCatModalOpen(false); setEditingCat(null); }}
        onSave={async (d) => { await handleSaveCategory(d); setIsCatModalOpen(false); fetchCategories(); }}
        initialData={editingCat}
      />

      <TargetModal
        isOpen={isTargetModalOpen}
        onClose={() => { setIsTargetModalOpen(false); setEditingTarget(null); }}
        onSave={handleSaveTarget}
        initialData={editingTarget}
        categories={categories}
        defaultCategoryId={selectedCategory?.id}
      />

      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => { setIsServiceModalOpen(false); setEditingService(null); }}
        onSave={handleSaveService}
        initialData={editingService}
        categories={categories as any}
        targets={targets}
      />

      <DeleteCategoryModal
        isOpen={Boolean(deleteCatTarget)}
        onClose={() => setDeleteCatTarget(null)}
        onConfirm={async (force) => {
          if (deleteCatTarget) await handleDeleteCategory(deleteCatTarget.id, force);
          setDeleteCatTarget(null);
        }}
        categoryName={deleteCatTarget?.name}
        serviceCount={deleteCatTarget?._count?.services}
      />

      <DeleteServiceModal
        isOpen={Boolean(deleteServiceTarget)}
        onClose={() => setDeleteServiceTarget(null)}
        onConfirm={async (force) => {
          if (deleteServiceTarget) await adminServicesService.deleteService(deleteServiceTarget.id, force);
          setDeleteServiceTarget(null);
          if (selectedCategory) fetchServices(selectedCategory.id, selectedTarget?.id);
        }}
        serviceName={deleteServiceTarget?.name}
      />
    </div>
  );
}

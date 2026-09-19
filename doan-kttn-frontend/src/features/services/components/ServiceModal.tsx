import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wrench,
  DollarSign,
  Clock,
  Layers,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import type { ServiceModalProps, ServiceFormData } from '../../../types/service';

/**
 * ServiceModal Component (Linear / Vercel Style)
 * Modal khởi tạo và cập nhật thông tin gói dịch vụ.
 * Tuân thủ chuẩn 8pt Grid System, không dùng CSS inline, hỗ trợ animation Framer Motion.
 */
export default function ServiceModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  categories = [],
  isSubmitting = false,
}: ServiceModalProps) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    categoryId: '',
    basePrice: '',
    unit: 'lần',
    estimatedDurationMin: 60,
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        categoryId: initialData.category?.id || initialData.categoryId || categories[0]?.id || '',
        basePrice: initialData.basePrice ? Number(initialData.basePrice) : '',
        unit: initialData.unit || 'lần',
        estimatedDurationMin: initialData.estimatedDurationMin || 60,
        description: initialData.description || '',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        categoryId: categories[0]?.id || '',
        basePrice: 150000,
        unit: 'lần',
        estimatedDurationMin: 60,
        description: '',
        isActive: true,
      });
    }
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      basePrice: Number(formData.basePrice) || 100000,
      estimatedDurationMin: Number(formData.estimatedDurationMin) || 60,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5"
        >
          {/* Close Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {isEditing ? 'Chỉnh Sửa Gói Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEditing
                  ? 'Điều chỉnh thông tin hoặc mức giá khởi điểm của gói dịch vụ'
                  : 'Khởi tạo gói dịch vụ mới hiển thị trên ứng dụng khách hàng FixGo'}
              </p>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 1. Tên dịch vụ */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Tên Gói Dịch Vụ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Sửa chập điện âm tường, Vệ sinh máy giặt..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* 2. Phân loại ngành nghề (Dropdown Category) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Phân Loại Ngành Nghề / Danh Mục *</span>
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                {categories.length === 0 && (
                  <option value="">Chưa có danh mục nào - Đang tải...</option>
                )}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Giá khởi điểm & Đơn vị tính (Grid 2 cột) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Giá khởi điểm */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Giá Khởi Điểm (VNĐ) *</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="10000"
                    step="5000"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    placeholder="150000"
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    đ
                  </span>
                </div>
              </div>

              {/* Đơn vị tính */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Đơn Vị Tính *
                </label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="lần, giờ, máy, bộ..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* 4. Thời lượng ước tính */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-500" />
                <span>Thời Lượng Ước Tính (Phút) *</span>
              </label>
              <input
                type="number"
                required
                min="15"
                step="5"
                value={formData.estimatedDurationMin}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedDurationMin: e.target.value })
                }
                placeholder="60"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* 5. Mô tả chi tiết gói dịch vụ */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>Mô Tả Chi Tiết Gói Dịch Vụ</span>
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả phạm vi công việc, cam kết linh kiện thay thế chính hãng..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* 6. Kích hoạt cung cấp dịch vụ (Toggle switch) */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Kích hoạt cung cấp dịch vụ
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Cho phép khách hàng tìm kiếm và đặt lịch thợ trên ứng dụng FixGo
                </span>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 7. Nút thao tác Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer disabled:opacity-40"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 border border-blue-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Cập Nhật Dịch Vụ' : 'Tạo Dịch Vụ Mới'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

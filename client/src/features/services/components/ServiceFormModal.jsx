import React, { useState, useEffect } from 'react';
import { X, Wrench, DollarSign, Clock, Layers, FileText, Loader2, Sparkles } from 'lucide-react';

export default function ServiceFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  categories = [],
  isSubmitting = false,
}) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
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
        basePrice: initialData.basePrice || '',
        unit: initialData.unit || 'lần',
        estimatedDurationMin: initialData.estimatedDurationMin || 60,
        description: initialData.description || '',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        categoryId: categories[0]?.id || '',
        basePrice: '150000',
        unit: 'lần',
        estimatedDurationMin: 60,
        description: '',
        isActive: true,
      });
    }
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      basePrice: Number(formData.basePrice) || 100000,
      estimatedDurationMin: Number(formData.estimatedDurationMin) || 60,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {isEditing ? 'Chỉnh Sửa Gói Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isEditing
                ? 'Điều chỉnh thông tin hoặc mức giá khởi điểm của dịch vụ'
                : 'Khởi tạo gói dịch vụ mới hiển thị trên ứng dụng khách hàng'}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Tên dịch vụ */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              Tên Gói Dịch Vụ *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Sửa chập điện âm tường, Vệ sinh máy lạnh..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-medium"
            />
          </div>

          {/* Danh mục & Giá khởi điểm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Danh mục */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Phân Loại Ngành Nghề *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Giá khởi điểm */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Giá Khởi Điểm (VNĐ) *
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
                  className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 font-semibold text-[11px]">
                  đ
                </span>
              </div>
            </div>
          </div>

          {/* Đơn vị & Thời lượng ước tính */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Đơn vị tính */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Đơn Vị Tính
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="VD: lần, giờ, bộ, m²..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Thời gian ước tính (phút) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Thời Lượng Ước Tính (Phút)
              </label>
              <input
                type="number"
                min="10"
                step="5"
                value={formData.estimatedDurationMin}
                onChange={(e) => setFormData({ ...formData, estimatedDurationMin: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Mô tả dịch vụ */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              Mô Tả Chi Tiết Gói Dịch Vụ
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả phạm vi công việc, cam kết linh kiện hoặc dụng cụ đi kèm..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all resize-none text-xs"
            />
          </div>

          {/* Toggle Trạng Thái Kích Hoạt */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                Kích hoạt cung cấp dịch vụ
              </span>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                Cho phép khách hàng đặt đơn ngay trên ứng dụng
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>{isEditing ? 'Lưu Thay Đổi' : 'Tạo Dịch Vụ Mới'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

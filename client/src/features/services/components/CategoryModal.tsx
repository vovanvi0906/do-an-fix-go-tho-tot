import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, FileText, Link as LinkIcon, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import type { CategoryModalProps, CategoryFormData } from '../../../types/category';

/**
 * Hàm tự động sinh slug từ tên tiếng Việt
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Preset Icons thông dụng cho dịch vụ gia đình FixGo
 */
const PRESET_ICONS = [
  { label: 'Điện - Nước', url: 'https://cdn-icons-png.flaticon.com/512/3100/3100553.png' },
  { label: 'Vệ sinh', url: 'https://cdn-icons-png.flaticon.com/512/995/995053.png' },
  { label: 'Thiết bị gia đình', url: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png' },
  { label: 'Sân vườn', url: 'https://cdn-icons-png.flaticon.com/512/1518/1518968.png' },
  { label: 'Sửa điện', url: 'https://cdn-icons-png.flaticon.com/512/2933/2933245.png' },
];

/**
 * CategoryModal Component (Linear / Vercel Style)
 * Modal khởi tạo và cập nhật nhóm danh mục ngành nghề FixGo Pro.
 */
export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isSubmitting = false,
}: CategoryModalProps) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    iconUrl: PRESET_ICONS[0].url,
    isActive: true,
  });

  const [isManualSlug, setIsManualSlug] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || generateSlug(initialData.name || ''),
        description: initialData.description || '',
        iconUrl: initialData.iconUrl || PRESET_ICONS[0].url,
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      });
      setIsManualSlug(true);
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        iconUrl: PRESET_ICONS[0].url,
        isActive: true,
      });
      setIsManualSlug(false);
    }
  }, [initialData, isOpen]);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isManualSlug ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug = formData.slug || generateSlug(formData.name);
    onSave({
      ...formData,
      slug: finalSlug,
      icon: formData.iconUrl,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xs select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-4"
          >
          {/* Close Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {isEditing ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Ngành Nghề'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEditing
                  ? 'Cập nhật thông tin nhóm ngành nghề trên hệ thống FixGo'
                  : 'Khởi tạo nhóm ngành nghề phân loại các gói dịch vụ trực thuộc'}
              </p>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* 1. Tên danh mục */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Tên Danh Mục Ngành Nghề <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Điện - Nước, Vệ sinh & Dọn dẹp..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* 2. Slug định danh URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>Slug Định Danh (SEO / URL) *</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsManualSlug(false);
                    setFormData((prev) => ({ ...prev, slug: generateSlug(prev.name) }));
                  }}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Tự động sinh lại
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                  #
                </span>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => {
                    setIsManualSlug(true);
                    setFormData({ ...formData, slug: e.target.value });
                  }}
                  placeholder="dien-nuoc"
                  className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* 3. Icon nhận diện */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Biểu Tượng (Icon URL hoặc Chọn Preset)</span>
              </label>

              {/* Preset Icon Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                {PRESET_ICONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, iconUrl: preset.url })}
                    className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-[11px] transition-all cursor-pointer shrink-0 ${
                      formData.iconUrl === preset.url
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-3.5 h-3.5 object-contain" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>

              <input
                type="url"
                value={formData.iconUrl}
                onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                placeholder="https://cdn-icons-png.flaticon.com/..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-mono text-[11px]"
              />
            </div>

            {/* 4. Mô tả chi tiết */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-500" />
                <span>Mô Tả Nhóm Ngành Nghề</span>
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả phạm vi và các loại hình dịch vụ chính thuộc nhóm này..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* 5. Toggle Trạng thái hoạt động */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Kích hoạt cung cấp ngành nghề
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Hiển thị nhóm danh mục này cho khách hàng và đối tác thợ đăng ký kỹ năng
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

            {/* Footer Buttons */}
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
                    <span>{isEditing ? 'Cập Nhật Danh Mục' : 'Tạo Danh Mục Mới'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}

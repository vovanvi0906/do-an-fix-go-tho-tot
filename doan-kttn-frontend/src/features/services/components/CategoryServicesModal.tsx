import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, RefreshCw, Inbox, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCategoryServices } from '../hooks/useCategoryServices';
import { getCategoryFallbackIcon } from '../utils/getCategoryFallbackIcon';
import CategoryServiceCard from './CategoryServiceCard';
import type { CategoryItem } from '../../../types/category';

interface CategoryServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryItem | null;
}

export default function CategoryServicesModal({
  isOpen,
  onClose,
  category,
}: CategoryServicesModalProps) {
  const navigate = useNavigate();
  const { services, loading, error } = useCategoryServices(isOpen, category);

  if (!isOpen || !category) return null;

  const FallbackIcon = getCategoryFallbackIcon(category.name);
  const iconSource = category.iconUrl || category.icon;
  const activeCount = services.filter((s) => s.isActive).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                {iconSource ? (
                  <img
                    src={iconSource}
                    alt={category.name}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <FallbackIcon className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {category.name}
                  </h3>
                  <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/40">
                    #{category.slug || 'category'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {category.description || 'Danh sách các gói dịch vụ trực thuộc ngành nghề'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subheader Stats */}
          <div className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
              <span>
                Tổng số:{' '}
                <strong className="font-mono text-slate-900 dark:text-white">
                  {services.length}
                </strong>{' '}
                gói
              </span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                Đang hoạt động: <strong>{activeCount}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/admin/services?categoryId=${category.id}`);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <span>Mở trang Quản lý gói</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* List Content */}
          <div className="p-5 overflow-y-auto flex-1 space-y-3">
            {loading && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-xs font-medium">Đang tải danh sách gói dịch vụ...</span>
              </div>
            )}

            {!loading && error && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && services.length === 0 && (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Inbox className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Chưa có gói dịch vụ nào
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                  Ngành nghề này chưa được cấu hình gói dịch vụ chi tiết nào trong cơ sở dữ liệu.
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              services.map((svc) => <CategoryServiceCard key={svc.id} service={svc} />)}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

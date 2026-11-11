import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Clock, DollarSign, Briefcase, Calendar, CheckCircle2, XCircle } from 'lucide-react';

/**
 * ServiceDetailModal Component
 * Hiển thị chi tiết thông số gói dịch vụ khi Admin bấm vào icon Xem (Eye).
 */
export default function ServiceDetailModal({ isOpen, onClose, service }) {
  if (!isOpen || !service) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {service.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mã dịch vụ: <span className="font-mono">{service.id?.slice(0, 8)}...</span>
              </p>
            </div>
          </div>

          {/* Detail List */}
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Danh mục:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-slate-800 text-[11px]">
                  {service.category?.name || 'Chung'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Giá khởi điểm:</span>
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                  {Number(service.basePrice).toLocaleString('vi-VN')} đ
                  <span className="text-xs text-slate-400 font-normal">/{service.unit || 'lần'}</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Thời lượng dự kiến:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {service.estimatedDurationMin || 60} phút
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Trạng thái:</span>
                {service.isActive ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đang hoạt động</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Tạm ngưng</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Số đơn đã phục vụ:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {service._count?.orders ?? 0} đơn
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-slate-500 dark:text-slate-400 font-semibold block text-[11px]">
                Mô tả chi tiết:
              </span>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 text-slate-700 dark:text-slate-300 leading-relaxed">
                {service.description || 'Chưa có mô tả chi tiết cho gói dịch vụ này.'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
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

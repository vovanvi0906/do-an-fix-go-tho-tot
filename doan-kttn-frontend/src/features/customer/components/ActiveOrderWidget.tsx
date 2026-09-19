import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  MapPin,
  Wrench,
  ChevronRight,
  Phone,
  Radio,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  X,
} from 'lucide-react';
import type { ActiveOrderWidgetProps } from '../../../types/customerHome';
import { formatVietnameseDateTime } from '../../../utils/formatDate';

/**
 * Định dạng tiền tệ VND chuẩn Việt Nam kèm đơn vị ký hiệu tiền tệ mono
 * @param {number} amount - Số tiền cần định dạng
 * @returns {string} Chuỗi tiền tệ định dạng mono (ví dụ: "150.000 đ")
 */
function formatCurrencyVND(amount: number = 0): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, amount))} đ`;
}

/**
 * 4 Giai đoạn tiến trình chuẩn hóa của đơn hàng (Linear Milestones)
 */
const ORDER_STAGES = [
  { step: 1, label: 'Tiếp nhận', sublabel: 'Đã nhận đơn' },
  { step: 2, label: 'Di chuyển', sublabel: 'Đang đến nơi' },
  { step: 3, label: 'Có mặt', sublabel: 'Tại điểm hẹn' },
  { step: 4, label: 'Sửa chữa', sublabel: 'Đang thực hiện' },
];

/**
 * Xác định giai đoạn hiện tại theo trạng thái đơn hàng
 */
function getActiveStage(status: string): { currentStep: number; stageNote: string } {
  switch (status) {
    case 'SEARCHING':
      return { currentStep: 1, stageNote: 'Hệ thống đang điều phối kỹ thuật viên gần nhất' };
    case 'ASSIGNED':
      return { currentStep: 1, stageNote: 'Kỹ thuật viên đã nhận đơn và chuẩn bị di chuyển' };
    case 'WORKER_ARRIVING':
      return { currentStep: 2, stageNote: 'Kỹ thuật viên đang di chuyển đến địa chỉ của bạn' };
    case 'ARRIVED':
      return { currentStep: 3, stageNote: 'Kỹ thuật viên đã có mặt tại điểm hẹn, sẵn sàng kiểm tra' };
    case 'IN_PROGRESS':
      return { currentStep: 4, stageNote: 'Kỹ thuật viên đang tiến hành sửa chữa, bảo dưỡng' };
    case 'AWAITING_CONFIRMATION':
      return { currentStep: 4, stageNote: 'Đã hoàn tất sửa chữa, chờ bạn nghiệm thu thanh toán' };
    case 'COMPLETED':
      return { currentStep: 4, stageNote: 'Đơn hàng đã hoàn thành trọn vẹn' };
    default:
      return { currentStep: 1, stageNote: 'Đang cập nhật tiến độ...' };
  }
}

/**
 * ActiveOrderWidget Component (Linear / Vercel Style)
 * Widget động ưu tiên cao nhất (#1) hiển thị tiến trình đơn hàng đang thực hiện.
 *
 * Chuẩn hóa theo phản hồi chuyên môn:
 * 1. Khử số % ép buộc gây mâu thuẫn -> Chuyển sang Milestone Stepper 4 bước logic với trạng thái thực tế.
 * 2. Chuẩn hóa mã đơn hàng viết hoa toàn bộ: #3F5E1F19.
 * 3. Chuẩn hóa thời gian theo định dạng Việt Nam: HH:mm • DD/MM/YYYY.
 * 4. Modal xác nhận cuộc gọi an toàn tránh bấm nhầm trong demo / thuyết trình.
 * 5. Độ tương phản chuẩn WCAG AA trên nền tối.
 *
 * @param {ActiveOrderWidgetProps} props
 */
export const ActiveOrderWidget: React.FC<ActiveOrderWidgetProps> = ({
  activeOrder,
  setActiveTab = () => {},
  onViewDetails,
}) => {
  const [showCallModal, setShowCallModal] = useState<boolean>(false);

  const { currentStep, stageNote } = getActiveStage(activeOrder.status);
  const formattedOrderCode = `#${activeOrder.id.slice(0, 8).toUpperCase()}`;
  const formattedCreatedAt = formatVietnameseDateTime(activeOrder.createdAt);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(activeOrder.id);
    } else {
      setActiveTab('orders');
    }
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-2xl border border-blue-500/40 bg-slate-900/95 backdrop-blur-md p-4 sm:p-5 shadow-sm space-y-4"
      >
        {/* Thanh highlight phát sáng phía trên */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

        {/* 1. Header: Live Pulse, Trạng thái văn bản, Mã đơn in hoa & Thời gian tạo */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Live Indicator */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>

            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>{activeOrder.statusLabel}</span>
            </span>

            <span className="font-mono text-xs font-bold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              {formattedOrderCode}
            </span>
          </div>

          {/* Thời gian tạo & Dự kiến di chuyển */}
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{formattedCreatedAt}</span>
            </div>
            {activeOrder.estimatedTime && (
              <>
                <span className="text-slate-600">•</span>
                <div className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-mono">{activeOrder.estimatedTime}</span>
                </div>
              </>
            )}
            {activeOrder.estimatedDistance && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-mono font-medium">{activeOrder.estimatedDistance}</span>
              </>
            )}
          </div>
        </div>

        {/* 2. Middle Row: Thẻ Dịch vụ & Thẻ Kỹ thuật viên */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chi tiết Dịch vụ */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                  {activeOrder.service.name}
                </h4>
                <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                  {formatCurrencyVND(activeOrder.totalPrice)}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{activeOrder.pickupAddress}</span>
              </p>
            </div>
          </div>

          {/* Chi tiết Thợ / Kỹ thuật viên */}
          {activeOrder.worker ? (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                  {activeOrder.worker.avatarUrl ? (
                    <img
                      src={activeOrder.worker.avatarUrl}
                      alt={activeOrder.worker.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '👨‍🔧'
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {activeOrder.worker.fullName}
                    </h4>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-medium mt-0.5">
                    <span>⭐ {activeOrder.worker.ratingAvg.toFixed(1)}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-300">Kỹ thuật viên đối tác</span>
                  </div>
                </div>
              </div>

              {/* Nút Gọi thợ với Popup Xác nhận An toàn */}
              {activeOrder.worker.phone && (
                <button
                  type="button"
                  onClick={() => setShowCallModal(true)}
                  title={`Gọi thợ: ${activeOrder.worker.phone}`}
                  className="h-9 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Gọi thợ</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">Đang điều phối thợ</h4>
                  <p className="text-xs text-slate-300">Hệ thống đang phát đơn đến thợ 5km gần nhất</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Milestone Stage Stepper (Logic Tiến độ chuẩn xác thay thế 65% áp đặt) */}
        <div className="pt-2 pb-1 space-y-3">
          {/* Stepper Steps Row */}
          <div className="grid grid-cols-4 gap-2 relative">
            {ORDER_STAGES.map((s) => {
              const isPast = s.step < currentStep;
              const isCurrent = s.step === currentStep;

              return (
                <div key={s.step} className="flex flex-col items-center text-center space-y-1.5">
                  {/* Step Circle & Connecting Bar */}
                  <div className="relative w-full flex items-center justify-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-colors z-10 ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-400 ring-4 ring-blue-500/20 shadow-md shadow-blue-500/30'
                          : isPast
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.step}
                    </div>
                  </div>

                  {/* Step Label */}
                  <div className="min-w-0 px-1">
                    <span
                      className={`text-[11px] font-bold block truncate ${
                        isCurrent ? 'text-blue-300' : isPast ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block truncate">
                      {s.sublabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Note Banner */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
              <span className="font-medium text-slate-200">
                Bước {currentStep}/4: <span className="text-white font-semibold">{stageNote}</span>
              </span>
            </div>

            <button
              onClick={handleViewDetails}
              className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span>Xem tiến trình</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* 4. Action Confirmation Dialog (An Toàn Tương Tác: Chống bấm nhầm Gọi Thợ khi demo) */}
      <AnimatePresence>
        {showCallModal && activeOrder.worker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Xác nhận gọi kỹ thuật viên</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCallModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <p className="text-xs text-slate-300">
                  Kỹ thuật viên phụ trách: <span className="font-bold text-white">{activeOrder.worker.fullName}</span>
                </p>
                <p className="text-xs text-slate-300">
                  Số điện thoại: <span className="font-mono font-bold text-blue-400">{activeOrder.worker.phone}</span>
                </p>
                <p className="text-[11px] text-slate-400 pt-1">
                  Hệ thống sẽ chuyển tiếp cuộc gọi qua trình quay số của thiết bị.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCallModal(false)}
                  className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <a
                  href={`tel:${activeOrder.worker.phone}`}
                  onClick={() => setShowCallModal(false)}
                  className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Gọi ngay</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ActiveOrderWidget;

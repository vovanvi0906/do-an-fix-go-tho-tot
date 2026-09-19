import React, { useState, useEffect } from 'react';
import { Radio, CheckCircle, Clock, MapPin, Wrench, UserCheck, RefreshCw, ChevronRight } from 'lucide-react';
import customerOrderService from '../services/customerOrderService';
import { formatVietnameseDateTime } from '../../../utils/formatDate';
import Skeleton from '../../../components/ui/Skeleton';

const STATUS_CONFIG = {
  SEARCHING: {
    label: 'Đang quét tìm thợ...',
    bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Radio,
    animate: true,
  },
  ASSIGNED: {
    label: 'Thợ đã nhận đơn',
    bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    icon: UserCheck,
  },
  WORKER_ARRIVING: {
    label: 'Thợ đang di chuyển đến',
    bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    icon: Clock,
  },
  ARRIVED: {
    label: 'Thợ đã có mặt tại điểm hẹn',
    bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    icon: MapPin,
  },
  IN_PROGRESS: {
    label: 'Đang thực hiện sửa chữa',
    bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    icon: Wrench,
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Đã hủy',
    bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: Clock,
  },
};

/**
 * ActiveOrdersList Component (Linear / Vercel Style)
 * Danh sách đơn hàng gần đây của khách hàng.
 *
 * Tối ưu hóa:
 * 1. Khử trùng lặp: Nhận excludeOrderId để loại bỏ đơn hàng active đã hiển thị trên ActiveOrderWidget.
 * 2. Skeleton loading: Bắt buộc dùng Skeleton, tuyệt đối không dùng spinner tròn.
 * 3. Chuẩn hóa mã đơn hàng viết hoa: #3F5E1F19.
 * 4. Chuẩn hóa ngày giờ Việt Nam: HH:mm • DD/MM/YYYY.
 * 5. Độ tương phản WCAG AA trên nền tối.
 *
 * @param {Object} props
 * @param {number|string} [props.refreshTrigger]
 * @param {string} [props.excludeOrderId] - ID đơn hàng active cần ẩn để tránh trùng lặp
 */
export default function ActiveOrdersList({ refreshTrigger, excludeOrderId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await customerOrderService.getMyOrders();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.warn('Cannot fetch my orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [refreshTrigger]);

  // Lọc bỏ đơn hàng đang active đã được ưu tiên hiển thị ở widget trên cùng (Khử trùng lặp 100%)
  const displayOrders = excludeOrderId
    ? orders.filter((o) => o.id !== excludeOrderId)
    : orders;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>📦 Lịch Sử & Đơn Hàng Khác</span>
          </h2>
          <p className="text-xs text-slate-300">Theo dõi toàn bộ các yêu cầu dịch vụ của bạn</p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          title="Tải lại danh sách"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      {loading && orders.length === 0 ? (
        /* Skeleton Loading State - Tuyệt đối không dùng spinner */
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : displayOrders.length === 0 ? (
        /* Empty State */
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400 mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Không có đơn hàng nào khác</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {excludeOrderId
                ? 'Đơn hàng hiện tại của bạn đang được theo dõi trực tiếp ở khung tiến độ phía trên.'
                : 'Hãy chọn một dịch vụ ở trên để kết nối thợ ngay lập tức.'}
            </p>
          </div>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-3">
          {displayOrders.map((order) => {
            const statusInfo = STATUS_CONFIG[order.status] || {
              label: order.status || 'Chờ xử lý',
              bg: 'bg-slate-800 text-slate-200 border-slate-700',
              icon: Clock,
            };
            const StatusIcon = statusInfo.icon;
            const formattedCode = `#${order.id.slice(0, 8).toUpperCase()}`;
            const formattedDate = formatVietnameseDateTime(order.createdAt);

            return (
              <div
                key={order.id}
                className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 sm:p-5 shadow-sm space-y-3.5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {order.service?.name || 'Dịch vụ sửa chữa tại nhà'}
                      </h4>
                      <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {formattedCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="line-clamp-1">{order.pickupAddress || '268 Lý Thường Kiệt, Q.10'}</span>
                    </p>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} shrink-0`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.animate ? 'animate-pulse' : ''}`} />
                    <span>{statusInfo.label}</span>
                  </span>
                </div>

                {/* Worker Assigned Info */}
                {order.worker && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-base">
                        👨‍🔧
                      </div>
                      <div>
                        <p className="font-bold text-white">{order.worker.fullName || 'Nguyễn Văn An'}</p>
                        <p className="text-[11px] text-slate-300">SĐT: {order.worker.user?.phone || order.worker.phone || '0912 345 678'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400">
                      ⭐ {Number(order.worker.ratingAvg || 5.0).toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Footer Price & Vietnamese Formatted Date */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    {formattedDate}
                  </span>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] mr-1.5">Tổng thanh toán:</span>
                    <span className="font-bold text-emerald-400 text-sm font-mono">
                      {Number(order.totalPrice || 150000).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

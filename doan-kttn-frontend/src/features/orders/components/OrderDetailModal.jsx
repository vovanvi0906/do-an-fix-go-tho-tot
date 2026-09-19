import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  User,
  Wrench,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Star,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  ShieldCheck,
  Send,
  Loader2,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { formatDate } from '../../../utils/formatDate';

export default function OrderDetailModal({
  isOpen,
  onClose,
  order,
  onUpdateStatus,
  onCancelOrder,
}) {
  if (!isOpen || !order) return null;

  const [newStatus, setNewStatus] = useState(order.status || 'CREATED');
  const [adminNote, setAdminNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Format Currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(amount) || 0);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (newStatus === order.status) return;
    try {
      setIsUpdating(true);
      await onUpdateStatus(order.id, newStatus, adminNote);
      setAdminNote('');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SEARCHING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Đang tìm thợ (Searching)</span>
          </span>
        );
      case 'ASSIGNED':
      case 'WORKER_ARRIVING':
      case 'ARRIVED':
      case 'IN_PROGRESS':
      case 'AWAITING_CONFIRMATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Đang thực hiện (In Progress)</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã hoàn thành (Completed)</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <XCircle className="w-3.5 h-3.5" />
            <span>Đã hủy / Lỗi (Cancelled)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: Order ID & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-10 border-b border-slate-100 dark:border-slate-800/80 pb-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-mono font-bold text-slate-900 dark:text-white tracking-tight">
                #{order.id.slice(0, 8).toUpperCase()}
              </h2>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Khởi tạo: {formatDate(order.createdAt)}</span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Tổng thanh toán
            </span>
            <span className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(order.totalPrice)}
            </span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar text-xs">
          {/* 2-Column: Customer & Worker Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Customer Info Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                <User className="w-4 h-4 text-blue-500" />
                <span>Khách hàng đặt dịch vụ</span>
              </div>
              <div className="space-y-1 pl-1">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {order.customer?.fullName || 'Khách vãng lai'}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span className="font-mono">{order.customer?.user?.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{order.customer?.user?.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Worker Info Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-amber-500" />
                <span>Đối tác thợ đảm nhận</span>
              </div>
              {order.worker ? (
                <div className="space-y-1 pl-1">
                  <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
                    <span>{order.worker.fullName}</span>
                    <span className="inline-flex items-center gap-1 text-amber-500 font-bold text-xs">
                      <Star className="w-3 h-3 fill-amber-500" />
                      <span>{order.worker.ratingAvg ? Number(order.worker.ratingAvg).toFixed(1) : '5.0'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="font-mono">{order.worker.user?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{order.worker.user?.email || 'N/A'}</span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin shrink-0" />
                  <span>Chưa có thợ nhận đơn. Hệ thống đang phát sóng radar tìm thợ gần nhất.</span>
                </div>
              )}
            </div>
          </div>

          {/* Service & Location Detail */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-500" />
                <span>Dịch vụ đăng ký: {order.service?.name}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold text-[11px]">
                {order.service?.category?.name || 'Dịch vụ gia đình'}
              </span>
            </div>

            <div className="space-y-1.5 pt-1 text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Địa chỉ phục vụ:</strong> {order.pickupAddress || 'Chưa cung cấp'}
                </span>
              </div>
              {order.note && (
                <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Ghi chú của khách:</strong> "{order.note}"
                  </span>
                </div>
              )}
              {order.cancellationReason && (
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
                  Lý do hủy đơn: {order.cancellationReason}
                </div>
              )}
            </div>
          </div>

          {/* Admin Status Manual Override Form */}
          <form
            onSubmit={handleStatusSubmit}
            className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>Quản trị viên can thiệp trạng thái</span>
              </div>
              <span className="text-[10.5px] text-slate-400">
                Xử lý sự cố / Khiếu nại
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-4">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
                >
                  <option value="SEARCHING">SEARCHING (Tìm thợ)</option>
                  <option value="ASSIGNED">ASSIGNED (Đã gán thợ)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Đang làm)</option>
                  <option value="COMPLETED">COMPLETED (Hoàn tất)</option>
                  <option value="CANCELLED">CANCELLED (Đã hủy)</option>
                </select>
              </div>

              <div className="sm:col-span-8 flex gap-2">
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ghi chú can thiệp (VD: Khách hàng yêu cầu đổi lịch...)"
                  className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isUpdating || newStatus === order.status}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {isUpdating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Lưu</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => onCancelOrder(order)}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30 transition-colors cursor-pointer"
          >
            Hủy đơn này
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition-all hover:opacity-90 cursor-pointer"
          >
            Đóng chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}

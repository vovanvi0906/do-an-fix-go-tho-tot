import React, { useState, useEffect } from 'react';
import { adminOrdersService } from '../services/adminOrders.service';
import OrderDetailModal from '../components/OrderDetailModal';
import CancelOrderModal from '../components/CancelOrderModal';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  Trash2,
  X,
  MapPin,
  Calendar,
  User,
  Wrench,
  DollarSign,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { formatDate } from '../../../utils/formatDate';

/**
 * Enterprise Orders Management CRUD Page for Admin (OrdersManagementPage.jsx)
 * - Vercel / Linear Style Enterprise Data Grid
 * - 5 Status Tabs: Tất cả đơn, Đang tìm thợ, Đang thực hiện, Đã hoàn thành, Đã hủy
 * - 6-Column Data Table with 2-way Client/Worker identities, Monospace IDs, Emerald Currency
 * - Custom Glassmorphism Confirmation Modal for Cancellation / Deletion (Zero window.confirm)
 * - Glassmorphism Toast Notifications for instant operation feedback
 * - Viewport Lock with Internal Smooth Table Scroll, Strict 8pt Grid System
 */
export default function OrdersManagementPage() {
  // State Management
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals & Target State
  const [detailOrder, setDetailOrder] = useState(null);
  const [cancelOrderTarget, setCancelOrderTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Format Currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(amount) || 0);
  };

  // Fetch Orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminOrdersService.getOrders({
        status: activeTab === 'ALL' ? undefined : activeTab,
        categoryId: selectedCategory === 'ALL' ? undefined : selectedCategory,
        search: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (res?.data) {
        setOrders(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else if (Array.isArray(res)) {
        setOrders(res);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      showToast('error', 'Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab, selectedCategory, pagination.page]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'SEARCHING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-[11px] font-semibold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Đang tìm thợ</span>
          </span>
        );
      case 'ASSIGNED':
      case 'WORKER_ARRIVING':
      case 'ARRIVED':
      case 'IN_PROGRESS':
      case 'AWAITING_CONFIRMATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span>Đang thực hiện</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Hoàn thành</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-semibold">
            <XCircle className="w-3 h-3" />
            <span>Đã hủy</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
            {status}
          </span>
        );
    }
  };

  // Cancel / Delete Order Handler (Via Custom Modal)
  const handleConfirmCancel = async (reason) => {
    if (!cancelOrderTarget) return;
    try {
      setIsCancelling(true);
      await adminOrdersService.cancelOrder(cancelOrderTarget.id, reason);
      showToast('success', `Đã hủy đơn hàng #${cancelOrderTarget.id.slice(0, 8).toUpperCase()} thành công.`);
      setCancelOrderTarget(null);
      if (detailOrder?.id === cancelOrderTarget.id) {
        setDetailOrder(null);
      }
      fetchOrders();
    } catch (err) {
      showToast('error', err.friendlyMessage || 'Lỗi khi hủy đơn hàng.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Update Status from Detail Drawer
  const handleUpdateStatus = async (orderId, newStatus, note) => {
    try {
      await adminOrdersService.updateOrderStatus(orderId, newStatus, note);
      showToast('success', `Đã cập nhật trạng thái đơn #${orderId.slice(0, 8).toUpperCase()} sang ${newStatus}.`);
      setDetailOrder(null);
      fetchOrders();
    } catch (err) {
      showToast('error', err.friendlyMessage || 'Lỗi khi cập nhật trạng thái đơn hàng.');
    }
  };

  return (
    <div className="h-full flex flex-col justify-between select-none space-y-3 overflow-hidden transition-colors duration-200">
      {/* ========================================= */}
      {/* GLASSMORPHISM TOAST NOTIFICATION (TOP RIGHT) */}
      {/* ========================================= */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 p-3.5 rounded-xl border backdrop-blur-xl transition-all duration-200 flex items-center gap-2.5 shadow-2xl animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-rose-950/85 border-rose-500/40 text-rose-200 shadow-rose-950/50'
              : 'bg-emerald-950/85 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <div className="text-xs font-semibold pr-2">{toast.message}</div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================= */}
      {/* 1. HEADER ROW: TIÊU ĐỀ & LÀM MỚI */}
      {/* ========================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Quản Lý Đơn Hàng Hệ Thống
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/30">
              ORDERS CRUD
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Theo dõi vòng đời đơn đặt dịch vụ, giám sát tiến độ và xử lý các sự cố phát sinh
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`}
            />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* 2. FILTER TABS & SEARCH / CATEGORY TOOLBAR */}
      {/* ========================================= */}
      <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-[#1e293b]/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        {/* 5 Status Tabs: Segmented Control */}
        <div className="p-1 rounded-lg bg-slate-200/60 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center text-xs w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tất Cả Đơn ({activeTab === 'ALL' ? pagination.total || orders.length : '•'})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SEARCHING')}
            className={`px-3 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${
              activeTab === 'SEARCHING'
                ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Đang Tìm Thợ (Searching)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('IN_PROGRESS')}
            className={`px-3 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${
              activeTab === 'IN_PROGRESS'
                ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Đang Thực Hiện (In Progress)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-3 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${
              activeTab === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Đã Hoàn Thành (Completed)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-3 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${
              activeTab === 'CANCELLED'
                ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Đã Hủy / Lỗi (Cancelled)
          </button>
        </div>

        {/* Search & Category Filter Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã đơn, tên khách, thợ..."
              className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-2.5 pr-7 py-1.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer shadow-2xs font-medium"
            >
              <option value="ALL">Tất cả ngành nghề</option>
              <option value="dien-dan-dung">Điện dân dụng</option>
              <option value="dien-lanh">Điện lạnh</option>
              <option value="duong-ong-nuoc">Đường ống nước</option>
              <option value="khoa-cua">Khóa cửa</option>
              <option value="ve-sinh">Vệ sinh</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* 3. ORDERS DATA GRID (6 DEDICATED COLUMNS) */}
      {/* ========================================= */}
      <div className="flex-1 min-h-0 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between overflow-hidden">
        <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            {/* Header: 6 Columns */}
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#1e293b]/70 backdrop-blur-xs text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold sticky top-0 z-10">
                <th className="py-2.5 px-4">1. Mã Đơn & Dịch Vụ</th>
                <th className="py-2.5 px-4">2. Khách Hàng & Thợ</th>
                <th className="py-2.5 px-4">3. Giá Trị Đơn</th>
                <th className="py-2.5 px-4">4. Trạng Thái Đơn</th>
                <th className="py-2.5 px-4">5. Thời Gian Tạo</th>
                <th className="py-2.5 px-4 text-right">6. Thao Tác</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs text-slate-700 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    <span className="text-xs font-medium">Đang tải dữ liệu đơn hàng hệ thống...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      Không tìm thấy đơn hàng nào
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const shortId = `#ORD-${order.id.slice(0, 6).toUpperCase()}`;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150 group"
                    >
                      {/* Cột 1: Mã Đơn & Dịch Vụ */}
                      <td className="py-2 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 tracking-tight">
                              {shortId}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 truncate max-w-[120px]">
                              {order.service?.category?.name || 'Sửa chữa'}
                            </span>
                          </div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] text-xs">
                            {order.service?.name || 'Dịch vụ yêu cầu'}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Khách Hàng & Thợ (2 chiều) */}
                      <td className="py-2 px-4">
                        <div className="space-y-1">
                          {/* Khách đặt */}
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 text-xs truncate">
                            <User className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="font-medium truncate">
                              {order.customer?.fullName || 'Khách vãng lai'}
                            </span>
                          </div>

                          {/* Thợ nhận */}
                          <div className="flex items-center gap-1.5 text-xs truncate">
                            <Wrench className="w-3 h-3 text-amber-500 shrink-0" />
                            {order.worker ? (
                              <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                                {order.worker.fullName}
                              </span>
                            ) : (
                              <span className="text-amber-500/80 text-[10.5px] italic">
                                Chưa gán thợ
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Giá Trị Đơn Hàng (Xanh ngọc font-mono nổi bật) */}
                      <td className="py-2 px-4">
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          {formatCurrency(order.totalPrice)}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {order.payment?.status === 'PAID' ? 'Đã thanh toán' : 'Tiền mặt/Chờ trả'}
                        </div>
                      </td>

                      {/* Cột 4: Trạng Thái Đơn */}
                      <td className="py-2 px-4">
                        {renderStatusBadge(order.status)}
                      </td>

                      {/* Cột 5: Thời Gian Tạo */}
                      <td className="py-2 px-4">
                        <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                          <div>{formatDate(order.createdAt)}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Cột 6: Thao Tác (Actions) */}
                      <td className="py-2 px-4 text-right">
                        <div className="inline-flex items-center gap-1 opacity-75 group-hover:opacity-100 transition-opacity duration-150">
                          {/* Nút Xem chi tiết đơn */}
                          <button
                            type="button"
                            onClick={() => setDetailOrder(order)}
                            className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút Hủy đơn (Custom Glassmorphism Modal) */}
                          {order.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => setCancelOrderTarget(order)}
                              className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                              title="Hủy đơn hàng này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ========================================= */}
        {/* 4. PAGINATION FOOTER (CHUẨN VERCEL STYLE) */}
        {/* ========================================= */}
        <div className="p-2 sm:p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#1e293b]/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div>
            Hiển thị{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              {orders.length}
            </span>{' '}
            trong tổng số{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              {pagination.total || orders.length}
            </span>{' '}
            đơn đặt dịch vụ
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
              className="p-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors cursor-pointer shadow-2xs"
              title="Trang trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 font-bold font-mono text-xs shadow-2xs">
              {pagination.page} / {pagination.totalPages || 1}
            </span>

            <button
              disabled={
                pagination.page >= (pagination.totalPages || 1) || loading
              }
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
              className="p-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors cursor-pointer shadow-2xs"
              title="Trang tiếp"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* 5. ENTERPRISE MODALS (ZERO WINDOW.CONFIRM) */}
      {/* ========================================= */}

      {/* Modal 1: Chi Tiết Đơn Hàng & Can Thiệp Trạng Thái */}
      <OrderDetailModal
        isOpen={Boolean(detailOrder)}
        onClose={() => setDetailOrder(null)}
        order={detailOrder}
        onUpdateStatus={handleUpdateStatus}
        onCancelOrder={(ord) => {
          setDetailOrder(null);
          setCancelOrderTarget(ord);
        }}
      />

      {/* Modal 2: Xác Nhận Hủy Đơn Hàng (Thay Thế Hoàn Toàn window.confirm) */}
      <CancelOrderModal
        isOpen={Boolean(cancelOrderTarget)}
        onClose={() => setCancelOrderTarget(null)}
        onConfirm={handleConfirmCancel}
        orderId={cancelOrderTarget?.id}
        isSubmitting={isCancelling}
      />
    </div>
  );
}

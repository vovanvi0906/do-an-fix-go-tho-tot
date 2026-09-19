import React, { useState, useEffect } from 'react';
import { workersAdminService } from '../services/workersAdminService';
import RejectWorkerModal from '../components/RejectWorkerModal';
import WorkerDetailModal from '../components/WorkerDetailModal';
import ConfirmActionModal from '../components/ConfirmActionModal';
import {
  Briefcase,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Star,
  ShieldCheck,
  Radio,
  X,
  Trash2,
  Eye,
  Wrench,
  Loader2,
} from 'lucide-react';

/**
 * Enterprise Worker Management Portal (WorkersManagementPage.jsx)
 * - Triệt tiêu 100% native browser confirm/alert dialogs bằng ConfirmActionModal & RejectWorkerModal
 * - Data-Dense, 6 cột đặc trị cho thợ đối tác
 * - 4 Tab bộ lọc trạng thái: Tất cả thợ, Chờ phê duyệt, Đã phê duyệt, Đang trực tuyến (5km)
 * - Glassmorphism Toast Notification góc trên bên phải
 * - 8pt Grid System và Scroll Lock (Internal scroll)
 */
export default function WorkersManagementPage() {
  // State Management
  const [workers, setWorkers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter Tabs: ALL, PENDING, APPROVED, ONLINE
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Action Targets
  const [detailTarget, setDetailTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [approveTarget, setApproveTarget] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Workers Data from GET /api/admin/workers
  const fetchWorkers = async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
      };

      if (activeTab === 'PENDING') {
        params.approvalStatus = 'PENDING';
      } else if (activeTab === 'APPROVED') {
        params.approvalStatus = 'APPROVED';
      } else if (activeTab === 'ONLINE') {
        params.isOnline = 'true';
      }

      const res = await workersAdminService.getWorkers(params);

      if (res?.data) {
        setWorkers(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else if (Array.isArray(res)) {
        setWorkers(res);
      }
    } catch (err) {
      console.error('Fetch workers error:', err);
      showToast('error', 'Không thể tải danh sách thợ đối tác. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [activeTab, pagination.page]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchWorkers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkers();
  };

  // Approve Handler (via Custom Modal)
  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    try {
      setIsApproving(true);
      await workersAdminService.approveWorker(approveTarget.id || approveTarget.userId);
      showToast('success', `Đã phê duyệt hồ sơ thợ "${approveTarget.fullName}" thành công.`);
      setApproveTarget(null);
      fetchWorkers();
    } catch (err) {
      showToast('error', err.friendlyMessage || 'Lỗi khi phê duyệt hồ sơ.');
    } finally {
      setIsApproving(false);
    }
  };

  // Reject Handler (via RejectWorkerModal)
  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    try {
      setIsRejecting(true);
      await workersAdminService.rejectWorker(rejectTarget.id || rejectTarget.userId, reason);
      showToast('success', `Đã từ chối hồ sơ thợ "${rejectTarget.fullName}".`);
      setRejectTarget(null);
      fetchWorkers();
    } catch (err) {
      showToast('error', err.friendlyMessage || 'Lỗi khi từ chối hồ sơ.');
    } finally {
      setIsRejecting(false);
    }
  };

  // Delete / Lock Handler (via ConfirmActionModal - Zero window.confirm!)
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await workersAdminService.deleteWorker(deleteTarget.id || deleteTarget.userId);
      showToast('success', `Đã khóa/xóa tài khoản thợ "${deleteTarget.fullName}" thành công.`);
      setDeleteTarget(null);
      fetchWorkers();
    } catch (err) {
      showToast('error', err.friendlyMessage || 'Lỗi khi khóa tài khoản.');
    } finally {
      setIsDeleting(false);
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
              Quản Lý Đối Tác Thợ (Worker Portal)
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
              CHUYÊN BIỆT
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kiểm duyệt hồ sơ, giám sát vị trí trực tuyến và theo dõi chỉ số hiệu suất của thợ đối tác
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Làm mới dữ liệu thợ"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`}
            />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* 2. FILTER TABS & SEARCH TOOLBAR */}
      {/* ========================================= */}
      <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-[#1e293b]/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        {/* 4 Dedicated Tabs for Worker Status */}
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
            Tất Cả Thợ ({activeTab === 'ALL' ? pagination.total || workers.length : '•'})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${
              activeTab === 'PENDING'
                ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Chờ Phê Duyệt Hồ Sơ (Pending)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('APPROVED')}
            className={`px-3 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${
              activeTab === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Đã Phê Duyệt (Approved)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ONLINE')}
            className={`px-3 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ONLINE'
                ? 'bg-teal-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Đang Trực Tuyến (Online)</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên thợ, SĐT, email..."
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
      </div>

      {/* ========================================= */}
      {/* 3. WORKER DATA GRID (6 DEDICATED COLUMNS) */}
      {/* ========================================= */}
      <div className="flex-1 min-h-0 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between overflow-hidden">
        <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            {/* Header: 6 Columns */}
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#1e293b]/70 backdrop-blur-xs text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold sticky top-0 z-10">
                <th className="py-2.5 px-4">1. Thông Tin Thợ</th>
                <th className="py-2.5 px-4">2. Liên Hệ</th>
                <th className="py-2.5 px-4">3. Trạng Thái Duyệt</th>
                <th className="py-2.5 px-4">4. Trạng Thái Trực Tuyến</th>
                <th className="py-2.5 px-4">5. Hiệu Suất</th>
                <th className="py-2.5 px-4 text-right">6. Thao Tác</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs text-slate-700 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    <span className="text-xs font-medium">Đang tải dữ liệu hồ sơ đối tác thợ...</span>
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      Không tìm thấy hồ sơ thợ nào
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Thử đổi tab trạng thái hoặc từ khóa tìm kiếm
                    </p>
                  </td>
                </tr>
              ) : (
                workers.map((worker) => {
                  const status = worker.approvalStatus || 'PENDING';
                  const isPending = status === 'PENDING';
                  const isApproved = status === 'APPROVED';

                  // Service specialty badge
                  const serviceName =
                    worker.workerServices?.[0]?.service?.name ||
                    worker.skills?.[0] ||
                    'Sửa chữa đa năng';

                  return (
                    <tr
                      key={worker.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150 group"
                    >
                      {/* Cột 1: Thông tin thợ */}
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-700 flex items-center justify-center text-white font-bold text-xs uppercase shadow-xs shrink-0">
                            {worker.fullName ? worker.fullName.charAt(0) : 'W'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white leading-tight truncate text-xs flex items-center gap-1.5">
                              <span>{worker.fullName || 'Chưa đặt tên'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                                ID: {worker.id.slice(0, 8)}...
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {serviceName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Liên hệ */}
                      <td className="py-2 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs truncate">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{worker.user?.email || 'N/A'}</span>
                          </div>
                          {worker.user?.phone && (
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10.5px] font-mono">
                              <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span>{worker.user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cột 3: Trạng thái Duyệt & Nút Thao Tác Nhanh */}
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[10.5px] font-semibold animate-pulse">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Chờ duyệt</span>
                            </span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-semibold">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Đã duyệt</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200/70 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-[10.5px] font-semibold">
                              <XCircle className="w-2.5 h-2.5" />
                              <span>Từ chối</span>
                            </span>
                          )}

                          {/* Quick Approve / Reject triggers modal */}
                          {isPending && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setApproveTarget(worker)}
                                className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                                title="Phê duyệt nhanh"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget(worker)}
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                                title="Từ chối hồ sơ"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cột 4: Trạng thái Trực tuyến */}
                      <td className="py-2 px-4">
                        <div className="space-y-0.5">
                          {worker.isOnline ? (
                            <div className="flex items-center gap-1.5 text-emerald-500 font-semibold text-xs">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                              </span>
                              <span>Trực tuyến (5km)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                              <span className="h-2 w-2 rounded-full bg-slate-400/50" />
                              <span>Ngoại tuyến</span>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 truncate">
                            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{worker.currentAddress || 'TP. Hồ Chí Minh'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 5: Hiệu suất */}
                      <td className="py-2 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{worker.ratingAvg ? Number(worker.ratingAvg).toFixed(1) : '5.0'}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({worker.totalReviews || 0})
                            </span>
                          </div>
                          <div className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400">
                            Hoàn thành: <strong className="text-slate-700 dark:text-slate-200">{worker.totalJobs ?? 0}</strong> đơn
                          </div>
                        </div>
                      </td>

                      {/* Cột 6: Thao tác (Custom Modals thay thế native window.confirm!) */}
                      <td className="py-2 px-4 text-right">
                        <div className="inline-flex items-center gap-1 opacity-75 group-hover:opacity-100 transition-opacity duration-150">
                          {/* Nút Xem chi tiết hồ sơ */}
                          <button
                            type="button"
                            onClick={() => setDetailTarget(worker)}
                            className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Xem chi tiết hồ sơ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút Phê duyệt nếu chưa duyệt */}
                          {!isApproved && (
                            <button
                              type="button"
                              onClick={() => setApproveTarget(worker)}
                              className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors cursor-pointer"
                              title="Phê duyệt hồ sơ"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Nút Khóa / Xóa tài khoản thợ (Mở ConfirmActionModal) */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(worker)}
                            className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Khóa/Xóa tài khoản đối tác"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
              {workers.length}
            </span>{' '}
            trong tổng số{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              {pagination.total || workers.length}
            </span>{' '}
            đối tác thợ
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

      {/* Modal 1: Xem Chi Tiết Hồ Sơ Thợ */}
      <WorkerDetailModal
        isOpen={Boolean(detailTarget)}
        onClose={() => setDetailTarget(null)}
        worker={detailTarget}
      />

      {/* Modal 2: Từ Chối Hồ Sơ Kèm Lý Do */}
      <RejectWorkerModal
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        workerName={rejectTarget?.fullName}
        isSubmitting={isRejecting}
      />

      {/* Modal 3: Xác Nhận Khóa / Xóa Tài Khoản (Thay thế window.confirm) */}
      <ConfirmActionModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác Nhận Khóa / Xóa Tài Khoản Thợ"
        message="Hành động này sẽ vô hiệu hóa tài khoản và thu hồi quyền nhận đơn của đối tác thợ trên toàn bộ hệ thống FixGo."
        targetName={deleteTarget?.fullName}
        confirmText="Xác Nhận Khóa"
        variant="danger"
        isSubmitting={isDeleting}
      />

      {/* Modal 4: Xác Nhận Phê Duyệt Hồ Sơ Thợ */}
      <ConfirmActionModal
        isOpen={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApproveConfirm}
        title="Xác Nhận Phê Duyệt Hồ Sơ Thợ"
        message="Sau khi phê duyệt, đối tác thợ sẽ chính thức được cấp quyền bật sóng trực tuyến và nhận đơn hàng trong bán kính 5km."
        targetName={approveTarget?.fullName}
        confirmText="Phê Duyệt Ngay"
        variant="success"
        isSubmitting={isApproving}
      />
    </div>
  );
}

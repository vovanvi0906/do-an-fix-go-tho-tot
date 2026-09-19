import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/authStore';
import { userService } from '../services/user.service';
import UserModal from '../components/UserModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  X,
} from 'lucide-react';
import { formatDate } from '../../../utils/formatDate';

/**
 * Enterprise-Grade Users Management Page (Linear / Vercel Style)
 * - Data-Dense, compact row padding, ultra-sharp typography
 * - Segmented control role tabs with smooth active styling
 * - Integrated single-row search, status filter, and primary action
 * - Internal scroll container locking the outer viewport
 * - Strict 8pt Grid adherence (p-3, gap-2, space-y-2)
 */
export default function UsersPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // State Management
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedRoleTab, setSelectedRoleTab] = useState('ALL'); // ALL, CUSTOMER, WORKER, ADMIN
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Action States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers({
        role: selectedRoleTab === 'ALL' ? undefined : selectedRoleTab,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (res?.data) {
        setUsers(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      showToast('error', 'Không thể tải danh sách người dùng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRoleTab, selectedStatus, pagination.page]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Create or Update Submit Handler
  const handleSaveUser = async (formData) => {
    try {
      setIsSubmitting(true);
      if (editingUser) {
        // Update
        await userService.updateUser(editingUser.id, formData);
        showToast(
          'success',
          `Đã cập nhật thông tin "${formData.fullName}" thành công.`
        );
      } else {
        // Create
        await userService.createUser(formData);
        showToast(
          'success',
          `Đã tạo tài khoản "${formData.fullName}" thành công.`
        );
      }
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Save user failed:', err);
      showToast(
        'error',
        err.response?.data?.message ||
          err.message ||
          'Lỗi khi lưu thông tin người dùng.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler with Constraints
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    // Ràng buộc bảo vệ
    if (deleteTarget.id === currentUser?.id || deleteTarget.email === currentUser?.email) {
      showToast('error', 'Bạn không thể tự xóa tài khoản của chính mình.');
      setDeleteTarget(null);
      return;
    }

    if (deleteTarget.role === 'ADMIN') {
      showToast('error', 'Không thể xóa tài khoản Quản trị viên (Admin).');
      setDeleteTarget(null);
      return;
    }

    try {
      setIsDeleting(true);
      await userService.deleteUser(deleteTarget.id);
      showToast(
        'success',
        `Đã xóa tài khoản "${deleteTarget.fullName}" thành công.`
      );
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      console.error('Delete user failed:', err);
      showToast(
        'error',
        err.response?.data?.message || err.message || 'Lỗi khi xóa người dùng.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Worker Approve / Reject
  const handleApproveWorker = async (workerId, name) => {
    try {
      await userService.approveWorker(workerId);
      showToast('success', `Đã phê duyệt hồ sơ thợ "${name}" thành công.`);
      fetchUsers();
    } catch (err) {
      showToast('error', 'Lỗi khi phê duyệt hồ sơ.');
    }
  };

  const handleRejectWorker = async (workerId, name) => {
    try {
      await userService.rejectWorker(workerId);
      showToast('success', `Đã từ chối hồ sơ thợ "${name}".`);
      fetchUsers();
    } catch (err) {
      showToast('error', 'Lỗi khi từ chối hồ sơ.');
    }
  };

  return (
    <div className="h-full flex flex-col justify-between select-none transition-colors duration-200 overflow-hidden space-y-2">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 p-3.5 rounded-xl border backdrop-blur-xl transition-all duration-200 flex items-start gap-2.5 shadow-2xl animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-rose-950/85 border-rose-500/40 text-rose-200 shadow-rose-950/50'
              : 'bg-emerald-950/85 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-semibold pr-2">{toast.message}</div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================= */}
      {/* 1. HEADER ROW: TIÊU ĐỀ & NÚT HÀNH ĐỘNG CHÍNH */}
      {/* ========================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Quản Lý Người Dùng
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Phân quyền tài khoản Khách hàng, Đối tác Thợ và Quản trị viên hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
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

          <button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold tracking-wide shadow-xs shadow-blue-500/25 active:scale-95 transition-all cursor-pointer border border-blue-400/20"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Thêm Người Dùng</span>
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* 2. FILTER & ACTION TOOLBAR (TRÊN CÙNG HÀNG NGANG) */}
      {/* ========================================= */}
      <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-[#1e293b]/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-2.5 shrink-0">
        {/* Role Tabs: Segmented Control Liền Mạch */}
        <div className="p-1 rounded-lg bg-slate-200/60 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center text-xs w-full md:w-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedRoleTab('ALL')}
            className={`px-3 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${
              selectedRoleTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tất Cả ({pagination.total || users.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedRoleTab('CUSTOMER')}
            className={`px-3 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${
              selectedRoleTab === 'CUSTOMER'
                ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Khách Hàng
          </button>

          <button
            type="button"
            onClick={() => setSelectedRoleTab('WORKER')}
            className={`px-3 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${
              selectedRoleTab === 'WORKER'
                ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Đối Tác Thợ
          </button>

          <button
            type="button"
            onClick={() => setSelectedRoleTab('ADMIN')}
            className={`px-3 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium whitespace-nowrap ${
              selectedRoleTab === 'ADMIN'
                ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Search Input & Status Dropdown Nằm Gọn Cùng Hàng */}
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
              placeholder="Tìm tên, email, SĐT..."
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

          {/* Status Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="pl-2.5 pr-7 py-1.5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer shadow-2xs font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động (Active)</option>
              <option value="BLOCKED">Tạm khóa (Blocked)</option>
              <option value="PENDING">Chờ duyệt (Pending)</option>
              <option value="APPROVED">Đã duyệt (Approved)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* 3. DATA TABLE CARD (DATA-DENSE, VIỀN MỎNG) */}
      {/* ========================================= */}
      <div className="flex-1 min-h-0 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between overflow-hidden">
        {/* Table Container với Internal Scroll */}
        <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            {/* Table Header: Đồng nhất bg-[#1e293b]/70, text-[10px] uppercase */}
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#1e293b]/70 backdrop-blur-xs text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold sticky top-0 z-10">
                <th className="py-2.5 px-3.5">Người Dùng</th>
                <th className="py-2.5 px-3.5">Liên Hệ</th>
                <th className="py-2.5 px-3.5">Vai Trò</th>
                <th className="py-2.5 px-3.5">Trạng Thái</th>
                <th className="py-2.5 px-3.5">Ngày Tạo</th>
                <th className="py-2.5 px-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs text-slate-700 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    <span className="text-xs font-medium">Đang tải dữ liệu người dùng...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      Không tìm thấy người dùng nào
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const isWorker = item.role === 'WORKER';
                  const isAdmin = item.role === 'ADMIN';
                  const isSelf = item.id === currentUser?.id || item.email === currentUser?.email;
                  const canDelete = !isAdmin && !isSelf;

                  const isPendingWorker =
                    isWorker && item.approvalStatus === 'PENDING';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors duration-150 group"
                    >
                      {/* Cột 1: Người Dùng (Avatar bo tròn gradient + ID Mono) */}
                      <td className="py-2 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 flex items-center justify-center text-white font-bold text-[11px] uppercase shadow-xs shrink-0">
                            {item.fullName ? item.fullName.charAt(0) : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white leading-tight truncate text-xs flex items-center gap-1.5">
                              <span>{item.fullName || 'Chưa đặt tên'}</span>
                              {isSelf && (
                                <span className="text-[9.5px] font-semibold text-blue-600 dark:text-blue-400">
                                  (Bạn)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              ID: {item.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Liên Hệ (Email + SĐT chung 1 ô) */}
                      <td className="py-2 px-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs truncate">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{item.email || 'N/A'}</span>
                          </div>
                          {item.phone && (
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10.5px] font-mono">
                              <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span>{item.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cột 3: Vai Trò (Badge bo góc sắc sảo) */}
                      <td className="py-2 px-3.5">
                        {isWorker ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[10.5px] font-semibold">
                            <Briefcase className="w-2.5 h-2.5" />
                            <span>Thợ</span>
                          </span>
                        ) : isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-[10.5px] font-semibold">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>Admin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-[10.5px] font-semibold">
                            <Users className="w-2.5 h-2.5" />
                            <span>Khách Hàng</span>
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Trạng Thái */}
                      <td className="py-2 px-3.5">
                        {item.status === 'BLOCKED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-[10.5px] font-semibold">
                            <XCircle className="w-2.5 h-2.5" />
                            <span>Tạm khóa</span>
                          </span>
                        ) : isPendingWorker ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[10.5px] font-semibold animate-pulse">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Chờ duyệt</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-semibold">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Hoạt động</span>
                          </span>
                        )}
                      </td>

                      {/* Cột 5: Ngày Tạo */}
                      <td className="py-2 px-3.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {item.createdAt ? formatDate(item.createdAt) : 'Mới tạo'}
                      </td>

                      {/* Cột 6: Thao Tác (Action Icons tinh tế hiện rõ khi hover) */}
                      <td className="py-2 px-3.5 text-right">
                        <div className="inline-flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-150">
                          {/* Worker Approval Shortcut */}
                          {isPendingWorker && (
                            <>
                              <button
                                onClick={() =>
                                  handleApproveWorker(item.id, item.fullName)
                                }
                                className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors cursor-pointer"
                                title="Phê duyệt thợ"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleRejectWorker(item.id, item.fullName)
                                }
                                className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 transition-colors cursor-pointer"
                                title="Từ chối thợ"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setEditingUser(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            disabled={!canDelete}
                            onClick={() => {
                              if (!canDelete) {
                                if (isSelf) {
                                  showToast('error', 'Bạn không thể tự xóa tài khoản của chính mình.');
                                } else if (isAdmin) {
                                  showToast('error', 'Không thể xóa tài khoản Quản trị viên (Admin).');
                                }
                                return;
                              }
                              setDeleteTarget(item);
                            }}
                            className={`p-1.5 rounded-md border transition-colors ${
                              canDelete
                                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-pointer'
                                : 'opacity-25 cursor-not-allowed text-slate-400 dark:text-slate-600 border-transparent'
                            }`}
                            title={
                              isSelf
                                ? 'Không thể tự xóa tài khoản của chính mình'
                                : isAdmin
                                ? 'Không thể xóa tài khoản Quản trị viên (Admin)'
                                : 'Xóa người dùng'
                            }
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
              {users.length}
            </span>{' '}
            trong tổng số{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              {pagination.total || users.length}
            </span>{' '}
            người dùng
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

      {/* User Create / Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleSaveUser}
        initialData={editingUser}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        userName={deleteTarget?.fullName}
        isSubmitting={isDeleting}
      />
    </div>
  );
}

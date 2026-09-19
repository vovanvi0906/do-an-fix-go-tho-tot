import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Lock, FileText, Shield, Loader2, Check } from 'lucide-react';
import { EMAIL_REGEX, PHONE_REGEX } from '../../../utils/validation';

export default function UserModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
}) {
  const isEdit = Boolean(initialData);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    bio: '',
    cccdNumber: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        password: '',
        role: initialData.role || 'CUSTOMER',
        status: initialData.status || 'ACTIVE',
        bio: initialData.bio || '',
        cccdNumber: initialData.cccdNumber || '',
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        bio: '',
        cccdNumber: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được để trống';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = 'Email không đúng định dạng';
    }

    if (formData.phone && !PHONE_REGEX.test(formData.phone.trim().replace(/[\s.-]/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ (cần 10 chữ số)';
    }

    if (!isEdit && (!formData.password || formData.password.length < 6)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (formData.role === 'WORKER') {
      if (formData.cccdNumber && formData.cccdNumber.trim().length !== 12) {
        newErrors.cccdNumber = 'CCCD/CMND cần đúng 12 chữ số';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {isEdit ? 'Chỉnh Sửa Thông Tin Người Dùng' : 'Thêm Người Dùng Mới'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEdit ? 'Cập nhật chi tiết tài khoản' : 'Tạo mới tài khoản Khách hàng, Thợ hoặc Quản trị viên'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          
          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Họ và Tên <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
                className={`w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                  errors.fullName
                    ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/30'
                }`}
              />
            </div>
            {errors.fullName && <p className="text-[11px] text-rose-500 dark:text-rose-400">{errors.fullName}</p>}
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className={`w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                    errors.email
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/30'
                  }`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-500 dark:text-rose-400">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Số điện thoại
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0901234567"
                  className={`w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                    errors.phone
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/30'
                  }`}
                />
              </div>
              {errors.phone && <p className="text-[11px] text-rose-500 dark:text-rose-400">{errors.phone}</p>}
            </div>
          </div>

          {/* Password (if creating new) */}
          {!isEdit && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mật khẩu khởi tạo <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  className={`w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                    errors.password
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/30'
                  }`}
                />
              </div>
              {errors.password && <p className="text-[11px] text-rose-500 dark:text-rose-400">{errors.password}</p>}
            </div>
          )}

          {/* Role & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Role Selection */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Vai trò (Role)
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={isEdit}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 disabled:opacity-60 cursor-pointer"
              >
                <option value="CUSTOMER">Khách hàng (CUSTOMER)</option>
                <option value="WORKER">Thợ đối tác (WORKER)</option>
                <option value="ADMIN">Quản trị viên (ADMIN)</option>
              </select>
            </div>

            {/* Status Selection */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Trạng thái hoạt động
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="BLOCKED">Tạm khóa (BLOCKED)</option>
              </select>
            </div>
          </div>

          {/* Worker Extra Details (If Role is Worker) */}
          {formData.role === 'WORKER' && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                <span>Thông tin hồ sơ Thợ</span>
              </div>

              {/* CCCD Number */}
              <div className="space-y-1">
                <label className="block text-xs text-slate-700 dark:text-slate-300">Số CCCD / CMND (12 số)</label>
                <input
                  type="text"
                  value={formData.cccdNumber}
                  onChange={(e) => setFormData({ ...formData, cccdNumber: e.target.value })}
                  placeholder="079201009988"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
                {errors.cccdNumber && <p className="text-[11px] text-rose-500 dark:text-rose-400">{errors.cccdNumber}</p>}
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="block text-xs text-slate-700 dark:text-slate-300">Kinh nghiệm & Giới thiệu</label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Kinh nghiệm làm việc, tay nghề..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-60 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEdit ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

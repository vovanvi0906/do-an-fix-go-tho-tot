import React, { useState, useEffect } from 'react';
import { adminSettingsService } from '../services/adminSettings.service';
import {
  Settings,
  Save,
  Globe,
  Radio,
  Bell,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Mail,
  Phone,
  Compass,
  Percent,
  Clock,
  Zap,
  Smartphone,
  AlertTriangle,
  Server,
  Building,
} from 'lucide-react';

/**
 * Enterprise System Settings Page for Admin (SystemSettingsPage.jsx)
 * - 4 Functional Sub-tabs: Thông tin chung | Vận hành & Ghép đơn | Thông báo & API | Bảo trì hệ thống
 * - Micro-interactions, rounded-xl inputs, gradient Save button
 * - Prominent Red/Amber Maintenance Mode toggle banner
 * - Strict 8pt Grid System & Scroll Lock (Linear / Vercel style)
 * - Zero native alert / confirm dialogs
 */
export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'matching' | 'notifications' | 'maintenance'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    siteName: 'FixGo - Nền tảng Dịch vụ Cứu hộ & Sửa chữa',
    supportEmail: 'support@fixgo.vn',
    supportHotline: '1900-8888',
    maxSearchRadiusKm: 15.0,
    defaultCommissionRate: 15.0,
    orderTimeoutSeconds: 60,
    autoMatching: true,
    notifyOnArrival: true,
    smsOtpEnabled: true,
    maintenanceMode: false,
    maintenanceMessage: 'Hệ thống đang bảo trì nâng cấp định kỳ. Xin vui lòng quay lại sau ít phút!',
  });

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Current Settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await adminSettingsService.getSettings();
      if (res) {
        setFormData({
          siteName: res.siteName || '',
          supportEmail: res.supportEmail || '',
          supportHotline: res.supportHotline || '',
          maxSearchRadiusKm: res.maxSearchRadiusKm ?? 15,
          defaultCommissionRate: res.defaultCommissionRate ?? 15,
          orderTimeoutSeconds: res.orderTimeoutSeconds ?? 60,
          autoMatching: res.autoMatching ?? true,
          notifyOnArrival: res.notifyOnArrival ?? true,
          smsOtpEnabled: res.smsOtpEnabled ?? true,
          maintenanceMode: res.maintenanceMode ?? false,
          maintenanceMessage:
            res.maintenanceMessage ||
            'Hệ thống đang bảo trì nâng cấp định kỳ. Xin vui lòng quay lại sau ít phút!',
        });
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
      showToast('error', 'Không thể tải cấu hình hệ thống từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save Settings
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        maxSearchRadiusKm: Number(formData.maxSearchRadiusKm),
        defaultCommissionRate: Number(formData.defaultCommissionRate),
        orderTimeoutSeconds: Number(formData.orderTimeoutSeconds),
      };

      await adminSettingsService.updateSettings(payload);
      showToast('success', 'Đã lưu và áp dụng toàn bộ cấu hình hệ thống thành công!');
    } catch (err) {
      console.error('Save settings error:', err);
      showToast('error', err.friendlyMessage || 'Lỗi khi lưu cấu hình. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between select-none space-y-3.5 overflow-hidden transition-colors duration-200">
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
      {/* 1. HEADER ROW: TIÊU ĐỀ & NÚT LƯU CẤU HÌNH */}
      {/* ========================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Cài Đặt Hệ Thống
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/30">
              PLATFORM CONFIG
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý tham số vận hành, cấu hình không gian quét đơn, tỷ lệ chiết khấu và thông tin chung toàn nền tảng
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading || saving}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Khôi phục lại dữ liệu chưa lưu"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            <span className="hidden sm:inline">Khôi phục</span>
          </button>

          {/* Nút Lưu Cấu Hình Gradient Vercel */}
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shrink-0"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Cấu Hình</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* 2. SUB-TABS SEGMENTED CONTROL */}
      {/* ========================================= */}
      <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Thông tin chung</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matching')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap ${
            activeTab === 'matching'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Vận hành & Ghép đơn</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Thông báo & Bảo mật</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap ${
            activeTab === 'maintenance'
              ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Bảo trì hệ thống</span>
          {formData.maintenanceMode && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* ========================================= */}
      {/* 3. SETTINGS FORM CARDS (INTERNAL SCROLL) */}
      {/* ========================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 no-scrollbar space-y-4">
        {/* ------------------------------------- */}
        {/* TAB 1: THÔNG TIN CHUNG */}
        {/* ------------------------------------- */}
        {activeTab === 'general' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Nhận Diện Nền Tảng & Thương Hiệu
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tên hiển thị và các thông tin liên hệ dịch vụ khách hàng
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Tên nền tảng */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Tên Hiển Thị Nền Tảng (Site Name) *
                  </label>
                  <input
                    type="text"
                    value={formData.siteName}
                    onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                    placeholder="VD: FixGo - Dịch vụ sửa chữa tại nhà"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Email Hỗ Trợ */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Email Hỗ Trợ Khách Hàng (Support Email) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={formData.supportEmail}
                      onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                      placeholder="support@fixgo.vn"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Hotline Hỗ Trợ */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Tổng Đài Khẩn Cấp (Support Hotline) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={formData.supportHotline}
                      onChange={(e) => setFormData({ ...formData, supportHotline: e.target.value })}
                      placeholder="1900-8888"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------- */}
        {/* TAB 2: VẬN HÀNH & GHÉP ĐƠN */}
        {/* ------------------------------------- */}
        {activeTab === 'matching' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Thuật Toán Ghép Đơn & Bán Kính Quét GPS
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cấu hình khoảng cách tối đa và các giới hạn thời gian nhận cuốc của thợ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Bán kính quét */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Bán Kính Tìm Thợ Tối Đa
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="50"
                      value={formData.maxSearchRadiusKm}
                      onChange={(e) =>
                        setFormData({ ...formData, maxSearchRadiusKm: e.target.value })
                      }
                      className="w-full p-2.5 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 font-semibold text-[11px]">
                      km
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Khuyên dùng: 10 - 20 km</span>
                </div>

                {/* Tỷ lệ hoa hồng */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Chiết Khấu Nền Tảng (Commission)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={formData.defaultCommissionRate}
                      onChange={(e) =>
                        setFormData({ ...formData, defaultCommissionRate: e.target.value })
                      }
                      className="w-full p-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 font-semibold text-[11px]">
                      %
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Trích xuất ví của thợ khi hoàn tất</span>
                </div>

                {/* Timeout nhận đơn */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Thời Gian Chờ Nhận Đơn (Timeout)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="5"
                      min="15"
                      max="300"
                      value={formData.orderTimeoutSeconds}
                      onChange={(e) =>
                        setFormData({ ...formData, orderTimeoutSeconds: e.target.value })
                      }
                      className="w-full p-2.5 pr-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 font-semibold text-[11px]">
                      giây
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Hết giờ sẽ chuyển sang thợ tiếp theo</span>
                </div>
              </div>

              {/* Toggle Switches */}
              <div className="pt-2 space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      Tự Động Ghép Đơn Thông Minh (Smart Matching)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Hệ thống tự động phát sóng tới thợ có khoảng cách gần nhất và điểm đánh giá cao nhất
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoMatching}
                      onChange={(e) => setFormData({ ...formData, autoMatching: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------- */}
        {/* TAB 3: THÔNG BÁO & BẢO MẬT */}
        {/* ------------------------------------- */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Thông Báo & Xác Thực An Toàn
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cấu hình cổng tin nhắn SMS OTP và các thông báo đẩy thời gian thực
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Notify On Arrival */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      Thông Báo Tức Thì Khi Thợ Đến Điểm Hẹn
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Gửi thông báo âm thanh và push notification cho khách hàng khi thợ bấm "Đã đến nơi"
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifyOnArrival}
                      onChange={(e) =>
                        setFormData({ ...formData, notifyOnArrival: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>

                {/* SMS OTP Enabled */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      Xác Thực Đăng Ký Bằng SMS OTP (ESMS / Twilio)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Yêu cầu mã xác minh OTP 6 số gửi tới số điện thoại người dùng khi đăng ký tài khoản mới
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.smsOtpEnabled}
                      onChange={(e) => setFormData({ ...formData, smsOtpEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------- */}
        {/* TAB 4: BẢO TRÌ HỆ THỐNG */}
        {/* ------------------------------------- */}
        {activeTab === 'maintenance' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Warning Banner */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 ${
                formData.maintenanceMode
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  formData.maintenanceMode ? 'text-rose-400' : 'text-amber-400'
                }`}
              />
              <div className="text-xs space-y-1">
                <span className="font-bold text-sm block text-slate-900 dark:text-white">
                  {formData.maintenanceMode
                    ? '⚠️ CẢNH BÁO: HỆ THỐNG ĐANG BẬT CHẾ ĐỘ BẢO TRÌ'
                    : 'Chế Độ Bảo Trì Định Kỳ (Maintenance Mode)'}
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11.5px]">
                  {formData.maintenanceMode
                    ? 'Khách hàng và Thợ sẽ tạm thời không thể đặt hoặc nhận cuốc xe mới. Toàn bộ người dùng không phải Quản trị viên khi truy cập sẽ thấy màn hình thông báo bảo trì.'
                    : 'Khi kích hoạt chế độ này, nền tảng sẽ tạm ngưng nhận các đơn đặt hàng mới để bảo vệ toàn vẹn dữ liệu trong quá trình nâng cấp máy chủ.'}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              {/* Toggle Switch Bảo Trì */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-xs block">
                    Kích Hoạt Chế Độ Bảo Trì Toàn Nền Tảng
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Chỉ tài khoản ADMIN mới có quyền truy cập trang quản trị
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.maintenanceMode}
                    onChange={(e) =>
                      setFormData({ ...formData, maintenanceMode: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
                </label>
              </div>

              {/* Lời nhắn hiển thị cho người dùng */}
              <div className="space-y-1.5 text-xs">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Thông Điệp Bảo Trì Hiển Thị Cho Khách Hàng & Thợ
                </label>
                <textarea
                  rows={3}
                  value={formData.maintenanceMessage}
                  onChange={(e) =>
                    setFormData({ ...formData, maintenanceMessage: e.target.value })
                  }
                  placeholder="Nhập thông báo gửi tới người dùng khi hệ thống bảo trì..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 resize-none text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

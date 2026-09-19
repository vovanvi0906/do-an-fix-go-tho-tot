import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Shield, Key, Save, Plus, Trash2, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../../../store/authStore';

export default function UserProfileView() {
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || 'Võ Văn Khách Hàng');
  const [email, setEmail] = useState(user?.email || 'vovanviuser@gmail.com');
  const [phone, setPhone] = useState(user?.phone || '0987654321');
  const [address, setAddress] = useState('268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState([
    { id: 1, title: 'Nhà riêng (Mặc định)', street: '268 Lý Thường Kiệt, P.14, Q.10, TP.HCM', isDefault: true },
    { id: 2, title: 'Văn phòng công ty', street: 'Tòa nhà Bitexco, Q.1, TP.HCM', isDefault: false },
  ]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight">Hồ Sơ Cá Nhân & Quản Lý Tài Khoản</h1>
        <p className="text-xs text-slate-400 mt-1">
          Cập nhật thông tin định danh, sổ địa chỉ và bảo mật tài khoản FixGo.
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Thông tin hồ sơ cá nhân đã được cập nhật thành công!</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-500/20">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center text-[10px] text-white">
            ✓
          </span>
        </div>

        <div className="space-y-1.5 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-white">{fullName}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Đã xác thực Email
            </span>
          </div>
          <p className="text-xs text-slate-400">{email}</p>
          <p className="text-xs text-slate-500">Thành viên từ: Tháng 09/2026 • Khách hàng thân thiết</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Form thông tin cá nhân */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            <span>Thông tin liên hệ</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Họ và tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Địa chỉ Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Số điện thoại liên hệ</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>LƯU THAY ĐỔI HỒ SƠ</span>
            </button>
          </form>
        </div>

        {/* 2. Sổ địa chỉ đã lưu */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Sổ địa chỉ đặt thợ</span>
            </h3>

            <button
              onClick={() => alert('Thêm địa chỉ mới')}
              className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm mới</span>
            </button>
          </div>

          <div className="space-y-3">
            {savedAddresses.map((addr) => (
              <div
                key={addr.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 shadow-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{addr.title}</h4>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{addr.street}</p>
                </div>

                <button className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Bảo mật tài khoản */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 mt-6">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Bảo mật & Đổi mật khẩu</span>
            </h4>
            <p className="text-xs text-slate-400">
              Định kỳ thay đổi mật khẩu sau 90 ngày để đảm bảo an toàn cho tài khoản và ví thanh toán.
            </p>
            <button
              onClick={() => alert('Mở form đổi mật khẩu')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
            >
              Đổi mật khẩu tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

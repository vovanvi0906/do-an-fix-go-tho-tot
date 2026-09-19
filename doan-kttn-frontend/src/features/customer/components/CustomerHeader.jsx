import React from 'react';
import { useAuth } from '../../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Sparkles, Shield, Bell } from 'lucide-react';

export default function CustomerHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userDisplayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Khách hàng';
  const userEmail = user?.email || 'customer@fixgo.vn';

  return (
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 border border-slate-800 shadow-2xl backdrop-blur-xl">
      {/* Subtle glowing ambient lights */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white font-bold text-xl">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" title="Trực tuyến" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Xin chào, {userDisplayName} 👋
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                FixGo VIP
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>{userEmail}</span>
              <span className="text-slate-600">•</span>
              <span className="text-blue-400 font-medium flex items-center gap-1">
                <Shield className="w-3 h-3 inline" /> Đã xác thực
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/15 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/40 text-xs font-semibold transition-all duration-200 shadow-sm cursor-pointer"
            title="Đăng xuất tài khoản"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  Sparkles,
  ChevronRight,
  User,
  Sun,
  Moon,
} from 'lucide-react';
import { adminMenuConfig } from '../routers/menuConfig';
import { useAuth } from '../store/authStore';
import { useTheme } from '../store/themeStore';
import Sidebar from '../components/layout/Sidebar';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // State quản lý đóng/mở Sidebar trên Mobile/Tablet
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Tìm tiêu đề của trang hiện tại từ menuConfig
  const currentMenuItem = adminMenuConfig.find((item) =>
    location.pathname.startsWith(item.path)
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f0f3f8] dark:bg-[#090d16] flex font-sans text-slate-800 dark:text-slate-100 select-none relative transition-colors duration-200">
      {/* ========================================= */}
      {/* SIDEBAR NAVIGATION (ENTERPRISE SAAS) */}
      {/* ========================================= */}
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* ========================================= */}
      {/* KHU VỰC BÊN PHẢI (TOPBAR + MAIN CONTENT) */}
      {/* ========================================= */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* TOPBAR (CAO 56px / h-14) */}
        <header className="h-14 bg-white dark:bg-[#0f172a] border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs z-10 transition-colors duration-200">
          {/* Topbar Left: Hamburger Menu Button & Page Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Button (Chỉ hiển thị trên Mobile/Tablet < lg) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Mở Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              <span className="truncate">
                {currentMenuItem?.title || 'Bảng Điều Khiển'}
              </span>
            </div>
          </div>

          {/* Topbar Right: Theme Toggle + Status & User Name */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button (Sáng / Tối) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs active:scale-95"
              title={isDark ? 'Chuyển sang Theme Sáng' : 'Chuyển sang Theme Tối'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 animate-in spin-in-180 duration-300" />
              )}
            </button>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hệ thống trực tuyến</span>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden md:block">
                {user?.fullName || 'Quản trị viên'}
              </span>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA (BỌC BỞI BOX NỀN, TỰ ĐỘNG VỪA KHÍT 1 TRANG KHÔNG CUỘN NGOÀI) */}
        <main className="flex-1 p-2.5 sm:p-3.5 lg:p-4 flex flex-col min-h-0 overflow-hidden">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-2xs dark:shadow-slate-950/50 p-3 sm:p-3.5 flex-1 min-h-0 flex flex-col overflow-hidden transition-colors duration-200">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

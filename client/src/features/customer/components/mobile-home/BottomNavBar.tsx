/**
 * @file BottomNavBar.tsx
 * @description Floating Bottom Navigation Bar cố định đáy màn hình theo tỷ lệ max-w-md.
 * 5 Tabs chuẩn: Trang chủ, Đơn hàng, Nút AI Chat nhô cao trung tâm, Tin nhắn, Tài khoản.
 */

import React from 'react';
import {
  Home,
  ClipboardList,
  Sparkles,
  MessageSquare,
  User,
} from 'lucide-react';

interface BottomNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeOrderCount?: number;
  unreadMessagesCount?: number;
}

/**
 * Component `BottomNavBar`
 */
export default function BottomNavBar({
  activeTab,
  onTabChange,
  activeOrderCount = 1,
  unreadMessagesCount = 2,
}: BottomNavBarProps) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 max-w-md mx-auto z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 px-4 py-1.5 shadow-xl shadow-slate-950/5"
      role="navigation"
      aria-label="Thanh điều hướng chính"
    >
      <div className="flex items-center justify-around relative">
        {/* TAB 1: Trang chủ */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-all active:scale-90 ${
            activeTab === 'home'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Trang chủ</span>
        </button>

        {/* TAB 2: Đơn hàng */}
        <button
          type="button"
          onClick={() => onTabChange('orders')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 transition-all active:scale-90 ${
            activeTab === 'orders'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <ClipboardList className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Đơn hàng</span>
          {activeOrderCount > 0 && (
            <span className="absolute top-0 right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-white shadow-sm">
              {activeOrderCount}
            </span>
          )}
        </button>

        {/* TAB 3 (CENTER): AI Chat Button - Elevated floating button */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            type="button"
            onClick={() => onTabChange('ai-chat')}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white shadow-lg shadow-sky-500/40 ring-4 ring-white flex items-center justify-center active:scale-90 transition-transform duration-200"
            aria-label="Kích hoạt trợ lý FixGo AI"
          >
            <Sparkles className="w-6 h-6 text-white animate-spin-slow drop-shadow" />
          </button>
          <span className="text-[10px] font-bold text-blue-600 mt-0.5">AI Chat</span>
        </div>

        {/* TAB 4: Tin nhắn */}
        <button
          type="button"
          onClick={() => onTabChange('messages')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 transition-all active:scale-90 ${
            activeTab === 'messages'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Tin nhắn</span>
          {unreadMessagesCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-rose-500 border border-white" />
          )}
        </button>

        {/* TAB 5: Tài khoản */}
        <button
          type="button"
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-all active:scale-90 ${
            activeTab === 'profile'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Tài khoản</span>
        </button>
      </div>
    </nav>
  );
}

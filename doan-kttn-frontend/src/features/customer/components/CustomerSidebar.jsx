import React from 'react';
import {
  Home,
  LayoutGrid,
  ClipboardList,
  Calendar,
  MapPin,
  Sparkles,
  Gift,
  User,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../../store/authStore';
import { useNavigate } from 'react-router-dom';

export const MENU_GROUPS = [
  {
    title: 'KHÁM PHÁ & ĐẶT DỊCH VỤ',
    items: [
      { id: 'home', label: 'Trang chủ', icon: Home, badge: 'HOT' },
      { id: 'services', label: 'Tất cả Dịch vụ & Bảng giá', icon: LayoutGrid },
      { id: 'ai-diagnosis', label: 'AI Chẩn đoán sự cố', icon: Sparkles, badge: 'AI' },
    ],
  },
  {
    title: 'QUẢN LÝ DỊCH VỤ',
    items: [
      { id: 'orders', label: 'Đơn hàng của tôi', icon: ClipboardList },
      { id: 'scheduled', label: 'Lịch hẹn trước', icon: Calendar },
      { id: 'addresses', label: 'Sổ địa chỉ đã lưu', icon: MapPin },
    ],
  },
  {
    title: 'ƯU ĐÃI & KHUYẾN MÃI',
    items: [
      { id: 'promotions', label: 'Mã giảm giá & Voucher', icon: Gift, badge: '3' },
    ],
  },
  {
    title: 'TÀI KHOẢN & HỖ TRỢ',
    items: [
      { id: 'profile', label: 'Hồ sơ cá nhân (KYC)', icon: User },
      { id: 'notifications', label: 'Trung tâm thông báo', icon: Bell },
      { id: 'settings', label: 'Cài đặt & Trợ giúp', icon: Settings },
    ],
  },
];

/**
 * CustomerSidebar Component (Linear / Vercel Style)
 * Sidebar điều hướng Cổng Khách Hàng FixGo Pro.
 *
 * Tính năng UX:
 * - Badge Thông báo Sidebar: Tự động hiển thị huy hiệu số lượng (chấm cam/số 1) ngay tại mục
 *   "Đơn hàng của tôi" khi đang có đơn hàng active để thu hút sự chú ý của khách hàng.
 *
 * @param {Object} props
 * @param {string} props.activeTab
 * @param {Function} props.setActiveTab
 * @param {boolean} props.isCollapsed
 * @param {Function} props.setIsCollapsed
 * @param {boolean} [props.hasActiveOrder] - Cờ xác định có đơn hàng đang hoạt động không
 */
export default function CustomerSidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  hasActiveOrder = false,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userDisplayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'Khách hàng';

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* 1. Header Logo */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center font-black text-amber-400 text-lg">
                FG
              </div>
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-wider">FixGo</span>
              <span className="block text-[10px] font-bold text-amber-400/90 tracking-wider">CUSTOMER PORTAL</span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center font-black text-amber-400 text-lg">
              FG
            </div>
          </div>
        )}
      </div>

      {/* 2. Menu Navigation Groups */}
      <div
        className="flex-1 overflow-y-auto p-3.5 space-y-6 custom-scrollbar no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {MENU_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            {!isCollapsed && (
              <p className="px-3 text-[11px] font-extrabold text-slate-400 tracking-wider uppercase">
                {group.title}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                const isOrdersItem = item.id === 'orders';
                const showOrderBadge = isOrdersItem && hasActiveOrder;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                    title={isCollapsed ? `${item.label}${showOrderBadge ? ' (Đang có đơn hoạt động)' : ''}` : undefined}
                  >
                    <div className="flex items-center gap-3 relative">
                      <div className="relative">
                        <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                        {/* Dot badge khi sidebar thu nhỏ (Collapsed) */}
                        {isCollapsed && showOrderBadge && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                          </span>
                        )}
                      </div>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <>
                        {/* Badge Đơn hàng hoạt động: Ưu tiên hiển thị số lượng 1 kèm hiệu ứng pulse */}
                        {showOrderBadge ? (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            <span>1</span>
                          </span>
                        ) : item.badge ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              item.badge === 'HOT'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : item.badge === 'AI'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Footer User Profile & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div
              onClick={() => setActiveTab('profile')}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-slate-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{userDisplayName}</p>
                <p className="text-[11px] text-slate-300 truncate">{user?.email || 'customer@fixgo.vn'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-rose-500/10 text-rose-300 flex items-center justify-center hover:bg-rose-500/20 transition-all cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

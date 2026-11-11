import {
  LayoutDashboard,
  Users,
  Briefcase,
  Layers,
  Wrench,
  ShoppingBag,
  CreditCard,
  Percent,
  ShieldAlert,
  FileBarChart,
  Settings,
} from 'lucide-react';

/**
 * Cấu hình danh sách menu Admin (Sidebar Navigation)
 * Theo đúng quy chuẩn tách biệt giữa Data Menu và UI Render
 */
export const adminMenuConfig = [
  {
    id: 'dashboard',
    title: 'Tổng Quan Hệ Thống',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'users',
    title: 'Quản Lý Người Dùng',
    path: '/admin/users',
    icon: Users,
  },
  {
    id: 'workers',
    title: 'Đối Tác Thợ (Worker)',
    path: '/admin/workers',
    icon: Briefcase,
  },
  {
    id: 'categories',
    title: 'Quản Lý Danh Mục',
    path: '/admin/categories',
    icon: Layers,
  },
  {
    id: 'services',
    title: 'Quản Lý Dịch Vụ',
    path: '/admin/services',
    icon: Wrench,
  },
  {
    id: 'orders',
    title: 'Quản Lý Đơn Hàng',
    path: '/admin/orders',
    icon: ShoppingBag,
  },
  {
    id: 'payments',
    title: 'Thanh Toán & Ví Tiền',
    path: '/admin/payments',
    icon: CreditCard,
  },
  {
    id: 'commissions',
    title: 'Hoa Hồng & Chiết Khấu',
    path: '/admin/commissions',
    icon: Percent,
  },
  {
    id: 'disputes',
    title: 'Khiếu Nại & Tranh Chấp',
    path: '/admin/disputes',
    icon: ShieldAlert,
  },
  {
    id: 'reports',
    title: 'Báo Cáo & Thống Kê',
    path: '/admin/reports',
    icon: FileBarChart,
  },
  {
    id: 'settings',
    title: 'Cài Đặt Hệ Thống',
    path: '/admin/settings',
    icon: Settings,
  },
];

export default adminMenuConfig;

/**
 * ============================================================================
 * FIXGO PRO - DASHBOARD OVERVIEW TYPE DEFINITIONS & INTERFACES
 * ============================================================================
 * Chứa toàn bộ các định nghĩa TypeScript Interfaces và JSDoc chi tiết
 * phục vụ cho màn hình Tổng Quan Hệ Thống (Dashboard Overview)
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Khoảng thời gian lọc báo cáo thống kê
 */
export type DashboardTimeframe = 'today' | 'week' | 'month';

/**
 * Tỷ lệ tăng trưởng so với kỳ trước
 */
export interface DashboardGrowthRate {
  customers: string;
  workers: string;
  orders: string;
}

/**
 * Payload phản hồi từ API GET /api/v1/dashboard/overview
 */
export interface DashboardOverviewResponse {
  /** Tổng số tài khoản khách hàng trên hệ thống */
  totalCustomers: number;
  /** Tổng số đối tác thợ đã được duyệt */
  totalWorkers: number;
  /** Số lượng hồ sơ thợ đang chờ phê duyệt (CCCD, bằng cấp) */
  pendingWorkers: number;
  /** Số lượng thợ đang online sẵn sàng nhận việc */
  onlineWorkers: number;
  /** Tổng số đơn đặt dịch vụ toàn thời gian */
  totalOrders: number;
  /** Tổng số đơn đặt phát sinh trong kỳ timeframe được chọn */
  totalOrdersInPeriod: number;
  /** Số đơn đặt hoàn thành thành công trong kỳ */
  completedOrders: number;
  /** Số đơn đang hoạt động (Đang tìm, Thợ đang tới, Đang làm việc...) */
  activeOrders: number;
  /** Tổng doanh thu phát sinh từ các đơn hoàn thành (VND) */
  totalRevenue: number;
  /** Tỷ lệ tăng trưởng so với kỳ trước */
  growth?: DashboardGrowthRate;
  /** Kỳ báo cáo hiện tại */
  timeframe: DashboardTimeframe;
}

/**
 * Các loại sự kiện thời gian thực trong hệ thống
 */
export type DashboardActivityType =
  | 'ORDER_CREATED'
  | 'ORDER_ASSIGNED'
  | 'ORDER_IN_PROGRESS'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELLED'
  | 'WORKER_REGISTER'
  | 'WORKER_APPROVED';

/**
 * Bản ghi hoạt động gần đây thời gian thực
 * Payload từ API GET /api/v1/dashboard/activities
 */
export interface DashboardActivity {
  /** Mã định danh hoạt động */
  id: string;
  /** Phân loại sự kiện */
  type: DashboardActivityType;
  /** Tiêu đề ngắn gọn của sự kiện */
  title: string;
  /** Mô tả chi tiết (ví dụ: tên dịch vụ, khách hàng, thợ phụ trách) */
  description: string;
  /** Thời điểm phát sinh sự kiện dạng ISO 8601 */
  createdAt: string;
  /** Trạng thái nghiệp vụ đi kèm */
  status: string;
}

/**
 * Phân bổ đơn hàng theo danh mục dịch vụ
 */
export interface ServiceDistributionItem {
  /** Mã danh mục dịch vụ */
  id: string;
  /** Tên danh mục (ví dụ: Sửa máy giặt, Điện nước dân dụng...) */
  name: string;
  /** Số lượng đơn đặt thuộc danh mục này */
  count: number;
  /** Tỷ lệ phần trăm trên tổng đơn (0 - 100) */
  percentage: number;
  /** Mã màu hex Linear/Vercel palette gán cho danh mục */
  color: string;
}

/**
 * Payload phản hồi từ API GET /api/v1/dashboard/service-distribution
 */
export interface DashboardServiceDistributionResponse {
  /** Tổng số đơn tính phân bổ */
  totalOrders: number;
  /** Danh sách phân bổ chi tiết theo danh mục */
  distribution: ServiceDistributionItem[];
  /** Kỳ báo cáo */
  timeframe?: DashboardTimeframe;
}

/**
 * Props cho thẻ chỉ số KPI StatisticCard
 */
export interface StatisticCardProps {
  /** Tiêu đề thẻ chỉ số */
  title: string;
  /** Giá trị hiển thị (chuỗi số đã format hoặc số nguyên) */
  value: string | number;
  /** Dòng phụ chú thích nhỏ bên dưới */
  subtext?: string;
  /** Icon Lucide đại diện */
  icon: LucideIcon;
  /** Hướng xu hướng ('up' | 'down') */
  trend?: 'up' | 'down';
  /** Giá trị/nhãn xu hướng hiển thị trên badge */
  trendValue?: string;
  /** Bộ tông màu thiết kế */
  colorScheme?: 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan';
  /** Mảng điểm dữ liệu vẽ micro-sparkline SVG */
  sparklineData?: number[];
  /** Trạng thái loading hiển thị Skeleton */
  isLoading?: boolean;
  /** Callback khi click vào thẻ để điều hướng */
  onClick?: () => void;
}

/**
 * Props cho component biểu đồ Donut ServiceDistributionChart
 */
export interface ServiceDistributionChartProps {
  /** Danh sách phân bổ danh mục */
  services: ServiceDistributionItem[];
  /** Tổng số đơn */
  totalOrders: number;
  /** Trạng thái loading */
  isLoading?: boolean;
}

/**
 * Props cho component dòng thời gian RecentActivityTimeline
 */
export interface RecentActivityTimelineProps {
  /** Danh sách sự kiện hoạt động */
  activities: DashboardActivity[];
  /** Trạng thái loading */
  isLoading?: boolean;
}

/**
 * TypeScript Interfaces for Customer Portal (FixGo Pro)
 * Cung cấp định nghĩa dữ liệu cho Dashboard, Summary Metrics & Active Order Dynamic Widget.
 */

/**
 * Dữ liệu tổng quan thời gian thực trả về từ API: GET /api/v1/customer/home/summary
 */
export interface CustomerHomeSummary {
  /**
   * Tổng số lượng gói dịch vụ đang sẵn sàng hoạt động trên hệ thống (isActive: true)
   */
  activeServicesCount: number;

  /**
   * Số lượng mã giảm giá hợp lệ đang hoạt động và còn hạn sử dụng (Voucher model)
   */
  availableVouchersCount: number;

  /**
   * Số dư ví thực tế (tùy chọn / không bắt buộc hiển thị trên giao diện người dùng)
   */
  walletBalance?: number;
}

/**
 * Thông tin dịch vụ trong đơn hàng đang hoạt động
 */
export interface ActiveOrderServiceInfo {
  id: string;
  name: string;
  basePrice: number;
  unit: string;
}

/**
 * Thông tin thợ kỹ thuật phụ trách đơn hàng
 */
export interface ActiveOrderWorkerInfo {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  ratingAvg: number;
  phone: string;
}

/**
 * Dữ liệu chi tiết đơn hàng đang hoạt động của khách hàng
 * Trả về từ API: GET /api/v1/customer/orders/active
 */
export interface ActiveOrderPayload {
  id: string;
  status: 'SEARCHING' | 'ASSIGNED' | 'WORKER_ARRIVING' | 'ARRIVED' | 'IN_PROGRESS' | 'AWAITING_CONFIRMATION' | string;
  statusLabel: string;
  progressPercent: number;
  estimatedTime: string;
  estimatedDistance: string;
  service: ActiveOrderServiceInfo;
  totalPrice: number;
  pickupAddress: string;
  createdAt: string;
  scheduledAt?: string | null;
  worker: ActiveOrderWorkerInfo | null;
}

/**
 * Response trả về từ API đơn hàng đang hoạt động
 */
export interface ActiveOrderResponse {
  activeOrder: ActiveOrderPayload | null;
  hasActiveOrder: boolean;
}

/**
 * Kiểu dữ liệu trả về từ Custom Hook useCustomerHome
 */
export interface UseCustomerHomeReturn {
  /**
   * Dữ liệu thống kê tổng quan (Gói dịch vụ sẵn sàng, Voucher khả dụng)
   */
  summary: CustomerHomeSummary | null;

  /**
   * Đơn hàng đang hoạt động gần nhất của khách hàng (hoặc null nếu không có đơn nào đang chạy)
   */
  activeOrder: ActiveOrderPayload | null;

  /**
   * Cờ kiểm tra khách hàng có đơn hàng đang chạy hay không
   */
  hasActiveOrder: boolean;

  /**
   * Trạng thái đang tải dữ liệu
   */
  isLoading: boolean;

  /**
   * Thông báo lỗi nếu việc gọi API thất bại
   */
  error: string | null;

  /**
   * Hàm gọi lại API để làm mới số liệu (thực thi theo yêu cầu người dùng)
   */
  refetch: () => Promise<void>;
}

/**
 * Thuộc tính Props cho component ActiveOrderWidget
 */
export interface ActiveOrderWidgetProps {
  /**
   * Thông tin đơn hàng đang hoạt động
   */
  activeOrder: ActiveOrderPayload;

  /**
   * Hàm điều hướng chuyển tab trên giao diện Cổng Khách Hàng
   */
  setActiveTab?: (tab: string) => void;

  /**
   * Callback khi người dùng nhấn xem chi tiết tiến trình
   */
  onViewDetails?: (orderId: string) => void;
}

/**
 * Thuộc tính Props cho component CustomerPortalHome
 */
export interface CustomerPortalHomeProps {
  /**
   * Callback thông báo khi một đơn hàng mới được tạo thành công
   */
  onOrderCreated?: () => void;

  /**
   * Hàm điều hướng chuyển tab trên giao diện Cổng Khách Hàng
   */
  setActiveTab?: (tab: string) => void;
}

/**
 * Thuộc tính Props cho thanh điều hướng Header (CustomerNavbar)
 */
export interface CustomerNavbarProps {
  /**
   * Trạng thái thu gọn/mở rộng thanh Sidebar
   */
  isCollapsed: boolean;

  /**
   * Hàm thay đổi trạng thái thu gọn Sidebar
   */
  setIsCollapsed: (collapsed: boolean) => void;

  /**
   * Hàm điều hướng chuyển tab trên Cổng Khách Hàng
   */
  setActiveTab: (tab: string) => void;
}

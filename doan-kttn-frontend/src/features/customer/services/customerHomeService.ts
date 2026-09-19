import apiClient from '../../../services/api/client';
import type {
  CustomerHomeSummary,
  ActiveOrderResponse,
} from '../../../types/customerHome';

/**
 * Service gọi API dữ liệu cho Cổng Khách Hàng FixGo Pro (Customer Portal)
 */
export const customerHomeService = {
  /**
   * Gọi API lấy dữ liệu thống kê tổng quan trang chủ khách hàng
   * RESTful API: GET /api/v1/customer/home/summary
   * @returns {Promise<CustomerHomeSummary>}
   */
  async getSummary(): Promise<CustomerHomeSummary> {
    const response = await apiClient.get<CustomerHomeSummary>('/v1/customer/home/summary');
    return response.data;
  },

  /**
   * Gọi API lấy đơn hàng đang hoạt động gần nhất của khách hàng (nếu có)
   * RESTful API: GET /api/v1/customer/orders/active
   * @returns {Promise<ActiveOrderResponse>}
   */
  async getActiveOrder(): Promise<ActiveOrderResponse> {
    const response = await apiClient.get<ActiveOrderResponse>('/v1/customer/orders/active');
    return response.data;
  },
};

export default customerHomeService;

import apiClient from '../../../services/api/client';

/**
 * ============================================================================
 * FIXGO PRO - DASHBOARD RESTFUL API SERVICE
 * ============================================================================
 * Cung cấp các phương thức gọi API chính xác tới Backend FixGo Pro
 * Điểm kết nối tuân thủ cấu trúc RESTful API v1
 */
export const dashboardService = {
  /**
   * API ENDPOINT: GET /api/v1/dashboard/overview
   * Chức năng: Lấy số liệu tổng quan hệ thống (Khách hàng, Đối tác thợ, Hồ sơ chờ duyệt, Tổng đơn đặt)
   * @param {'today' | 'week' | 'month'} [timeframe='month'] - Khoảng thời gian thống kê
   * @returns {Promise<import('../../../types/dashboard').DashboardOverviewResponse>}
   */
  async getOverview(timeframe = 'month') {
    try {
      // Gắn kết endpoint: GET /api/v1/dashboard/overview
      const response = await apiClient.get('/v1/dashboard/overview', {
        params: { timeframe },
      });
      return response.data || response;
    } catch (err) {
      console.warn('[dashboardService] Lỗi khi gọi GET /api/v1/dashboard/overview, đang thử endpoint dự phòng:', err.message);
      // Fallback tương thích với route cũ nếu v1 chưa sẵn sàng
      const fallback = await apiClient.get('/admin/dashboard/overview', {
        params: { timeframe },
      });
      return fallback.data || fallback;
    }
  },

  /**
   * API ENDPOINT: GET /api/v1/dashboard/activities
   * Chức năng: Lấy danh sách hoạt động gần đây theo thời gian thực
   * @param {number} [limit=10] - Số lượng bản ghi hoạt động cần lấy
   * @returns {Promise<import('../../../types/dashboard').DashboardActivity[]>}
   */
  async getActivities(limit = 10) {
    // Gắn kết endpoint: GET /api/v1/dashboard/activities
    const response = await apiClient.get('/v1/dashboard/activities', {
      params: { limit },
    });
    return response.data || response;
  },

  /**
   * API ENDPOINT: GET /api/v1/dashboard/service-distribution
   * Chức năng: Lấy dữ liệu thống kê phân bổ theo danh mục dịch vụ phục vụ cho biểu đồ
   * @param {'today' | 'week' | 'month'} [timeframe='month'] - Khoảng thời gian thống kê
   * @returns {Promise<import('../../../types/dashboard').DashboardServiceDistributionResponse>}
   */
  async getServiceDistribution(timeframe = 'month') {
    // Gắn kết endpoint: GET /api/v1/dashboard/service-distribution
    const response = await apiClient.get('/v1/dashboard/service-distribution', {
      params: { timeframe },
    });
    return response.data || response;
  },
};

export default dashboardService;

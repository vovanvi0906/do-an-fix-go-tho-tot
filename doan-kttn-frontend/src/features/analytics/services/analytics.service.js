import apiClient from '../../../services/api/client';

export const analyticsService = {
  /**
   * Lấy các chỉ số KPI tổng quan (dữ liệu thật từ cơ sở dữ liệu)
   * @param {'today' | '7days' | 'month' | 'year'} timeRange
   */
  async getOverview(timeRange = 'month') {
    try {
      const response = await apiClient.get('/admin/analytics/overview', {
        params: { timeRange },
      });
      return response.data || response;
    } catch (err) {
      console.warn('[analyticsService] API overview error:', err.message);
      return {
        totalRevenue: 0,
        revenueGrowth: 0,
        totalOrders: 0,
        ordersGrowth: 0,
        totalCustomers: 0,
        totalWorkers: 0,
        activeWorkers: 0,
        completionRate: 0,
        timeRange,
      };
    }
  },

  /**
   * Lấy dữ liệu biểu đồ doanh thu theo kỳ
   * @param {'today' | '7days' | 'month' | 'year'} timeRange
   */
  async getRevenue(timeRange = 'month') {
    try {
      const response = await apiClient.get('/admin/analytics/revenue', {
        params: { timeRange },
      });
      return response.data || response;
    } catch (err) {
      console.warn('[analyticsService] API revenue error:', err.message);
      return {
        points: [],
        totalRevenue: 0,
        totalOrders: 0,
        timeRange,
      };
    }
  },

  /**
   * Lấy tỷ lệ phân bổ ngành nghề
   */
  async getServicesDistribution() {
    try {
      const response = await apiClient.get('/admin/analytics/services-distribution');
      return response.data || response;
    } catch (err) {
      console.warn('[analyticsService] API services distribution error:', err.message);
      return [];
    }
  },

  /**
   * Lấy danh sách thợ xuất sắc nhất
   */
  async getTopWorkers() {
    try {
      const response = await apiClient.get('/admin/analytics/top-workers');
      return response.data || response;
    } catch (err) {
      console.warn('[analyticsService] API top workers error:', err.message);
      return [];
    }
  },

  /**
   * Xuất báo cáo thống kê dạng tệp CSV
   * @param {'today' | '7days' | 'month' | 'year'} timeRange
   */
  async exportReport(timeRange = 'month') {
    try {
      const res = await apiClient.get('/admin/analytics/export', {
        params: { timeRange },
      });
      const data = res.data || res;

      // Create blob and trigger direct download
      const blob = new Blob([data.content || ''], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', data.fileName || `FixGo_Bao_Cao_${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      console.error('[analyticsService] Export CSV error:', err.message);
      throw err;
    }
  },
};

export default analyticsService;

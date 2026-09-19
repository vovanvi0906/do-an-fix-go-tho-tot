import apiClient from '../../../services/api/client';

/**
 * ============================================================================
 * FIXGO PRO - ADMIN SERVICES RESTFUL API SERVICE
 * ============================================================================
 * Cung cấp các phương thức gọi API chính xác tới Backend FixGo Pro
 * Điểm kết nối tuân thủ cấu trúc RESTful API v1: /api/v1/admin/services
 */
export const adminServicesService = {
  /**
   * API ENDPOINT: GET /api/v1/admin/services
   * Lấy danh sách toàn bộ dịch vụ (hỗ trợ search, categoryId, status, page, limit)
   * @param {{ status?: string, isActive?: string, categoryId?: string, search?: string, page?: number, limit?: number }} params
   */
  async getServices({ status, isActive, categoryId, search, page = 1, limit = 10 } = {}) {
    const params = { page, limit };

    if (status && status !== 'ALL') {
      params.status = status;
    } else if (isActive !== undefined && isActive !== 'ALL' && isActive !== '') {
      params.isActive = isActive;
    }

    if (categoryId && categoryId !== 'ALL') {
      params.categoryId = categoryId;
    }

    if (search && search.trim()) {
      params.search = search.trim();
    }

    try {
      // Gắn kết endpoint v1: GET /api/v1/admin/services
      const response = await apiClient.get('/v1/admin/services', { params });
      return response.data || response;
    } catch (err) {
      console.warn('[adminServicesService] Thử gọi endpoint dự phòng /admin/services:', err.message);
      const response = await apiClient.get('/admin/services', { params });
      return response.data || response;
    }
  },

  /**
   * API ENDPOINT: GET /api/v1/admin/services/categories
   * Lấy danh sách toàn bộ danh mục dịch vụ phục vụ dropdown và lọc
   */
  async getCategories() {
    try {
      // Gắn kết endpoint v1: GET /api/v1/admin/services/categories
      const response = await apiClient.get('/v1/admin/services/categories');
      return response.data || response;
    } catch (err) {
      console.warn('[adminServicesService] Thử gọi endpoint dự phòng /admin/service-categories:', err.message);
      try {
        const response = await apiClient.get('/admin/service-categories');
        return response.data || response;
      } catch {
        return [];
      }
    }
  },

  /**
   * API ENDPOINT: POST /api/v1/admin/services
   * Tạo mới một gói dịch vụ
   * @param {import('../../../types/service').ServiceFormData} data
   */
  async createService(data) {
    try {
      const res = await apiClient.post('/v1/admin/services', data);
      return res.data || res;
    } catch (err) {
      const res = await apiClient.post('/admin/services', data);
      return res.data || res;
    }
  },

  /**
   * API ENDPOINT: PUT /api/v1/admin/services/:id
   * Cập nhật thông tin dịch vụ
   * @param {string} id
   * @param {Partial<import('../../../types/service').ServiceFormData>} data
   */
  async updateService(id, data) {
    try {
      const res = await apiClient.put(`/v1/admin/services/${id}`, data);
      return res.data || res;
    } catch (err) {
      const res = await apiClient.patch(`/admin/services/${id}`, data);
      return res.data || res;
    }
  },

  /**
   * API ENDPOINT: PATCH /api/v1/admin/services/:id/toggle
   * Bật/Tắt nhanh trạng thái hoạt động của dịch vụ
   * @param {string} id
   */
  async toggleServiceStatus(id) {
    try {
      const res = await apiClient.patch(`/v1/admin/services/${id}/toggle`);
      return res.data || res;
    } catch (err) {
      const res = await apiClient.patch(`/admin/services/${id}/toggle`);
      return res.data || res;
    }
  },

  /**
   * API ENDPOINT: DELETE /api/v1/admin/services/:id
   * Xóa hoặc vô hiệu hóa dịch vụ (hỗ trợ force delete)
   * @param {string} id
   * @param {boolean} [force=false] - Xóa vĩnh viễn khỏi cơ sở dữ liệu
   */
  async deleteService(id, force = false) {
    try {
      const res = await apiClient.delete(`/v1/admin/services/${id}`, {
        params: { force },
      });
      return res.data || res;
    } catch (err) {
      const res = await apiClient.delete(`/admin/services/${id}`, {
        params: { force },
      });
      return res.data || res;
    }
  },
};

export default adminServicesService;

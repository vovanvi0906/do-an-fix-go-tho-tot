import apiClient from '../../../services/api/client';

/**
 * ============================================================================
 * FIXGO PRO - ADMIN CATEGORIES RESTFUL API SERVICE
 * ============================================================================
 * Cung cấp các phương thức gọi API cho tính năng Quản lý Danh mục Ngành nghề
 * Điểm kết nối chuẩn RESTful API v1: /api/v1/admin/categories
 */
export const adminCategoriesService = {
  /**
   * API ENDPOINT: GET /api/v1/admin/categories
   * Lấy danh sách toàn bộ danh mục kèm số lượng dịch vụ
   * @param {{ search?: string, status?: string }} [params] - Tham số lọc từ khóa và trạng thái
   * @returns {Promise<import('../../../types/category').CategoryItem[]>}
   */
  async getCategories(params = {}) {
    try {
      const response = await apiClient.get('/v1/admin/categories', { params });
      return response.data || response;
    } catch (err) {
      console.warn('[adminCategoriesService] Thử gọi endpoint dự phòng /admin/service-categories:', err.message);
      try {
        const response = await apiClient.get('/admin/service-categories', { params });
        return response.data || response;
      } catch {
        return [];
      }
    }
  },

  /**
   * API ENDPOINT: POST /api/v1/admin/categories
   * Tạo mới danh mục ngành nghề
   * @param {import('../../../types/category').CategoryFormData} data
   */
  async createCategory(data) {
    try {
      const res = await apiClient.post('/v1/admin/categories', data);
      return res.data || res;
    } catch (err) {
      const res = await apiClient.post('/admin/service-categories', data);
      return res.data || res;
    }
  },

  /**
   * API ENDPOINT: PUT /api/v1/admin/categories/:id
   * Cập nhật thông tin danh mục
   * @param {string} id
   * @param {Partial<import('../../../types/category').CategoryFormData>} data
   */
  async updateCategory(id, data) {
    try {
      const res = await apiClient.put(`/v1/admin/categories/${id}`, data);
      return res.data || res;
    } catch (err) {
      const res = await apiClient.patch(`/admin/service-categories/${id}`, data);
      return res.data || res;
    }
  },

  /**
   * API ENDPOINT: PATCH /api/v1/admin/categories/:id/toggle
   * Bật/Tắt trạng thái hoạt động của danh mục
   * @param {string} id
   */
  async toggleCategoryStatus(id) {
    try {
      const res = await apiClient.patch(`/v1/admin/categories/${id}/toggle`);
      return res.data || res;
    } catch (err) {
      const res = await apiClient.patch(`/admin/service-categories/${id}/toggle`);
      return res.data || res;
    }
  },

  /**
   * API ENDPOINT: DELETE /api/v1/admin/categories/:id
   * Xóa hoặc tạm ngưng danh mục
   * @param {string} id
   * @param {boolean} [force=false]
   */
  async deleteCategory(id, force = false) {
    try {
      const res = await apiClient.delete(`/v1/admin/categories/${id}`, {
        params: { force },
      });
      return res.data || res;
    } catch (err) {
      const res = await apiClient.delete(`/admin/service-categories/${id}`, {
        params: { force },
      });
      return res.data || res;
    }
  },
};

export default adminCategoriesService;

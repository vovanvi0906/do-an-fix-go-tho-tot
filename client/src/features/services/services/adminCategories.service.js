import apiClient from '../../../services/api/client';

/**
 * FIXGO PRO - ADMIN CATEGORIES RESTFUL API SERVICE
 * Quản trị Danh mục Dịch vụ (Categories)
 */
export const adminCategoriesService = {
  async getCategories(params = {}) {
    try {
      const response = await apiClient.get('/admin/service-categories', { params });
      return response.data || response;
    } catch (err) {
      console.warn('[adminCategoriesService] Lỗi gọi /admin/service-categories:', err.message);
      return [];
    }
  },

  async createCategory(data) {
    const res = await apiClient.post('/admin/service-categories', data);
    return res.data || res;
  },

  async updateCategory(id, data) {
    const res = await apiClient.patch(`/admin/service-categories/${id}`, data);
    return res.data || res;
  },

  async toggleCategoryStatus(id) {
    const res = await apiClient.patch(`/admin/service-categories/${id}/toggle`);
    return res.data || res;
  },

  async deleteCategory(id, force = false) {
    const res = await apiClient.delete(`/admin/service-categories/${id}`, {
      params: { force },
    });
    return res.data || res;
  },
};

export default adminCategoriesService;

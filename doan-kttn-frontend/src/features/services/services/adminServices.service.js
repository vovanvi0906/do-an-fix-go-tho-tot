import apiClient from '../../../services/api/client';

/**
 * FIXGO PRO - ADMIN SERVICES RESTFUL API SERVICE
 * Quản trị Dịch vụ (Services) và Đối tượng/Thiết bị (Targets)
 */
export const adminServicesService = {
  async getServices({ status, isActive, categoryId, targetId, search, page = 1, limit = 10 } = {}) {
    const params = { page, limit };
    if (status && status !== 'ALL') params.status = status;
    else if (isActive !== undefined && isActive !== 'ALL' && isActive !== '') params.isActive = isActive;
    if (categoryId && categoryId !== 'ALL') params.categoryId = categoryId;
    if (targetId && targetId !== 'ALL') params.targetId = targetId;
    if (search && search.trim()) params.search = search.trim();
    const response = await apiClient.get('/admin/services', { params });
    return response.data || response;
  },

  async getTargets(categoryId) {
    const params = {};
    if (categoryId && categoryId !== 'ALL') params.categoryId = categoryId;
    try {
      const response = await apiClient.get('/admin/services/targets', { params });
      return response.data || response;
    } catch (err) {
      console.warn('[adminServicesService] Lỗi gọi /admin/services/targets:', err.message);
      return [];
    }
  },

  async createTarget(data) {
    const response = await apiClient.post('/admin/services/targets', data);
    return response.data || response;
  },

  async updateTarget(id, data) {
    const response = await apiClient.patch(`/admin/services/targets/${id}`, data);
    return response.data || response;
  },

  async toggleTargetStatus(id) {
    const response = await apiClient.patch(`/admin/services/targets/${id}/toggle`);
    return response.data || response;
  },

  async deleteTarget(id) {
    const response = await apiClient.delete(`/admin/services/targets/${id}`);
    return response.data || response;
  },

  async getCategories() {
    try {
      const response = await apiClient.get('/admin/service-categories');
      return response.data || response;
    } catch (err) {
      console.warn('[adminServicesService] Lỗi gọi /admin/service-categories:', err.message);
      return [];
    }
  },

  async createService(data) {
    const res = await apiClient.post('/admin/services', data);
    return res.data || res;
  },

  async updateService(id, data) {
    const res = await apiClient.patch(`/admin/services/${id}`, data);
    return res.data || res;
  },

  async toggleServiceStatus(id) {
    const res = await apiClient.patch(`/admin/services/${id}/toggle`);
    return res.data || res;
  },

  async deleteService(id, force = false) {
    const res = await apiClient.delete(`/admin/services/${id}`, { params: { force } });
    return res.data || res;
  },
};

export default adminServicesService;

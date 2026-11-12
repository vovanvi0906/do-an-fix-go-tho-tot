import apiClient from '../../../services/api/client';

export const adminOrdersService = {
  /**
   * Lấy danh sách toàn bộ đơn hàng kèm phân trang, bộ lọc status, categoryId và tìm kiếm
   * @param {{ status?: string, categoryId?: string, search?: string, page?: number, limit?: number }} params
   */
  async getOrders({ status, categoryId, search, page = 1, limit = 10 } = {}) {
    const params = { page, limit };

    if (status && status !== 'ALL') {
      params.status = status;
    }
    if (categoryId && categoryId !== 'ALL') {
      params.categoryId = categoryId;
    }
    if (search && search.trim()) {
      params.search = search.trim();
    }

    const response = await apiClient.get('/admin/orders', { params });
    return response.data || response;
  },

  async getOrderById(id) {
    const res = await apiClient.get(`/admin/orders/${id}`);
    return res.data || res;
  },

  /**
   * Cập nhật trạng thái đơn hàng thủ công (Admin)
   * @param {string} id
   * @param {string} status
   * @param {string} note
   */
  async updateOrderStatus(id, status, note = '') {
    const res = await apiClient.patch(`/admin/orders/${id}/status`, { status, note });
    return res.data || res;
  },

  /**
   * Hủy đơn hàng bởi Quản trị viên
   * @param {string} id
   * @param {string} reason
   */
  async cancelOrder(id, reason = '') {
    const res = await apiClient.patch(`/admin/orders/${id}/cancel`, { reason });
    return res.data || res;
  },

  /**
   * Xóa hoàn toàn đơn hàng vi phạm
   * @param {string} id
   */
  async deleteOrder(id) {
    const res = await apiClient.delete(`/admin/orders/${id}`);
    return res.data || res;
  },
};

export default adminOrdersService;

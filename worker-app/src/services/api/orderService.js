import { apiClient } from './apiClient';

export const orderService = {
  /**
   * 1. Chẩn đoán sự cố qua AI (POST /orders/diagnose)
   * @param {Object} payload - { imageUrl, description }
   */
  async diagnose(payload) {
    console.log('🤖 [OrderService] Gọi AI chẩn đoán sự cố:', payload);
    return apiClient.post('/orders/diagnose', payload);
  },

  /**
   * Lấy danh mục dịch vụ phục vụ chọn thủ công (GET /service-categories)
   */
  async getCategories() {
    return apiClient.get('/service-categories').catch(() => []);
  },

  /**
   * 2. Tạo đơn dịch vụ mới sau khi khách xác nhận (POST /orders)
   * @param {Object} payload - { categoryId, serviceId, lat, lng, addressText, note, estimatedPrice, scheduledAt }
   */
  async createOrder(payload) {
    console.log('🚀 [OrderService] Gọi API tạo đơn hàng mới:', payload);
    return apiClient.post('/orders', payload);
  },

  /**
   * 3. Lấy thông tin chi tiết đơn hàng (GET /orders/:id)
   */
  async getOrderById(orderId) {
    return apiClient.get(`/orders/${orderId}`);
  },

  /**
   * 4. Lấy danh sách đơn hàng của user (GET /orders)
   */
  async getMyOrders(params = {}) {
    return apiClient.get('/orders', { params });
  },

  /**
   * 5. Hủy đơn hàng (PATCH /orders/:id/cancel)
   */
  async cancelOrder(orderId, reason = 'Khách hủy đơn') {
    return apiClient.patch(`/orders/${orderId}/cancel`, { reason });
  },

  /**
   * 6. Thợ nhận đơn (POST /orders/:id/accept)
   */
  async acceptOrder(orderId) {
    return apiClient.post(`/orders/${orderId}/accept`);
  },

  /**
   * 7. Upload ảnh BEFORE / AFTER (POST /orders/:id/images)
   */
  async uploadImage(orderId, payload) {
    return apiClient.post(`/orders/${orderId}/images`, payload);
  },

  /**
   * 8. AI nghiệm thu so sánh before/after (POST /orders/:id/verify-completion)
   */
  async verifyCompletion(orderId) {
    return apiClient.post(`/orders/${orderId}/verify-completion`);
  },

  /**
   * 9. Khách nghiệm thu hoàn thành (POST /orders/:id/accept-completion)
   */
  async acceptCompletion(orderId) {
    return apiClient.post(`/orders/${orderId}/accept-completion`);
  },

  /**
   * 10. Khách khiếu nại (POST /orders/:id/dispute)
   */
  async disputeOrder(orderId, payload) {
    return apiClient.post(`/orders/${orderId}/dispute`, payload);
  },

  /**
   * 11. Thanh toán đơn hàng (POST /orders/:id/pay)
   */
  async payOrder(orderId) {
    return apiClient.post(`/orders/${orderId}/pay`);
  },

  /**
   * 12. Đánh giá thợ (POST /orders/:id/review)
   */
  async reviewOrder(orderId, payload) {
    return apiClient.post(`/orders/${orderId}/review`, payload);
  },

  /**
   * 13. Điều chỉnh chi phí phát sinh ngoài báo giá (PATCH /orders/:id/adjust-price)
   * @param {string} orderId
   * @param {Object} payload - { additionalPrice, reason, action: 'PROPOSE' | 'ACCEPT' | 'REJECT', note }
   */
  async adjustPrice(orderId, payload) {
    return apiClient.patch(`/orders/${orderId}/adjust-price`, payload);
  },

  /**
   * 14. Đặt lại lịch hẹn khi mở rộng không tìm thấy thợ (PATCH /orders/:id/schedule)
   * @param {string} orderId
   * @param {Object} payload - { scheduledAt }
   */
  async scheduleOrder(orderId, payload) {
    return apiClient.patch(`/orders/${orderId}/schedule`, payload);
  },
};


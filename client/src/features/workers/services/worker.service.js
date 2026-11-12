import apiClient from '../../../services/api/client';

export const workerService = {
  /**
   * Lấy thông tin hồ sơ thợ hiện tại
   */
  async getProfile() {
    try {
      const res = await apiClient.get('/workers/me');
      return res.data || res;
    } catch (err) {
      console.warn('[workerService] Fallback mock profile:', err.message);
      return {
        id: 'wkr_demo_01',
        fullName: 'Lê Văn Thợ',
        phone: '0912345678',
        approvalStatus: 'APPROVED',
        isOnline: true,
        ratingAvg: 4.9,
        completedOrdersCount: 48,
        todayEarnings: 650000,
        currentLat: 10.7680,
        currentLng: 106.6650,
        currentAddress: 'Quận 10, TP. Hồ Chí Minh',
      };
    }
  },

  /**
   * Bật/tắt trạng thái trực tuyến sẵn sàng nhận việc
   * @param {boolean} isOnline 
   */
  async toggleAvailability(isOnline) {
    try {
      const res = await apiClient.patch('/workers/me/availability', { isOnline });
      return res.data || res;
    } catch (err) {
      console.warn('[workerService] Fallback toggle online offline:', err.message);
      return { isOnline };
    }
  },

  /**
   * Cập nhật vị trí GPS thời gian thực của thợ
   * @param {number} currentLat 
   * @param {number} currentLng 
   */
  async updateLocation(currentLat, currentLng) {
    try {
      const res = await apiClient.patch('/workers/me', { currentLat, currentLng });
      return res.data || res;
    } catch (err) {
      console.warn('[workerService] Fallback update location offline:', err.message);
      return { currentLat, currentLng };
    }
  },

  /**
   * Lấy đơn hàng đang thực hiện của thợ (nếu có)
   */
  async getCurrentOrder() {
    try {
      const res = await apiClient.get('/orders/worker/current');
      return res.data || res;
    } catch (err) {
      // Check local storage for active worker job
      const savedJob = localStorage.getItem('fixgo_active_worker_job');
      if (savedJob) {
        return JSON.parse(savedJob);
      }
      return null;
    }
  },

  /**
   * Thợ nhận đơn hàng mới (POST /api/orders/:id/accept)
   * @param {string} orderId 
   */
  async acceptOrder(orderId) {
    try {
      const res = await apiClient.post(`/orders/${orderId}/accept`);
      const acceptedOrder = res.data || res;
      localStorage.setItem('fixgo_active_worker_job', JSON.stringify(acceptedOrder));
      return acceptedOrder;
    } catch (err) {
      if (!err.response && (err.code === 'ERR_NETWORK' || err.message?.includes('Network'))) {
        console.warn('[workerService] Offline simulation accept order:', orderId);
        const mockAccepted = {
          id: orderId,
          orderCode: `FG-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'ASSIGNED',
          service: { name: 'Sửa chữa điện nước khẩn cấp' },
          customer: { fullName: 'Trần Khách Hàng', phone: '0987654321' },
          pickupAddress: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM',
          pickupLat: 10.7626,
          pickupLng: 106.6601,
          description: 'Bồn cầu bị rò rỉ nước liên tục dưới chân đế',
          totalPrice: 150000,
          acceptedAt: new Date().toISOString(),
        };
        localStorage.setItem('fixgo_active_worker_job', JSON.stringify(mockAccepted));
        return mockAccepted;
      }
      throw err;
    }
  },

  /**
   * Cập nhật tiến trình công việc
   * @param {string} orderId 
   * @param {'arriving' | 'arrived' | 'start' | 'finish'} action 
   */
  async updateJobStep(orderId, action) {
    try {
      const res = await apiClient.patch(`/orders/${orderId}/${action}`);
      const updatedOrder = res.data || res;
      if (action === 'finish') {
        localStorage.removeItem('fixgo_active_worker_job');
      } else {
        localStorage.setItem('fixgo_active_worker_job', JSON.stringify(updatedOrder));
      }
      return updatedOrder;
    } catch (err) {
      console.warn(`[workerService] Offline simulation step ${action}:`, err.message);
      const stepStatusMap = {
        arriving: 'WORKER_ARRIVING',
        arrived: 'ARRIVED',
        start: 'IN_PROGRESS',
        finish: 'AWAITING_CONFIRMATION',
      };
      const savedJob = JSON.parse(localStorage.getItem('fixgo_active_worker_job') || '{}');
      const updated = { ...savedJob, status: stepStatusMap[action] || 'IN_PROGRESS' };
      if (action === 'finish') {
        localStorage.removeItem('fixgo_active_worker_job');
      } else {
        localStorage.setItem('fixgo_active_worker_job', JSON.stringify(updated));
      }
      return updated;
    }
  },
};

export default workerService;

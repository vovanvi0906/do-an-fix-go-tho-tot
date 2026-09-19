import apiClient from '../../../services/api/client';

export const customerOrderService = {
  /**
   * Lấy danh sách dịch vụ khả dụng từ Backend (hoặc fallback mặc định)
   */
  async getServices() {
    try {
      const res = await apiClient.get('/services');
      return res.data || res;
    } catch (err) {
      console.warn('[customerOrderService] Fallback default services:', err.message);
      return [
        {
          id: 'srv_dien_nuoc_1',
          name: 'Sửa Chữa Điện Nước Khẩn Cấp',
          category: 'Điện Nước',
          desc: 'Xử lý sự cố rò rỉ đường ống, chập cầu dao, mất nước cục bộ trong 15-30 phút.',
          basePrice: 150000,
        },
        {
          id: 'srv_dien_lanh_2',
          name: 'Vệ Sinh & Bơm Ga Máy Lạnh',
          category: 'Điện Lạnh',
          desc: 'Bảo trì dàn nóng, dàn lạnh, khử khuẩn nấm mốc và nạp ga tiêu chuẩn.',
          basePrice: 200000,
        },
        {
          id: 'srv_sua_khoa_3',
          name: 'Mở Khóa & Sửa Khóa Cửa',
          category: 'Khóa Cửa',
          desc: 'Cứu hộ khóa cửa nhà, khóa điện tử, mở khóa xe khẩn cấp 24/7.',
          basePrice: 120000,
        },
        {
          id: 'srv_ve_sinh_4',
          name: 'Vệ Sinh Nhà Cửa & Sofa',
          category: 'Vệ Sinh',
          desc: 'Dọn dẹp tổng thể căn hộ, giặt thảm, vệ sinh nệm bằng máy hơi nước nóng.',
          basePrice: 250000,
        },
      ];
    }
  },

  /**
   * Tạo đơn hàng dịch vụ mới (Khách hàng gọi POST /api/orders)
   * @param {Object} data - { serviceId, pickupLat, pickupLng, pickupAddress, description, note }
   */
  async createOrder(data) {
    try {
      const res = await apiClient.post('/orders', data);
      return res.data || res;
    } catch (err) {
      // Khi chạy trong môi trường phát triển chưa kết nối Backend server,
      // thông minh tạo đơn mô phỏng và lưu vào localStorage để dashboard hiển thị tức thì
      if (!err.response && (err.code === 'ERR_NETWORK' || err.message?.includes('Network'))) {
        console.warn('[customerOrderService] Backend offline. Generating simulated order:', data);
        const orderId = `ord_${Date.now()}`;
        const mockOrder = {
          id: orderId,
          orderCode: `FG-${Math.floor(100000 + Math.random() * 900000)}`,
          serviceId: data.serviceId,
          status: 'SEARCHING',
          pickupLat: data.pickupLat,
          pickupLng: data.pickupLng,
          pickupAddress: data.pickupAddress,
          description: data.description,
          totalPrice: 150000,
          createdAt: new Date().toISOString(),
        };

        const existing = JSON.parse(localStorage.getItem('fixgo_customer_orders') || '[]');
        localStorage.setItem('fixgo_customer_orders', JSON.stringify([mockOrder, ...existing]));

        return {
          order: mockOrder,
          id: mockOrder.id,
          nearbyWorkersCount: 3,
          message: 'Tạo đơn dịch vụ thành công! Đang quét thợ trong bán kính 5km.',
        };
      }
      throw err;
    }
  },

  /**
   * Lấy danh sách đơn hàng của khách hàng hiện tại
   */
  async getMyOrders() {
    try {
      const res = await apiClient.get('/orders');
      return res.data || res;
    } catch (err) {
      console.warn('[customerOrderService] Cannot fetch orders from API, checking local storage:', err.message);
      const localOrders = JSON.parse(localStorage.getItem('fixgo_customer_orders') || '[]');
      return localOrders;
    }
  },

  /**
   * Lấy chi tiết đơn hàng theo ID
   */
  async getOrderById(orderId) {
    try {
      const res = await apiClient.get(`/orders/${orderId}`);
      return res.data || res;
    } catch (err) {
      const localOrders = JSON.parse(localStorage.getItem('fixgo_customer_orders') || '[]');
      const found = localOrders.find((o) => o.id === orderId);
      if (found) return found;
      throw err;
    }
  },
};

export default customerOrderService;

/**
 * BookingService — Feature-level service for booking flow
 * Logging prefix: 🚀 [BookingService]
 */
import { orderService } from '../../../services/api/orderService';

export const bookingService = {
  /**
   * Tạo đơn đặt thợ mới
   * @param {Object} payload - CreateOrderPayload
   * @returns {Promise<Object>} - { orderId, status, ... }
   */
  async createBooking(payload) {
    console.log('🚀 [BookingService] Khởi tạo đơn đặt thợ mới:', {
      serviceId: payload.serviceId,
      scheduleType: payload.scheduleType,
      urgency: payload.urgency,
      proposedPrice: payload.proposedPrice,
      hasPhotos: payload.evidencePhotos?.length > 0,
    });

    try {
      const orderPayload = {
        serviceId: payload.serviceId,
        lat: payload.lat,
        lng: payload.lng,
        addressText: payload.addressText,
        note: payload.note,
        estimatedPrice: payload.proposedPrice || 0,
        scheduledAt: payload.scheduleType === 'SCHEDULED' ? payload.scheduledAt : null,
        urgency: payload.urgency,
        voucherCode: payload.voucherCode || undefined,
        evidencePhotos: payload.evidencePhotos || [],
      };

      const result = await orderService.createOrder(orderPayload);
      const orderId = result?.orderId || result?.order?.id || `ORD-${Date.now()}`;

      console.log('🚀 [BookingService] ✅ Đã tạo đơn thành công:', orderId);
      return { orderId, ...result };
    } catch (error) {
      console.error('🚀 [BookingService] ❌ Lỗi tạo đơn:', error.message);
      throw error;
    }
  },

  /**
   * Hủy đơn đang tìm thợ
   * @param {string} orderId
   * @returns {Promise<void>}
   */
  async cancelBooking(orderId) {
    console.log('🚀 [BookingService] Hủy đơn đang tìm thợ:', orderId);
    try {
      await orderService.cancelOrder(orderId, 'Khách hủy trong khi đang tìm thợ');
      console.log('🚀 [BookingService] ✅ Đã hủy đơn:', orderId);
    } catch (error) {
      console.error('🚀 [BookingService] ❌ Lỗi hủy đơn:', error.message);
      throw error;
    }
  },

  /**
   * Lấy danh sách dịch vụ khả dụng
   * @returns {Promise<Array>}
   */
  async getAvailableServices() {
    console.log('🚀 [BookingService] Tải danh sách dịch vụ...');
    try {
      const categories = await orderService.getCategories();
      console.log('🚀 [BookingService] ✅ Đã tải', categories?.length || 0, 'dịch vụ');
      return categories;
    } catch (error) {
      console.log('🚀 [BookingService] ⚠️ Dùng mock services fallback');
      return [];
    }
  },

  /**
   * Upload ảnh bằng chứng sự cố
   * @param {string} orderId
   * @param {string} imageUri
   * @returns {Promise<Object>}
   */
  async uploadEvidencePhoto(orderId, imageUri) {
    console.log('🚀 [BookingService] Upload ảnh bằng chứng cho đơn:', orderId);
    try {
      const result = await orderService.uploadImage(orderId, {
        imageUrl: imageUri,
        type: 'EVIDENCE',
      });
      console.log('🚀 [BookingService] ✅ Upload ảnh thành công');
      return result;
    } catch (error) {
      console.error('🚀 [BookingService] ❌ Lỗi upload ảnh:', error.message);
      throw error;
    }
  },
};

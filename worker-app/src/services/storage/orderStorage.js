/**
 * @file orderStorage.js
 * @description Quản lý lưu trữ đơn hàng bền vững trên thiết bị qua AsyncStorage kết hợp API Backend.
 * Đảm bảo mọi đơn vừa tạo đều xuất hiện ngay lập tức trong tab Đơn hàng / Hoạt động.
 * Tích hợp tự động chuyển trạng thái lỗi nếu quá 20 phút mà Admin chưa xác nhận đơn 'Dịch vụ khác'.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { orderService } from '../api/orderService';

const ORDERS_STORAGE_KEY = '@fixgo_user_orders';
const TIMEOUT_20_MINS_MS = 20 * 60 * 1000; // 20 phút

export const orderStorage = {
  /**
   * Lưu một đơn hàng mới vào bộ nhớ cục bộ
   */
  async saveOrder(order) {
    try {
      const existing = await this.getLocalOrders();
      // Tránh trùng lặp id
      const filtered = existing.filter((o) => o.id !== order.id);
      const updated = [order, ...filtered];
      await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
      console.log('💾 [OrderStorage] Đã lưu đơn hàng vào máy:', order.id);
      return updated;
    } catch (err) {
      console.error('❌ [OrderStorage] Lỗi lưu đơn hàng:', err);
      return [];
    }
  },

  /**
   * Tự động kiểm tra và chuyển trạng thái lỗi cho đơn 'Dịch vụ khác'
   * nếu quá 20 phút mà Admin chưa xác nhận hoặc không có thợ phù hợp.
   */
  async checkAndExpireOrders(orders) {
    if (!Array.isArray(orders) || orders.length === 0) return [];

    const now = Date.now();
    let hasChanges = false;

    const processed = orders.map((order) => {
      const isCustom = order.isCustomService || order.categorySlug === 'dich-vu-khac';
      const isPending = order.status === 'AWAITING_CONFIRM' || order.status === 'PENDING_ADMIN';

      if (isCustom && isPending) {
        const createdTime = new Date(order.createdAt || order.submittedAt || Date.now()).getTime();
        const diffMs = now - createdTime;

        if (diffMs > TIMEOUT_20_MINS_MS) {
          hasChanges = true;
          console.log(`⏰ [OrderStorage] Đơn ${order.orderCode || order.id} đã quá hạn 20 phút -> Tự chuyển Lỗi`);
          return {
            ...order,
            status: 'EXPIRED',
            statusReason: 'Quá 20 phút không có thợ tiếp nhận hoặc Admin chưa xác nhận',
            expiredAt: new Date().toISOString(),
          };
        }
      }
      return order;
    });

    if (hasChanges) {
      try {
        await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(processed));
      } catch (e) {
        console.error('❌ [OrderStorage] Lỗi lưu lại đơn sau khi hết hạn:', e);
      }
    }

    return processed;
  },

  /**
   * Lấy danh sách đơn hàng đã lưu trong máy (đã áp dụng kiểm tra 20 phút)
   */
  async getLocalOrders() {
    try {
      const raw = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return await this.checkAndExpireOrders(parsed);
    } catch (err) {
      console.error('❌ [OrderStorage] Lỗi đọc đơn hàng:', err);
      return [];
    }
  },

  /**
   * Lấy danh sách đơn hàng kết hợp giữa API Backend và AsyncStorage
   */
  async getAllOrders() {
    let localList = await this.getLocalOrders();

    try {
      const apiRes = await orderService.getMyOrders();
      const serverOrders = Array.isArray(apiRes?.data) ? apiRes.data : Array.isArray(apiRes) ? apiRes : [];

      if (serverOrders.length > 0) {
        // Map server orders to local format if needed
        const mappedServer = serverOrders.map((so) => ({
          id: so.id,
          orderCode: `#${so.id.slice(0, 8).toUpperCase()}`,
          title: so.category?.name || so.service?.name || so.note || 'Dịch vụ sửa chữa',
          serviceName: so.service?.name || so.category?.name || 'Dịch vụ sửa chữa',
          addressText: so.addressText || 'Địa chỉ khách hàng',
          status: so.status || 'SEARCHING_WORKER',
          createdAt: so.createdAt || new Date().toISOString(),
          scheduledAt: so.scheduledAt || 'Cần thợ gấp',
          price: Number(so.estimatedPrice || so.finalPrice || 150000),
          isCustomService: so.isCustomService || false,
        }));

        // Hợp nhất, ưu tiên server, giữ lại các đơn local chưa sync
        const serverIds = new Set(mappedServer.map((s) => s.id));
        const nonSyncedLocal = localList.filter((l) => !serverIds.has(l.id));
        const combined = [...nonSyncedLocal, ...mappedServer];
        return await this.checkAndExpireOrders(combined);
      }
    } catch (err) {
      console.warn('⚠️ [OrderStorage] Không tải được từ server, dùng cache offline:', err.message);
    }

    return localList;
  },

  /**
   * Cập nhật trạng thái một đơn hàng
   */
  async updateOrderStatus(orderId, newStatus, reason = null) {
    try {
      const list = await this.getLocalOrders();
      const updated = list.map((item) => {
        if (item.id === orderId) {
          return {
            ...item,
            status: newStatus,
            ...(reason ? { statusReason: reason } : {}),
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      });
      await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.error('❌ [OrderStorage] Lỗi cập nhật trạng thái đơn:', err);
    }
  },

  /**
   * Admin duyệt đơn hàng tự đặt (Chuyển từ AWAITING_CONFIRM sang MATCHED / Đã xác nhận)
   */
  async adminConfirmOrder(orderId) {
    return this.updateOrderStatus(orderId, 'MATCHED', 'Admin đã duyệt yêu cầu dịch vụ');
  },

  /**
   * Admin từ chối đơn hàng hoặc không có thợ phù hợp
   */
  async adminRejectOrder(orderId, reason = 'Không có thợ phù hợp') {
    return this.updateOrderStatus(orderId, 'REJECTED', reason);
  },
};

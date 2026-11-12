/**
 * @file orderStorage.js
 * @description Quản lý lưu trữ đơn hàng bền vững trên thiết bị, phân tách cache theo userId thực.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { orderService } from '../api/orderService';
import { tokenStorage } from './tokenStorage';
import { checkOrderExpiry } from './checkOrderExpiry';
import { mapServerOrders } from './mapServerOrders';
import { clearLegacyOrders, clearUserOrders, clearAllLocalOrders, getUserOrdersKey } from './clearOrderStorage';

export const orderStorage = {
  async getActiveUserId(explicitUserId) {
    if (explicitUserId) return String(explicitUserId);
    try {
      const user = await tokenStorage.getUser();
      return user?.id ? String(user.id) : null;
    } catch {
      return null;
    }
  },

  clearLegacyOrders,
  async clearUserOrders(explicitUserId) {
    clearUserOrders(await this.getActiveUserId(explicitUserId));
  },
  clearAllLocalOrders,

  async getLocalOrders(explicitUserId) {
    const userId = await this.getActiveUserId(explicitUserId);
    if (!userId) return [];
    try {
      const raw = await AsyncStorage.getItem(getUserOrdersKey(userId));
      if (!raw) return [];
      const { processed, hasChanges } = checkOrderExpiry(JSON.parse(raw));
      if (hasChanges) await AsyncStorage.setItem(getUserOrdersKey(userId), JSON.stringify(processed));
      return processed;
    } catch (err) {
      console.error('❌ [OrderStorage] Lỗi đọc đơn hàng:', err);
      return [];
    }
  },

  async getLocalOrderById(orderId, explicitUserId) {
    const list = await this.getLocalOrders(explicitUserId);
    return list.find((o) => String(o.id) === String(orderId)) || null;
  },

  async saveOrders(orders, explicitUserId) {
    const userId = await this.getActiveUserId(explicitUserId);
    if (!userId || !Array.isArray(orders)) return [];
    try {
      await AsyncStorage.setItem(getUserOrdersKey(userId), JSON.stringify(orders));
      return orders;
    } catch (err) {
      console.error('❌ [OrderStorage] Lỗi lưu danh sách đơn:', err);
      return [];
    }
  },

  async saveOrder(order, explicitUserId) {
    const userId = await this.getActiveUserId(explicitUserId);
    if (!userId || !order?.id) return [];
    try {
      const existing = await this.getLocalOrders(userId);
      const updated = [order, ...existing.filter((o) => o.id !== order.id)];
      await AsyncStorage.setItem(getUserOrdersKey(userId), JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.error('❌ [OrderStorage] Lỗi lưu đơn hàng:', err);
      return [];
    }
  },

  async removeLocalOrder(orderId, explicitUserId) {
    const userId = await this.getActiveUserId(explicitUserId);
    if (!userId) return;
    const list = await this.getLocalOrders(userId);
    await this.saveOrders(list.filter((o) => String(o.id) !== String(orderId)), userId);
  },

  async updateOrderStatus(orderId, newStatus, reason = null, explicitUserId) {
    const userId = await this.getActiveUserId(explicitUserId);
    if (!userId) return [];
    const list = await this.getLocalOrders(userId);
    const updated = list.map((item) => (item.id === orderId ? { ...item, status: newStatus, ...(reason ? { statusReason: reason } : {}), updatedAt: new Date().toISOString() } : item));
    await this.saveOrders(updated, userId);
    return updated;
  },

  async getAllOrders(explicitUserId) {
    const userId = await this.getActiveUserId(explicitUserId);
    if (!userId) return [];
    const localList = await this.getLocalOrders(userId);
    try {
      const apiRes = await orderService.getMyOrders();
      const serverOrders = Array.isArray(apiRes?.data) ? apiRes.data : Array.isArray(apiRes) ? apiRes : [];
      const mappedServer = mapServerOrders(serverOrders, localList);
      await this.saveOrders(mappedServer, userId);
      return mappedServer;
    } catch (err) {
      console.warn('⚠️ [OrderStorage] Không tải được từ server, dùng cache offline:', err.message);
      return localList;
    }
  },
};

tokenStorage.onClear(async (clearedUser) => {
  if (clearedUser?.id) await clearUserOrders(clearedUser.id);
  await clearLegacyOrders();
});

/**
 * @file clearOrderStorage.js
 * @description Tiện ích dọn dẹp và cô lập cache đơn hàng theo phiên người dùng
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const LEGACY_STORAGE_KEY = '@fixgo_user_orders';
export const getUserOrdersKey = (userId) => `@fixgo_orders_${userId}`;

export async function clearLegacyOrders() {
  try {
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.warn('❌ [OrderStorage] Lỗi xóa legacy cache:', err);
  }
}

export async function clearUserOrders(userId) {
  if (!userId) return;
  try {
    await AsyncStorage.removeItem(getUserOrdersKey(userId));
  } catch (err) {
    console.error(`❌ [OrderStorage] Lỗi xóa cache của user ${userId}:`, err);
  }
}

export async function clearAllLocalOrders() {
  try {
    await clearLegacyOrders();
    const keys = await AsyncStorage.getAllKeys();
    const orderKeys = keys.filter((k) => k.startsWith('@fixgo_orders_') || k === LEGACY_STORAGE_KEY);
    if (orderKeys.length > 0) {
      await AsyncStorage.multiRemove(orderKeys);
    }
  } catch (err) {
    console.error('❌ [OrderStorage] Lỗi dọn sạch toàn bộ cache đơn hàng:', err);
  }
}

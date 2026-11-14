/**
 * @file orderStorageIsolation.test.js
 * @description Kiểm thử CUS-04: Cô lập cache đơn hàng theo userId thực và dọn dẹp khi logout
 */

let mockStore = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(async (key, value) => { mockStore[key] = String(value); return null; }),
  getItem: jest.fn(async (key) => mockStore[key] || null),
  removeItem: jest.fn(async (key) => { delete mockStore[key]; return null; }),
  multiRemove: jest.fn(async (keys) => { keys.forEach((k) => delete mockStore[k]); return null; }),
  getAllKeys: jest.fn(async () => Object.keys(mockStore)),
  clear: jest.fn(async () => { mockStore = {}; return null; }),
}));

jest.mock('../src/services/api/orderService', () => ({
  orderService: { getMyOrders: jest.fn() },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { orderStorage } from '../src/services/storage/orderStorage';
import { tokenStorage } from '../src/services/storage/tokenStorage';
import { orderService } from '../src/services/api/orderService';

describe('CUS-04 — Order Storage User Isolation & Session Cleanup', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockStore = {};
  });

  it('AC-04-1: Customer A có đơn, logout, Customer B login không nhìn thấy dữ liệu của A', async () => {
    // 1. Customer A đăng nhập
    await tokenStorage.saveUser({ id: 'user-a', name: 'Customer A' });
    await tokenStorage.saveToken('token-a');

    // Customer A tạo / lưu 1 đơn hàng vào cache
    const orderA = {
      id: 'ord-a-01',
      title: 'Sửa bồn rửa bát',
      status: 'SEARCHING_WORKER',
      price: 200000,
    };
    await orderStorage.saveOrder(orderA);

    // Xác minh cache của A có đơn
    const aOrders = await orderStorage.getLocalOrders();
    expect(aOrders).toHaveLength(1);
    expect(aOrders[0].id).toBe('ord-a-01');

    // 2. Customer A logout
    await tokenStorage.clearAll();

    // 3. Customer B đăng nhập
    await tokenStorage.saveUser({ id: 'user-b', name: 'Customer B' });
    await tokenStorage.saveToken('token-b');

    // Customer B kiểm tra danh sách đơn cục bộ (khi offline / chưa fetch)
    const bLocalOrders = await orderStorage.getLocalOrders();
    expect(bLocalOrders).toHaveLength(0);

    // Customer B gọi getAllOrders khi server trả về mảng rỗng (B chưa có đơn trên server)
    orderService.getMyOrders.mockResolvedValueOnce({ data: [] });
    const bAllOrders = await orderStorage.getAllOrders();
    expect(bAllOrders).toHaveLength(0);

    // Đảm bảo đơn của A không hề xuất hiện ở B
    expect(bAllOrders.find((o) => o.id === 'ord-a-01')).toBeUndefined();
  });

  it('Cô lập key AsyncStorage theo format @fixgo_orders_{userId} và xóa legacy cache', async () => {
    await tokenStorage.saveUser({ id: 'user-custom-123' });
    await orderStorage.saveOrder({ id: 'order-1', title: 'Điện nước' });

    // Kiểm tra key trong AsyncStorage
    const stored = await AsyncStorage.getItem('@fixgo_orders_user-custom-123');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored);
    expect(parsed[0].id).toBe('order-1');

    // Key legacy cũ @fixgo_user_orders không được dùng
    const legacy = await AsyncStorage.getItem('@fixgo_user_orders');
    expect(legacy).toBeNull();
  });

  it('Không có user đăng nhập thì getLocalOrders và saveOrder trả về mảng rỗng', async () => {
    await tokenStorage.clearAll();

    const result = await orderStorage.saveOrder({ id: 'anon-order', title: 'Test' });
    expect(result).toEqual([]);

    const orders = await orderStorage.getLocalOrders();
    expect(orders).toEqual([]);
  });

  it('clearUserOrders xóa chính xác cache của user chỉ định', async () => {
    await orderStorage.saveOrder({ id: 'order-1' }, 'user-x');
    expect(await orderStorage.getLocalOrders('user-x')).toHaveLength(1);

    await orderStorage.clearUserOrders('user-x');
    expect(await orderStorage.getLocalOrders('user-x')).toHaveLength(0);
  });
});

/**
 * @file orderDetailSync.test.js
 * @description Kiểm thử CUS-04: Đồng bộ snapshot server, xử lý 403/404, cập nhật trạng thái từ server
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
  orderService: {
    getOrderById: jest.fn(),
    getMyOrders: jest.fn(),
  },
}));

jest.mock('../src/services/socket/socketService', () => ({
  socketService: {
    connect: jest.fn(),
    joinOrderRoom: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
}));

import { renderHook, waitFor } from '@testing-library/react-native';
import { useOrderDetailSync } from '../src/features/orders/hooks/useOrderDetailSync';
import { orderStorage } from '../src/services/storage/orderStorage';
import { tokenStorage } from '../src/services/storage/tokenStorage';
import { orderService } from '../src/services/api/orderService';

describe('CUS-04 — Order Detail Server Snapshot & Guard', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockStore = {};
    await tokenStorage.saveUser({ id: 'user-cus-1' });
  });

  it('AC-04-2: Cache có MATCHED nhưng server AWAITING_PAYMENT -> cập nhật về AWAITING_PAYMENT', async () => {
    const orderId = 'order-matched-001';
    // 1. Cache cục bộ đang lưu trạng thái cũ là MATCHED
    await orderStorage.saveOrder({ id: orderId, status: 'MATCHED', price: 150000 });

    // 2. Server trả về snapshot mới nhất là AWAITING_PAYMENT
    orderService.getOrderById.mockResolvedValueOnce({
      id: orderId,
      status: 'AWAITING_PAYMENT',
      price: 250000,
      finalPrice: 250000,
    });

    const { result } = renderHook(() => useOrderDetailSync(orderId));

    await waitFor(() => {
      expect(result.current.order).not.toBeNull();
      expect(result.current.order.status).toBe('AWAITING_PAYMENT');
      expect(result.current.order.finalPrice).toBe(250000);
    });

    // Cache trong storage cũng phải được cập nhật snapshot mới
    const cached = await orderStorage.getLocalOrderById(orderId);
    expect(cached.status).toBe('AWAITING_PAYMENT');
  });

  it('Server trả 403 Forbidden: xóa cache và không hiển thị dữ liệu không có quyền', async () => {
    const orderId = 'order-forbidden-002';
    // Đang có cache lưu tạm
    await orderStorage.saveOrder({ id: orderId, status: 'MATCHED' });

    // Server trả lỗi 403 Forbidden
    const error403 = new Error('Bạn không có quyền truy cập vào thông tin đơn hàng này');
    error403.status = 403;
    orderService.getOrderById.mockRejectedValueOnce(error403);

    const { result } = renderHook(() => useOrderDetailSync(orderId));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.error.status).toBe(403);
      expect(result.current.error.type).toBe('FORBIDDEN');
      expect(result.current.order).toBeNull();
    });

    // Cache đã bị xóa sạch khỏi storage
    const cached = await orderStorage.getLocalOrderById(orderId);
    expect(cached).toBeNull();
  });

  it('Server trả 404 Not Found: xóa cache và hiển thị lỗi NOT_FOUND', async () => {
    const orderId = 'order-missing-003';
    await orderStorage.saveOrder({ id: orderId, status: 'SEARCHING_WORKER' });

    const error404 = new Error('Không tìm thấy đơn hàng');
    error404.status = 404;
    orderService.getOrderById.mockRejectedValueOnce(error404);

    const { result } = renderHook(() => useOrderDetailSync(orderId));

    await waitFor(() => {
      expect(result.current.error?.status).toBe(404);
      expect(result.current.error?.type).toBe('NOT_FOUND');
      expect(result.current.order).toBeNull();
    });

    const cached = await orderStorage.getLocalOrderById(orderId);
    expect(cached).toBeNull();
  });

  it('Mất mạng khi đã có cache an toàn: hiển thị cache tạm thời kèm cờ isOffline', async () => {
    const orderId = 'order-offline-004';
    await orderStorage.saveOrder({ id: orderId, status: 'IN_PROGRESS', title: 'Sửa máy bơm' });

    const netErr = new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend!');
    orderService.getOrderById.mockRejectedValueOnce(netErr);

    const { result } = renderHook(() => useOrderDetailSync(orderId));

    await waitFor(() => {
      expect(result.current.order).not.toBeNull();
      expect(result.current.order.title).toBe('Sửa máy bơm');
      expect(result.current.isOffline).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  it('Lỗi 401 Unauthorized: xóa snapshot và thông báo hết hạn phiên', async () => {
    const orderId = 'order-unauth-005';
    const error401 = new Error('Phiên đăng nhập đã hết hạn');
    error401.status = 401;
    orderService.getOrderById.mockRejectedValueOnce(error401);

    const { result } = renderHook(() => useOrderDetailSync(orderId));

    await waitFor(() => {
      expect(result.current.error?.status).toBe(401);
      expect(result.current.error?.type).toBe('UNAUTHORIZED');
      expect(result.current.order).toBeNull();
    });
  });
});

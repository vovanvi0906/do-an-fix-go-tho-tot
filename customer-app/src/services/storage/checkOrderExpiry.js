/**
 * @file checkOrderExpiry.js
 * @description Tự động kiểm tra quá hạn 20 phút cho đơn Dịch vụ khác
 */

const TIMEOUT_20_MINS_MS = 20 * 60 * 1000;

export function checkOrderExpiry(orders) {
  if (!Array.isArray(orders) || orders.length === 0) {
    return { processed: [], hasChanges: false };
  }

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

  return { processed, hasChanges };
}

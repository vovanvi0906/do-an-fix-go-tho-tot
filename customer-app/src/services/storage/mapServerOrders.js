/**
 * @file mapServerOrders.js
 * @description Chuẩn hóa dữ liệu đơn hàng từ server kết hợp cache cục bộ
 */

export function mapServerOrders(serverOrders = [], localList = []) {
  if (!Array.isArray(serverOrders)) return [];
  return serverOrders.map((so) => {
    const cached = localList.find((order) => order.id === so.id);
    return {
      ...cached,
      id: so.id,
      orderCode: `#${String(so.id).slice(0, 8).toUpperCase()}`,
      title: so.category?.name || so.service?.name || so.note || 'Dịch vụ sửa chữa',
      serviceName: so.service?.name || so.category?.name || 'Dịch vụ sửa chữa',
      addressText: so.addressText || 'Địa chỉ khách hàng',
      status: so.status || 'SEARCHING_WORKER',
      createdAt: so.createdAt || new Date().toISOString(),
      scheduledAt: so.scheduledAt || 'Cần thợ gấp',
      price: Number(so.estimatedPrice || so.finalPrice || 150000),
      isCustomService: so.isCustomService || false,
      worker: so.worker || cached?.worker,
      assignedWorker: so.worker || cached?.assignedWorker,
    };
  });
}

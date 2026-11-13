import { OrderWorkflowService } from '../order-workflow.service';
import { OrdersService } from '../orders.service';
import { AdminService } from '../../admin/admin.service';

describe('Catalog Sync and Server-side Commercial Invariants', () => {
  let ordersService, adminService, tx;

  beforeEach(() => {
    ordersService = Object.create(OrdersService.prototype);
    adminService = Object.create(AdminService.prototype);
    tx = {
      order: { create: jest.fn().mockImplementation(async ({ data }) => ({ id: 'order-99', ...data })) },
      orderStatusHistory: { create: jest.fn() },
      orderImage: { create: jest.fn() },
    };
    ordersService.prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1', role: 'CUSTOMER', status: 'ACTIVE' }) },
      service: { findFirst: jest.fn() },
      serviceCategory: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn().mockImplementation((fn) => fn(tx)),
    };
    ordersService.orderWorkflowService = new OrderWorkflowService(ordersService.prisma, {});
    ordersService.orderQueueService = { scheduleRadiusExpansion: jest.fn() };
    ordersService.matchNearbyWorkers = jest.fn().mockResolvedValue([]);
    ordersService.ordersGateway = { broadcastNewOrderToWorkers: jest.fn() };
  });

  it('rejects order creation if service is deactivated in DB regardless of cache', async () => {
    ordersService.prisma.service.findFirst.mockResolvedValue(null);
    await expect(
      ordersService.createOrder('user-1', { serviceId: 'deactivated-srv', lat: 10.7, lng: 106.6 })
    ).rejects.toThrow();
  });

  it('enforces current DB price over stale client/cache price', async () => {
    const liveDbService = {
      id: 'srv-live',
      categoryId: 'cat-1',
      basePrice: 150000,
      category: { id: 'cat-1', basePrice: 100000, commissionPercent: 10 },
    };
    ordersService.prisma.service.findFirst.mockResolvedValue(liveDbService);

    const order = await ordersService.createOrder('user-1', {
      serviceId: 'srv-live',
      lat: 10.7,
      lng: 106.6,
      estimatedPrice: 90000,
    });

    expect(order.estimatedPrice).toBe(150000);
  });

  it('notifyAiServiceSync safely catches fetch failure without disrupting admin action', () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('AI service offline'));
    expect(() => adminService.notifyAiServiceSync()).not.toThrow();
  });
});

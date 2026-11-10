import { OrdersService } from '../orders.service';

describe('Order catalog validation', () => {
  let service, tx;
  const category = { id: 'cat-1', basePrice: 100000, commissionPercent: 10 };
  const catalogService = { id: 'srv-1', categoryId: category.id, basePrice: 180000, category };
  const input = { serviceId: 'srv-1', lat: 10, lng: 106, estimatedPrice: 1 };
  beforeEach(() => {
    service = Object.create(OrdersService.prototype);
    tx = { order: { create: jest.fn().mockImplementation(async ({ data }) => ({ id: 'order-1', ...data })) },
      orderStatusHistory: { create: jest.fn() }, orderImage: { create: jest.fn() } };
    service.prisma = {
      service: { findFirst: jest.fn().mockResolvedValue(catalogService) },
      serviceCategory: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn().mockImplementation(fn => fn(tx)),
    };
    service.orderQueueService = { scheduleRadiusExpansion: jest.fn() };
    service.matchNearbyWorkers = jest.fn().mockResolvedValue([]);
    service.ordersGateway = { broadcastNewOrderToWorkers: jest.fn() };
  });
  it('uses server catalog price instead of client price', async () => {
    const result = await service.createOrder('user-1', input);
    expect(result.estimatedPrice).toBe(180000);
    expect(result.categoryId).toBe(category.id);
  });
  it('saves the incident image using fields supported by Prisma', async () => {
    await service.createOrder('user-1', { ...input, imageUrl: 'https://example.test/photo.jpg' });
    expect(tx.orderImage.create).toHaveBeenCalledWith({ data: {
      orderId: 'order-1', type: 'BEFORE', url: 'https://example.test/photo.jpg',
    } });
  });
  it('rejects service/category mismatch before writing', async () => {
    await expect(service.createOrder('user-1', { ...input, categoryId: 'other' })).rejects.toThrow();
    expect(service.prisma.$transaction).not.toHaveBeenCalled();
  });
  it('rejects missing/disabled service before writing', async () => {
    service.prisma.service.findFirst.mockResolvedValue(null);
    await expect(service.createOrder('user-1', input)).rejects.toThrow();
    expect(service.prisma.$transaction).not.toHaveBeenCalled();
  });
  it('never substitutes the first category for missing input', async () => {
    await expect(service.createOrder('user-1', { lat: 10, lng: 106 })).rejects.toThrow();
    expect(service.prisma.$transaction).not.toHaveBeenCalled();
  });
});

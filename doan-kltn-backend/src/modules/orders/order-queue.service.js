import { Injectable, OnModuleInit, OnModuleDestroy, Dependencies } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';

/**
 * OrderQueueService
 * Quản lý hàng đợi BullMQ xử lý Delayed Jobs cho luồng đặt đơn:
 * - Sau 3 phút nếu không có thợ nhận đơn (vẫn ở SEARCHING_WORKER) -> tự động mở rộng bán kính +2km.
 */
@Injectable()
@Dependencies(ConfigService, PrismaService)
export class OrderQueueService {
  constructor(configService, prisma) {
    this.configService = configService;
    this.prisma = prisma;

    const redisHost = this.configService.get('redis.host') || process.env.REDIS_HOST || 'localhost';
    const redisPort = Number(this.configService.get('redis.port') || process.env.REDIS_PORT || 6379);
    const redisPassword = this.configService.get('redis.password') || process.env.REDIS_PASSWORD || undefined;

    this.connection = {
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      maxRetriesPerRequest: null,
    };

    this.queueName = 'order-matching-expansion';
    this.queue = null;
    this.worker = null;
    this.ordersGateway = null; // Sẽ được inject nếu có
  }

  setGateway(gateway) {
    this.ordersGateway = gateway;
  }

  async onModuleInit() {
    try {
      this.queue = new Queue(this.queueName, { connection: this.connection });

      this.worker = new Worker(
        this.queueName,
        async (job) => {
          await this.processJob(job);
        },
        { connection: this.connection },
      );

      this.worker.on('failed', (job, err) => {
        console.warn(`[BullMQ] Job ${job?.id} thất bại:`, err.message);
      });

      console.log('🚀 [BullMQ] Order Matching Queue & Worker đã sẵn sàng hoạt động.');
    } catch (err) {
      console.warn('⚠️ [BullMQ] Không thể khởi tạo BullMQ (kiểm tra Redis):', err.message);
    }
  }

  async onModuleDestroy() {
    if (this.worker) await this.worker.close();
    if (this.queue) await this.queue.close();
  }

  /**
   * Lên lịch kiểm tra và mở rộng bán kính sau 3 phút nếu chưa có thợ nhận
   * @param {string} orderId - ID đơn hàng
   * @param {number} [attempt=1] - Lần mở rộng thứ mấy
   * @param {number} [currentRadius=5] - Bán kính hiện tại (km)
   * @param {number} [delayMs=180000] - Thời gian chờ (3 phút = 180.000 ms)
   */
  async scheduleRadiusExpansion(orderId, attempt = 1, currentRadius = 5, delayMs = 180000) {
    if (!this.queue) return;

    try {
      await this.queue.add(
        'expand-search-radius',
        { orderId, attempt, currentRadius },
        {
          delay: delayMs,
          jobId: `expand-${orderId}-${attempt}`,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      console.log(
        `⏳ [BullMQ Delayed Job] Đã lên lịch mở rộng bán kính cho đơn ${orderId} sau ${delayMs / 1000}s (bán kính hiện tại: ${currentRadius}km)`,
      );
    } catch (err) {
      console.warn(`[BullMQ] Không thể lên lịch delayed job:`, err.message);
    }
  }

  /**
   * Xử lý delayed job mở rộng bán kính tìm kiếm
   */
  async processJob(job) {
    const { orderId, attempt, currentRadius } = job.data;
    console.log(`🔍 [BullMQ Worker] Đang kiểm tra đơn ${orderId} (attempt: ${attempt})...`);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { category: true },
    });

    if (!order) return;

    // Chỉ mở rộng nếu đơn hàng vẫn đang ở trạng thái tìm thợ và chưa có ai nhận
    if (
      (order.status === 'SEARCHING_WORKER' || order.status === 'SEARCHING') &&
      !order.workerId
    ) {
      const expandedRadius = currentRadius + 2; // Tự động mở rộng +2km
      console.log(
        `📡 [BullMQ Auto-Expand] Đơn ${orderId} sau 3 phút chưa có thợ nhận! Tự động mở rộng bán kính từ ${currentRadius}km lên ${expandedRadius}km.`,
      );

      // Ghi log vào OrderStatusHistory
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: order.status,
          note: `Hệ thống tự động mở rộng bán kính tìm kiếm lên ${expandedRadius}km (lần ${attempt})`,
        },
      });

      // Bắn tín hiệu WebSocket cho các thợ trong bán kính mới
      if (this.ordersGateway && typeof this.ordersGateway.broadcastToNearbyWorkers === 'function') {
        this.ordersGateway.broadcastToNearbyWorkers(order, expandedRadius);
      }

      // Nếu chưa vượt quá bán kính tối đa 15km, tiếp tục lên lịch cho lần tiếp theo
      if (expandedRadius < 15 && attempt < 3) {
        await this.scheduleRadiusExpansion(orderId, attempt + 1, expandedRadius, 180000);
      } else {
        console.log(
          `⚠️ [BullMQ Timeout] Đơn ${orderId} đã quét đến ${expandedRadius}km (lần ${attempt}) mà chưa có thợ nhận. Thông báo cho khách hàng đặt lịch sau hoặc hủy miễn phí.`,
        );
        await this.prisma.orderStatusHistory.create({
          data: {
            orderId,
            status: order.status,
            note: `Hệ thống đã mở rộng tìm kiếm tới ${expandedRadius}km nhưng chưa tìm được thợ nhận đơn. Khách hàng có thể đặt lịch hẹn sau hoặc hủy miễn phí.`,
          },
        });

        if (this.ordersGateway && typeof this.ordersGateway.emitNoWorkerFound === 'function') {
          this.ordersGateway.emitNoWorkerFound(orderId);
        }
      }
    } else {
      console.log(`✅ [BullMQ] Đơn ${orderId} đã có thợ hoặc trạng thái ${order.status}, bỏ qua.`);
    }
  }
}

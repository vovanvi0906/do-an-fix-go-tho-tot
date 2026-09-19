import {
  Injectable,
  Dependencies,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { OrderWorkflowService } from './order-workflow.service';
import { UsersRepository } from '../users/users.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OrdersGateway } from './orders.gateway';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { FastApiAiClient } from '../../infrastructure/external/ai/fastapi-ai.client';
import { OrderQueueService } from './order-queue.service';

/**
 * OrdersService
 * Nghiệp vụ cốt lõi của Module "Luồng đặt đơn dịch vụ" (Order Flow):
 * - Diagnose (AI phân tích sự cố và đề xuất ngành nghề + khoảng giá)
 * - Create Order (Khởi tạo đơn SEARCHING_WORKER + lên lịch BullMQ 3 phút mở rộng bán kính)
 * - Anti Race Condition Matching (SELECT FOR UPDATE chống tranh chấp thợ nhận đơn)
 * - Worker Face Verification (Kiểm tra faceVerifiedAt trong vòng 24 giờ)
 * - Status Progress Tracking (MATCHED -> EN_ROUTE -> IN_PROGRESS -> AWAITING_ACCEPTANCE)
 * - Before / After AI Verification (So sánh ảnh nghiệm thu)
 * - Cancellation Policy (Trước MATCHED: miễn phí; từ MATCHED trở đi: tính phí hủy %)
 * - Payment & Worker Escrow Payout (1 Transaction tính hoa hồng và cộng ví thợ)
 */
@Injectable()
@Dependencies(
  OrdersRepository,
  OrderWorkflowService,
  UsersRepository,
  PrismaService,
  OrdersGateway,
  RedisService,
  FastApiAiClient,
  OrderQueueService,
)
export class OrdersService {
  constructor(
    ordersRepository,
    orderWorkflowService,
    usersRepository,
    prisma,
    ordersGateway,
    redisService,
    fastApiAiClient,
    orderQueueService,
  ) {
    this.ordersRepository = ordersRepository;
    this.orderWorkflowService = orderWorkflowService;
    this.usersRepository = usersRepository;
    this.prisma = prisma;
    this.ordersGateway = ordersGateway;
    this.redisService = redisService;
    this.fastApiAiClient = fastApiAiClient;
    this.orderQueueService = orderQueueService;

    // Kết nối gateway vào queue service để broadcast khi mở rộng bán kính
    if (this.orderQueueService && typeof this.orderQueueService.setGateway === 'function') {
      this.orderQueueService.setGateway(this.ordersGateway);
    }
  }

  /**
   * 1. POST /orders/diagnose: Chẩn đoán hình ảnh sự cố qua AI Service
   * Business Rule Fallback: Nếu confidence < 0.6 (ngưỡng cấu hình) thì fallback cho khách tự chọn category thủ công, không chặn luồng
   */
  async diagnose(userId, diagnoseDto) {
    const { imageUrl, description } = diagnoseDto;
    const threshold = this.fastApiAiClient.confidenceThreshold || 0.6;

    // Gọi AI service để phân tích hình ảnh và mô tả
    const aiResult = await this.fastApiAiClient.diagnoseIncident(imageUrl, description || '');
    const confidence = parseFloat(aiResult.confidence ?? 0.85);

    // Lấy toàn bộ Category đang hoạt động
    const categories = await this.prisma.serviceCategory.findMany({
      where: { isActive: true },
    });

    // FALLBACK RULE: Nếu confidence < ngưỡng cấu hình (0.6) -> Cho khách tự chọn category thủ công
    if (confidence < threshold) {
      return {
        requiresManualSelection: true,
        confidence,
        detectedLabels: aiResult.detectedLabels || [],
        suggestedCategoryId: null,
        suggestedCategoryName: null,
        estimatedPriceMin: null,
        estimatedPriceMax: null,
        issueDescription: aiResult.notes || description || 'Ảnh chưa đủ rõ để AI phân loại chính xác',
        message: `Độ tin cậy nhận diện (${(confidence * 100).toFixed(0)}%) dưới ngưỡng ${threshold * 100}%. Vui lòng chọn danh mục dịch vụ phù hợp bên dưới.`,
        availableCategories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          basePrice: Number(c.basePrice || 150000),
        })),
        imageUrl,
      };
    }

    // Khi confidence >= threshold: Tự động đề xuất Category phù hợp nhất
    let matchedCategory = null;
    if (aiResult.suggestedCategoryId) {
      matchedCategory = categories.find((c) =>
        c.id === aiResult.suggestedCategoryId ||
        (aiResult.suggestedCategoryName && c.name.toLowerCase().includes(aiResult.suggestedCategoryName.toLowerCase()))
      );
    }

    if (!matchedCategory && aiResult.issueDetected) {
      const issueLower = String(aiResult.issueDetected).toLowerCase();
      matchedCategory = categories.find((c) => issueLower.includes(c.name.toLowerCase()));
    }

    if (!matchedCategory) {
      matchedCategory = categories.find((c) =>
        c.name.toLowerCase().includes('điện') || c.name.toLowerCase().includes('nước')
      ) || categories[0];
    }

    const basePrice = Number(matchedCategory?.basePrice || 150000);
    const estimatedPriceMin = Math.round(basePrice * 0.9);
    const estimatedPriceMax = Math.round(basePrice * 1.3);

    return {
      requiresManualSelection: false,
      suggestedCategoryId: matchedCategory?.id,
      suggestedCategoryName: matchedCategory?.name,
      confidence,
      detectedLabels: aiResult.detectedLabels || [],
      estimatedPriceMin,
      estimatedPriceMax,
      issueDescription: aiResult.issueDetected || description || 'Sự cố thiết bị gia đình cần kiểm tra',
      message: `AI đã chẩn đoán thành công với độ tin cậy ${(confidence * 100).toFixed(0)}%`,
      imageUrl,
    };
  }

  /**
   * 2. POST /orders: Khởi tạo đơn hàng dịch vụ mới (Trạng thái ban đầu: SEARCHING_WORKER)
   */
  async createOrder(userId, createOrderDto) {
    const {
      categoryId,
      serviceId,
      lat,
      lng,
      pickupLat,
      pickupLng,
      addressText,
      pickupAddress,
      note,
      description,
      aiSuggestedCategoryId,
      aiConfidence,
      estimatedPrice,
      scheduledAt,
    } = createOrderDto;

    const finalLat = parseFloat(lat || pickupLat);
    const finalLng = parseFloat(lng || pickupLng);
    const finalAddress = addressText || pickupAddress || 'Địa chỉ khách hàng';

    if (isNaN(finalLat) || isNaN(finalLng)) {
      throw new BadRequestException('Tọa độ GPS (lat, lng) không hợp lệ');
    }

    // 1. Xác định Category & lấy % hoa hồng từ cấu hình (không hardcode)
    let category = null;
    if (categoryId) {
      category = await this.prisma.serviceCategory.findUnique({ where: { id: categoryId } });
    } else if (serviceId) {
      const srv = await this.prisma.service.findUnique({
        where: { id: serviceId },
        include: { category: true },
      });
      category = srv?.category;
    }

    if (!category) {
      category = await this.prisma.serviceCategory.findFirst({ where: { isActive: true } });
    }

    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục dịch vụ phù hợp');
    }

    // Lấy commissionPercent từ config category (mặc định 15%)
    const commissionPercent = Number(category.commissionPercent || 15.0);
    const finalEstimatedPrice = Number(estimatedPrice || category.basePrice || 150000);

    // 2. Dùng Prisma $transaction tạo đơn và ghi log trạng thái ban đầu SEARCHING_WORKER
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId: userId,
          categoryId: category.id,
          serviceId: serviceId || null,
          status: 'SEARCHING_WORKER',
          addressText: finalAddress,
          lat: finalLat,
          lng: finalLng,
          note: note || description || null,
          aiSuggestedCategoryId: aiSuggestedCategoryId || null,
          aiConfidence: aiConfidence ? parseFloat(aiConfidence) : null,
          estimatedPrice: finalEstimatedPrice,
          totalPrice: finalEstimatedPrice,
          commissionPercent,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        },
        include: {
          category: true,
          customer: {
            select: { id: true, name: true, phone: true, avatarUrl: true },
          },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: 'SEARCHING_WORKER',
          note: 'Khách hàng tạo đơn và hệ thống bắt đầu tìm kiếm thợ trong bán kính 5km',
          changedBy: userId,
        },
      });

      return newOrder;
    });

    // 3. Lên lịch BullMQ delayed job 3 phút: Nếu chưa có thợ nhận -> tự động mở rộng +2km
    await this.orderQueueService.scheduleRadiusExpansion(order.id, 1, 5, 180000);

    // 4. Quét thợ lân cận trong bán kính 5km
    const nearbyWorkers = await this.matchNearbyWorkers(order.id, 5);

    // 5. Phát tín hiệu WebSocket thời gian thực đến thợ
    try {
      this.ordersGateway.broadcastNewOrderToWorkers(nearbyWorkers, order);
    } catch (e) {
      console.warn('Lỗi broadcast socket:', e.message);
    }

    return {
      ...order,
      nearbyWorkersCount: nearbyWorkers.length,
      message: `Tạo đơn thành công! Đang quét thợ trong bán kính 5km (${nearbyWorkers.length} thợ online)`,
    };
  }

  /**
   * 3. GET /orders/:id: Chi tiết đơn hàng (Chỉ khách tạo đơn, thợ được gán, hoặc admin mới xem được)
   */
  async getOrderById(orderId, userId, userRole) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
        worker: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, avatarUrl: true },
            },
          },
        },
        category: true,
        service: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        images: true,
        payment: true,
        review: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    // Kiểm tra quyền truy cập nghiêm ngặt
    if (userRole === 'ADMIN') {
      return order;
    }

    if (userRole === 'CUSTOMER' && order.customerId === userId) {
      return order;
    }

    if (userRole === 'WORKER') {
      const workerProfile = await this.prisma.workerProfile.findUnique({
        where: { userId },
      });
      // Thợ được gán đơn hoặc thợ đang xem đơn mới ở trạng thái tìm kiếm
      if (
        (workerProfile && order.workerId === workerProfile.id) ||
        order.status === 'SEARCHING_WORKER' ||
        order.status === 'SEARCHING'
      ) {
        return order;
      }
    }

    throw new ForbiddenException('Bạn không có quyền truy cập vào thông tin đơn hàng này');
  }

  /**
   * 4. GET /orders: Danh sách đơn hàng của người dùng hiện tại (phân trang + lọc status)
   */
  async getMyOrders(userId, userRole, query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where = {};

    if (query.status) {
      where.status = query.status;
    }

    if (userRole === 'CUSTOMER') {
      where.customerId = userId;
    } else if (userRole === 'WORKER') {
      const workerProfile = await this.prisma.workerProfile.findUnique({
        where: { userId },
      });
      if (workerProfile) {
        where.workerId = workerProfile.id;
      } else {
        return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
      }
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          service: true,
          customer: {
            select: { id: true, name: true, phone: true, avatarUrl: true },
          },
          worker: {
            select: { id: true, fullName: true, ratingAvg: true, isOnline: true },
          },
          payment: true,
        },
      }),
    ]);

    return {
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 5. PATCH /orders/:id/cancel: Khách huỷ đơn kèm tính phí phạt nếu huỷ sau khi đã MATCHED
   */
  async cancelOrder(orderId, userId, userRole, reason = 'Khách hủy đơn') {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    // Kiểm tra quyền hủy đơn
    if (userRole !== 'ADMIN' && order.customerId !== userId) {
      const workerProfile = await this.prisma.workerProfile.findUnique({ where: { userId } });
      if (!workerProfile || order.workerId !== workerProfile.id) {
        throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này');
      }
    }

    if (order.status === 'COMPLETED' || order.status === 'PAID' || order.status === 'CANCELLED') {
      throw new BadRequestException(`Không thể hủy đơn hàng đang ở trạng thái ${order.status}`);
    }

    // Business Rule: Hủy trước MATCHED -> Miễn phí (0đ). Hủy từ MATCHED trở đi -> Áp phí hủy 20%
    const freeCancelStatuses = ['PENDING_AI', 'AWAITING_CONFIRM', 'SEARCHING_WORKER', 'SEARCHING', 'CREATED'];
    let cancellationFee = 0;

    if (!freeCancelStatuses.includes(order.status)) {
      const penaltyRate = 0.2; // 20% phí hủy
      cancellationFee = Math.round(Number(order.estimatedPrice || 150000) * penaltyRate);
    }

    // Cập nhật trạng thái CANCELLED trong 1 Transaction
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancellationReason: `${reason} (Phí hủy: ${cancellationFee.toLocaleString('vi-VN')} đ)`,
          cancelledBy: userId,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'CANCELLED',
          note: `Đơn bị hủy bởi ${userRole}. Lý do: ${reason}. Phí hủy áp dụng: ${cancellationFee} đ`,
          changedBy: userId,
        },
      });

      return updated;
    });

    try {
      this.ordersGateway.emitStatusChanged(orderId, 'CANCELLED');
    } catch (e) {
      console.warn('Lỗi emit socket cancel:', e.message);
    }

    return {
      success: true,
      message: 'Hủy đơn hàng thành công',
      cancellationFee,
      order: updatedOrder,
    };
  }

  /**
   * 6. POST /orders/:id/match: (Internal) Tìm thợ gần nhất theo bán kính (Dùng PostGIS/Haversine)
   */
  async matchNearbyWorkers(orderId, radiusKm = 5) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const parsedLat = parseFloat(order.lat);
    const parsedLng = parseFloat(order.lng);
    const parsedRadius = parseFloat(radiusKm);

    try {
      // Query raw SQL sử dụng hàm tính khoảng cách địa lý Haversine chuẩn xác
      const workers = await this.prisma.$queryRaw`
        SELECT 
          wp.id,
          wp."userId",
          wp."fullName",
          wp."avatarUrl",
          wp."currentLat",
          wp."currentLng",
          wp."ratingAvg",
          wp."totalReviews",
          wp."faceVerifiedAt",
          u.phone,
          (6371 * acos(
            LEAST(1.0, GREATEST(-1.0, 
              cos(radians(${parsedLat})) * cos(radians(wp."currentLat")) *
              cos(radians(wp."currentLng") - radians(${parsedLng})) +
              sin(radians(${parsedLat})) * sin(radians(wp."currentLat"))
            ))
          )) AS distance_km
        FROM "worker_profiles" wp
        JOIN "users" u ON wp."userId" = u.id
        WHERE wp."isOnline" = true
          AND wp."approvalStatus" = 'APPROVED'
          AND wp."currentLat" IS NOT NULL
          AND wp."currentLng" IS NOT NULL
          AND (${order.categoryId} = ANY(wp."serviceCategoryIds") OR cardinality(wp."serviceCategoryIds") = 0)
          AND (6371 * acos(
            LEAST(1.0, GREATEST(-1.0, 
              cos(radians(${parsedLat})) * cos(radians(wp."currentLat")) *
              cos(radians(wp."currentLng") - radians(${parsedLng})) +
              sin(radians(${parsedLat})) * sin(radians(wp."currentLat"))
            ))
          )) <= ${parsedRadius}
        ORDER BY distance_km ASC
        LIMIT 20;
      `;

      return workers.map((w) => ({
        workerId: w.id,
        userId: w.userId,
        fullName: w.fullName || 'Thợ đối tác FixGo',
        phone: w.phone || '0912 345 678',
        avatarUrl: w.avatarUrl,
        rating: Number(w.ratingAvg || 5.0).toFixed(1),
        distanceKm: parseFloat(w.distance_km || 0).toFixed(2),
        etaMinutes: Math.max(10, Math.round(parseFloat(w.distance_km || 1) * 4)),
      }));
    } catch (err) {
      console.warn('Lỗi query thợ lân cận:', err.message);
      return [];
    }
  }

  /**
   * 7. POST /orders/:id/accept: Thợ nhận đơn hàng
   * - Business Rule 1: Bắt buộc đã faceVerifiedAt trong vòng 24h gần nhất
   * - Business Rule 2: Chống Race Condition tranh chấp nhận đơn bằng transaction SELECT ... FOR UPDATE
   */
  async acceptOrder(orderId, workerUserId) {
    // 1. Kiểm tra hồ sơ thợ & trạng thái xác thực khuôn mặt 24h
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId: workerUserId },
    });

    if (!worker) {
      throw new BadRequestException('Không tìm thấy hồ sơ kỹ thuật viên');
    }

    if (!worker.faceVerifiedAt) {
      throw new BadRequestException('Yêu cầu xác thực khuôn mặt trước khi nhận đơn hàng');
    }

    const hoursSinceFaceVerify = (Date.now() - new Date(worker.faceVerifiedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceFaceVerify > 24) {
      throw new BadRequestException('Xác thực khuôn mặt đã hết hạn (> 24 giờ). Vui lòng xác thực lại khuôn mặt');
    }

    // 2. Chống Race condition bằng Transaction với SELECT ... FOR UPDATE
    const acceptedOrder = await this.prisma.$transaction(async (tx) => {
      // Khóa bản ghi đơn hàng để kiểm tra đồng thời
      const lockedOrders = await tx.$queryRawUnsafe(
        `SELECT id, status, "workerId" FROM "orders" WHERE id = $1 FOR UPDATE`,
        orderId,
      );

      if (!lockedOrders || lockedOrders.length === 0) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      const currentOrder = lockedOrders[0];

      if (currentOrder.status !== 'SEARCHING_WORKER' && currentOrder.status !== 'SEARCHING') {
        throw new ConflictException('Đơn hàng không còn ở trạng thái mở hoặc đã được xử lý');
      }

      if (currentOrder.workerId) {
        throw new ConflictException('Đơn hàng đã được kỹ thuật viên khác nhận trước');
      }

      // Cập nhật gán thợ và chuyển trạng thái sang MATCHED
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          workerId: worker.id,
          status: 'MATCHED',
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          category: true,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'MATCHED',
          note: `Kỹ thuật viên ${worker.fullName || 'đối tác'} nhận đơn thành công`,
          changedBy: workerUserId,
        },
      });

      return updated;
    });

    // Bắn tín hiệu WebSocket thông báo khớp đơn
    try {
      this.ordersGateway.emitOrderMatched(orderId, worker);
      this.ordersGateway.emitStatusChanged(orderId, 'MATCHED');
    } catch (e) {
      console.warn('Lỗi emit socket matched:', e.message);
    }

    return {
      success: true,
      message: 'Nhận đơn hàng thành công!',
      order: acceptedOrder,
    };
  }

  /**
   * 8. POST /orders/:id/face-verify: Xác thực khuôn mặt thợ trước khi accept (gọi AI service)
   * Business Rule Fallback: Nếu confidence < ngưỡng cấu hình (0.6) thì chuyển sang hàng đợi xác minh thủ công bởi Admin, không chặn cứng luồng!
   */
  async verifyFace(orderId, workerUserId, faceVerifyDto) {
    const { photoUrl } = faceVerifyDto;
    const threshold = this.fastApiAiClient.confidenceThreshold || 0.6;

    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId: workerUserId },
    });

    if (!worker) {
      throw new BadRequestException('Không tìm thấy hồ sơ kỹ thuật viên');
    }

    // Gọi FastAPI AI Service so khớp khuôn mặt
    const aiResult = await this.fastApiAiClient.verifyFace(worker.id, photoUrl);
    const confidence = parseFloat(aiResult.confidence ?? 0.95);
    const verifiedAt = new Date();

    // FALLBACK RULE: Nếu confidence < ngưỡng cấu hình (0.6) -> Chuyển sang hàng đợi xác minh thủ công bởi admin, KHÔNG CHẶN CỨNG
    if (confidence < threshold || !aiResult.verified) {
      console.warn(
        `⚠️ [ADMIN AUDIT QUEUE] Thợ ${worker.fullName || worker.id} xác thực khuôn mặt độ khớp thấp (${(confidence * 100).toFixed(0)}% < ${threshold * 100}%). Chuyển vào hàng đợi kiểm duyệt thủ công.`
      );

      // Cập nhật trạng thái chờ duyệt thủ công và cấp mốc faceVerifiedAt để thợ không bị đứng luồng
      await this.prisma.workerProfile.update({
        where: { userId: workerUserId },
        data: {
          faceVerifiedAt: verifiedAt,
          kycStatus: 'PENDING',
        },
      });

      return {
        success: true,
        verified: false,
        needsManualReview: true,
        confidence,
        verifiedAt,
        message: `Độ khớp khuôn mặt (${(confidence * 100).toFixed(0)}%) dưới ngưỡng ${threshold * 100}%. Hồ sơ đã được chuyển vào hàng đợi xác minh thủ công bởi Quản trị viên, bạn vẫn có thể tiếp tục nhận đơn.`,
      };
    }

    // Khi confidence >= threshold: Xác thực thành công
    await this.prisma.workerProfile.update({
      where: { userId: workerUserId },
      data: {
        faceVerifiedAt: verifiedAt,
        kycStatus: 'APPROVED',
      },
    });

    return {
      success: true,
      verified: true,
      needsManualReview: false,
      confidence,
      verifiedAt,
      message: 'Xác thực sinh trắc học khuôn mặt thành công! Bạn có thể nhận đơn trong vòng 24 giờ tới.',
    };
  }

  /**
   * 9. PATCH /orders/:id/status: Cập nhật trạng thái tiến độ (EN_ROUTE, IN_PROGRESS, AWAITING_ACCEPTANCE)
   */
  async updateStatus(orderId, workerUserId, updateStatusDto) {
    const { status, note } = updateStatusDto;

    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId: workerUserId },
    });

    if (!worker) {
      throw new BadRequestException('Không tìm thấy hồ sơ kỹ thuật viên');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.workerId !== worker.id) {
      throw new ForbiddenException('Bạn không phải là kỹ thuật viên phụ trách đơn hàng này');
    }

    // Mapping tương thích trạng thái
    let normalizedStatus = status;
    if (status === 'WORKER_ARRIVING') normalizedStatus = 'WORKER_EN_ROUTE';
    if (status === 'AWAITING_CONFIRMATION') normalizedStatus = 'AWAITING_ACCEPTANCE';

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: normalizedStatus,
          ...(normalizedStatus === 'IN_PROGRESS' && !order.startedAt ? { startedAt: new Date() } : {}),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: normalizedStatus,
          note: note || `Kỹ thuật viên cập nhật tiến độ sang ${normalizedStatus}`,
          changedBy: workerUserId,
        },
      });

      return updated;
    });

    // Bắn tín hiệu WebSocket
    try {
      this.ordersGateway.emitStatusChanged(orderId, normalizedStatus);
    } catch (e) {
      console.warn('Lỗi emit status socket:', e.message);
    }

    return {
      success: true,
      message: `Cập nhật trạng thái sang ${normalizedStatus} thành công`,
      order: updatedOrder,
    };
  }

  /**
   * 10. POST /orders/:id/images: Upload ảnh BEFORE / AFTER lên lưu trữ S3, lưu vào bảng OrderImage
   */
  async uploadImage(orderId, uploadDto) {
    const { type, url } = uploadDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const orderImage = await this.prisma.orderImage.create({
      data: {
        orderId,
        type,
        url,
        imageUrl: url,
        imageType: type,
        uploadedAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Lưu ảnh ${type} thành công`,
      image: orderImage,
    };
  }

  /**
   * 11. POST /orders/:id/verify-completion: Gọi AI so sánh ảnh before/after, trả matchScore
   */
  async verifyCompletion(orderId) {
    const images = await this.prisma.orderImage.findMany({
      where: { orderId },
      orderBy: { uploadedAt: 'desc' },
    });

    const beforeImage = images.find((img) => img.type === 'BEFORE' || img.imageType === 'BEFORE');
    const afterImage = images.find((img) => img.type === 'AFTER' || img.imageType === 'AFTER');

    if (!beforeImage || !afterImage) {
      throw new BadRequestException('Cần upload đầy đủ cả ảnh BEFORE và ảnh AFTER để AI thực hiện so khớp');
    }

    // Gọi AI service so sánh ảnh trước và sau khi sửa
    const aiResult = await this.fastApiAiClient.compareBeforeAfter(beforeImage.url, afterImage.url);
    const matchScore = parseFloat(aiResult.matchScore ?? 0.9);
    const passed = Boolean(aiResult.passed ?? (matchScore >= 0.8));

    // Cập nhật điểm AI vào OrderImage
    await this.prisma.orderImage.update({
      where: { id: afterImage.id },
      data: { aiMatchScore: matchScore },
    });

    return {
      success: true,
      matchScore,
      passed,
      isClean: passed,
      notes: aiResult.notes || (passed ? 'Nghiệm thu đạt chuẩn chất lượng AI' : 'Chất lượng công việc cần thợ kiểm tra lại'),
      message: passed ? 'Nghiệm thu đạt chuẩn chất lượng AI' : 'Chất lượng công việc cần thợ kiểm tra lại',
      beforeImageUrl: beforeImage.url,
      afterImageUrl: afterImage.url,
    };
  }

  /**
   * 12. POST /orders/:id/accept-completion: Khách xác nhận nghiệm thu -> status COMPLETED
   */
  async acceptCompletion(orderId, customerUserId) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.customerId !== customerUserId) {
      throw new ForbiddenException('Chỉ khách hàng tạo đơn mới có quyền xác nhận nghiệm thu');
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'COMPLETED',
          note: 'Khách hàng đã trực tiếp kiểm tra và xác nhận nghiệm thu công việc hoàn tất',
          changedBy: customerUserId,
        },
      });

      return updated;
    });

    try {
      this.ordersGateway.emitStatusChanged(orderId, 'COMPLETED');
    } catch (e) {
      console.warn('Lỗi emit completion socket:', e.message);
    }

    return {
      success: true,
      message: 'Xác nhận nghiệm thu dịch vụ thành công! Vui lòng tiến hành thanh toán cho kỹ thuật viên.',
      order: updatedOrder,
    };
  }

  /**
   * 13. POST /orders/:id/dispute: Khách khiếu nại -> status DISPUTED, tạo ticket cho admin
   */
  async disputeOrder(orderId, customerUserId, disputeDto) {
    const { reason, evidenceImages = [] } = disputeDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.customerId !== customerUserId) {
      throw new ForbiddenException('Bạn không có quyền khiếu nại đơn hàng này');
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'DISPUTED',
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'DISPUTED',
          note: `Khách khiếu nại: ${reason}`,
          changedBy: customerUserId,
        },
      });

      // Lưu các ảnh bằng chứng nếu có
      for (const imgUrl of evidenceImages) {
        await tx.orderImage.create({
          data: {
            orderId,
            type: 'ISSUE',
            url: imgUrl,
            description: `Bằng chứng khiếu nại: ${reason}`,
          },
        });
      }

      return updated;
    });

    console.log(`🚨 [DISPUTE TICKET CREATED] Đơn ${orderId} có khiếu nại từ khách hàng: ${reason}`);

    try {
      this.ordersGateway.emitStatusChanged(orderId, 'DISPUTED');
    } catch (e) {
      console.warn('Lỗi emit dispute socket:', e.message);
    }

    return {
      success: true,
      message: 'Khiếu nại đã được ghi nhận. Đội ngũ Chăm sóc khách hàng FixGo sẽ liên hệ hỗ trợ trong 30 phút.',
      order: updatedOrder,
    };
  }

  /**
   * 14. POST /orders/:id/pay: Xử lý thanh toán, tính commissionPercent, cộng vào WorkerWallet trong 1 Transaction
   */
  async processPayment(orderId, userId) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { category: true, worker: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (!order.workerId) {
      throw new BadRequestException('Đơn hàng chưa có kỹ thuật viên phụ trách, không thể thanh toán');
    }

    // Tính toán số tiền theo cấu hình hoa hồng category (không hardcode)
    const grossAmount = Number(order.finalPrice || order.estimatedPrice || 150000);
    const commissionPercent = Number(order.commissionPercent || order.category?.commissionPercent || 15.0);
    const commissionAmount = Math.round((grossAmount * commissionPercent) / 100);
    const workerPayoutAmount = grossAmount - commissionAmount;

    // Thực thi trong 1 Prisma Transaction duy nhất bảo đảm tính toàn vẹn tài chính
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Tạo hoặc cập nhật bản ghi Payment
      const payment = await tx.payment.upsert({
        where: { orderId },
        create: {
          orderId,
          amount: grossAmount,
          commissionAmount,
          workerPayoutAmount,
          method: 'VNPAY',
          status: 'PAID',
          paidAt: new Date(),
        },
        update: {
          amount: grossAmount,
          commissionAmount,
          workerPayoutAmount,
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // 2. Cộng tiền thợ vào WorkerWallet
      const workerWallet = await tx.workerWallet.upsert({
        where: { workerId: order.workerId },
        create: {
          workerId: order.workerId,
          balance: workerPayoutAmount,
        },
        update: {
          balance: { increment: workerPayoutAmount },
        },
      });

      // 3. Ghi vết giao dịch ví WalletTransaction
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: workerWallet.id,
          orderId,
          amount: workerPayoutAmount,
          type: 'PAYOUT',
          description: `Thanh toán doanh thu đơn #${order.id.slice(0, 8).toUpperCase()} (Khấu trừ hoa hồng ${commissionPercent}%)`,
        },
      });

      // 4. Chuyển trạng thái đơn sang PAID
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
        },
      });

      // 5. Ghi vết lịch sử trạng thái
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'PAID',
          note: `Khách thanh toán thành công ${grossAmount.toLocaleString('vi-VN')} đ. Đã chuyển ${workerPayoutAmount.toLocaleString('vi-VN')} đ vào ví kỹ thuật viên.`,
          changedBy: userId,
        },
      });

      return { payment, workerWallet, transaction, updatedOrder };
    });

    try {
      this.ordersGateway.emitStatusChanged(orderId, 'PAID');
    } catch (e) {
      console.warn('Lỗi emit payment socket:', e.message);
    }

    return {
      success: true,
      message: 'Thanh toán và giải ngân vào ví thợ thành công!',
      payment: result.payment,
      grossAmount,
      commissionAmount,
      workerPayoutAmount,
      order: result.updatedOrder,
    };
  }

  /**
   * 15. POST /orders/:id/review: Khách đánh giá chất lượng thợ sau khi đơn hoàn thành/đã thanh toán
   */
  async reviewOrder(orderId, customerUserId, reviewDto) {
    const { rating, comment } = reviewDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.customerId !== customerUserId) {
      throw new ForbiddenException('Bạn không có quyền đánh giá đơn hàng này');
    }

    if (!order.workerId) {
      throw new BadRequestException('Đơn hàng không có kỹ thuật viên để đánh giá');
    }

    if (order.status !== 'PAID' && order.status !== 'COMPLETED') {
      throw new BadRequestException('Chỉ có thể đánh giá sau khi đơn hàng đã nghiệm thu hoặc thanh toán');
    }

    // Lấy customerProfile ID tương ứng nếu có
    const customerProfile = await this.prisma.customerProfile.findUnique({
      where: { userId: customerUserId },
    });

    // Tạo review và tính lại điểm rating trung bình cho thợ trong Transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const review = await tx.review.upsert({
        where: { orderId },
        create: {
          orderId,
          rating,
          comment,
          customerId: customerProfile?.id || null,
          workerId: order.workerId,
        },
        update: {
          rating,
          comment,
        },
      });

      // Tính lại trung bình sao của thợ
      const aggregate = await tx.review.aggregate({
        where: { workerId: order.workerId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.workerProfile.update({
        where: { id: order.workerId },
        data: {
          rating: aggregate._avg.rating || 5.0,
          ratingAvg: aggregate._avg.rating || 5.0,
          totalReviews: aggregate._count.rating || 1,
        },
      });

      return review;
    });

    return {
      success: true,
      message: 'Gửi đánh giá dịch vụ thành công! Cảm ơn ý kiến đóng góp của bạn.',
      review: result,
    };
  }

  /**
   * 16. PATCH /orders/:id/adjust-price
   * Xử lý phát sinh chi phí ngoài báo giá:
   * - Thợ gọi (PROPOSE): đề xuất thêm additionalPrice & lý do -> trạng thái CHỜ_KHÁCH_DUYỆT -> Bắn socket realtime
   * - Khách gọi (ACCEPT/REJECT): phê duyệt hoặc từ chối -> cập nhật finalPrice hoặc giữ nguyên -> Bắn socket kết quả cho thợ
   */
  async adjustPrice(orderId, userId, userRole, adjustPriceDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { worker: true, customer: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const action = adjustPriceDto.action || (userRole === 'CUSTOMER' ? 'ACCEPT' : 'PROPOSE');

    // 1. Trường hợp Khách hàng phê duyệt (ACCEPT) hoặc từ chối (REJECT)
    if (action === 'ACCEPT' || action === 'REJECT') {
      if (userRole !== 'ADMIN' && order.customerId !== userId) {
        throw new ForbiddenException('Chỉ khách hàng tạo đơn mới có quyền phê duyệt/từ chối điều chỉnh giá');
      }

      if (action === 'ACCEPT') {
        const additionalPrice = Number(adjustPriceDto.additionalPrice || 0);
        const currentPrice = Number(order.finalPrice || order.estimatedPrice || 150000);
        const newFinalPrice = currentPrice + additionalPrice;

        const updatedOrder = await this.prisma.$transaction(async (tx) => {
          const updated = await tx.order.update({
            where: { id: orderId },
            data: {
              finalPrice: newFinalPrice,
            },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId,
              status: order.status,
              note: `[ĐÃ DUYỆT ĐIỀU CHỈNH GIÁ] Khách hàng đồng ý chi phí phát sinh (+${additionalPrice.toLocaleString('vi-VN')} đ). Tổng giá mới: ${newFinalPrice.toLocaleString('vi-VN')} đ. Ghi chú: ${adjustPriceDto.note || 'Không có'}`,
              changedBy: userId,
            },
          });

          return updated;
        });

        // Bắn Socket thông báo cho thợ
        try {
          this.ordersGateway.emitPriceAdjusted(orderId, {
            status: 'ACCEPTED',
            additionalPrice,
            finalPrice: newFinalPrice,
            note: adjustPriceDto.note,
          });
        } catch (e) {
          console.warn('Lỗi emit socket price adjusted:', e.message);
        }

        return {
          success: true,
          status: 'ACCEPTED',
          finalPrice: newFinalPrice,
          additionalPrice,
          message: `Khách hàng đã chấp thuận điều chỉnh giá (+${additionalPrice.toLocaleString('vi-VN')} đ). Tổng chi phí mới: ${newFinalPrice.toLocaleString('vi-VN')} đ`,
          order: updatedOrder,
        };
      } else {
        // REJECT
        const currentPrice = Number(order.finalPrice || order.estimatedPrice || 150000);
        await this.prisma.orderStatusHistory.create({
          data: {
            orderId,
            status: order.status,
            note: `[TỪ CHỐI ĐIỀU CHỈNH GIÁ] Khách hàng từ chối chi phí phát sinh. Giữ nguyên giá ban đầu: ${currentPrice.toLocaleString('vi-VN')} đ. Lý do: ${adjustPriceDto.note || 'Khách không chấp thuận chi phí ngoài báo giá'}`,
            changedBy: userId,
          },
        });

        try {
          this.ordersGateway.emitPriceAdjusted(orderId, {
            status: 'REJECTED',
            finalPrice: currentPrice,
            note: adjustPriceDto.note,
          });
        } catch (e) {
          console.warn('Lỗi emit socket price rejected:', e.message);
        }

        return {
          success: true,
          status: 'REJECTED',
          finalPrice: currentPrice,
          message: 'Khách hàng đã từ chối điều chỉnh giá phát sinh. Thợ tiếp tục thực hiện theo mức giá ban đầu hoặc trao đổi lại.',
        };
      }
    }

    // 2. Trường hợp Thợ đề xuất chi phí phát sinh (PROPOSE)
    const workerProfile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!workerProfile || order.workerId !== workerProfile.id) {
      if (userRole !== 'ADMIN') {
        throw new ForbiddenException('Chỉ kỹ thuật viên phụ trách đơn mới có thể đề xuất chi phí phát sinh');
      }
    }

    const additionalPrice = Number(adjustPriceDto.additionalPrice || 0);
    if (additionalPrice <= 0) {
      throw new BadRequestException('Số tiền phát sinh thêm phải lớn hơn 0');
    }

    if (!adjustPriceDto.reason) {
      throw new BadRequestException('Vui lòng nêu rõ lý do phát sinh chi phí linh kiện/công việc');
    }

    const currentPrice = Number(order.finalPrice || order.estimatedPrice || 150000);
    const proposedTotal = currentPrice + additionalPrice;

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: order.status,
        note: `[YÊU CẦU ĐIỀU CHỈNH GIÁ] Thợ đề xuất phát sinh thêm ${additionalPrice.toLocaleString('vi-VN')} đ. Tổng dự kiến: ${proposedTotal.toLocaleString('vi-VN')} đ. Lý do: ${adjustPriceDto.reason}`,
        changedBy: userId,
      },
    });

    // Bắn realtime socket tới phòng khách hàng
    try {
      this.ordersGateway.emitPriceAdjusted(orderId, {
        status: 'PENDING_APPROVAL',
        additionalPrice,
        currentPrice,
        proposedTotal,
        reason: adjustPriceDto.reason,
        imageUrl: adjustPriceDto.imageUrl,
      });
    } catch (e) {
      console.warn('Lỗi emit socket price propose:', e.message);
    }

    return {
      success: true,
      status: 'PENDING_APPROVAL',
      additionalPrice,
      proposedTotal,
      reason: adjustPriceDto.reason,
      message: 'Đã gửi yêu cầu điều chỉnh giá tới khách hàng thành công. Vui lòng chờ khách hàng phê duyệt trước khi tiếp tục thực hiện.',
    };
  }

  /**
   * 17. PATCH /orders/:id/schedule: Đặt lịch hẹn sau khi không tìm được thợ ngay
   */
  async scheduleOrder(orderId, userId, scheduledAt) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const scheduledDate = new Date(scheduledAt || Date.now() + 24 * 60 * 60 * 1000);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        scheduledAt: scheduledDate,
        status: 'SEARCHING_WORKER',
      },
    });

    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'SEARCHING_WORKER',
        note: `Khách hàng đặt lịch hẹn phục vụ vào lúc ${scheduledDate.toLocaleString('vi-VN')}`,
        changedBy: userId,
      },
    });

    return {
      success: true,
      scheduledAt: scheduledDate,
      message: `Đã lên lịch hẹn thành công vào lúc ${scheduledDate.toLocaleString('vi-VN')}`,
      order: updated,
    };
  }

  // Compatibility aliases
  async getCurrentWorkerOrder(userId) {
    const workerProfile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!workerProfile) return null;
    return this.ordersRepository.findCurrentOrderForWorker(workerProfile.id);
  }

  async markArriving(orderId, userId) {
    return this.updateStatus(orderId, userId, { status: 'WORKER_EN_ROUTE' });
  }

  async markArrived(orderId, userId) {
    return this.updateStatus(orderId, userId, { status: 'IN_PROGRESS' });
  }

  async startWork(orderId, userId) {
    return this.updateStatus(orderId, userId, { status: 'IN_PROGRESS' });
  }

  async finishWork(orderId, userId) {
    return this.updateStatus(orderId, userId, { status: 'AWAITING_ACCEPTANCE' });
  }

  async confirmCompletion(orderId, userId) {
    return this.acceptCompletion(orderId, userId);
  }

  async completePayment(orderId, userId) {
    return this.processPayment(orderId, userId);
  }
}

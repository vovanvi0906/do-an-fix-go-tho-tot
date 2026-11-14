import { validFaceResult, hasTrustedFaceProof } from '../../infrastructure/external/ai/face-result';
import { ORDER_STATUS } from './constants/order-status';
import { resolveDiagnosis } from './diagnosis/diagnosis-resolver';
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
    if (
      this.orderQueueService &&
      typeof this.orderQueueService.setGateway === 'function'
    ) {
      this.orderQueueService.setGateway(this.ordersGateway);
    }
  }

  /**
   * 1. POST /orders/diagnose: Chẩn đoán hình ảnh sự cố qua AI Service
   * Business Rule Fallback: Nếu confidence < 0.6 (ngưỡng cấu hình) thì fallback cho khách tự chọn category thủ công, không chặn luồng
   */
  async diagnose(userId, diagnoseDto) {
    return resolveDiagnosis(this.prisma, this.fastApiAiClient, diagnoseDto);
  }

  /**
   * 2. POST /orders: Khởi tạo đơn hàng dịch vụ mới (Trạng thái ban đầu: SEARCHING_WORKER)
   */
  async createOrder(userId, createOrderDto) {
    const actor = await this.orderWorkflowService.actor(this.prisma, userId);
    if (actor.role !== 'CUSTOMER') throw new ForbiddenException('CUSTOMER_REQUIRED');
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
      scheduledAt,
      imageUrl,
    } = createOrderDto;

    const finalLat = parseFloat(lat || pickupLat);
    const finalLng = parseFloat(lng || pickupLng);
    const finalAddress = addressText || pickupAddress || 'Địa chỉ khách hàng';

    if (isNaN(finalLat) || isNaN(finalLng)) {
      throw new BadRequestException('Tọa độ GPS (lat, lng) không hợp lệ');
    }

    let service = null;
    let category = null;
    if (serviceId) {
      service = await this.prisma.service.findFirst({
        where: { id: serviceId, isActive: true, category: { isActive: true } },
        include: { category: true },
      });
      if (!service || (categoryId && categoryId !== service.categoryId)) {
        throw new BadRequestException('Dịch vụ không khả dụng hoặc không thuộc danh mục đã chọn');
      }
      category = service.category;
    } else if (categoryId) {
      category = await this.prisma.serviceCategory.findFirst({
        where: { id: categoryId, isActive: true },
      });
    }
    if (!category) {
      throw new BadRequestException('Vui lòng chọn danh mục hoặc dịch vụ hợp lệ');
    }
    const commissionPercent = Number(category.commissionPercent ?? 15);
    // Giá tham khảo lấy từ catalog server, không tin giá do client gửi.
    const finalEstimatedPrice = Number(service?.basePrice ?? category.basePrice);

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

      // Lưu ảnh khách là ISSUE; không dùng thay BEFORE của thợ
      if (imageUrl) {
        await tx.orderImage.create({
          data: {
            orderId: newOrder.id,
            type: 'ISSUE',
            url: imageUrl,
          },
        });
      }

      return newOrder;
    });

    // 3. Lên lịch BullMQ delayed job 3 phút: Nếu chưa có thợ nhận -> tự động mở rộng +2km
    await this.orderQueueService.scheduleRadiusExpansion(
      order.id,
      1,
      5,
      180000,
    );

    // 4. Quét thợ lân cận trong bán kính 5km
    const nearbyWorkers = await this.matchNearbyWorkers(order.id, 5);

    // 5. Phát tín hiệu WebSocket thời gian thực đến thợ & Admin portal
    try {
      this.ordersGateway.broadcastNewOrderToWorkers(
        nearbyWorkers.length > 0 ? nearbyWorkers : [{}],
        order,
      );
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
    const { actor } = await this.orderWorkflowService.access(orderId, userId);
    userRole = actor.role;
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
      // Chỉ thợ được gán mới đọc đầy đủ chi tiết đơn
      if (
        workerProfile && order.workerId === workerProfile.id
      ) {
        return order;
      }
    }

    throw new ForbiddenException(
      'Bạn không có quyền truy cập vào thông tin đơn hàng này',
    );
  }

  /**
   * 4. GET /orders: Danh sách đơn hàng của người dùng hiện tại (phân trang + lọc status)
   */
  async getMyOrders(userId, userRole, query = {}) {
    const actor = await this.orderWorkflowService.actor(this.prisma, userId);
    userRole = actor.role;
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where = {};

    if (query.status) {
      if (!Object.hasOwn(ORDER_STATUS, query.status)) throw new BadRequestException('INVALID_STATUS');
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
        return {
          data: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        };
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
            select: {
              id: true,
              fullName: true,
              ratingAvg: true,
              isOnline: true,
            },
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
  async cancelOrder(orderId, userId, userRole, reason = 'Hủy theo yêu cầu') {
    return this.orderWorkflowService.transition(orderId, userId, 'CANCELLED', { reason, chargeCancellationFee: true });
  }

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
        etaMinutes: Math.max(
          10,
          Math.round(parseFloat(w.distance_km || 1) * 4),
        ),
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
    const result = await this.orderWorkflowService.transition(orderId, workerUserId, 'MATCHED');
    if (result.changed) {
      try {
        const worker = await this.prisma.workerProfile.findUnique({ where: { userId: workerUserId } });
        this.ordersGateway.emitOrderMatched(orderId, worker);
      }
      catch (error) { console.warn('Order matched broadcast failed:', error.message); }
    }
    return result;
  }

  async verifyFace(orderId, workerUserId, faceVerifyDto) {
    const access = await this.orderWorkflowService.access(orderId, workerUserId, ['WORKER']);
    if (!['MATCHED', 'ASSIGNED', 'WORKER_EN_ROUTE', 'WORKER_ARRIVING', 'ARRIVED', 'IN_PROGRESS'].includes(access.order.status)) throw new ConflictException('FACE_STAGE_NOT_ALLOWED');
    const { photoUrl } = faceVerifyDto;
    if (!photoUrl) throw new BadRequestException('SELFIE_REQUIRED');
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId: workerUserId }, include: { faceProfile: true },
    });
    if (!worker) throw new BadRequestException('WORKER_NOT_FOUND');
    const reference = worker.faceProfile?.facePhotoUrl;
    if (!reference) throw new BadRequestException('REFERENCE_MISSING');
    const result = await this.fastApiAiClient.verifyFace(worker.id, photoUrl, reference);
    if (!validFaceResult(result) || result.status !== 'MATCH') {
      throw new BadRequestException('FACE_NOT_VERIFIED');
    }
    // Matching an existing photo does not establish trusted enrollment or scoped proof.
    throw new BadRequestException('FACE_PROOF_UNAVAILABLE');
  }

  /**
   * 9. PATCH /orders/:id/status: Cập nhật trạng thái tiến độ (EN_ROUTE, IN_PROGRESS, AWAITING_ACCEPTANCE)
   */
  async updateStatus(orderId, workerUserId, dto) {
    return this.orderWorkflowService.transition(orderId, workerUserId, dto.status, { note: dto.note });
  }

  async uploadImage(orderId, uploadDto, userId) {
    const image = await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const actor = await this.orderWorkflowService.actor(tx, userId);
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundException('ORDER_NOT_FOUND');
      this.orderWorkflowService.authorize(order, actor);
      const permitted = actor.role === 'WORKER'
        ? (uploadDto.type === 'BEFORE' && order.status === 'ARRIVED') || (uploadDto.type === 'AFTER' && order.status === 'IN_PROGRESS')
        : actor.role === 'CUSTOMER' && uploadDto.type === 'ISSUE' && ['CREATED', 'SEARCHING', 'SEARCHING_WORKER'].includes(order.status);
      if (!permitted) throw new ForbiddenException('PHOTO_ACTION_NOT_ALLOWED');
      if (!/^https?:\/\//i.test(uploadDto.url)) throw new BadRequestException('INVALID_PHOTO_URL');
      const existing = await tx.orderImage.findFirst({ where: { orderId, type: uploadDto.type, url: uploadDto.url } });
      if (existing) return existing;
      return tx.orderImage.create({ data: { orderId, type: uploadDto.type, url: uploadDto.url,
        imageUrl: uploadDto.url, imageType: uploadDto.type, uploadedAt: new Date() } });
    });
    return { success: true, image };
  }

  /**
   * 11. POST /orders/:id/verify-completion: Gọi AI so sánh ảnh before/after, trả matchScore
   */
  async verifyCompletion(orderId, userId) {
    const access = await this.orderWorkflowService.access(orderId, userId);
    if (!['AWAITING_ACCEPTANCE', 'AWAITING_CONFIRMATION', 'AWAITING_PAYMENT', 'COMPLETED', 'PAID', 'DISPUTED'].includes(access.order.status)) throw new ConflictException('ACCEPTANCE_STAGE_REQUIRED');
    const images = await this.prisma.orderImage.findMany({
      where: { orderId },
      orderBy: { uploadedAt: 'desc' },
    });

    const beforeImage = images.find(
      (img) => img.type === 'BEFORE' || img.imageType === 'BEFORE',
    );
    const afterImage = images.find(
      (img) => img.type === 'AFTER' || img.imageType === 'AFTER',
    );

    if (!beforeImage || !afterImage) {
      throw new BadRequestException(
        'Cần upload đầy đủ cả ảnh BEFORE và ảnh AFTER để AI thực hiện so khớp',
      );
    }

    // Gọi AI service so sánh ảnh trước và sau khi sửa
    const aiResult = await this.fastApiAiClient.compareBeforeAfter(
      beforeImage.url,
      afterImage.url,
    );
    const matchScore = parseFloat(aiResult.matchScore ?? 0.9);
    const passed = Boolean(aiResult.passed ?? matchScore >= 0.8);

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
      notes:
        aiResult.notes ||
        (passed
          ? 'Nghiệm thu đạt chuẩn chất lượng AI'
          : 'Chất lượng công việc cần thợ kiểm tra lại'),
      message: passed
        ? 'Nghiệm thu đạt chuẩn chất lượng AI'
        : 'Chất lượng công việc cần thợ kiểm tra lại',
      beforeImageUrl: beforeImage.url,
      afterImageUrl: afterImage.url,
    };
  }

  /**
   * 12. Khách xác nhận nghiệm thu -> AWAITING_PAYMENT (chưa hoàn tất đơn)
   */
  async acceptCompletion(orderId, userId) {
    return this.orderWorkflowService.transition(orderId, userId, 'AWAITING_PAYMENT');
  }

  async disputeOrder(orderId, userId, dto) {
    if (typeof dto.reason !== 'string' || !dto.reason.trim()) throw new BadRequestException('DISPUTE_REASON_REQUIRED');
    return this.orderWorkflowService.transition(orderId, userId, 'DISPUTED', { reason: dto.reason, evidenceImages: dto.evidenceImages || [] });
  }

  async processPayment(orderId, userId) {
    // ARC-01 only finalizes an already recorded settlement. Creating/crediting money belongs to PAY/WAL.
    return this.orderWorkflowService.transition(orderId, userId, 'COMPLETED');
  }

  async reviewOrder(orderId, customerUserId, reviewDto) {
    const { rating, comment } = reviewDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.customerId !== customerUserId) {
      throw new ForbiddenException('Bạn không có quyền đánh giá đơn hàng này');
    }

    if (!order.workerId) {
      throw new BadRequestException(
        'Đơn hàng không có kỹ thuật viên để đánh giá',
      );
    }

    if (order.status !== 'PAID' && order.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Chỉ có thể đánh giá sau khi đơn hàng đã nghiệm thu hoặc thanh toán',
      );
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
      message:
        'Gửi đánh giá dịch vụ thành công! Cảm ơn ý kiến đóng góp của bạn.',
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
    const access = await this.orderWorkflowService.access(orderId, userId);
    if (access.actor.role !== userRole) throw new ForbiddenException('ROLE_NOT_ALLOWED');
    const result = await this.prisma.$transaction(async (lockedTx) => {
    await lockedTx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
    const order = await lockedTx.order.findUnique({
      where: { id: orderId },
      include: { worker: true, customer: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    this.orderWorkflowService.authorize(order, access.actor);
    if (order.status !== 'ARRIVED') throw new ConflictException('QUOTE_STAGE_REQUIRED');
    const action =
      adjustPriceDto.action || (userRole === 'CUSTOMER' ? 'ACCEPT' : 'PROPOSE');

    if (!['PROPOSE', 'ACCEPT', 'REJECT'].includes(action)) throw new BadRequestException('INVALID_QUOTE_ACTION');
    // 1. Trường hợp Khách hàng phê duyệt (ACCEPT) hoặc từ chối (REJECT)
    if (action === 'ACCEPT' || action === 'REJECT') {
      const pending = await lockedTx.orderStatusHistory.findFirst({ where: { orderId, OR: [
        { note: { startsWith: '[YÊU CẦU ĐIỀU CHỈNH GIÁ]' } },
        { note: { startsWith: '[ĐÃ DUYỆT ĐIỀU CHỈNH GIÁ]' } },
        { note: { startsWith: '[TỪ CHỐI ĐIỀU CHỈNH GIÁ]' } },
      ] }, orderBy: { createdAt: 'desc' } });
      if (!pending?.note.startsWith('[YÊU CẦU')) throw new ConflictException('NO_PENDING_QUOTE');

      if (userRole !== 'ADMIN' && order.customerId !== userId) {
        throw new ForbiddenException(
          'Chỉ khách hàng tạo đơn mới có quyền phê duyệt/từ chối điều chỉnh giá',
        );
      }

      if (action === 'ACCEPT') {
        const recordedAmount = pending.note.match(/phát sinh thêm ([\d.]+) đ/);
        const additionalPrice = Number(recordedAmount?.[1]?.replace(/\./g, ''));
        if (!Number.isFinite(additionalPrice) || additionalPrice <= 0 || (adjustPriceDto.additionalPrice != null && Number(adjustPriceDto.additionalPrice) !== additionalPrice)) throw new BadRequestException('QUOTE_AMOUNT_MISMATCH');
        const currentPrice = Number(
          order.finalPrice || order.estimatedPrice || 150000,
        );
        const newFinalPrice = currentPrice + additionalPrice;

        const updatedOrder = await (async (tx) => {
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
        })(lockedTx);

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
        const currentPrice = Number(
          order.finalPrice || order.estimatedPrice || 150000,
        );
        await lockedTx.orderStatusHistory.create({
          data: {
            orderId,
            status: order.status,
            note: `[TỪ CHỐI ĐIỀU CHỈNH GIÁ] Khách hàng từ chối chi phí phát sinh. Giữ nguyên giá ban đầu: ${currentPrice.toLocaleString('vi-VN')} đ. Lý do: ${adjustPriceDto.note || 'Khách không chấp thuận chi phí ngoài báo giá'}`,
            changedBy: userId,
          },
        });

        return {
          success: true,
          status: 'REJECTED',
          finalPrice: currentPrice,
          message:
            'Khách hàng đã từ chối điều chỉnh giá phát sinh. Thợ tiếp tục thực hiện theo mức giá ban đầu hoặc trao đổi lại.',
        };
      }
    }

    // 2. Trường hợp Thợ đề xuất chi phí phát sinh (PROPOSE)
    const workerProfile = await lockedTx.workerProfile.findUnique({
      where: { userId },
    });
    if (!workerProfile || order.workerId !== workerProfile.id) {
      if (userRole !== 'ADMIN') {
        throw new ForbiddenException(
          'Chỉ kỹ thuật viên phụ trách đơn mới có thể đề xuất chi phí phát sinh',
        );
      }
    }

    const additionalPrice = Number(adjustPriceDto.additionalPrice || 0);
    if (!Number.isFinite(additionalPrice) || additionalPrice <= 0) {
      throw new BadRequestException('Số tiền phát sinh thêm phải lớn hơn 0');
    }

    if (!adjustPriceDto.reason) {
      throw new BadRequestException(
        'Vui lòng nêu rõ lý do phát sinh chi phí linh kiện/công việc',
      );
    }

    const currentPrice = Number(
      order.finalPrice || order.estimatedPrice || 150000,
    );
    const proposedTotal = currentPrice + additionalPrice;

    await lockedTx.orderStatusHistory.create({
      data: {
        orderId,
        status: order.status,
        note: `[YÊU CẦU ĐIỀU CHỈNH GIÁ] Thợ đề xuất phát sinh thêm ${additionalPrice.toLocaleString('vi-VN')} đ. Tổng dự kiến: ${proposedTotal.toLocaleString('vi-VN')} đ. Lý do: ${adjustPriceDto.reason}`,
        changedBy: userId,
      },
    });

    return {
      success: true,
      status: 'PENDING_APPROVAL',
      additionalPrice,
      proposedTotal,
      reason: adjustPriceDto.reason,
      message:
        'Đã gửi yêu cầu điều chỉnh giá tới khách hàng thành công. Vui lòng chờ khách hàng phê duyệt trước khi tiếp tục thực hiện.',
    };
    });
    try { this.ordersGateway.emitPriceAdjusted(orderId, result); } catch (error) { console.warn(error.message); }
    return result;
  }

  /**
   * 17. PATCH /orders/:id/schedule: Đặt lịch hẹn sau khi không tìm được thợ ngay
   */
  async scheduleOrder(orderId, userId, scheduledAt) {
    const date = new Date(scheduledAt);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) throw new BadRequestException('INVALID_SCHEDULE');
    return this.orderWorkflowService.transition(orderId, userId, 'SEARCHING_WORKER', { schedule: date });
  }

  async getCurrentWorkerOrder(userId) {
    const actor = await this.orderWorkflowService.actor(this.prisma, userId);
    if (actor.role !== 'WORKER') throw new ForbiddenException('WORKER_REQUIRED');
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!workerProfile) return null;
    return this.ordersRepository.findCurrentOrderForWorker(workerProfile.id);
  }

  async markArriving(orderId, userId) {
    return this.updateStatus(orderId, userId, { status: 'WORKER_EN_ROUTE' });
  }

  async markArrived(orderId, userId) {
    return this.updateStatus(orderId, userId, { status: 'ARRIVED' });
  }

  async startWork(orderId, userId) {
    return this.updateStatus(orderId, userId, { status: 'IN_PROGRESS' });
  }

  async finishWork(orderId, userId) {
    return this.updateStatus(orderId, userId, {
      status: 'AWAITING_ACCEPTANCE',
    });
  }

  async confirmCompletion(orderId, userId) {
    return this.acceptCompletion(orderId, userId);
  }

  async completePayment(orderId, userId) {
    return this.processPayment(orderId, userId);
  }
}

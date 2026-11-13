import { hasTrustedFaceProof } from '../../infrastructure/external/ai/face-result';
import {
  Injectable,
  Dependencies,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { OrdersGateway } from './orders.gateway';
import {
  ACTIVE_STATUSES,
  normalizeOrderStatus,
} from './constants/order-status';
import { OrderTransitionValidator } from './validators/order-transition.validator';

@Injectable()
@Dependencies(PrismaService, OrdersGateway)
export class OrderWorkflowService {
  constructor(prisma, gateway) {
    this.prisma = prisma;
    this.gateway = gateway;
  }

  async actor(db, userId) {
    if (!userId) throw new ForbiddenException('AUTH_REQUIRED');
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true },
    });
    if (
      !user ||
      user.status !== 'ACTIVE' ||
      !['CUSTOMER', 'WORKER', 'ADMIN'].includes(user.role)
    ) {
      throw new ForbiddenException('ACTIVE_ACCOUNT_REQUIRED');
    }
    return user;
  }

  authorize(order, actor) {
    if (actor.role === 'ADMIN') return;
    if (actor.role === 'CUSTOMER' && order.customerId === actor.id) return;
    if (
      actor.role === 'WORKER' &&
      actor.workerProfile &&
      order.workerId === actor.workerProfile.id
    )
      return;
    throw new ForbiddenException('ORDER_ACCESS_DENIED');
  }

  async access(orderId, userId, roles = ['CUSTOMER', 'WORKER', 'ADMIN']) {
    const actor = await this.actor(this.prisma, userId);
    if (!roles.includes(actor.role))
      throw new ForbiddenException('ROLE_NOT_ALLOWED');
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');
    this.authorize(order, actor);
    return { order, actor };
  }

  requireFace(worker) {
    if (!hasTrustedFaceProof(worker)) {
      throw new BadRequestException('FACE_CHECKIN_EXPIRED');
    }
  }

  async transition(orderId, userId, requestedStatus, options = {}) {
    if (
      typeof requestedStatus !== 'string' ||
      (options.note != null && typeof options.note !== 'string')
    )
      throw new BadRequestException('INVALID_TRANSITION_INPUT');
    const target = normalizeOrderStatus(requestedStatus);
    const result = await this.prisma.$transaction(async (tx) => {
      const actor = await this.actor(tx, userId);
      // Same lock order for accept and all other mutations: worker, then order.
      if (actor.role === 'WORKER') {
        if (!actor.workerProfile)
          throw new ForbiddenException('WORKER_PROFILE_REQUIRED');
        await tx.$queryRaw`SELECT id FROM worker_profiles WHERE id = ${actor.workerProfile.id} FOR UPDATE`;
      }
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { images: true, payment: true },
      });
      if (!order) throw new NotFoundException('ORDER_NOT_FOUND');
      const accepting = target === 'MATCHED';
      if (accepting) {
        if (actor.role !== 'WORKER')
          throw new ForbiddenException('WORKER_REQUIRED');
        if (order.workerId && order.workerId !== actor.workerProfile.id)
          throw new ConflictException('ORDER_ALREADY_TAKEN');
      } else this.authorize(order, actor);
      const workerActions = [
        'WORKER_EN_ROUTE',
        'ARRIVED',
        'IN_PROGRESS',
        'AWAITING_ACCEPTANCE',
      ];
      if (
        workerActions.includes(target) &&
        !['WORKER', 'ADMIN'].includes(actor.role)
      )
        throw new ForbiddenException('WORKER_REQUIRED');
      if (
        ['AWAITING_PAYMENT', 'DISPUTED'].includes(target) &&
        actor.role !== 'CUSTOMER'
      )
        throw new ForbiddenException('CUSTOMER_REQUIRED');
      if (target === 'COMPLETED' && !['CUSTOMER', 'ADMIN'].includes(actor.role))
        throw new ForbiddenException('SETTLEMENT_ACTOR_REQUIRED');
      if (
        target === 'SEARCHING_WORKER' &&
        (actor.role !== 'CUSTOMER' || !options.schedule)
      )
        throw new ForbiddenException('SCHEDULE_ACTION_REQUIRED');
      if (
        ![
          'MATCHED',
          ...workerActions,
          'AWAITING_PAYMENT',
          'DISPUTED',
          'COMPLETED',
          'CANCELLED',
          'SEARCHING_WORKER',
        ].includes(target)
      ) {
        throw new BadRequestException('STATUS_NOT_ACTIONABLE');
      }
      const current = normalizeOrderStatus(order.status);
      if (target === 'COMPLETED') {
        const ledger = await tx.walletTransaction.findFirst({
          where: {
            orderId,
            type: 'PAYOUT',
            workerWallet: { workerId: order.workerId || '' },
          },
        });
        const payment = order.payment;
        if (
          payment?.status !== 'PAID' ||
          !payment.paidAt ||
          !ledger ||
          Number(payment.amount) !==
            Number(order.finalPrice ?? order.estimatedPrice) ||
          Number(ledger.amount) !== Number(payment.workerPayoutAmount)
        )
          throw new BadRequestException('PAYMENT_NOT_SETTLED');
      }
      if (current === target && !options.schedule)
        return {
          order,
          changed: false,
          ...(target === 'CANCELLED'
            ? {
                cancellationFee: Number(
                  order.cancellationReason?.match(/Phí hủy: (\d+) đ/)?.[1] || 0,
                ),
              }
            : {}),
        };
      if (options.schedule && current === target) {
        if (order.workerId)
          throw new ConflictException('ORDER_ALREADY_ASSIGNED');
        if (order.scheduledAt?.getTime() === options.schedule.getTime())
          return { order, changed: false };
      } else OrderTransitionValidator.validateTransition(current, target);
      const data = { status: target };
      let cancellationFee;
      if (accepting) {
        const worker = await tx.workerProfile.findUnique({
          where: { id: actor.workerProfile.id },
        });
        this.requireFace(worker);
        if (!worker.isOnline || worker.approvalStatus !== 'APPROVED')
          throw new BadRequestException('WORKER_NOT_AVAILABLE');
        const busy = await tx.order.findFirst({
          where: { workerId: worker.id, status: { in: ACTIVE_STATUSES } },
        });
        if (busy) throw new ConflictException('WORKER_HAS_ACTIVE_ORDER');
        data.workerId = worker.id;
      }
      if (target === 'IN_PROGRESS') {
        const worker = await tx.workerProfile.findUnique({
          where: { id: order.workerId || '' },
        });
        this.requireFace(worker);
        // Legacy customer uploads lack trustworthy worker provenance: require a BEFORE recorded after arrival.
        const arrival = await tx.orderStatusHistory.findFirst({
          where: { orderId, status: 'ARRIVED' },
          orderBy: { createdAt: 'asc' },
        });
        if (
          !arrival ||
          !order.images.some(
            (image) =>
              image.type === 'BEFORE' && image.uploadedAt >= arrival.createdAt,
          )
        ) {
          throw new BadRequestException('MISSING_BEFORE_PHOTO');
        }
        const quote = await tx.orderStatusHistory.findFirst({
          where: {
            orderId,
            OR: [
              { note: { startsWith: '[YÊU CẦU ĐIỀU CHỈNH GIÁ]' } },
              { note: { startsWith: '[ĐÃ DUYỆT ĐIỀU CHỈNH GIÁ]' } },
              { note: { startsWith: '[TỪ CHỐI ĐIỀU CHỈNH GIÁ]' } },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });
        if (quote && !quote.note.startsWith('[ĐÃ DUYỆT'))
          throw new BadRequestException('QUOTE_NOT_APPROVED');
        if (!order.startedAt) data.startedAt = new Date();
      }
      if (
        target === 'AWAITING_ACCEPTANCE' &&
        (!order.startedAt ||
          !order.images.some(
            (image) =>
              image.type === 'AFTER' && image.uploadedAt >= order.startedAt,
          ))
      ) {
        throw new BadRequestException('MISSING_AFTER_PHOTO');
      }
      if (target === 'COMPLETED') data.completedAt = new Date();
      if (target === 'CANCELLED') {
        if (typeof options.reason !== 'string' || !options.reason.trim())
          throw new BadRequestException('CANCELLATION_REASON_REQUIRED');
        cancellationFee =
          options.chargeCancellationFee &&
          ![
            'PENDING_AI',
            'AWAITING_CONFIRM',
            'CREATED',
            'SEARCHING_WORKER',
          ].includes(current)
            ? Math.round(Number(order.estimatedPrice ?? 150000) * 0.2)
            : 0;
        data.cancellationReason = options.chargeCancellationFee
          ? `${options.reason} (Phí hủy: ${cancellationFee} đ)`
          : options.reason;
        data.cancelledBy = actor.id;
      }
      if (options.schedule) data.scheduledAt = options.schedule;
      const updated = await tx.order.updateMany({
        where: {
          id: orderId,
          status: order.status,
          updatedAt: order.updatedAt,
        },
        data,
      });
      if (updated.count !== 1)
        throw new ConflictException('ORDER_STATE_CONFLICT');
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: target,
          changedBy: actor.id,
          note:
            options.note || options.reason || `${order.status} -> ${target}`,
        },
      });
      if (target === 'DISPUTED') {
        for (const url of options.evidenceImages || []) {
          if (typeof url !== 'string' || !/^https?:\/\//i.test(url))
            throw new BadRequestException('INVALID_EVIDENCE_URL');
          await tx.orderImage.create({
            data: { orderId, type: 'ISSUE', url, description: options.reason },
          });
        }
      }
      return {
        order: await tx.order.findUnique({ where: { id: orderId } }),
        changed: true,
        ...(cancellationFee === undefined ? {} : { cancellationFee }),
      };
    });
    if (result.changed) {
      // No event is sent before transaction resolution, including rollback/rejected requests.
      try {
        this.gateway.emitStatusChanged(
          orderId,
          result.order.status,
          result.order.updatedAt,
        );
      } catch (error) {
        console.warn('Order status broadcast failed:', error.message);
      }
    }
    return {
      success: true,
      order: result.order,
      changed: result.changed,
      ...(result.cancellationFee === undefined
        ? {}
        : { cancellationFee: result.cancellationFee }),
    };
  }

  // Legacy entry points delegate to the same actor/policy/transaction. IDs supplied by callers never authorize.
  async assignWorker(id, ignoredProfileId, userId) {
    return (await this.transition(id, userId, 'MATCHED')).order;
  }
  async markWorkerArriving(id, ignoredProfileId, userId) {
    return (await this.transition(id, userId, 'WORKER_EN_ROUTE')).order;
  }
  async markArrived(id, ignoredProfileId, userId) {
    return (await this.transition(id, userId, 'ARRIVED')).order;
  }
  async startWork(id, ignoredProfileId, userId) {
    return (await this.transition(id, userId, 'IN_PROGRESS')).order;
  }
  async finishWork(id, ignoredProfileId, userId) {
    return (await this.transition(id, userId, 'AWAITING_ACCEPTANCE')).order;
  }
  async confirmCompletion(id, ignoredProfileId, userId) {
    return (await this.transition(id, userId, 'AWAITING_PAYMENT')).order;
  }
  async markPaidAndComplete(id, userId) {
    return (await this.transition(id, userId, 'COMPLETED')).order;
  }
  async cancel(id, reason, userId) {
    return (await this.transition(id, userId, 'CANCELLED', { reason })).order;
  }
}

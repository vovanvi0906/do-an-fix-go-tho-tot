import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger, Dependencies, Bind } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

/**
 * OrderGateway (Namespace: /orders)
 * Quản lý kết nối Socket.IO thời gian thực cho luồng đặt đơn:
 *
 * Server -> Client:
 * - order:status_changed   { orderId, status, timestamp }
 * - worker:location_update { orderId, lat, lng }
 * - order:matched          { orderId, worker: {...} }
 *
 * Client -> Server:
 * - worker:update_location { orderId, lat, lng }  (throttle tối đa 1 lần / 3 giây)
 * - order:join             { orderId }            (join room khi mở màn hình theo dõi đơn)
 * - order:leave            { orderId }            (rời room khi đóng màn hình, tránh leak listener)
 */
@WebSocketGateway({
  namespace: '/orders',
  cors: {
    origin: '*',
  },
})
@Injectable()
@Dependencies(RedisService, PrismaService)
export class OrderGateway {
  @WebSocketServer()
  server;

  constructor(redisService, prisma) {
    this.redisService = redisService;
    this.prisma = prisma;
    this.logger = new Logger(OrderGateway.name);

    // Map lưu vết thời điểm gửi GPS gần nhất của thợ (để throttle 3s)
    // Key: `${clientId}:${orderId}` -> Value: timestamp (ms)
    this.throttleMap = new Map();
  }

  afterInit(server) {
    server.use(async (client, next) => {
      try { await this.authenticate(client); next(); }
      catch { next(new Error('UNAUTHORIZED')); }
    });
    this.logger.log(
      '📡 [WebSocket Gateway] OrderGateway initialized on namespace /orders',
    );

    // Thiết lập Redis Subscriber nếu có cụm phân tán
    try {
      const redisClient = this.redisService?.getClient();
      if (redisClient) {
        const subClient = redisClient.duplicate();
        subClient.subscribe(
          'order:broadcast:new',
          'order:broadcast:status',
          'order:broadcast:location',
        );
        subClient.on('message', (channel, message) => {
          try {
            const payload = JSON.parse(message);
            if (channel === 'order:broadcast:new') {
              this.handleRedisNewOrder(payload);
            } else if (channel === 'order:broadcast:status') {
              this.emitStatusChanged(payload.orderId, payload.status);
            } else if (channel === 'order:broadcast:location') {
              this.emitWorkerLocationUpdate(
                payload.orderId,
                payload.lat,
                payload.lng,
              );
            }
          } catch (e) {
            this.logger.error('Lỗi parse message từ Redis PubSub:', e);
          }
        });
        this.logger.log(
          '⚡ [Redis PubSub] Subscribed to order channels on namespace /orders',
        );
      }
    } catch (err) {
      this.logger.warn('⚠️ [Redis PubSub Warning]:', err.message);
    }
  }

  async authenticate(client) {
    const token = String(client.handshake?.auth?.token || '').replace(/^Bearer /i, '');
    const payload = new JwtService({ secret: process.env.JWT_SECRET || 'super-secret' }).verify(token);
    if (payload.type === 'refresh' || !payload.sub) throw new WsException('ACCESS_TOKEN_REQUIRED');
    const actor = await this.prisma.user.findUnique({ where: { id: payload.sub }, include: { workerProfile: true } });
    if (!actor || actor.status !== 'ACTIVE' || !['CUSTOMER', 'WORKER', 'ADMIN'].includes(actor.role)) throw new WsException('ACTIVE_ACCOUNT_REQUIRED');
    client.data = { ...client.data, actor, tokenExpiresAt: payload.exp * 1000 };
    return actor;
  }

  async orderAccess(client, orderId) {
    const actor = await this.authenticate(client);
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || !(actor.role === 'ADMIN' ||
      (actor.role === 'CUSTOMER' && order.customerId === actor.id) ||
      (actor.role === 'WORKER' && actor.workerProfile && order.workerId === actor.workerProfile.id))) {
      throw new WsException('ORDER_ACCESS_DENIED');
    }
    return { actor, order };
  }

  @SubscribeMessage('join_room')
  @Bind(ConnectedSocket())
  async handleIdentityRoom(client) {
    const actor = await this.authenticate(client);
    // Ignore role/profile/user IDs in the incoming payload.
    client.join(`user:${actor.id}`);
    if (actor.role === 'WORKER' && actor.workerProfile) client.join(`worker:${actor.workerProfile.id}`);
    return { status: 'joined' };
  }

  handleConnection(client) {
    this.logger.log(`🟢 [Socket Connected] Client ID: ${client.id} on /orders`);
    if (!client.data?.actor) { client.disconnect(true); return; }
    client.join(`user:${client.data.actor.id}`);
    if (client.data.actor.role === 'WORKER' && client.data.actor.workerProfile) client.join(`worker:${client.data.actor.workerProfile.id}`);
    client.authExpiryTimer = setTimeout(() => client.disconnect(true), Math.max(0, client.data.tokenExpiresAt - Date.now()));
    client.orderRooms = new Set();
  }

  handleDisconnect(client) {
    clearTimeout(client.authExpiryTimer);
    this.logger.log(`🔴 [Socket Disconnected] Client ID: ${client.id}`);

    // Dọn dẹp bộ nhớ throttle liên quan đến client này để tránh Memory Leak
    for (const key of this.throttleMap.keys()) {
      if (key.startsWith(`${client.id}:`)) {
        this.throttleMap.delete(key);
      }
    }

    if (client.orderRooms) {
      client.orderRooms.clear();
    }
  }

  // ==========================================
  // CLIENT -> SERVER: ROOM SUBSCRIPTIONS
  // ==========================================

  /**
   * Client join room theo orderId khi mở màn hình theo dõi đơn
   */
  @SubscribeMessage('order:join')
  @Bind(ConnectedSocket(), MessageBody())
  async handleJoinOrder(client, data) {
    const orderId = typeof data === 'string' ? data : data?.orderId;
    if (!orderId) {
      return { status: 'error', message: 'Thiếu orderId để join room' };
    }

    await this.orderAccess(client, orderId);
    const roomName = `order:${orderId}`;
    client.join(roomName);

    if (client.orderRooms) {
      client.orderRooms.add(orderId);
    }

    this.logger.log(`👁️ Client ${client.id} joined room: ${roomName}`);
    return { status: 'joined', orderId, room: roomName };
  }

  /**
   * Client rời room khi rời màn hình để tránh leak listener
   */
  @SubscribeMessage('order:leave')
  @Bind(ConnectedSocket(), MessageBody())
  handleLeaveOrder(client, data) {
    const orderId = typeof data === 'string' ? data : data?.orderId;
    if (!orderId) {
      return { status: 'error', message: 'Thiếu orderId để leave room' };
    }

    const roomName = `order:${orderId}`;
    client.leave(roomName);

    if (client.orderRooms) {
      client.orderRooms.delete(orderId);
    }

    this.logger.log(`👋 Client ${client.id} left room: ${roomName}`);
    return { status: 'left', orderId, room: roomName };
  }

  @SubscribeMessage('join_order')
  @Bind(ConnectedSocket(), MessageBody())
  handleLegacyJoinOrder(client, data) { return this.handleJoinOrder(client, data); }

  @SubscribeMessage('leave_order')
  @Bind(ConnectedSocket(), MessageBody())
  handleLegacyLeaveOrder(client, data) { return this.handleLeaveOrder(client, data); }

  /**
   * Admin portal subscribe kênh theo dõi đơn hàng toàn hệ thống
   */
  @SubscribeMessage('admin:orders:join')
  @Bind(ConnectedSocket())
  async handleAdminJoinOrders(client) {
    const actor = await this.authenticate(client);
    if (actor.role !== 'ADMIN') throw new WsException('ADMIN_REQUIRED');
    client.join('admin_orders_room');
    this.logger.log(`🛡️ Admin Client ${client.id} joined admin_orders_room`);
    return { status: 'joined', room: 'admin_orders_room' };
  }

  @SubscribeMessage('admin:join')
  @Bind(ConnectedSocket())
  async handleLegacyAdminJoin(client) { return this.handleAdminJoinOrders(client); }

  // ==========================================
  // CLIENT -> SERVER: WORKER GPS LOCATION
  // ==========================================

  /**
   * Thợ cập nhật vị trí GPS thời gian thực (Throttle tối đa 1 lần / 3 giây)
   */
  @SubscribeMessage('worker:update_location')
  @Bind(ConnectedSocket(), MessageBody())
  async handleWorkerUpdateLocation(client, data) {
    const { orderId, lat, lng } = data || {};
    const { actor, order } = await this.orderAccess(client, orderId);
    if (actor.role !== 'WORKER' || !['WORKER_EN_ROUTE', 'WORKER_ARRIVING'].includes(order.status)) throw new WsException('GPS_STAGE_NOT_ALLOWED');
    const workerId = actor.workerProfile.id;

    if (!orderId || lat === undefined || lng === undefined) {
      return {
        status: 'error',
        message: 'Thiếu thông tin orderId, lat hoặc lng',
      };
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (!Number.isFinite(parsedLat) || Math.abs(parsedLat) > 90 || !Number.isFinite(parsedLng) || Math.abs(parsedLng) > 180) {
      return { status: 'error', message: 'Tọa độ GPS lat, lng không hợp lệ' };
    }

    // Áp dụng cơ chế Throttling: Tối đa 1 lần mỗi 3 giây (3000ms)
    const throttleKey = `${client.id}:${orderId}`;
    const now = Date.now();
    const lastUpdateTime = this.throttleMap.get(throttleKey) || 0;
    const elapsed = now - lastUpdateTime;

    if (elapsed < 3000) {
      return {
        status: 'throttled',
        message: 'Tần suất gửi vị trí quá nhanh. Tối đa 1 lần / 3 giây.',
        retryAfterMs: 3000 - elapsed,
      };
    }

    // Cập nhật timestamp gần nhất
    this.throttleMap.set(throttleKey, now);

    await this.prisma.workerProfile.update({ where: { id: workerId }, data: { currentLat: parsedLat, currentLng: parsedLng } });
    this.emitWorkerLocationUpdate(orderId, parsedLat, parsedLng);

    return {
      status: 'ok',
      orderId,
      lat: parsedLat,
      lng: parsedLng,
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================
  // SERVER -> CLIENT: BROADCAST EMITTERS
  // ==========================================

  /**
   * 1. Server -> Client: order:status_changed { orderId, status, timestamp }
   */
  emitStatusChanged(orderId, status, updatedAt) {
    if (!orderId || !status) return;

    const payload = {
      orderId,
      status,
      ...(updatedAt ? { updatedAt } : {}),
      timestamp: new Date().toISOString(),
    };

    const roomName = `order:${orderId}`;
    this.logger.log(
      `📢 [Emit order:status_changed] Đơn ${orderId} -> ${status}`,
    );

    if (this.server) {
      this.server.to(roomName).emit('order:status_changed', payload);
      // Compatibility alias
      this.server.to(roomName).emit('order.status', payload);

      // Broadcast to Admin order portal
      this.server.to('admin_orders_room').emit('order:status_changed', payload);
      this.server.to('admin_orders_room').emit('order.status', payload);


      // Nếu đơn hàng đã kết thúc (COMPLETED, PAID, CANCELLED), tự động giải phóng room để tránh leak listener
      if (['COMPLETED', 'PAID', 'CANCELLED'].includes(status)) {
        try {
          if (typeof this.server.in === 'function') {
            this.server.in(roomName).socketsLeave(roomName);
            this.logger.log(
              `🧹 [Room Cleanup] Đã giải phóng room ${roomName} sau khi hoàn tất trạng thái ${status}`,
            );
          }
        } catch (e) {
          // Socket.IO cleanup fallback
        }
      }
    }
  }

  /**
   * 2. Server -> Client: worker:location_update { orderId, lat, lng }
   */
  emitWorkerLocationUpdate(orderId, lat, lng) {
    if (!orderId) return;

    const payload = {
      orderId,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      timestamp: new Date().toISOString(),
    };

    const roomName = `order:${orderId}`;
    if (this.server) {
      this.server.to(roomName).emit('worker:location_update', payload);
    }
  }

  /**
   * 3. Server -> Client: order:matched { orderId, worker: {...} }
   */
  emitOrderMatched(orderId, worker) {
    if (!orderId) return;

    const payload = {
      orderId,
      worker: {
        id: worker?.id,
        fullName: worker?.fullName || 'Kỹ thuật viên đối tác',
        phone: worker?.phone || worker?.user?.phone,
        avatarUrl: worker?.avatarUrl,
        rating: worker?.ratingAvg || worker?.rating || 5.0,
      },
      timestamp: new Date().toISOString(),
    };

    const roomName = `order:${orderId}`;
    this.logger.log(
      `🎉 [Emit order:matched] Đơn ${orderId} khớp với thợ: ${payload.worker.fullName}`,
    );

    if (this.server) {
      this.server.to(roomName).emit('order:matched', payload);
      this.server.to(roomName).emit('order.accepted', payload);
      // Compatibility alias
      this.server.to(roomName).emit('order.matched', payload);

      // Broadcast to Admin order portal
      this.server.to('admin_orders_room').emit('order:matched', payload);
      this.server.to('admin_orders_room').emit('order.matched', payload);

    }
  }

  /**
   * 4. Server -> Client: order:price_adjusted { orderId, status, additionalPrice, newTotal, reason }
   */
  emitPriceAdjusted(orderId, payload) {
    if (!orderId) return;
    const roomName = `order:${orderId}`;
    this.logger.log(
      `💰 [Emit order:price_adjusted] Đơn ${orderId} điều chỉnh giá:`,
      payload,
    );
    if (this.server) {
      this.server.to(roomName).emit('order:price_adjusted', {
        orderId,
        ...payload,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * 5. Server -> Client: order:no_worker_found { orderId, canScheduleLater, canCancelFree }
   */
  emitNoWorkerFound(orderId) {
    if (!orderId) return;
    const roomName = `order:${orderId}`;
    this.logger.log(
      `⚠️ [Emit order:no_worker_found] Đơn ${orderId} không tìm thấy thợ sau bán kính mở rộng`,
    );
    if (this.server) {
      this.server.to(roomName).emit('order:no_worker_found', {
        orderId,
        message:
          'Hệ thống chưa tìm thấy thợ khả dụng gần bạn trong khu vực này.',
        canScheduleLater: true,
        canCancelFree: true,
        timestamp: new Date().toISOString(),
      });
    }
  }

  broadcastNewOrderToWorkers(workers, orderData) {
    if (!workers || workers.length === 0) return;
    this.logger.log(
      `📡 [Emit order.new] Bắn tín hiệu đơn ${orderData?.id} tới ${workers.length} thợ`,
    );

    if (this.server) {
      const payload = {
        orderId: orderData?.id,
        id: orderData?.id,
        service: orderData?.service,
        totalPrice: orderData?.totalPrice,
        addressText: orderData?.addressText,
        status: orderData?.status || 'SEARCHING',
        createdAt: orderData?.createdAt || new Date().toISOString(),

      };

      workers.forEach(worker => {
        const workerId = worker.workerId || worker.id;
        if (workerId) this.server.to(`worker:${workerId}`).emit('order.new', payload);
      });
      this.server.to('admin_orders_room').emit('order.created', payload);
      this.server.to('admin_orders_room').emit('order:created', payload);
      this.server.to('admin_orders_room').emit('order.new', payload);
    }
  }

  emitOrderStatusUpdated(order, newStatus) {
    this.emitStatusChanged(order?.id, newStatus);
  }

  emitOrderAccepted(order, workerProfile) {
    this.emitOrderMatched(order?.id, workerProfile);
  }

  handleRedisNewOrder(payload) {
    this.broadcastNewOrderToWorkers(payload.workers, payload.order);
  }
}

// Export alias để tương thích toàn bộ import cũ
export const OrdersGateway = OrderGateway;

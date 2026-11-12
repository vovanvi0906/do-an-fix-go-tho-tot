import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';

/**
 * AdminGateway (Namespace: /admin hoặc root)
 * Quản lý kết nối Socket.IO thời gian thực cho trang Quản trị Admin
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class AdminGateway {
  @WebSocketServer()
  server;

  constructor() {
    this.logger = new Logger(AdminGateway.name);
  }

  afterInit() {
    this.logger.log('📡 [WebSocket Gateway] AdminGateway initialized');
  }

  handleConnection(client) {
    this.logger.log(`🟢 [Admin Socket Connected] Client ID: ${client.id}`);
  }

  handleDisconnect(client) {
    this.logger.log(`🔴 [Admin Socket Disconnected] Client ID: ${client.id}`);
  }

  /**
   * Admin client join phòng quản trị 'admin_room'
   */
  @SubscribeMessage('admin:join')
  @SubscribeMessage('join_admin')
  handleJoinAdmin(client) {
    client.join('admin_room');
    this.logger.log(`🛡️ Admin Client ${client.id} joined room: admin_room`);
    return { status: 'joined', room: 'admin_room' };
  }

  /**
   * Phát sóng sự kiện tạo người dùng mới
   */
  emitUserCreated(user) {
    if (this.server) {
      this.logger.log(`📢 [Emit user.created] User: ${user?.id} (${user?.email})`);
      this.server.emit('user.created', user);
      this.server.to('admin_room').emit('user:created', user);
    }
  }

  /**
   * Phát sóng sự kiện cập nhật thông tin người dùng / thợ
   */
  emitUserUpdated(user) {
    if (this.server) {
      this.logger.log(`📢 [Emit user.updated] User: ${user?.id} (${user?.email})`);
      this.server.emit('user.updated', user);
      this.server.to('admin_room').emit('user:updated', user);
    }
  }

  /**
   * Phát sóng sự kiện thợ đăng ký mới
   */
  emitWorkerRegistered(worker) {
    if (this.server) {
      this.logger.log(`📢 [Emit worker.registered] Worker: ${worker?.id || worker?.fullName}`);
      this.server.emit('worker.registered', worker);
      this.server.to('admin_room').emit('worker:registered', worker);
      this.server.emit('user.created', worker);
      this.server.to('admin_room').emit('user:created', worker);
    }
  }

  /**
   * Phát sóng sự kiện thay đổi trạng thái thợ (online/offline, duyệt, v.v.)
   */
  emitWorkerStatusChanged(workerData) {
    if (this.server) {
      this.logger.log(`📢 [Emit worker.status_changed] Worker: ${workerData?.id || workerData?.workerId} online=${workerData?.isOnline}`);
      this.server.emit('worker.status_changed', workerData);
      this.server.to('admin_room').emit('worker:status_changed', workerData);
      this.server.emit('user.updated', workerData);
      this.server.to('admin_room').emit('user:updated', workerData);
    }
  }

  /**
   * Phát sóng sự kiện xóa người dùng
   */
  emitUserDeleted(userId) {
    if (this.server) {
      this.logger.log(`📢 [Emit user.deleted] User ID: ${userId}`);
      this.server.emit('user.deleted', { id: userId });
      this.server.to('admin_room').emit('user:deleted', { id: userId });
    }
  }

  /**
   * Phát sóng sự kiện thay đổi Danh mục Dịch vụ (Tạo, Sửa, Xóa, Bật/Tắt)
   */
  emitCategoryUpdated(action, category) {
    if (this.server) {
      this.logger.log(`📢 [Emit category.updated] Action: ${action}, ID: ${category?.id}`);
      const payload = { action, category, timestamp: new Date().toISOString() };
      this.server.emit('category.updated', payload);
      this.server.to('admin_room').emit('category.updated', payload);
      this.server.emit('dashboard.refresh', { reason: 'category_updated' });
      this.server.to('admin_room').emit('dashboard.refresh', { reason: 'category_updated' });
    }
  }

  /**
   * Phát sóng sự kiện thay đổi Gói Dịch vụ (Tạo, Sửa, Xóa, Đổi giá)
   */
  emitServiceUpdated(action, service) {
    if (this.server) {
      this.logger.log(`📢 [Emit service.updated] Action: ${action}, ID: ${service?.id}`);
      const payload = { action, service, timestamp: new Date().toISOString() };
      this.server.emit('service.updated', payload);
      this.server.to('admin_room').emit('service.updated', payload);
      this.server.emit('dashboard.refresh', { reason: 'service_updated' });
      this.server.to('admin_room').emit('dashboard.refresh', { reason: 'service_updated' });
    }
  }

  /**
   * Phát sóng sự kiện làm mới chỉ số Dashboard & Báo cáo thống kê
   */
  emitDashboardRefresh(reason, data = {}) {
    if (this.server) {
      const payload = { reason, ...data, timestamp: new Date().toISOString() };
      this.server.emit('dashboard.refresh', payload);
      this.server.to('admin_room').emit('dashboard.refresh', payload);
      this.server.emit('analytics.refresh', payload);
      this.server.to('admin_room').emit('analytics.refresh', payload);
    }
  }
}

import { io } from 'socket.io-client';
import { tokenStorage } from '../storage/tokenStorage';
import { SOCKET_BASE_URL } from '../../config/connection';

class SocketService {
  constructor() {
    this.socket = null;
    this.url = `${SOCKET_BASE_URL}/orders`;
    this.isConnected = false;
    this.joinedRooms = new Set();
  }

  connect() {
    if (this.socket) {
      if (!this.socket.connected) this.socket.connect();
      return this.socket;
    }

    console.log(`📡 [Socket.IO] Khởi tạo kết nối tới Gateway: ${this.url}`);

    this.socket = io(this.url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', async () => {
      this.isConnected = true;
      console.log(`✅ [Socket.IO] Đã kết nối thành công! Socket ID: ${this.socket.id}`);

      // Tự động gửi join_room khi kết nối
      const user = await tokenStorage.getUser();
      if (user) {
        const role = String(user.role || 'CUSTOMER').toUpperCase();
        const profileId = user.workerProfile?.id || user.customerProfile?.id || user.id;
        this.joinRoom(role, profileId, user.id);
      }

      // Re-join any previously joined order rooms after reconnection
      this.joinedRooms.forEach((orderId) => {
        this.joinOrderRoom(orderId);
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log(`🔴 [Socket.IO] Đã ngắt kết nối: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.warn(`⚠️ [Socket.IO Error]: ${error.message}`);
    });

    return this.socket;
  }

  joinRoom(role, profileId, userId) {
    if (this.socket && this.socket.connected) {
      console.log(`🚪 [Socket.IO] Yêu cầu tham gia Room: role=${role}, profileId=${profileId}`);
      this.socket.emit('join_room', { role, profileId, userId });
    }
  }

  /**
   * Tham gia phòng theo dõi đơn hàng
   * @param {string} orderId 
   */
  joinOrderRoom(orderId) {
    if (!orderId) return;
    this.joinedRooms.add(orderId);

    if (!this.socket || !this.socket.connected) {
      this.connect();
    }

    this.socket?.emit('order:join', { orderId }, (res) => {
      console.log(`👁️ [Socket.IO] Đã join room đơn ${orderId}:`, res);
    });
  }

  /**
   * Rời phòng theo dõi đơn hàng để tránh leak listener
   * @param {string} orderId 
   */
  leaveOrderRoom(orderId) {
    if (!orderId) return;
    this.joinedRooms.delete(orderId);

    if (this.socket && this.socket.connected) {
      this.socket.emit('order:leave', { orderId }, (res) => {
        console.log(`👋 [Socket.IO] Đã rời room đơn ${orderId}:`, res);
      });
    }
  }

  on(eventName, callback) {
    if (!this.socket) {
      this.connect();
    }
    this.socket.on(eventName, callback);
  }

  off(eventName, callback) {
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }

  emit(eventName, data, callback) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(eventName, data, callback);
    } else {
      console.warn(`⚠️ [Socket.IO] Chưa kết nối, không thể emit '${eventName}'`);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.joinedRooms.clear();
    }
  }
}

export const socketService = new SocketService();

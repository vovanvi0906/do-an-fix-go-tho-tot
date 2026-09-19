import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import { tokenStorage } from '../storage/tokenStorage';

const getSocketUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace('/api', '');
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
};

class SocketService {
  constructor() {
    this.socket = null;
    this.url = getSocketUrl();
    this.isConnected = false;
    this.joinedRooms = new Set();
  }

  connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const orderNamespaceUrl = `${this.url}/orders`;
    console.log(`📡 [Socket.IO] Khởi tạo kết nối tới Gateway /orders: ${orderNamespaceUrl}`);

    this.socket = io(orderNamespaceUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', async () => {
      this.isConnected = true;
      console.log(`✅ [Socket.IO /orders] Đã kết nối thành công! Socket ID: ${this.socket.id}`);

      // Re-join any previously joined rooms after reconnection
      this.joinedRooms.forEach((orderId) => {
        this.joinOrderRoom(orderId);
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log(`🔴 [Socket.IO /orders] Đã ngắt kết nối: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.warn(`⚠️ [Socket.IO Error]: ${error.message}`);
    });

    return this.socket;
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

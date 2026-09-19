import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { tokenStorage } from '../storage/tokenStorage';

const getSocketUrl = () => {
  if (
    process.env.EXPO_PUBLIC_API_URL &&
    !process.env.EXPO_PUBLIC_API_URL.includes('localhost') &&
    !process.env.EXPO_PUBLIC_API_URL.includes('127.0.0.1')
  ) {
    return process.env.EXPO_PUBLIC_API_URL.replace('/api', '');
  }
  if (
    process.env.EXPO_PUBLIC_SOCKET_URL &&
    !process.env.EXPO_PUBLIC_SOCKET_URL.includes('localhost') &&
    !process.env.EXPO_PUBLIC_SOCKET_URL.includes('127.0.0.1')
  ) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }

  // Tự động lấy IP máy tính chủ từ Expo server để thiết bị thật kết nối thẳng vào Backend
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000`;
    }
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

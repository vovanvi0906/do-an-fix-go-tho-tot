import { io } from 'socket.io-client';
import { tokenStorage } from '../storage/tokenStorage';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentRoom = null;
    this.listeners = new Map();
  }

  /**
   * Kết nối tới WebSocket Gateway
   */
  connect(token = null) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const authToken = token || tokenStorage.getAccessToken();

    try {
      this.socket = io(WS_URL, {
        auth: {
          token: authToken ? `Bearer ${authToken}` : undefined,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('⚡ [SocketService] Kết nối WebSocket thành công. ID:', this.socket.id);
        if (this.currentRoom) {
          this.socket.emit('join_room', this.currentRoom);
        }
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        console.warn('⚠️ [SocketService] Đã ngắt kết nối WebSocket:', reason);
      });

      this.socket.on('connect_error', (error) => {
        this.isConnected = false;
        console.warn('⚠️ [SocketService] Lỗi kết nối Socket.IO:', error.message);
      });

      return this.socket;
    } catch (err) {
      console.warn('⚠️ [SocketService] Không thể khởi tạo socket:', err.message);
      return null;
    }
  }

  /**
   * Tham gia phòng định danh (WORKER hoặc CUSTOMER)
   */
  joinRoom(role, profileId, userId) {
    this.currentRoom = { role, profileId, userId };
    if (this.socket && this.isConnected) {
      this.socket.emit('join_room', this.currentRoom);
      console.log(`📡 [SocketService] Đã gửi yêu cầu join_room:`, this.currentRoom);
    }
  }

  /**
   * Đăng ký lắng nghe sự kiện
   */
  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Hủy lắng nghe sự kiện
   */
  off(event, callback) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  /**
   * Ngắt kết nối socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;

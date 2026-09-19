import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { tokenStorage } from '../storage/tokenStorage';

// Tự động nhận diện Base URL API tùy theo môi trường (Điện thoại thật qua Wi-Fi, Android Emulator, Web/iOS)
const getDefaultBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Tự động lấy IP máy tính chủ từ Expo server để điện thoại thật kết nối thẳng vào Backend
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000/api`;
    }
  }

  // Android Emulator map localhost qua địa chỉ IP 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = getDefaultBaseUrl();
console.log(`🌐 [API Client] Đã khởi tạo kết nối Base URL: ${API_BASE_URL} (Platform: ${Platform.OS})`);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor: tự động đính kèm accessToken nếu có & log request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`📡 [API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        hasToken: !!token,
        data: config.data,
      });
    } catch (err) {
      console.warn('⚠️ [API Request Interceptor Warning]:', err);
    }
    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: chuẩn hóa xử lý lỗi từ NestJS backend & log response
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response] ${response.status} ${response.config.url}:`, response.data);
    return response.data;
  },
  (error) => {
    const errorResponse = error.response?.data;
    const status = error.response?.status;
    let message = 'Đã có lỗi xảy ra. Vui lòng thử lại sau!';

    if (errorResponse) {
      if (Array.isArray(errorResponse.message)) {
        message = errorResponse.message.join(', ');
      } else if (typeof errorResponse.message === 'string') {
        message = errorResponse.message;
      } else if (errorResponse.error) {
        message = errorResponse.error;
      }
    } else if (error.message === 'Network Error') {
      message = `Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend (${API_BASE_URL})!`;
    } else if (error.code === 'ECONNABORTED') {
      message = 'Kết nối quá thời gian chờ (Timeout). Vui lòng thử lại!';
    }

    console.error(`❌ [API Error] Status: ${status || 'Network Error'} | Message: ${message}`, {
      url: error.config?.url,
      serverData: errorResponse,
    });

    return Promise.reject(new Error(message));
  }
);

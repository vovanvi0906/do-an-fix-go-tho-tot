import axios from 'axios';
import { Platform } from 'react-native';
import { tokenStorage } from '../storage/tokenStorage';
import { API_BASE_URL } from './apiConfig';
import { handleTokenRefresh } from './tokenRefreshHandler';
import { sendErrorToLog } from '../../utils/remoteLogger';

export { API_BASE_URL };
console.log(`🌐 [API Client] Đã khởi tạo kết nối Base URL: ${API_BASE_URL} (Platform: ${Platform.OS})`);

let onUnauthorizedCallback = null;
export const setOnUnauthorizedCallback = (callback) => {
  onUnauthorizedCallback = callback;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    config.metadata = { startedAt: Date.now(), requestId: `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` };
    config.headers['X-Request-ID'] = config.metadata.requestId;
    try {
      config.headers['ngrok-skip-browser-warning'] = 'true';
      const token = await tokenStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`📡 [API Request] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url}`, {
        hasToken: !!token,
        requestId: config.metadata.requestId,
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

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response] ${response.status} ${response.config.url}`, {
      requestId: response.config.metadata?.requestId,
      durationMs: Date.now() - (response.config.metadata?.startedAt || Date.now()),
    });
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorResponse = error.response?.data;

    // Silent refresh token khi gặp 401 (loại trừ endpoint auth login và request đã retry)
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      return handleTokenRefresh(apiClient, originalRequest, onUnauthorizedCallback);
    }

    let message = 'Đã có lỗi xảy ra. Vui lòng thử lại sau!';
    if (status === 401) {
      message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
      tokenStorage.clearAll().catch((e) => console.warn('Lỗi khi xóa token storage:', e));
      if (onUnauthorizedCallback) onUnauthorizedCallback();
    } else if (errorResponse) {
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
      requestId: error.config?.metadata?.requestId,
      code: error.code,
    });

    const failure = new Error(message);
    failure.name = 'ApiError';
    failure.status = status;
    failure.code = error.code;
    failure.url = error.config?.url;
    failure.requestId = error.response?.headers?.['x-request-id'] || error.config?.metadata?.requestId;
    failure.cause = error;
    failure.response = error.response;
    void sendErrorToLog(new Error(`${error.config?.method?.toUpperCase()} ${failure.url}: ${status || error.code || 'NETWORK'} ${message}`), 'API_ERROR', 'error', { requestId: failure.requestId });
    return Promise.reject(failure);
  }
);

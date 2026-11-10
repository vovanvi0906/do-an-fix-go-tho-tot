import axios from 'axios';
import { tokenStorage } from '../storage/tokenStorage';
import { API_BASE_URL } from './apiConfig';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

export const handleTokenRefresh = async (axiosInstance, originalRequest, onUnauthorized) => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      });
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('Không tìm thấy Refresh Token');
    }

    const res = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const newAccessToken = res.data?.accessToken || res.data?.data?.accessToken;
    const newRefreshToken = res.data?.refreshToken || res.data?.data?.refreshToken;

    if (!newAccessToken) {
      throw new Error('Dữ liệu trả về không có access token');
    }

    await tokenStorage.saveToken(newAccessToken);
    if (newRefreshToken) {
      await tokenStorage.saveRefreshToken(newRefreshToken);
    }

    processQueue(null, newAccessToken);
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return axiosInstance(originalRequest);
  } catch (refreshErr) {
    processQueue(refreshErr, null);
    await tokenStorage.clearAll().catch(() => {});
    if (onUnauthorized) onUnauthorized();
    return Promise.reject(new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!'));
  } finally {
    isRefreshing = false;
  }
};

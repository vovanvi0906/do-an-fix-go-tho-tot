import { sessionEpoch } from '../../features/auth/services/sessionEpoch';
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
  const epoch = originalRequest.sessionEpoch ?? sessionEpoch.current();
  sessionEpoch.assert(epoch);
  originalRequest._retry = true;
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then((token) => {
        sessionEpoch.assert(epoch);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      });
  }

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

    await sessionEpoch.write(epoch, async () => {
      await tokenStorage.saveToken(newAccessToken);
      if (newRefreshToken) await tokenStorage.saveRefreshToken(newRefreshToken);
    });

    processQueue(null, newAccessToken);
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return axiosInstance(originalRequest);
  } catch (refreshErr) {
    const failure = new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
    failure.status = 401;
    failure.code = 'AUTH_REFRESH_FAILED';
    failure.cause = refreshErr;
    failure.url = originalRequest.url;
    failure.requestId = originalRequest.metadata?.requestId;
    failure.response = refreshErr.response;
    processQueue(failure, null);
    if (epoch === sessionEpoch.current()) {
      // Network failures are retryable; only rejected credentials end the session.
      if (!await tokenStorage.getRefreshToken() || [401, 403].includes(refreshErr.response?.status)) {
        const invalidated = sessionEpoch.begin();
        await sessionEpoch.write(invalidated, () => tokenStorage.clearAll());
        sessionEpoch.assert(invalidated);
        if (onUnauthorized) onUnauthorized();
      }
    }
    return Promise.reject(failure);
  } finally {
    isRefreshing = false;
  }
};

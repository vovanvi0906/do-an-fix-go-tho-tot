import axios from 'axios';
import { tokenStorage } from '../storage/tokenStorage';
import { isTokenExpired } from '../../utils/jwt';

const transport = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api', timeout: 15000 });
let pending = null;
export function expireSession() {
  window.dispatchEvent(new Event('auth:before-expire'));
  tokenStorage.clearAuth();
  if (window.location.pathname !== '/login') {
    sessionStorage.setItem('auth:returnTo', window.location.pathname + window.location.search + window.location.hash);
    window.location.assign('/login');
  }
}
export function refreshSession() {
  if (pending) return pending;
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    expireSession();
    return Promise.reject(new Error('Phiên cũ không có refresh token. Vui lòng đăng nhập lại.'));
  }
  pending = transport.post('/auth/refresh', { refreshToken }).then(({ data }) => {
    // A logout/new login while the request was pending must never resurrect the old session.
    if (tokenStorage.getRefreshToken() !== refreshToken) throw new Error('Phiên đăng nhập đã thay đổi.');
    if (!data.accessToken || !data.refreshToken) throw new Error('Phản hồi làm mới phiên không hợp lệ.');
    tokenStorage.setAccessToken(data.accessToken);
    tokenStorage.setRefreshToken(data.refreshToken);
    if (data.user) tokenStorage.setUser(data.user);
    window.dispatchEvent(new Event('auth:updated'));
    return data.accessToken;
  }).catch(error => {
    if ([400, 401, 403].includes(error.response?.status) && tokenStorage.getRefreshToken() === refreshToken) expireSession();
    throw error; // Network errors/5xx retain tokens and the user's work for retry.
  }).finally(() => { pending = null; });
  return pending;
}
export function ensureSession() {
  const token = tokenStorage.getAccessToken();
  if (!token) return tokenStorage.getRefreshToken() ? refreshSession() : Promise.resolve(null);
  if (!isTokenExpired(token, 60)) return Promise.resolve(token);
  return refreshSession();
}

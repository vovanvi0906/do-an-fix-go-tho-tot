import apiClient from '../../../services/api/client';
import { tokenStorage } from '../../../services/storage/tokenStorage';

export const authService = {
  /**
   * Log in user with email/phone and password
   * @param {{ account?: string, email?: string, password: string }} credentials 
   * @returns {Promise<{ accessToken: string, user: { role: string, [key: string]: any } }>}
   */
  login: async ({ account, email, password }) => {
    const identifier = (account || email || '').trim();
    const response = await apiClient.post('/auth/login', {
      email: identifier,
      account: identifier,
      password,
    });
    
    // API returns { accessToken, user: { role, ... } }
    const data = response.data;
    if (data.accessToken) {
      tokenStorage.setAccessToken(data.accessToken);
    }
    if (data.user) {
      tokenStorage.setUser(data.user);
    }
    return data;
  },

  /**
   * Register a new user account (Customer or Worker)
   * @param {{ fullName: string, email: string, password: string, phone?: string, role: string, cccdNumber?: string, bio?: string }} userData
   * @returns {Promise<{ accessToken: string, user: object }>}
   */
  register: async (userData) => {
    const isWorker = (userData.role || '').toUpperCase() === 'WORKER';
    const primaryEndpoint = isWorker ? '/auth/register/worker' : '/auth/register/customer';

    try {
      // 1. Thử gọi endpoint chuyên biệt (/auth/register/customer hoặc /auth/register/worker)
      const response = await apiClient.post(primaryEndpoint, userData);
      const data = response.data;
      if (data.accessToken) {
        tokenStorage.setAccessToken(data.accessToken);
      }
      if (data.user) {
        tokenStorage.setUser(data.user);
      }
      return data;
    } catch (err) {
      // 2. Nếu 404 (do version server cũ hoặc khác route), fallback thử /auth/register
      if (err.response?.status === 404) {
        const fallbackRes = await apiClient.post('/auth/register', userData);
        const data = fallbackRes.data;
        if (data.accessToken) {
          tokenStorage.setAccessToken(data.accessToken);
        }
        if (data.user) {
          tokenStorage.setUser(data.user);
        }
        return data;
      }
      throw err;
    }
  },

  /**
   * Log out user and purge local tokens
   */
  logout: () => {
    tokenStorage.clearAuth();
  },

  /**
   * Get current authenticated user from storage
   */
  getCurrentUser: () => {
    return tokenStorage.getUser();
  },

  /**
   * Get current access token
   */
  getAccessToken: () => {
    return tokenStorage.getAccessToken();
  },

  /**
   * Check if current session is authenticated
   */
  isAuthenticated: () => {
    return !!tokenStorage.getAccessToken();
  },
};

export default authService;

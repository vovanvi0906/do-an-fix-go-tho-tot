import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'AUTH_ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'AUTH_REFRESH_TOKEN';
const USER_KEY = 'AUTH_USER_INFO';
const clearHandlers = new Set();

export const tokenStorage = {
  onClear(handler) {
    if (typeof handler === 'function') {
      clearHandlers.add(handler);
      return () => clearHandlers.delete(handler);
    }
  },
  async saveToken(token) {
    try {
      if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to save token to storage', e);
    }
  },

  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to get token from storage', e);
      return null;
    }
  },

  async removeToken() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to remove token from storage', e);
    }
  },

  async saveRefreshToken(refreshToken) {
    try {
      if (refreshToken) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch (e) {
      console.error('Failed to save refresh token to storage', e);
    }
  },

  async getRefreshToken() {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.error('Failed to get refresh token from storage', e);
      return null;
    }
  },

  async removeRefreshToken() {
    try {
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.error('Failed to remove refresh token from storage', e);
    }
  },

  async saveUser(user) {
    try {
      if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user to storage', e);
    }
  },

  async getUser() {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to get user from storage', e);
      return null;
    }
  },

  async removeUser() {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed to remove user from storage', e);
    }
  },

  async clearAll() {
    try {
      const user = await this.getUser().catch(() => null);
      for (const handler of Array.from(clearHandlers)) {
        try {
          await handler(user);
        } catch (hErr) {
          console.warn('tokenStorage clearHandler error:', hErr);
        }
      }
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    } catch (e) {
      console.error('Failed to clear storage', e);
    }
  },
};

/**
 * Token and User session storage manager
 */

const ACCESS_TOKEN_KEY = 'home_service_access_token';
const USER_KEY = 'home_service_user';

export const tokenStorage = {
  getAccessToken: () => {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY) || null;
    } catch (e) {
      console.error('Error reading access token from storage:', e);
      return null;
    }
  },

  setAccessToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    } catch (e) {
      console.error('Error saving access token to storage:', e);
    }
  },

  getUser: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error parsing user from storage:', e);
      return null;
    }
  },

  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.error('Error saving user to storage:', e);
    }
  },

  clearAuth: () => {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Error clearing auth storage:', e);
    }
  },
};

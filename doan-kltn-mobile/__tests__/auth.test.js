import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock expo-router
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  Link: ({ children }) => children,
}));

// Mock @expo-google-fonts/inter
jest.mock('@expo-google-fonts/inter', () => ({
  useFonts: () => [true],
  Inter_400Regular: 'Inter_400Regular',
  Inter_600SemiBold: 'Inter_600SemiBold',
  Inter_700Bold: 'Inter_700Bold',
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  FontAwesome: 'FontAwesome',
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  return {
    setItem: jest.fn(async (key, value) => {
      store[key] = String(value);
      return null;
    }),
    getItem: jest.fn(async (key) => store[key] || null),
    removeItem: jest.fn(async (key) => {
      delete store[key];
      return null;
    }),
    multiRemove: jest.fn(async (keys) => {
      keys.forEach((k) => delete store[k]);
      return null;
    }),
    clear: jest.fn(async () => {
      store = {};
      return null;
    }),
    __getStore: () => store,
  };
});

// Import services & components after mocks
import { authService } from '../src/features/auth/services/authService';
import { AuthProvider } from '../src/features/auth/context/AuthContext';
import { tokenStorage } from '../src/services/storage/tokenStorage';
import { apiClient } from '../src/services/api/apiClient';
import FixGoLoginScreen from '../app/index';

jest.setTimeout(15000);

describe('═══════════════════════════════════════════════════════════════', () => {
  describe('FIXGO AUTHENTICATION MODULE - TEST SUITE', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      await AsyncStorage.clear();
    });

    /**
     * Helper render và chờ kết thúc Launch Screen để xuất hiện Form Đăng nhập
     */
    const renderLoginScreen = async () => {
      const utils = render(
        <AuthProvider>
          <FixGoLoginScreen />
        </AuthProvider>
      );
      await waitFor(() => {
        expect(utils.getByPlaceholderText('Số điện thoại hoặc email')).toBeTruthy();
      });
      return utils;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION A: CLIENT-SIDE VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    describe('A. Client-Side Form Validation', () => {
      it('A1: Hiển thị lỗi khi bấm Đăng nhập mà để trống cả 2 trường', async () => {
        const { getByText } = await renderLoginScreen();

        const loginBtn = getByText('Đăng nhập');
        fireEvent.press(loginBtn);

        await waitFor(() => {
          expect(getByText('Vui lòng điền thông tin đăng nhập')).toBeTruthy();
        });
      });

      it('A2: Hiển thị lỗi khi chỉ để trống trường Số điện thoại/Email', async () => {
        const { getByText, getByPlaceholderText } = await renderLoginScreen();

        const passwordInput = getByPlaceholderText('Mật khẩu');
        fireEvent.changeText(passwordInput, 'Password123!');

        const loginBtn = getByText('Đăng nhập');
        fireEvent.press(loginBtn);

        await waitFor(() => {
          expect(getByText('Vui lòng nhập Số điện thoại hoặc email')).toBeTruthy();
        });
      });

      it('A3: Hiển thị lỗi khi chỉ để trống trường Mật khẩu', async () => {
        const { getByText, getByPlaceholderText } = await renderLoginScreen();

        const identifierInput = getByPlaceholderText('Số điện thoại hoặc email');
        fireEvent.changeText(identifierInput, 'user@example.com');

        const loginBtn = getByText('Đăng nhập');
        fireEvent.press(loginBtn);

        await waitFor(() => {
          expect(getByText('Vui lòng nhập Mật khẩu')).toBeTruthy();
        });
      });

      it('A4: Tự động xóa thông báo lỗi khi người dùng bắt đầu nhập lại', async () => {
        const { getByText, getByPlaceholderText, queryByText } = await renderLoginScreen();

        const loginBtn = getByText('Đăng nhập');
        fireEvent.press(loginBtn);

        await waitFor(() => {
          expect(getByText('Vui lòng điền thông tin đăng nhập')).toBeTruthy();
        });

        const identifierInput = getByPlaceholderText('Số điện thoại hoặc email');
        fireEvent.changeText(identifierInput, 'user@example.com');

        expect(queryByText('Vui lòng điền thông tin đăng nhập')).toBeNull();
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION B: API ERROR HANDLING (401, 403, 500, Network Error)
    // ─────────────────────────────────────────────────────────────────────────
    describe('B. API Error Handling', () => {
      it('B1: Xử lý lỗi HTTP 401 Unauthorized (Sai email hoặc mật khẩu)', async () => {
        const spyPost = jest.spyOn(apiClient, 'post').mockRejectedValueOnce(
          new Error('Email hoặc mật khẩu không chính xác')
        );

        const { getByText, getByPlaceholderText } = await renderLoginScreen();

        fireEvent.changeText(getByPlaceholderText('Số điện thoại hoặc email'), 'wrong@email.com');
        fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'WrongPass');
        fireEvent.press(getByText('Đăng nhập'));

        await waitFor(() => {
          expect(getByText('Email hoặc mật khẩu không chính xác')).toBeTruthy();
        });
        spyPost.mockRestore();
      });

      it('B2: Xử lý lỗi HTTP 403 Forbidden (Tài khoản bị khóa)', async () => {
        const spyPost = jest.spyOn(apiClient, 'post').mockRejectedValueOnce(
          new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin')
        );

        const { getByText, getByPlaceholderText } = await renderLoginScreen();

        fireEvent.changeText(getByPlaceholderText('Số điện thoại hoặc email'), 'locked@email.com');
        fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'Password123!');
        fireEvent.press(getByText('Đăng nhập'));

        await waitFor(() => {
          expect(
            getByText('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin')
          ).toBeTruthy();
        });
        spyPost.mockRestore();
      });

      it('B3: Xử lý lỗi Network Error / Mất kết nối máy chủ', async () => {
        const spyPost = jest.spyOn(apiClient, 'post').mockRejectedValueOnce(
          new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend (http://localhost:3000/api)!')
        );

        const { getByText, getByPlaceholderText } = await renderLoginScreen();

        fireEvent.changeText(getByPlaceholderText('Số điện thoại hoặc email'), 'user@email.com');
        fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'Password123!');
        fireEvent.press(getByText('Đăng nhập'));

        await waitFor(() => {
          expect(
            getByText(
              'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend (http://localhost:3000/api)!'
            )
          ).toBeTruthy();
        });
        spyPost.mockRestore();
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION C: STATE & STORAGE MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────
    describe('C. State & Storage Management (Token & User Session)', () => {
      const mockSuccessResponse = {
        accessToken: 'mock-jwt-access-token-12345',
        user: {
          id: 'usr-001',
          email: 'khachhang1@gmail.com',
          fullName: 'Nguyễn Văn Khách',
          role: 'CUSTOMER',
          phone: '0999888777',
        },
      };

      it('C1: Lưu accessToken và User Info vào AsyncStorage khi đăng nhập thành công', async () => {
        const spyPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockSuccessResponse);

        const result = await authService.login('khachhang1@gmail.com', 'Password123!');

        expect(result.accessToken).toBe('mock-jwt-access-token-12345');
        expect(result.user.role).toBe('CUSTOMER');
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'AUTH_ACCESS_TOKEN',
          'mock-jwt-access-token-12345'
        );
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'AUTH_USER_INFO',
          JSON.stringify(mockSuccessResponse.user)
        );
        spyPost.mockRestore();
      });

      it('C2: Lấy lại Token & User từ Storage thông qua tokenStorage wrapper', async () => {
        AsyncStorage.getItem.mockImplementation(async (key) => {
          if (key === 'AUTH_ACCESS_TOKEN') return 'saved-token-xyz';
          if (key === 'AUTH_USER_INFO')
            return JSON.stringify({ email: 'saved@user.com', role: 'CUSTOMER' });
          return null;
        });

        const token = await tokenStorage.getToken();
        const user = await tokenStorage.getUser();

        expect(token).toBe('saved-token-xyz');
        expect(user).toEqual({ email: 'saved@user.com', role: 'CUSTOMER' });
      });

      it('C3: Xóa toàn bộ Token & User khi thực hiện logout', async () => {
        await authService.logout();

        expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
          'AUTH_ACCESS_TOKEN',
          'AUTH_USER_INFO',
        ]);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION D: ROLE-BASED ROUTING
    // ─────────────────────────────────────────────────────────────────────────
    describe('D. Role-Based Routing', () => {
      it('D1: Điều hướng role CUSTOMER sang /(user)/(tabs)', async () => {
        const customerResponse = {
          accessToken: 'token-customer-jwt',
          user: {
            id: 'c-01',
            email: 'customer@gmail.com',
            role: 'CUSTOMER',
          },
        };
        const spyPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(customerResponse);

        const { getByText, getByPlaceholderText } = await renderLoginScreen();

        fireEvent.changeText(getByPlaceholderText('Số điện thoại hoặc email'), 'customer@gmail.com');
        fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'Password123!');
        fireEvent.press(getByText('Đăng nhập'));

        await waitFor(() => {
          expect(mockReplace).toHaveBeenCalledWith('/(user)/(tabs)');
        });
        spyPost.mockRestore();
      });

      it('D2: Điều hướng role WORKER sang /(worker)/(tabs)', async () => {
        const workerResponse = {
          accessToken: 'token-worker-jwt',
          user: {
            id: 'w-01',
            email: 'tho1@gmail.com',
            role: 'WORKER',
          },
        };
        const spyPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(workerResponse);

        const { getByText, getByPlaceholderText } = await renderLoginScreen();

        fireEvent.changeText(getByPlaceholderText('Số điện thoại hoặc email'), 'tho1@gmail.com');
        fireEvent.changeText(getByPlaceholderText('Mật khẩu'), 'Password123!');
        fireEvent.press(getByText('Đăng nhập'));

        await waitFor(() => {
          expect(mockReplace).toHaveBeenCalledWith('/(worker)/(tabs)');
        });
        spyPost.mockRestore();
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION E: AXIOS INTERCEPTOR & AUTH HEADER
    // ─────────────────────────────────────────────────────────────────────────
    describe('E. Axios Interceptors & Authorization Header', () => {
      it('E1: Tự động gắn header "Authorization: Bearer <token>" khi token tồn tại', async () => {
        const spyGetToken = jest.spyOn(tokenStorage, 'getToken').mockResolvedValueOnce('active-session-jwt-token');

        const requestInterceptor = apiClient.interceptors.request.handlers[0].fulfilled;
        const config = { headers: {} };

        const updatedConfig = await requestInterceptor(config);

        expect(updatedConfig.headers.Authorization).toBe('Bearer active-session-jwt-token');
        spyGetToken.mockRestore();
      });

      it('E2: Không gắn header Authorization khi chưa đăng nhập / không có token', async () => {
        const spyGetToken = jest.spyOn(tokenStorage, 'getToken').mockResolvedValueOnce(null);

        const requestInterceptor = apiClient.interceptors.request.handlers[0].fulfilled;
        const config = { headers: {} };

        const updatedConfig = await requestInterceptor(config);

        expect(updatedConfig.headers.Authorization).toBeUndefined();
        spyGetToken.mockRestore();
      });

      it('E3: Response interceptor trích xuất response.data khi API thành công (200/201)', () => {
        const responseInterceptor = apiClient.interceptors.response.handlers[0].fulfilled;
        const mockRawResponse = {
          status: 200,
          config: { url: '/auth/login' },
          data: { accessToken: 'token-123', user: { role: 'CUSTOMER' } },
        };

        const extracted = responseInterceptor(mockRawResponse);
        expect(extracted).toEqual({
          accessToken: 'token-123',
          user: { role: 'CUSTOMER' },
        });
      });
    });
  });
});

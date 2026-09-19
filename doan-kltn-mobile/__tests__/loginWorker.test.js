import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock expo-router
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    back: mockBack,
  }),
  Link: ({ children }) => children,
}));

// Mock @expo-google-fonts/inter
jest.mock('@expo-google-fonts/inter', () => ({
  useFonts: () => [true],
  Inter_400Regular: 'Inter_400Regular',
  Inter_500Medium: 'Inter_500Medium',
  Inter_600SemiBold: 'Inter_600SemiBold',
  Inter_700Bold: 'Inter_700Bold',
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  FontAwesome: 'FontAwesome',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
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

// Import services & component after mocks
import { authService } from '../src/features/auth/services/authService';
import { AuthProvider } from '../src/features/auth/context/AuthContext';
import { tokenStorage } from '../src/services/storage/tokenStorage';
import { apiClient } from '../src/services/api/apiClient';
import WorkerLoginScreen from '../app/(auth)/login-worker';

jest.setTimeout(15000);

describe('═══════════════════════════════════════════════════════════════', () => {
  describe('FIXGO WORKER LOGIN MODULE - TEST SUITE', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      await AsyncStorage.clear();
    });

    const renderWorkerLoginScreen = async () => {
      const utils = render(
        <AuthProvider>
          <WorkerLoginScreen />
        </AuthProvider>
      );
      await waitFor(() => {
        expect(
          utils.getByPlaceholderText('Nhập số điện thoại hoặc email đối tác')
        ).toBeTruthy();
      });
      return utils;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION A: UI RENDERING & ELEMENTS
    // ─────────────────────────────────────────────────────────────────────────
    describe('A. UI Rendering & Elements', () => {
      it('A1: Render đầy đủ tiêu đề, badge đối tác, các ô input và nút đăng nhập', async () => {
        const { getByText, getByPlaceholderText } = await renderWorkerLoginScreen();

        expect(getByText('Đăng nhập Thợ')).toBeTruthy();
        expect(getByText('KÊNH ĐỐI TÁC')).toBeTruthy();
        expect(
          getByPlaceholderText('Nhập số điện thoại hoặc email đối tác')
        ).toBeTruthy();
        expect(getByPlaceholderText('Nhập mật khẩu của bạn')).toBeTruthy();
        expect(getByText('Đăng nhập')).toBeTruthy();
        expect(getByText('Quên mật khẩu?')).toBeTruthy();
        expect(getByText('Đăng ký ngay')).toBeTruthy();
        expect(getByText('Chuyển sang Đăng nhập Khách hàng')).toBeTruthy();
      });

      it('A2: Chuyển đổi ẩn / hiện mật khẩu khi ấn icon mắt', async () => {
        const { getByPlaceholderText } = await renderWorkerLoginScreen();
        const pwdInput = getByPlaceholderText('Nhập mật khẩu của bạn');

        expect(pwdInput.props.secureTextEntry).toBe(true);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION B: CLIENT-SIDE VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    describe('B. Client-Side Validation', () => {
      it('B1: Báo lỗi khi để trống cả 2 trường', async () => {
        const { getByText } = await renderWorkerLoginScreen();

        fireEvent.press(getByText('Đăng nhập'));

        await waitFor(() => {
          expect(getByText('Vui lòng điền thông tin đăng nhập Thợ')).toBeTruthy();
        });
      });

      it('B2: Báo lỗi khi chỉ nhập Mật khẩu mà bỏ trống SĐT/Email', async () => {
        const { getByText, getByPlaceholderText } = await renderWorkerLoginScreen();

        fireEvent.changeText(
          getByPlaceholderText('Nhập mật khẩu của bạn'),
          'WorkerPass123!'
        );
        fireEvent.press(getByText('Đăng nhập'));

        await waitFor(() => {
          expect(
            getByText('Vui lòng nhập Số điện thoại hoặc email đối tác')
          ).toBeTruthy();
        });
      });

      it('B3: Báo lỗi khi chỉ nhập SĐT/Email mà bỏ trống Mật khẩu', async () => {
        const { getByText, getByPlaceholderText } = await renderWorkerLoginScreen();

        fireEvent.changeText(
          getByPlaceholderText('Nhập số điện thoại hoặc email đối tác'),
          '0385361198'
        );
        fireEvent.press(getByText('Đăng nhập'));

        await waitFor(() => {
          expect(getByText('Vui lòng nhập Mật khẩu')).toBeTruthy();
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION C: API ERROR HANDLING (401, 403, NETWORK ERROR)
    // ─────────────────────────────────────────────────────────────────────────
    describe('C. API Error Handling', () => {
      it('C1: Xử lý lỗi 401 Unauthorized khi sai thông tin đăng nhập', async () => {
        jest.spyOn(authService, 'login').mockRejectedValueOnce(
          new Error('Email hoặc mật khẩu không chính xác')
        );

        const { getByText, getByPlaceholderText } = await renderWorkerLoginScreen();

        fireEvent.changeText(
          getByPlaceholderText('Nhập số điện thoại hoặc email đối tác'),
          'wrong_worker@gmail.com'
        );
        fireEvent.changeText(
          getByPlaceholderText('Nhập mật khẩu của bạn'),
          'WrongPass'
        );
        fireEvent.press(getByText('Đăng nhập'));

        await waitFor(() => {
          expect(getByText('Email hoặc mật khẩu không chính xác')).toBeTruthy();
        });
      });

      it('C2: Xử lý lỗi 403 Forbidden khi tài khoản thợ bị khóa', async () => {
        jest.spyOn(authService, 'login').mockRejectedValueOnce(
          new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin')
        );

        const { getByText, getByPlaceholderText } = await renderWorkerLoginScreen();

        fireEvent.changeText(
          getByPlaceholderText('Nhập số điện thoại hoặc email đối tác'),
          'locked_worker@gmail.com'
        );
        fireEvent.changeText(
          getByPlaceholderText('Nhập mật khẩu của bạn'),
          'ValidPass123!'
        );
        fireEvent.press(getByText('Đăng nhập'));

        await waitFor(() => {
          expect(
            getByText('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin')
          ).toBeTruthy();
        });
      });

      it('C3: Xử lý lỗi mất kết nối mạng / server offline', async () => {
        jest.spyOn(authService, 'login').mockRejectedValueOnce(
          new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend!')
        );

        const { getByText, getByPlaceholderText } = await renderWorkerLoginScreen();

        fireEvent.changeText(
          getByPlaceholderText('Nhập số điện thoại hoặc email đối tác'),
          '0385361198'
        );
        fireEvent.changeText(
          getByPlaceholderText('Nhập mật khẩu của bạn'),
          'WorkerPass123!'
        );
        fireEvent.press(getByText('Đăng nhập'));

        await waitFor(() => {
          expect(
            getByText('Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend!')
          ).toBeTruthy();
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION D: SUCCESSFUL LOGIN & STORAGE PERSISTENCE & ROUTING
    // ─────────────────────────────────────────────────────────────────────────
    describe('D. Successful Worker Login & Routing', () => {
      it('D1: Đăng nhập thành công với vai trò WORKER -> Lưu token & user -> Điều hướng /(worker)/(tabs)', async () => {
        const mockWorkerResponse = {
          accessToken: 'worker-jwt-token-xyz',
          user: {
            id: 'worker-001',
            email: 'tho1@gmail.com',
            fullName: 'Trần Văn Thợ',
            role: 'WORKER',
          },
        };

        jest.spyOn(authService, 'login').mockResolvedValueOnce(mockWorkerResponse);

        const { getByText, getByPlaceholderText } = await renderWorkerLoginScreen();

        fireEvent.changeText(
          getByPlaceholderText('Nhập số điện thoại hoặc email đối tác'),
          'tho1@gmail.com'
        );
        fireEvent.changeText(
          getByPlaceholderText('Nhập mật khẩu của bạn'),
          'Password123!'
        );
        fireEvent.press(getByText('Đăng nhập'));

        await waitFor(() => {
          expect(authService.login).toHaveBeenCalledWith(
            'tho1@gmail.com',
            'Password123!'
          );
          expect(mockReplace).toHaveBeenCalledWith('/(worker)/(tabs)');
        });
      });

      it('D2: Tự động điều hướng vào /(worker)/(tabs) nếu phiên đăng nhập WORKER đã lưu trong máy', async () => {
        // Giả lập phiên đăng nhập thợ đã lưu sẵn trong AsyncStorage
        await AsyncStorage.setItem('AUTH_ACCESS_TOKEN', 'saved-worker-token');
        await AsyncStorage.setItem(
          'AUTH_USER_INFO',
          JSON.stringify({
            id: 'worker-saved-01',
            email: 'saved_worker@fixgo.vn',
            role: 'WORKER',
          })
        );

        render(
          <AuthProvider>
            <WorkerLoginScreen />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(mockReplace).toHaveBeenCalledWith('/(worker)/(tabs)');
        });
      });
    });
  });
});

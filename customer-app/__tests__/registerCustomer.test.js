import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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
  Inter_500Medium: 'Inter_500Medium',
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
import { apiClient } from '../src/services/api/apiClient';
import RegisterCustomerScreen from '../app/(auth)/register-customer';

jest.setTimeout(15000);

describe('═══════════════════════════════════════════════════════════════', () => {
  describe('FIXGO REGISTER CUSTOMER (FIGMA MULTI-STEP) - TEST SUITE', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
      await AsyncStorage.clear();
    });

    const renderRegisterScreen = () => {
      return render(
        <AuthProvider>
          <RegisterCustomerScreen />
        </AuthProvider>
      );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: NHẬP SỐ ĐIỆN THOẠI
    // ─────────────────────────────────────────────────────────────────────────
    describe('Step 1: Phone Number Input & Validation', () => {
      it('1.1: Báo lỗi khi để trống số điện thoại và bấm Tiếp tục', async () => {
        const { getByText } = renderRegisterScreen();

        fireEvent.press(getByText('Tiếp tục'));

        await waitFor(() => {
          expect(getByText('Vui lòng nhập số điện thoại')).toBeTruthy();
        });
      });

      it('1.2: Báo lỗi khi nhập số điện thoại không hợp lệ (ít hơn 9 số)', async () => {
        const { getByText, getByPlaceholderText } = renderRegisterScreen();

        fireEvent.changeText(getByPlaceholderText('Số điện thoại'), '12345');
        fireEvent.press(getByText('Tiếp tục'));

        await waitFor(() => {
          expect(getByText('Số điện thoại không hợp lệ (9 - 11 chữ số)')).toBeTruthy();
        });
      });

      it('1.3: Nhập số điện thoại hợp lệ chuyển sang Bước 2 (OTP)', async () => {
        const { getByText, getByPlaceholderText } = renderRegisterScreen();

        fireEvent.changeText(getByPlaceholderText('Số điện thoại'), '0988776655');
        fireEvent.press(getByText('Tiếp tục'));

        await waitFor(() => {
          expect(getByText('Nhập mã gồm 6 chữ số được gửi đến')).toBeTruthy();
          expect(getByText('+84 09*****6655')).toBeTruthy();
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: XÁC THỰC OTP
    // ─────────────────────────────────────────────────────────────────────────
    describe('Step 2: 6-Digit OTP Verification & Navigation', () => {
      const advanceToOtpStep = (screen) => {
        fireEvent.changeText(screen.getByPlaceholderText('Số điện thoại'), '0988776655');
        fireEvent.press(screen.getByText('Tiếp tục'));
      };

      it('2.1: Hiển thị bộ đếm thời gian hoặc nút Gửi lại mã', async () => {
        const screen = renderRegisterScreen();
        advanceToOtpStep(screen);

        await waitFor(() => {
          expect(screen.getByText(/Gửi lại mã/)).toBeTruthy();
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: TẠO MẬT KHẨU
    // ─────────────────────────────────────────────────────────────────────────
    describe('Step 3: Password Creation & Checklist', () => {
      const advanceToPasswordStep = async (screen) => {
        fireEvent.changeText(screen.getByPlaceholderText('Số điện thoại'), '0988776655');
        fireEvent.press(screen.getByText('Tiếp tục'));

        await waitFor(() => {
          expect(screen.getByText('Nhập mã gồm 6 chữ số được gửi đến')).toBeTruthy();
        });

        // Điền 6 chữ số OTP
        const inputs = screen.UNSAFE_getAllByType('TextInput');
        for (let i = 0; i < 6; i++) {
          fireEvent.changeText(inputs[i], '1');
        }

        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Tạo mật khẩu')).toBeTruthy();
        });
      };

      it('3.1: Hiển thị checklist điều kiện mật khẩu (8 ký tự, 1 chữ cái, 1 chữ số)', async () => {
        const screen = renderRegisterScreen();
        await advanceToPasswordStep(screen);

        expect(screen.getByText('Có ít nhất 8 ký tự')).toBeTruthy();
        expect(screen.getByText('Có một chữ cái')).toBeTruthy();
        expect(screen.getByText('Có một chữ số')).toBeTruthy();
      });

      it('3.2: Báo lỗi khi mật khẩu xác nhận không khớp', async () => {
        const screen = renderRegisterScreen();
        await advanceToPasswordStep(screen);

        fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'Password123');
        fireEvent.changeText(screen.getByPlaceholderText('Xác nhận lại mật khẩu'), 'DifferentPass123');

        await waitFor(() => {
          expect(screen.getByText('Mật khẩu không khớp')).toBeTruthy();
        });
      });

      it('3.3: Hiển thị "Mật khẩu chính xác" khi xác nhận khớp và hợp lệ', async () => {
        const screen = renderRegisterScreen();
        await advanceToPasswordStep(screen);

        fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'Password123');
        fireEvent.changeText(screen.getByPlaceholderText('Xác nhận lại mật khẩu'), 'Password123');

        await waitFor(() => {
          expect(screen.getByText('Mật khẩu chính xác')).toBeTruthy();
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: NHẬP HỌ TÊN & HOÀN TẤT ĐĂNG KÝ
    // ─────────────────────────────────────────────────────────────────────────
    describe('Step 4: Full Name & API Registration', () => {
      const advanceToNameStep = async (screen) => {
        fireEvent.changeText(screen.getByPlaceholderText('Số điện thoại'), '0988776655');
        fireEvent.press(screen.getByText('Tiếp tục'));

        await waitFor(() => {
          expect(screen.getByText('Nhập mã gồm 6 chữ số được gửi đến')).toBeTruthy();
        });

        const inputs = screen.UNSAFE_getAllByType('TextInput');
        for (let i = 0; i < 6; i++) {
          fireEvent.changeText(inputs[i], '1');
        }
        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Tạo mật khẩu')).toBeTruthy();
        });

        fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'Password123');
        fireEvent.changeText(screen.getByPlaceholderText('Xác nhận lại mật khẩu'), 'Password123');

        await waitFor(() => {
          expect(screen.getByText('Mật khẩu chính xác')).toBeTruthy();
        });

        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Nhập họ tên và gmail')).toBeTruthy();
        });
      };

      it('4.1: Đăng ký thành công gọi API POST /auth/register/customer và điều hướng về /(user)/(tabs)', async () => {
        const mockSuccess = {
          accessToken: 'mock-token-xyz',
          user: {
            id: 'c-100',
            fullName: 'Nguyễn Văn Khách',
            email: 'khach@gmail.com',
            role: 'CUSTOMER',
            phone: '0988776655',
          },
        };
        const spyPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockSuccess);

        const screen = renderRegisterScreen();
        await advanceToNameStep(screen);

        fireEvent.changeText(screen.getByPlaceholderText('Họ'), 'Nguyễn Văn');
        fireEvent.changeText(screen.getByPlaceholderText('Tên'), 'Khách');
        fireEvent.changeText(screen.getByPlaceholderText('Email (vd: example@gmail.com)'), 'khach@gmail.com');

        fireEvent.press(screen.getByText('Hoàn tất'));

        await waitFor(() => {
          expect(spyPost).toHaveBeenCalledWith('/auth/register/customer', {
            fullName: 'Nguyễn Văn Khách',
            email: 'khach@gmail.com',
            phone: '0988776655',
            password: 'Password123',
          });
          expect(mockReplace).toHaveBeenCalledWith('/(user)/(tabs)');
        });

        spyPost.mockRestore();
      });

      it('4.2: Lưu accessToken và User vào AsyncStorage khi đăng ký thành công', async () => {
        const mockSuccess = {
          accessToken: 'token-stored-customer',
          user: {
            id: 'c-101',
            fullName: 'Trần Văn A',
            email: 'trana@gmail.com',
            role: 'CUSTOMER',
            phone: '0912345678',
          },
        };
        const spyPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockSuccess);

        const res = await authService.registerCustomer({
          fullName: 'Trần Văn A',
          email: 'trana@gmail.com',
          phone: '0912345678',
          password: 'Password123',
        });

        expect(res.accessToken).toBe('token-stored-customer');
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'AUTH_ACCESS_TOKEN',
          'token-stored-customer'
        );
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'AUTH_USER_INFO',
          JSON.stringify(mockSuccess.user)
        );
        spyPost.mockRestore();
      });
    });
  });
});

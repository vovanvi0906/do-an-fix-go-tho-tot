import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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

// Import services & components after mocks
import { authService } from '../src/features/auth/services/authService';
import { AuthProvider } from '../src/features/auth/context/AuthContext';
import { apiClient } from '../src/services/api/apiClient';
import RegisterWorkerScreen, { validateVietnameseCCCD } from '../app/(auth)/register-worker';

jest.setTimeout(15000);

describe('═══════════════════════════════════════════════════════════════', () => {
  describe('FIXGO REGISTER WORKER (FIGMA SCREENS 22, 40-46) - TEST SUITE', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
      await AsyncStorage.clear();
    });

    const renderRegisterWorkerScreen = () => {
      return render(
        <AuthProvider>
          <RegisterWorkerScreen />
        </AuthProvider>
      );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: NHẬP SỐ ĐIỆN THOẠI (FIGMA SCREEN - 22)
    // ─────────────────────────────────────────────────────────────────────────
    describe('Step 1: Phone Number Input (Figma Screen 22)', () => {
      it('1.1: Render tiêu đề, cờ VN, ô SĐT, các nút Social và điều khoản', async () => {
        const { getByText, getByPlaceholderText } = renderRegisterWorkerScreen();

        expect(getByText('Nhập số điện thoại')).toBeTruthy();
        expect(getByPlaceholderText('Số điện thoại')).toBeTruthy();
        expect(getByText('Tiếp tục')).toBeTruthy();
        expect(getByText('Đăng nhập bằng Facebook')).toBeTruthy();
        expect(getByText('Đăng nhập bằng Google')).toBeTruthy();
        expect(getByText(/Bằng cách tiếp tục, bạn đồng ý/)).toBeTruthy();
      });

      it('1.2: Báo lỗi khi để trống số điện thoại và ấn Tiếp tục', async () => {
        const { getByText } = renderRegisterWorkerScreen();

        fireEvent.press(getByText('Tiếp tục'));

        await waitFor(() => {
          expect(getByText('Vui lòng nhập số điện thoại')).toBeTruthy();
        });
      });

      it('1.3: Báo lỗi khi nhập số điện thoại không hợp lệ (< 9 chữ số)', async () => {
        const { getByText, getByPlaceholderText } = renderRegisterWorkerScreen();

        fireEvent.changeText(getByPlaceholderText('Số điện thoại'), '12345');
        fireEvent.press(getByText('Tiếp tục'));

        await waitFor(() => {
          expect(
            getByText('Số điện thoại không hợp lệ (9 - 11 chữ số)')
          ).toBeTruthy();
        });
      });

      it('1.4: Nhập số điện thoại hợp lệ chuyển sang Bước 2 (OTP)', async () => {
        const { getByText, getByPlaceholderText } = renderRegisterWorkerScreen();

        fireEvent.changeText(getByPlaceholderText('Số điện thoại'), '0385361198');
        fireEvent.press(getByText('Tiếp tục'));

        await waitFor(() => {
          expect(getByText('Nhập mã gồm 6 chữ số được gửi đến')).toBeTruthy();
          expect(getByText('+84 03*****1198')).toBeTruthy();
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: XÁC THỰC MÃ OTP 6 SỐ
    // ─────────────────────────────────────────────────────────────────────────
    describe('Step 2: 6-Digit OTP Verification', () => {
      const advanceToOtpStep = (screen, phone = '0385361198') => {
        fireEvent.changeText(screen.getByPlaceholderText('Số điện thoại'), phone);
        fireEvent.press(screen.getByText('Tiếp tục'));
      };

      it('2.1: Hiển thị bộ đếm thời gian hoặc nút Gửi lại mã', async () => {
        const screen = renderRegisterWorkerScreen();
        advanceToOtpStep(screen);

        await waitFor(() => {
          expect(screen.getByText(/Gửi lại mã/)).toBeTruthy();
        });
      });

      it('2.2: Nhập đủ 6 số OTP và ấn Tiếp chuyển sang Bước 3 (Tạo mật khẩu)', async () => {
        const screen = renderRegisterWorkerScreen();
        advanceToOtpStep(screen);

        await waitFor(() => {
          expect(screen.getByText('Nhập mã gồm 6 chữ số được gửi đến')).toBeTruthy();
        });

        const inputs = screen.UNSAFE_getAllByType('TextInput');
        for (let i = 0; i < 6; i++) {
          fireEvent.changeText(inputs[i], String(i + 1));
        }

        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Tạo mật khẩu')).toBeTruthy();
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: TẠO MẬT KHẨU & CHECKLIST
    // ─────────────────────────────────────────────────────────────────────────
    describe('Step 3: Password Creation & Security Checklist', () => {
      const advanceToPasswordStep = async (screen) => {
        fireEvent.changeText(screen.getByPlaceholderText('Số điện thoại'), '0385361198');
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
      };

      it('3.1: Hiển thị checklist điều kiện mật khẩu (8 ký tự, 1 chữ cái, 1 chữ số)', async () => {
        const screen = renderRegisterWorkerScreen();
        await advanceToPasswordStep(screen);

        expect(screen.getByText('Có ít nhất 8 ký tự')).toBeTruthy();
        expect(screen.getByText('Có một chữ cái')).toBeTruthy();
        expect(screen.getByText('Có một chữ số')).toBeTruthy();
      });

      it('3.2: Nhập đúng mật khẩu và ấn Tiếp chuyển sang Bước 4 (Họ tên & Email)', async () => {
        const screen = renderRegisterWorkerScreen();
        await advanceToPasswordStep(screen);

        fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'WorkerPass123');
        fireEvent.changeText(screen.getByPlaceholderText('Xác nhận lại mật khẩu'), 'WorkerPass123');

        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Nhập họ tên và gmail')).toBeTruthy();
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: NHẬP HỌ TÊN VÀ EMAIL
    // ─────────────────────────────────────────────────────────────────────────
    describe('Step 4: Full Name & Email Input', () => {
      const advanceToNameStep = async (screen) => {
        fireEvent.changeText(screen.getByPlaceholderText('Số điện thoại'), '0385361198');
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

        fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'WorkerPass123');
        fireEvent.changeText(screen.getByPlaceholderText('Xác nhận lại mật khẩu'), 'WorkerPass123');
        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Nhập họ tên và gmail')).toBeTruthy();
        });
      };

      it('4.1: Nhập Họ, Tên và Email ấn Tiếp chuyển sang Bước 5 (Chọn dịch vụ)', async () => {
        const screen = renderRegisterWorkerScreen();
        await advanceToNameStep(screen);

        fireEvent.changeText(screen.getByPlaceholderText('Họ'), 'Nguyễn Văn');
        fireEvent.changeText(screen.getByPlaceholderText('Tên'), 'Thợ');
        fireEvent.changeText(screen.getByPlaceholderText('Email (vd: example@gmail.com)'), 'tho1@gmail.com');

        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Chọn dịch vụ muốn đăng ký')).toBeTruthy();
          expect(screen.getByText('Dịch vụ muốn đăng ký')).toBeTruthy();
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 5: CHỌN DỊCH VỤ MUỐN ĐĂNG KÝ (FIGMA SCREENS 40 - 42)
    // ─────────────────────────────────────────────────────────────────────────
    describe('Step 5: Service Selection with Bottom Sheet (Figma Screens 40 - 42)', () => {
      const advanceToServiceStep = async (screen) => {
        fireEvent.changeText(screen.getByPlaceholderText('Số điện thoại'), '0385361198');
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

        fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'WorkerPass123');
        fireEvent.changeText(screen.getByPlaceholderText('Xác nhận lại mật khẩu'), 'WorkerPass123');
        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Nhập họ tên và gmail')).toBeTruthy();
        });

        fireEvent.changeText(screen.getByPlaceholderText('Họ'), 'Nguyễn Văn');
        fireEvent.changeText(screen.getByPlaceholderText('Tên'), 'Thợ');
        fireEvent.changeText(screen.getByPlaceholderText('Email (vd: example@gmail.com)'), 'tho1@gmail.com');
        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Chọn dịch vụ muốn đăng ký')).toBeTruthy();
        });
      };

      it('5.1: Mở Bottom Sheet danh sách dịch vụ và chọn Sửa điện nước', async () => {
        const screen = renderRegisterWorkerScreen();
        await advanceToServiceStep(screen);

        // Click ô chọn dịch vụ để mở Modal
        fireEvent.press(screen.getByText('Dịch vụ muốn đăng ký'));

        // Kiểm tra danh sách trong modal
        expect(screen.getByText('Giúp việc')).toBeTruthy();
        expect(screen.getByText('Làm vườn')).toBeTruthy();
        expect(screen.getByText('Sửa điện nước')).toBeTruthy();
        expect(screen.getByText('Sửa thiết bị')).toBeTruthy();

        // Chọn "Sửa điện nước"
        fireEvent.press(screen.getByText('Sửa điện nước'));

        // Chuyển sang Bước 6 (Nhập CCCD) khi ấn Tiếp
        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Nhập số CCCD')).toBeTruthy();
          expect(screen.getByPlaceholderText('Số CCCD')).toBeTruthy();
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 6: NHẬP SỐ CCCD & HOÀN TẤT ĐĂNG KÝ (FIGMA SCREENS 43 - 46)
    // ─────────────────────────────────────────────────────────────────────────
    describe('Step 6: CCCD Validation & Worker Registration (Figma Screens 43 - 46)', () => {
      const advanceToCccdStep = async (screen) => {
        fireEvent.changeText(screen.getByPlaceholderText('Số điện thoại'), '0385361198');
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

        fireEvent.changeText(screen.getByPlaceholderText('Nhập mật khẩu'), 'WorkerPass123');
        fireEvent.changeText(screen.getByPlaceholderText('Xác nhận lại mật khẩu'), 'WorkerPass123');
        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Nhập họ tên và gmail')).toBeTruthy();
        });

        fireEvent.changeText(screen.getByPlaceholderText('Họ'), 'Nguyễn Văn');
        fireEvent.changeText(screen.getByPlaceholderText('Tên'), 'Thợ');
        fireEvent.changeText(screen.getByPlaceholderText('Email (vd: example@gmail.com)'), 'tho1@gmail.com');
        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Chọn dịch vụ muốn đăng ký')).toBeTruthy();
        });

        fireEvent.press(screen.getByText('Dịch vụ muốn đăng ký'));
        fireEvent.press(screen.getByText('Sửa điện nước'));
        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Nhập số CCCD')).toBeTruthy();
        });
      };

      it('6.1: Kiểm tra cấu trúc CCCD Việt Nam hợp lệ (052204008688 - Bình Định, Nam 2004)', () => {
        const validCccd = validateVietnameseCCCD('052204008688');
        expect(validCccd.isValid).toBe(true);

        const invalidCccd1 = validateVietnameseCCCD('012345678912'); // Năm 2045 ở tương lai
        expect(invalidCccd1.isValid).toBe(false);
        expect(invalidCccd1.message).toBe('Thông tin CCCD không khớp');

        const invalidCccd2 = validateVietnameseCCCD('999204008688'); // Mã tỉnh 999 không tồn tại
        expect(invalidCccd2.isValid).toBe(false);
        expect(invalidCccd2.message).toBe('Thông tin CCCD không khớp');
      });

      it('6.2: Báo lỗi "Thông tin CCCD không khớp" khi nhập sai quy chuẩn trên giao diện (012345678912)', async () => {
        const screen = renderRegisterWorkerScreen();
        await advanceToCccdStep(screen);

        fireEvent.changeText(screen.getByPlaceholderText('Số CCCD'), '012345678912');
        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(screen.getByText('Thông tin CCCD không khớp')).toBeTruthy();
        });
      });

      it('6.3: Đăng ký thành công khi nhập CCCD chuẩn (052204008688) -> Gọi API -> Điều hướng /(worker)/(tabs)', async () => {
        const mockWorkerResponse = {
          accessToken: 'worker-token-secret-999',
          user: {
            id: 'worker-001',
            fullName: 'Nguyễn Văn Thợ',
            email: 'tho1@gmail.com',
            role: 'WORKER',
            phone: '0385361198',
            skills: ['Sửa điện nước'],
            cccdNumber: '052204008688',
          },
        };
        const spyPost = jest.spyOn(apiClient, 'post').mockResolvedValueOnce(mockWorkerResponse);

        const screen = renderRegisterWorkerScreen();
        await advanceToCccdStep(screen);

        fireEvent.changeText(screen.getByPlaceholderText('Số CCCD'), '052204008688');
        fireEvent.press(screen.getByText('Tiếp'));

        await waitFor(() => {
          expect(spyPost).toHaveBeenCalledWith('/auth/register/worker', {
            fullName: 'Nguyễn Văn Thợ',
            email: 'tho1@gmail.com',
            phone: '0385361198',
            password: 'WorkerPass123',
            skills: ['Sửa điện nước'],
            cccdNumber: '052204008688',
          });
          expect(mockReplace).toHaveBeenCalledWith('/(worker)/(tabs)');
        });

        spyPost.mockRestore();
      });
    });
  });
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock expo-router
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    back: mockBack,
  }),
  useLocalSearchParams: () => mockParams,
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
  FontAwesome5: 'FontAwesome5',
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

import { AuthProvider } from '../src/features/auth/context/AuthContext';
import CustomerProfileScreen from '../app/(user)/(tabs)/profile';
import EditCustomerProfileScreen from '../app/(user)/profile/edit';
import EditFieldScreen from '../app/(user)/profile/edit-field';
import CustomerWalletScreen from '../app/(user)/profile/wallet';
import VouchersScreen from '../app/(user)/profile/vouchers';
import CustomerHomeScreen from '../app/(user)/(tabs)/index';

describe('═══════════════════════════════════════════════════════════════', () => {
  describe('FIXGO CUSTOMER ACCOUNT & PROFILE FLOW - TEST SUITE', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      mockParams = {};
      await AsyncStorage.clear();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 0. MÀN HÌNH TRANG CHỦ KHÁCH HÀNG (index.jsx)
    // ─────────────────────────────────────────────────────────────────────────
    describe('0. Customer Home Screen (index.jsx)', () => {
      it('0.1: Render vị trí GPS, banner ưu đãi, lưới 4 dịch vụ chính và thợ nổi bật', async () => {
        const screen = render(
          <AuthProvider>
            <CustomerHomeScreen />
          </AuthProvider>
        );

        expect(screen.getByText('Vị trí của bạn')).toBeTruthy();
        expect(screen.getByText('Dịch vụ FixGo')).toBeTruthy();
        expect(screen.getByText('Sửa điện')).toBeTruthy();
        expect(screen.getByText('Sửa nước')).toBeTruthy();
        expect(screen.getByText('Điện lạnh')).toBeTruthy();
        expect(screen.getByText('Sửa khóa')).toBeTruthy();
        expect(screen.getByText('Gọi Thợ Khẩn Cấp 24/7')).toBeTruthy();
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 1. MÀN HÌNH CHÍNH TÀI KHOẢN (profile.jsx)
    // ─────────────────────────────────────────────────────────────────────────
    describe('1. Main Customer Profile Screen (profile.jsx)', () => {
      it('1.1: Render đầy đủ tên người dùng, avatar và 4 menu mục chức năng', async () => {
        const screen = render(
          <AuthProvider>
            <CustomerProfileScreen />
          </AuthProvider>
        );

        expect(screen.getByText('Lu Dai')).toBeTruthy();
        expect(screen.getByText('Chỉnh sửa thông tin')).toBeTruthy();
        expect(screen.getByText('Ví FixGo')).toBeTruthy();
        expect(screen.getByText('Mã giảm giá')).toBeTruthy();
        expect(screen.getByText('Đăng xuất')).toBeTruthy();
      });

      it('1.2: Bấm vào "Chỉnh sửa thông tin" điều hướng sang /(user)/profile/edit', async () => {
        const screen = render(
          <AuthProvider>
            <CustomerProfileScreen />
          </AuthProvider>
        );

        fireEvent.press(screen.getByText('Chỉnh sửa thông tin'));
        expect(mockPush).toHaveBeenCalledWith('/(user)/profile/edit');
      });

      it('1.3: Bấm vào "Ví FixGo" điều hướng sang /(user)/profile/wallet', async () => {
        const screen = render(
          <AuthProvider>
            <CustomerProfileScreen />
          </AuthProvider>
        );

        fireEvent.press(screen.getByText('Ví FixGo'));
        expect(mockPush).toHaveBeenCalledWith('/(user)/profile/wallet');
      });

      it('1.4: Bấm vào "Mã giảm giá" điều hướng sang /(user)/profile/vouchers', async () => {
        const screen = render(
          <AuthProvider>
            <CustomerProfileScreen />
          </AuthProvider>
        );

        fireEvent.press(screen.getByText('Mã giảm giá'));
        expect(mockPush).toHaveBeenCalledWith('/(user)/profile/vouchers');
      });

      it('1.5: Bấm "Đăng xuất" hiển thị modal xác nhận và bấm xác nhận đăng xuất', async () => {
        const screen = render(
          <AuthProvider>
            <CustomerProfileScreen />
          </AuthProvider>
        );

        fireEvent.press(screen.getByText('Đăng xuất'));

        await waitFor(() => {
          expect(screen.getByText('Đăng xuất tài khoản')).toBeTruthy();
          expect(
            screen.getByText('Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng FIXGO không?')
          ).toBeTruthy();
        });

        // Bấm nút Đăng xuất trong modal
        const confirmBtns = screen.getAllByText('Đăng xuất');
        fireEvent.press(confirmBtns[confirmBtns.length - 1]);

        await waitFor(() => {
          expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. MÀN HÌNH CHỈNH SỬA THÔNG TIN (edit.jsx)
    // ─────────────────────────────────────────────────────────────────────────
    describe('2. Edit Profile Screen (edit.jsx)', () => {
      it('2.1: Render tiêu đề, nút Tải ảnh lên và 4 trường thông tin kèm badge', async () => {
        const screen = render(
          <AuthProvider>
            <EditCustomerProfileScreen />
          </AuthProvider>
        );

        expect(screen.getByText('Chỉnh sửa thông tin')).toBeTruthy();
        expect(screen.getByText('Tải ảnh lên')).toBeTruthy();
        expect(screen.getByText('Họ')).toBeTruthy();
        expect(screen.getByText('Tên')).toBeTruthy();
        expect(screen.getByText('Số điện thoại')).toBeTruthy();
        expect(screen.getByText('Email')).toBeTruthy();
        expect(screen.getAllByText('Verified').length).toBeGreaterThan(0);
      });

      it('2.2: Bấm vào dòng Họ điều hướng sang edit-field với field: surname', async () => {
        const screen = render(
          <AuthProvider>
            <EditCustomerProfileScreen />
          </AuthProvider>
        );

        fireEvent.press(screen.getByText('Họ'));
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/(user)/profile/edit-field',
          params: { field: 'surname', value: 'Lu' },
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. MÀN HÌNH SUB-SCREEN CẬP NHẬT CHI TIẾT & XÁC MINH OTP/PASSWORD (edit-field.jsx)
    // ─────────────────────────────────────────────────────────────────────────
    describe('3. Edit Field Screen (edit-field.jsx)', () => {
      it('3.1: Render giao diện cập nhật Họ với nút đen "Cập nhật họ"', async () => {
        mockParams = { field: 'surname', value: 'Nguyễn' };
        const screen = render(
          <AuthProvider>
            <EditFieldScreen />
          </AuthProvider>
        );

        expect(screen.getByText('Họ')).toBeTruthy();
        expect(screen.getByDisplayValue('Nguyễn')).toBeTruthy();
        expect(screen.getByText('Cập nhật họ')).toBeTruthy();
      });

      it('3.2: Luồng xác minh SĐT: Nhập SĐT -> Gửi OTP -> Bước 3 Verify Password', async () => {
        mockParams = { field: 'phone', value: '0989358777' };
        const screen = render(
          <AuthProvider>
            <EditFieldScreen />
          </AuthProvider>
        );

        expect(screen.getByText('Số điện thoại')).toBeTruthy();
        expect(screen.getByText('+84')).toBeTruthy();
        expect(screen.getByDisplayValue('0989358777')).toBeTruthy();
        expect(screen.getByText('Gửi mã xác minh')).toBeTruthy();

        // Bấm Gửi mã xác minh
        fireEvent.press(screen.getByText('Gửi mã xác minh'));

        // Kiểm tra bước 2: Nhập OTP
        await waitFor(() => {
          expect(screen.getByText('Nhập mã xác nhận')).toBeTruthy();
          expect(screen.getByText('Xác nhận mã')).toBeTruthy();
        });

        // Nhập mã OTP 6 số
        const otpInput = screen.getByPlaceholderText('• • • • • •');
        fireEvent.changeText(otpInput, '123456');

        // Bấm Xác nhận mã
        fireEvent.press(screen.getByText('Xác nhận mã'));

        // Kiểm tra bước 3: Verify password (Khớp Image 2)
        await waitFor(() => {
          expect(screen.getByText('Verify password')).toBeTruthy();
          expect(
            screen.getByText('For your security, please enter your current password')
          ).toBeTruthy();
          expect(screen.getByText('Verify')).toBeTruthy();
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. MÀN HÌNH VÍ FIXGO (wallet.jsx - Matching Image 3)
    // ─────────────────────────────────────────────────────────────────────────
    describe('4. FixGo Wallet Screen (wallet.jsx)', () => {
      it('4.1: Render số dư khả dụng, 3 nút Nạp/Rút/Quét QR, Phương thức và Giao dịch gần đây', async () => {
        const screen = render(
          <AuthProvider>
            <CustomerWalletScreen />
          </AuthProvider>
        );

        expect(screen.getByText('Ví của tôi')).toBeTruthy();
        expect(screen.getByText('Số dư khả dụng')).toBeTruthy();
        expect(screen.getByText('850.000 đ')).toBeTruthy();

        // 3 nút thao tác
        expect(screen.getByText('Nạp tiền')).toBeTruthy();
        expect(screen.getByText('Rút tiền')).toBeTruthy();
        expect(screen.getByText('Quét QR')).toBeTruthy();

        // Phương thức thanh toán
        expect(screen.getByText('Phương thức thanh toán')).toBeTruthy();
        expect(screen.getByText('MB Bank •••• 6868')).toBeTruthy();
        expect(screen.getByText('Ví MoMo')).toBeTruthy();
        expect(screen.getByText('Thêm phương thức mới')).toBeTruthy();

        // Giao dịch gần đây (Khớp Image 3)
        expect(screen.getByText('Giao dịch gần đây')).toBeTruthy();
        expect(screen.getByText('Sửa rò rỉ nước')).toBeTruthy();
        expect(screen.getByText('Nạp tiền MB Bank')).toBeTruthy();
        expect(screen.getByText('Vệ sinh máy lạnh')).toBeTruthy();
      });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. MÀN HÌNH MÃ GIẢM GIÁ (vouchers.jsx - FixGo Services)
    // ─────────────────────────────────────────────────────────────────────────
    describe('5. Vouchers / My Offers Screen (vouchers.jsx)', () => {
      it('5.1: Render ô nhập mã và các tab dịch vụ FixGo (Sửa điện, Sửa nước, Điện lạnh, Sửa khóa)', async () => {
        const screen = render(
          <AuthProvider>
            <VouchersScreen />
          </AuthProvider>
        );

        expect(screen.getByText('Ưu đãi của tôi')).toBeTruthy();
        expect(screen.getByPlaceholderText('Nhập mã khuyến mãi')).toBeTruthy();
        expect(screen.getByText('Áp dụng')).toBeTruthy();

        // Các tabs dịch vụ FixGo
        expect(screen.getByText('Tất cả (5)')).toBeTruthy();
        expect(screen.getByText('Sửa điện')).toBeTruthy();
        expect(screen.getByText('Sửa nước')).toBeTruthy();
        expect(screen.getByText('Điện lạnh')).toBeTruthy();
        expect(screen.getByText('Sửa khóa')).toBeTruthy();
        expect(screen.getByText('Lịch sử dùng')).toBeTruthy();

        // Thẻ Voucher
        expect(screen.getByText('Giảm 30% đơn đầu')).toBeTruthy();
        expect(screen.getByText('MỚI')).toBeTruthy();
        expect(screen.getByText('HSD: 30/10/2026')).toBeTruthy();
      });

      it('5.2: Lọc theo tab danh mục Sửa điện hiển thị đúng voucher', async () => {
        const screen = render(
          <AuthProvider>
            <VouchersScreen />
          </AuthProvider>
        );

        fireEvent.press(screen.getByText('Sửa điện'));

        await waitFor(() => {
          expect(screen.getByText('Sửa chữa điện gia dụng')).toBeTruthy();
          expect(screen.queryByText('Giảm 30% đơn đầu')).toBeNull();
        });
      });
    });
  });
});

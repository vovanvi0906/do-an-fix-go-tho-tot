import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RegisterWorkerScreen, { validateVietnameseCCCD } from '../app/(auth)/register-worker';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

describe('Register Worker Screen (Legacy Compatibility)', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  describe('validateVietnameseCCCD', () => {
    it('validates 12-digit numeric CCCD', () => {
      expect(validateVietnameseCCCD('012345678901')).toBe(true);
      expect(validateVietnameseCCCD('12345')).toBe(false);
      expect(validateVietnameseCCCD('01234567890a')).toBe(false);
      expect(validateVietnameseCCCD(null)).toBe(false);
    });
  });

  it('renders notice informing that worker registration belongs to worker app', () => {
    const { getByText } = render(<RegisterWorkerScreen />);
    expect(getByText('Đăng ký Thợ đối tác FixGo')).toBeTruthy();
    expect(getByText(/Đăng ký hồ sơ Thợ đối tác chỉ được thực hiện trên ứng dụng FixGo Thợ/)).toBeTruthy();
  });

  it('redirects to customer registration when pressing Đăng ký tài khoản Khách hàng', () => {
    const { getByText } = render(<RegisterWorkerScreen />);
    fireEvent.press(getByText('Đăng ký tài khoản Khách hàng'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/register-customer');
  });

  it('redirects to customer login when pressing Đăng nhập ứng dụng', () => {
    const { getByText } = render(<RegisterWorkerScreen />);
    fireEvent.press(getByText('Đăng nhập ứng dụng'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });
});

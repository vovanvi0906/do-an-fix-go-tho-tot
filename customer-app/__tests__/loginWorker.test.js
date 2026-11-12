import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WorkerLoginScreen from '../app/(auth)/login-worker';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

describe('Worker Login Screen (Legacy Compatibility)', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('renders notice informing that worker features are on the worker app', () => {
    const { getByText } = render(<WorkerLoginScreen />);
    expect(getByText('Kênh Đối tác FixGo Thợ')).toBeTruthy();
    expect(getByText(/Ứng dụng này chỉ phục vụ người dùng Khách hàng/)).toBeTruthy();
  });

  it('redirects to customer login when pressing Đăng nhập Khách hàng', () => {
    const { getByText } = render(<WorkerLoginScreen />);
    fireEvent.press(getByText('Đăng nhập Khách hàng'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('redirects to customer registration when pressing Tạo tài khoản Khách hàng mới', () => {
    const { getByText } = render(<WorkerLoginScreen />);
    fireEvent.press(getByText('Tạo tài khoản Khách hàng mới'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/register-customer');
  });
});

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '../src/features/auth/context/AuthContext';
import { authService } from '../src/features/auth/services/authService';
import LoginScreen from '../app/index';

const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));
jest.mock('../src/hooks', () => ({
  useGoogleAuth: () => ({ signInWithGoogle: jest.fn(), isGoogleLoading: false }),
}));
jest.mock('@expo-google-fonts/inter', () => ({ useFonts: () => [true] }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons', FontAwesome: 'FontAwesome' }));
jest.mock('../src/services/storage/tokenStorage', () => ({ tokenStorage: {} }));

beforeEach(() => {
  jest.restoreAllMocks();
  mockReplace.mockClear();
  mockPush.mockClear();
  jest.spyOn(authService, 'getCurrentSession').mockResolvedValue({ token: null, user: null });
});

async function screen() {
  const result = render(<AuthProvider><LoginScreen /></AuthProvider>);
  await waitFor(() => expect(result.getByPlaceholderText('Số điện thoại hoặc email')).toBeTruthy());
  return result;
}

it('validates empty credentials without calling the login service', async () => {
  const login = jest.spyOn(authService, 'login');
  const view = await screen();
  fireEvent.press(view.getByText('Đăng nhập'));
  expect(view.getByText('Vui lòng điền đầy đủ tài khoản và mật khẩu!')).toBeTruthy();
  expect(login).not.toHaveBeenCalled();
});

it('routes CUSTOMER to customer tabs on successful login', async () => {
  const login = jest.spyOn(authService, 'login').mockResolvedValue({
    accessToken: 'test-token',
    user: { id: '1', role: 'CUSTOMER' },
  });
  const view = await screen();
  fireEvent.changeText(view.getByPlaceholderText('Số điện thoại hoặc email'), ' customer@example.com ');
  fireEvent.changeText(view.getByPlaceholderText('Mật khẩu'), 'Password123');
  fireEvent.press(view.getByText('Đăng nhập'));
  await waitFor(() => expect(login).toHaveBeenCalledWith('customer@example.com', 'Password123'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(user)/(tabs)'));
});

it('blocks WORKER login and does not route to customer or worker tabs', async () => {
  jest.spyOn(authService, 'login').mockRejectedValue(
    new Error('Tài khoản Đối tác/Quản trị viên không thể đăng nhập ứng dụng Khách hàng.')
  );
  const view = await screen();
  fireEvent.changeText(view.getByPlaceholderText('Số điện thoại hoặc email'), 'worker@example.com');
  fireEvent.changeText(view.getByPlaceholderText('Mật khẩu'), 'Password123');
  fireEvent.press(view.getByText('Đăng nhập'));
  await waitFor(() => expect(view.getByText('Tài khoản Đối tác/Quản trị viên không thể đăng nhập ứng dụng Khách hàng.')).toBeTruthy());
  expect(mockReplace).not.toHaveBeenCalled();
});

it('shows server errors without navigating', async () => {
  jest.spyOn(authService, 'login').mockRejectedValue(new Error('Tài khoản bị khóa'));
  const view = await screen();
  fireEvent.changeText(view.getByPlaceholderText('Số điện thoại hoặc email'), 'user@example.com');
  fireEvent.changeText(view.getByPlaceholderText('Mật khẩu'), 'Password123');
  fireEvent.press(view.getByText('Đăng nhập'));
  await waitFor(() => expect(view.getByText('Tài khoản bị khóa')).toBeTruthy());
  expect(mockReplace).not.toHaveBeenCalled();
});

it('navigates directly to customer registration from footer link', async () => {
  const view = await screen();
  fireEvent.press(view.getByText('Đăng ký ngay'));
  expect(mockPush).toHaveBeenCalledWith('/(auth)/register-customer');
});

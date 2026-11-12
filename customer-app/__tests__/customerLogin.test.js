import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '../src/features/auth/context/AuthContext';
import { authService } from '../src/features/auth/services/authService';
import LoginScreen from '../app/index';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace, push: jest.fn() }) }));
jest.mock('../src/hooks', () => ({ useGoogleAuth: () => ({ signInWithGoogle: jest.fn(), isGoogleLoading: false }) }));
jest.mock('@expo-google-fonts/inter', () => ({ useFonts: () => [true] }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons', FontAwesome: 'FontAwesome' }));
jest.mock('../src/services/storage/tokenStorage', () => ({ tokenStorage: {} }));
beforeEach(() => {
  jest.restoreAllMocks();
  mockReplace.mockClear();
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
it.each(['CUSTOMER', 'WORKER'])('passes credentials through AuthContext and routes %s', async (role) => {
  const login = jest.spyOn(authService, 'login').mockResolvedValue({ data: { accessToken: 'test-token', user: { id: '1', role } } });
  const view = await screen();
  fireEvent.changeText(view.getByPlaceholderText('Số điện thoại hoặc email'), ' user@example.com ');
  fireEvent.changeText(view.getByPlaceholderText('Mật khẩu'), 'Password123');
  fireEvent.press(view.getByText('Đăng nhập'));
  await waitFor(() => expect(login).toHaveBeenCalledWith('user@example.com', 'Password123'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(role === 'WORKER' ? '/(worker)/(tabs)' : '/(user)/(tabs)'));
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

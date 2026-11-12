jest.mock('../src/services/api/apiClient', () => ({ apiClient: { post: jest.fn() } }));
jest.mock('../src/services/storage/tokenStorage', () => ({ tokenStorage: {
  saveToken: jest.fn(), saveRefreshToken: jest.fn(), saveUser: jest.fn(),
  getToken: jest.fn(), getUser: jest.fn(), clearAll: jest.fn(),
} }));

import { authService } from '../src/features/auth/services/authService';
import { apiClient } from '../src/services/api/apiClient';
import { tokenStorage } from '../src/services/storage/tokenStorage';

beforeEach(() => jest.resetAllMocks());

it('persists the complete CUSTOMER login session', async () => {
  const response = { accessToken: 'access', refreshToken: 'refresh', user: { id: 'user-1', role: 'CUSTOMER' } };
  apiClient.post.mockResolvedValueOnce(response);
  await expect(authService.login(' customer@example.com ', 'password')).resolves.toEqual(response);
  expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { emailOrPhone: 'customer@example.com', email: 'customer@example.com', password: 'password' });
  expect(tokenStorage.saveToken).toHaveBeenCalledWith('access');
  expect(tokenStorage.saveRefreshToken).toHaveBeenCalledWith('refresh');
  expect(tokenStorage.saveUser).toHaveBeenCalledWith(response.user);
});

it('rejects WORKER login and does not persist worker session into customer storage', async () => {
  const response = { accessToken: 'worker-token', refreshToken: 'worker-refresh', user: { id: 'worker-1', role: 'WORKER' } };
  apiClient.post.mockResolvedValueOnce(response);
  await expect(authService.login('worker@example.com', 'password')).rejects.toThrow('Tài khoản Đối tác/Quản trị viên không thể đăng nhập ứng dụng Khách hàng.');
  expect(tokenStorage.clearAll).toHaveBeenCalled();
  expect(tokenStorage.saveToken).not.toHaveBeenCalled();
  expect(tokenStorage.saveUser).not.toHaveBeenCalled();
});

it('rejects worker registration on customer app', async () => {
  await expect(authService.registerWorker({ email: 'worker@example.com' })).rejects.toThrow('Đăng ký tài khoản Thợ không được hỗ trợ');
});

it('supports a nested session response for customer', async () => {
  apiClient.post.mockResolvedValueOnce({ data: { accessToken: 'access', refreshToken: 'refresh', user: { id: '1', role: 'CUSTOMER' } } });
  await authService.login('user', 'password');
  expect(tokenStorage.saveRefreshToken).toHaveBeenCalledWith('refresh');
  expect(tokenStorage.saveUser).toHaveBeenCalledWith({ id: '1', role: 'CUSTOMER' });
});

it.each([401, 403, 409])('preserves a failed login (%s) without writing a session', async (status) => {
  const error = Object.assign(new Error('Login failed'), { status, requestId: 'request-1' });
  apiClient.post.mockRejectedValueOnce(error);
  await expect(authService.login('user', 'password')).rejects.toBe(error);
  expect(tokenStorage.saveToken).not.toHaveBeenCalled();
  expect(tokenStorage.saveRefreshToken).not.toHaveBeenCalled();
  expect(tokenStorage.saveUser).not.toHaveBeenCalled();
});

it('clears the entire session on logout', async () => {
  await authService.logout();
  expect(tokenStorage.clearAll).toHaveBeenCalledTimes(1);
});

it('restores the saved customer user and access token', async () => {
  tokenStorage.getToken.mockResolvedValueOnce('saved-token');
  tokenStorage.getUser.mockResolvedValueOnce({ id: '1', role: 'CUSTOMER' });
  await expect(authService.getCurrentSession()).resolves.toEqual({ token: 'saved-token', user: { id: '1', role: 'CUSTOMER' } });
});

it('purges stored session if restored user has WORKER role', async () => {
  tokenStorage.getToken.mockResolvedValueOnce('saved-token');
  tokenStorage.getUser.mockResolvedValueOnce({ id: '1', role: 'WORKER' });
  await expect(authService.getCurrentSession()).resolves.toEqual({ token: null, user: null });
  expect(tokenStorage.clearAll).toHaveBeenCalled();
});

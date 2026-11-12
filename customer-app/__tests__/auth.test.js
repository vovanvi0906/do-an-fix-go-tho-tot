jest.mock('../src/services/api/apiClient', () => ({ apiClient: { post: jest.fn() } }));
jest.mock('../src/services/storage/tokenStorage', () => ({ tokenStorage: {
  saveToken: jest.fn(), saveRefreshToken: jest.fn(), saveUser: jest.fn(),
  getToken: jest.fn(), getUser: jest.fn(), clearAll: jest.fn(),
} }));
import { authService } from '../src/features/auth/services/authService';
import { apiClient } from '../src/services/api/apiClient';
import { tokenStorage } from '../src/services/storage/tokenStorage';
beforeEach(() => jest.resetAllMocks());
it.each(['CUSTOMER', 'WORKER'])('persists the complete %s login session', async (role) => {
  const response = { accessToken: 'access', refreshToken: 'refresh', user: { id: 'user-1', role } };
  apiClient.post.mockResolvedValueOnce(response);
  await expect(authService.login(' user@example.com ', 'password')).resolves.toEqual(response);
  expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { emailOrPhone: 'user@example.com', email: 'user@example.com', password: 'password' });
  expect(tokenStorage.saveToken).toHaveBeenCalledWith('access');
  expect(tokenStorage.saveRefreshToken).toHaveBeenCalledWith('refresh');
  expect(tokenStorage.saveUser).toHaveBeenCalledWith(response.user);
});
it('supports a nested session response', async () => {
  apiClient.post.mockResolvedValueOnce({ data: { accessToken: 'access', refreshToken: 'refresh', user: { id: '1' } } });
  await authService.login('user', 'password');
  expect(tokenStorage.saveRefreshToken).toHaveBeenCalledWith('refresh');
  expect(tokenStorage.saveUser).toHaveBeenCalledWith({ id: '1' });
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
it('restores the saved user and access token', async () => {
  tokenStorage.getToken.mockResolvedValueOnce('saved-token');
  tokenStorage.getUser.mockResolvedValueOnce({ id: '1', role: 'WORKER' });
  await expect(authService.getCurrentSession()).resolves.toEqual({ token: 'saved-token', user: { id: '1', role: 'WORKER' } });
});

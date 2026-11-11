import { authService } from '../src/features/auth/services/authService';
import { apiClient } from '../src/services/api/apiClient';
import { tokenStorage } from '../src/services/storage/tokenStorage';
jest.mock('../src/services/api/apiClient', () => ({ apiClient: { post: jest.fn() } }));
jest.mock('../src/services/storage/tokenStorage', () => ({
  tokenStorage: { saveToken: jest.fn(), saveRefreshToken: jest.fn(), saveUser: jest.fn() },
}));
beforeEach(() => jest.clearAllMocks());
it.each(['CUSTOMER', 'ADMIN', undefined])('rejects role %s before saving session', async (role) => {
  apiClient.post.mockResolvedValue({ accessToken: 'token', user: { role } });
  await expect(authService.login('account@example.com', 'password')).rejects.toThrow('chỉ dành cho thợ');
  expect(tokenStorage.saveToken).not.toHaveBeenCalled();
  expect(tokenStorage.saveUser).not.toHaveBeenCalled();
});
it.each([false, true])('saves worker session with nested response: %s', async (nested) => {
  const session = { accessToken: 'worker-token', user: { role: 'WORKER' } };
  apiClient.post.mockResolvedValue(nested ? { data: session } : session);
  await authService.login('worker@example.com', 'password');
  expect(tokenStorage.saveToken).toHaveBeenCalledWith('worker-token');
  expect(tokenStorage.saveUser).toHaveBeenCalledWith(session.user);
});

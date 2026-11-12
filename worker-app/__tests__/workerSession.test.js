import { authService } from '../src/features/auth/services/authService';
import { apiClient } from '../src/services/api/apiClient';
import { tokenStorage } from '../src/services/storage/tokenStorage';
jest.mock('../src/services/api/apiClient', () => ({ apiClient: { post: jest.fn(), get: jest.fn() } }));
jest.mock('../src/services/storage/tokenStorage', () => ({
  tokenStorage: { clearAll: jest.fn(), getToken: jest.fn(), saveToken: jest.fn(), saveRefreshToken: jest.fn(), saveUser: jest.fn() },
}));
beforeEach(() => jest.clearAllMocks());
it.each(['CUSTOMER', 'ADMIN', undefined])('rejects role %s before saving session', async (role) => {
  apiClient.post.mockResolvedValue({ accessToken: 'token', user: { role } });
  await expect(authService.login('account@example.com', 'password')).rejects.toThrow('chỉ dành cho thợ');
  expect(tokenStorage.saveToken).not.toHaveBeenCalled();
  expect(tokenStorage.saveUser).not.toHaveBeenCalled();
});
it.each([false, true])('saves worker session with nested response: %s', async (nested) => {
  const session = { accessToken: 'worker-token', user: { id: 'worker-1', role: 'WORKER' } };
  apiClient.post.mockResolvedValue(nested ? { data: session } : session);
  await authService.login('worker@example.com', 'password');
  expect(tokenStorage.saveToken).toHaveBeenCalledWith('worker-token');
  expect(tokenStorage.saveUser).toHaveBeenCalledWith(session.user);
});

it('late login cannot overwrite a newer login', async () => {
  let finish;
  apiClient.post.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const old = authService.login('old', 'password');
  apiClient.post.mockResolvedValueOnce({ accessToken: 'new', user: { id: 'new', role: 'WORKER' } });
  await authService.login('new', 'password');
  finish({ accessToken: 'old', user: { id: 'old', role: 'WORKER' } });
  await expect(old).rejects.toThrow('đã thay đổi');
  expect(tokenStorage.saveToken).toHaveBeenCalledTimes(1);
  expect(tokenStorage.saveToken).toHaveBeenCalledWith('new');
});
it('logout invalidates an in-flight login', async () => {
  let finish;
  apiClient.post.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const pending = authService.login('old', 'password');
  await authService.logout();
  finish({ accessToken: 'old', user: { id: 'old', role: 'WORKER' } });
  await expect(pending).rejects.toThrow('đã thay đổi');
  expect(tokenStorage.saveToken).not.toHaveBeenCalled();
});
it('restore reads server role rather than the stored role', async () => {
  tokenStorage.getToken.mockResolvedValue('cached');
  apiClient.get.mockResolvedValue({ id: 'customer', role: 'CUSTOMER' });
  await expect(authService.getCurrentSession()).rejects.toThrow('không phải thợ');
});

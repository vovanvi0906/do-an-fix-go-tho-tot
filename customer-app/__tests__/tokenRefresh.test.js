import axios from 'axios';
import { handleTokenRefresh } from '../src/services/api/tokenRefreshHandler';
import { tokenStorage } from '../src/services/storage/tokenStorage';
jest.mock('../src/services/storage/tokenStorage', () => ({ tokenStorage: {
  getRefreshToken: jest.fn(async () => 'refresh'), saveToken: jest.fn(), saveRefreshToken: jest.fn(), clearAll: jest.fn(async () => {}),
} }));
afterEach(() => jest.restoreAllMocks());
it('refreshes once for simultaneous requests and marks both retries', async () => {
  let finish;
  const refresh = jest.spyOn(axios, 'post').mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  const client = jest.fn(async () => ({ ok: true }));
  const first = { headers: {} }; const second = { headers: {} };
  const pendingFirst = handleTokenRefresh(client, first, jest.fn());
  const pendingSecond = handleTokenRefresh(client, second, jest.fn());
  await Promise.resolve();
  expect(refresh).toHaveBeenCalledTimes(1);
  finish({ data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });
  await Promise.all([pendingFirst, pendingSecond]);
  expect(first._retry).toBe(true);
  expect(second._retry).toBe(true);
  expect(second.headers.Authorization).toBe('Bearer new-access');
  expect(client).toHaveBeenCalledTimes(2);
});
it('retains refresh failure diagnostics and invalidates the session once', async () => {
  const cause = new Error('Refresh rejected');
  jest.spyOn(axios, 'post').mockRejectedValueOnce(cause);
  const unauthorized = jest.fn();
  await expect(handleTokenRefresh(jest.fn(), { headers: {} }, unauthorized)).rejects.toMatchObject({ status: 401, code: 'AUTH_REFRESH_FAILED', cause });
  expect(tokenStorage.clearAll).toHaveBeenCalled();
  expect(unauthorized).toHaveBeenCalledTimes(1);
});

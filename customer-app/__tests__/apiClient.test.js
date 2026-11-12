jest.mock('../src/services/storage/tokenStorage', () => ({ tokenStorage: { getToken: jest.fn(async () => 'secret-token'), clearAll: jest.fn(async () => {}) } }));
jest.mock('../src/utils/remoteLogger', () => ({ sendErrorToLog: jest.fn() }));
import { apiClient } from '../src/services/api/apiClient';
import { sendErrorToLog } from '../src/utils/remoteLogger';
it('preserves HTTP error diagnostics and correlates remote reports', async () => {
  const cause = Object.assign(new Error('Request failed'), {
    config: { url: '/orders/123/accept', method: 'post', metadata: { requestId: 'test-request' } },
    code: 'ERR_BAD_REQUEST', response: { status: 409, data: { message: 'Đơn đã được nhận' }, headers: { 'x-request-id': 'server-request' } },
  });
  const handler = apiClient.interceptors.response.handlers[0].rejected;
  await expect(handler(cause)).rejects.toMatchObject({ message: 'Đơn đã được nhận', status: 409, code: 'ERR_BAD_REQUEST', requestId: 'server-request', cause });
  expect(sendErrorToLog).toHaveBeenCalledWith(expect.any(Error), 'API_ERROR', 'error', { requestId: 'server-request' });
});
it('adds a request ID without logging credentials or body', async () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  try {
    const config = await apiClient.interceptors.request.handlers[0].fulfilled({ headers: {}, method: 'post', url: '/auth/login', data: { password: 'private-password' } });
    expect(config.headers['X-Request-ID']).toBeTruthy();
    expect(JSON.stringify(spy.mock.calls)).not.toContain('private-password');
    expect(JSON.stringify(spy.mock.calls)).not.toContain('secret-token');
  } finally { spy.mockRestore(); }
});

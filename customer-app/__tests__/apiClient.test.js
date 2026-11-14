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
    const config = await apiClient.interceptors.request.handlers[0].fulfilled({ headers: {}, method: 'post', url: '/auth/login', data: { password: 'private-password', code: 'private-otp', registrationProof: 'private-proof', idToken: 'private-id-token' } });
    expect(config.headers['X-Request-ID']).toBeTruthy();
    expect(JSON.stringify(spy.mock.calls)).not.toContain('private-password');
    ['secret-token', 'private-otp', 'private-proof', 'private-id-token'].forEach(secret => expect(JSON.stringify(spy.mock.calls)).not.toContain(secret));
  } finally { spy.mockRestore(); }
});

it('preserves backend registration proof error code', async () => {
  const cause = { code: 'ERR_BAD_REQUEST', config: { url: '/auth/register/customer' },
    response: { status: 400, data: { code: 'REGISTRATION_PROOF_INVALID', message: 'Verify OTP again' } } };
  await expect(apiClient.interceptors.response.handlers[0].rejected(cause)).rejects.toMatchObject({ code: 'REGISTRATION_PROOF_INVALID', status: 400 });
});

it('does not log request credentials when request setup fails', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  const error = { code: 'SETUP_ERROR', config: { data: { code: 'private-otp', registrationProof: 'private-proof' } } };
  try {
    await expect(apiClient.interceptors.request.handlers[0].rejected(error)).rejects.toBe(error);
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-otp');
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-proof');
  } finally { log.mockRestore(); }
});

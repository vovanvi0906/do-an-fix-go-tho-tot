import { createRegistrationFlow, socialSignup } from '../src/features/auth/services/registrationFlow';
import { authService } from '../src/features/auth/services/authService';
import { apiClient } from '../src/services/api/apiClient';
import { tokenStorage } from '../src/services/storage/tokenStorage';
jest.mock('../src/services/api/apiClient', () => ({ apiClient: { post: jest.fn() } }));
jest.mock('../src/services/storage/tokenStorage', () => ({ tokenStorage: {
  saveToken: jest.fn(), saveRefreshToken: jest.fn(), saveUser: jest.fn(), clearAll: jest.fn(),
} }));
const verified = { verified: true, registrationProof: 'a'.repeat(64), registrationProofExpiresIn: 300 };
beforeEach(() => { jest.clearAllMocks(); socialSignup.clear(); });
afterEach(() => jest.restoreAllMocks());
it('accepts verified OTP and rejects missing, expired and different-phone proof', () => {
  const flow = createRegistrationFlow();
  expect(() => flow.payload('0901234567')).toThrow();
  flow.verify('0901234567', verified);
  expect(flow.payload('0901234567')).toEqual({ phone: '0901234567', registrationProof: verified.registrationProof });
  expect(() => flow.payload('0901234568')).toThrow();
  const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
  flow.verify('0901234567', verified);
  now.mockReturnValue(301000);
  expect(() => flow.payload('0901234567')).toThrow();
});
it.each([{ verified: false }, { verified: true }, { ...verified, registrationProofExpiresIn: 0 }])('failed OTP clears previous proof (%j)', response => {
  const flow = createRegistrationFlow();
  flow.verify('0901234567', verified);
  expect(() => flow.verify('0901234567', response)).toThrow();
  expect(() => flow.payload('0901234567')).toThrow();
});
it('blocks concurrent submits and unlocks after failure', async () => {
  const flow = createRegistrationFlow();
  let finish;
  const action = jest.fn(() => new Promise(resolve => { finish = resolve; }));
  const first = flow.run(action);
  await flow.run(action);
  expect(action).toHaveBeenCalledTimes(1);
  finish(); await first;
  await expect(flow.run(() => Promise.reject(new Error('failure')))).rejects.toThrow();
  await expect(flow.run(() => 42)).resolves.toBe(42);
});
it('keeps proof in flow memory and clears it on disposal', () => {
  const flow = createRegistrationFlow(); flow.verify('0901234567', verified);
  expect(JSON.stringify(flow)).not.toContain(verified.registrationProof);
  flow.clear(); expect(() => flow.payload('0901234567')).toThrow();
  socialSignup.set('google', 'secret-id-token');
  expect(socialSignup.get().provider).toBe('google');
  socialSignup.clear(); expect(socialSignup.get()).toBeUndefined();
});
it.each(['googleLogin', 'firebaseGoogleLogin'])('%s preserves existing login and sends phone/proof on first signup', async method => {
  const response = { accessToken: 'access', user: { id: 'customer', role: 'CUSTOMER' } };
  apiClient.post.mockResolvedValue(response);
  await authService[method]('identity-token');
  expect(apiClient.post).toHaveBeenLastCalledWith(expect.any(String), { idToken: 'identity-token' });
  const flow = createRegistrationFlow(); flow.verify('0901234567', verified);
  await authService[method]('identity-token', flow.payload('0901234567'));
  expect(apiClient.post).toHaveBeenLastCalledWith(expect.any(String), { idToken: 'identity-token', phone: '0901234567', registrationProof: verified.registrationProof });
  expect(tokenStorage.saveUser).toHaveBeenCalledWith(response.user);
  expect(tokenStorage.saveUser).not.toHaveBeenCalledWith(expect.objectContaining({ registrationProof: expect.anything() }));
});
it('rejects registration without proof before making a request', async () => {
  await expect(authService.registerCustomer({ phone: '0901234567' })).rejects.toThrow();
  expect(apiClient.post).not.toHaveBeenCalled();
});
it('OTP service never logs credentials on success or failure', async () => {
  const { otpService } = jest.requireActual('../src/features/auth/services/otpService');
  const logs = ['log', 'warn', 'error'].map(method => jest.spyOn(console, method).mockImplementation(() => {}));
  apiClient.post.mockResolvedValueOnce(verified);
  await expect(otpService.verifyPhoneOtp('0901234567', '123456')).resolves.toEqual(verified);
  apiClient.post.mockRejectedValueOnce(new Error('invalid OTP'));
  await expect(otpService.verifyPhoneOtp('0901234567', '123456')).rejects.toThrow();
  logs.forEach(log => expect(log).not.toHaveBeenCalled());
});

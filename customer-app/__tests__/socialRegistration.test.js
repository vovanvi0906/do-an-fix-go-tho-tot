import React from 'react';
import { render, renderHook, act, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useGoogleAuth } from '../src/hooks/useGoogleAuth';
import RegisterCustomerScreen from '../app/(auth)/register-customer';
import { socialSignup } from '../src/features/auth/services/registrationFlow';
import { otpService } from '../src/features/auth/services/otpService';
import { GoogleAuthProvider, signInWithPopup } from '../src/services/firebaseConfig';
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockLogin = jest.fn();
const mockGoogleLogin = jest.fn();
let mockParams = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => mockParams, Link: ({ children }) => children,
}));
jest.mock('../src/features/auth', () => ({ useAuth: () => ({
  firebaseGoogleLogin: mockLogin, googleLogin: mockGoogleLogin,
}) }));
jest.mock('@expo-google-fonts/inter', () => ({ useFonts: () => [true] }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons', FontAwesome: 'FontAwesome' }));
jest.mock('../src/services/api/apiClient', () => ({ apiClient: { defaults: { headers: { common: {} } } } }));
jest.mock('../src/services/storage/tokenStorage', () => ({ tokenStorage: {
  saveToken: jest.fn(), saveUser: jest.fn(), clearAll: jest.fn(),
} }));
const proofError = Object.assign(new Error('Verify OTP again'), { status: 400, code: 'REGISTRATION_PROOF_INVALID' });
beforeEach(() => {
  jest.clearAllMocks(); socialSignup.clear(); mockParams = {};
  jest.replaceProperty(Platform, 'OS', 'web');
  GoogleAuthProvider.mockImplementation(() => ({ setCustomParameters: jest.fn() }));
  signInWithPopup.mockResolvedValue({ user: { getIdToken: async () => 'private-id-token' } });
});
afterEach(() => jest.restoreAllMocks());
it('existing Firebase login goes directly to customer tabs', async () => {
  mockLogin.mockResolvedValueOnce({ user: { role: 'CUSTOMER', phone: '0901234567' } });
  const hook = renderHook(() => useGoogleAuth());
  await act(async () => hook.result.current.signInWithGoogle());
  expect(mockLogin).toHaveBeenCalledWith('private-id-token');
  expect(mockReplace).toHaveBeenCalledWith('/(user)/(tabs)');
  expect(mockPush).not.toHaveBeenCalled();
});
it.each(['firebase', 'google'])('first %s signup verifies phone before retrying with proof', async provider => {
  if (provider === 'firebase') {
    mockLogin.mockRejectedValueOnce(proofError);
    const hook = renderHook(() => useGoogleAuth());
    await act(async () => hook.result.current.signInWithGoogle());
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/(auth)/register-customer', params: { isSocialSignup: 'true' } });
    expect(JSON.stringify(mockPush.mock.calls)).not.toContain('private-id-token');
    hook.unmount();
  } else socialSignup.set('google', 'private-id-token');
  mockParams = { isSocialSignup: 'true' };
  const login = provider === 'firebase' ? mockLogin : mockGoogleLogin;
  login.mockResolvedValueOnce({ user: { role: 'CUSTOMER', phone: '0901234567' } });
  const screen = render(<RegisterCustomerScreen />);
  fireEvent.changeText(screen.getByPlaceholderText('Số điện thoại'), '0901234567');
  fireEvent.press(screen.getByText('Tiếp tục'));
  await waitFor(() => expect(screen.getByText('Nhập mã gồm 6 chữ số được gửi đến')).toBeTruthy());
  const { TextInput } = require('react-native');
  const inputs = screen.UNSAFE_getAllByType(TextInput);
  inputs.forEach(input => fireEvent.changeText(input, '1'));
  fireEvent.press(screen.getByText('Tiếp'));
  await waitFor(() => expect(login).toHaveBeenLastCalledWith('private-id-token', {
    phone: '0901234567', registrationProof: expect.any(String),
  }));
  expect(otpService.verifyPhoneOtp).toHaveBeenCalledWith('0901234567', '111111', 'register');
  expect(screen.queryByPlaceholderText('Nhập mật khẩu')).toBeNull();
  expect(socialSignup.get()).toBeUndefined();
});

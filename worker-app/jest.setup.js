jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn(), signIn: jest.fn(), signOut: jest.fn(), getTokens: jest.fn() },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED', IN_PROGRESS: 'IN_PROGRESS', PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE' },
}));
jest.mock('react-native-webview', () => ({ WebView: 'WebView' }));
jest.mock('./src/services/firebaseConfig', () => ({
  auth: {}, GoogleAuthProvider: Object.assign(jest.fn(), { credential: jest.fn() }),
  signInWithCredential: jest.fn(), signInWithPopup: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

jest.mock('./src/features/auth/services/otpService', () => ({ otpService: {
  sendPhoneOtp: jest.fn(async () => ({ message: 'sent' })),
  verifyPhoneOtp: jest.fn(async () => ({ verified: true })),
  sendEmailOtp: jest.fn(async () => ({ message: 'sent' })),
  verifyEmailOtp: jest.fn(async () => ({ verified: true })),
} }));

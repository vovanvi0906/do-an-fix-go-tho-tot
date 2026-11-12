import { socialSignup, isProofInvalid } from '../features/auth/services/registrationFlow';
import { useState, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '../features/auth';
import { apiClient } from '../services/api/apiClient';
import { tokenStorage } from '../services/storage/tokenStorage';
import {
  auth as firebaseAuth, GoogleAuthProvider,
  signInWithCredential, signInWithPopup,
} from '../services/firebaseConfig';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '579509931869-u2p0e3d5k6l76kmu2ot8rqbgojbq24g0.apps.googleusercontent.com';

if (Platform.OS !== 'web') {
  GoogleSignin.configure({ webClientId, offlineAccess: true, forceCodeForRefreshToken: true });
}

export function useGoogleAuth() {
  const router = useRouter();
  const busy = useRef(false);
  const { firebaseGoogleLogin, googleLogin } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleFinishLogin = async (res) => {
    const loggedUser = res?.data?.user || res?.user;
    const jwtToken = res?.data?.accessToken || res?.accessToken;
    const userRole = (loggedUser?.role || '').toUpperCase();

    if (userRole && userRole !== 'CUSTOMER') {
      await tokenStorage.clearAll();
      Alert.alert('Không thể truy cập', 'Tài khoản Đối tác/Quản trị viên không được phép đăng nhập ứng dụng Khách hàng.');
      return;
    }
    if (jwtToken) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${jwtToken}`;
      await tokenStorage.saveToken(jwtToken);
    }
    if (loggedUser) await tokenStorage.saveUser(loggedUser);

    const requirePhone = !!(res?.data?.requirePhoneUpdate ?? res?.requirePhoneUpdate ?? !loggedUser?.phone);
    if (requirePhone) {
      router.push({ pathname: '/(auth)/register-customer', params: { isSocialOnboarding: 'true' } });
      return;
    }
    router.replace('/(user)/(tabs)');
  };

  const handleSocialAttempt = async (loginFn, idToken, provider) => {
    try {
      const res = await loginFn(idToken);
      await handleFinishLogin(res);
    } catch (err) {
      const isNew = err?.status === 400 && isProofInvalid(err);
      if (isNew) {
        socialSignup.set(provider, idToken);
        router.push({ pathname: '/(auth)/register-customer', params: { isSocialSignup: 'true' } });
        return;
      }
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    if (busy.current) return;
    busy.current = true;
    socialSignup.clear();
    try {
      setIsGoogleLoading(true);
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const cred = await signInWithPopup(firebaseAuth, provider);
        await handleSocialAttempt(firebaseGoogleLogin, await cred.user.getIdToken(), 'firebase');
        return;
      }
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      try { await GoogleSignin.signOut(); } catch {}
      const signInRes = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens().catch(() => null);
      const idToken = signInRes?.data?.idToken || signInRes?.idToken || tokens?.idToken;
      if (!idToken) throw new Error('Không nhận được mã idToken từ Google Play.');

      let firebaseToken;
      try {
        const cred = GoogleAuthProvider.credential(idToken);
        const userCred = await signInWithCredential(firebaseAuth, cred);
        firebaseToken = await userCred.user.getIdToken();
      } catch {
        // Fall back only when the Firebase credential exchange fails.
      }
      await handleSocialAttempt(firebaseToken ? firebaseGoogleLogin : googleLogin,
        firebaseToken || idToken, firebaseToken ? 'firebase' : 'google');
    } catch (err) {
      if (err.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Đăng nhập thất bại', err.message || 'Lỗi Google Sign-In');
      }
    } finally {
      busy.current = false;
      setIsGoogleLoading(false);
    }
  };

  return { signInWithGoogle, isGoogleLoading };
}

import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '../features/auth';
import { apiClient } from '../services/api/apiClient';
import { tokenStorage } from '../services/storage/tokenStorage';
import {
  auth as firebaseAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from '../services/firebaseConfig';

const webClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '579509931869-u2p0e3d5k6l76kmu2ot8rqbgojbq24g0.apps.googleusercontent.com';

if (Platform.OS !== 'web') {
  GoogleSignin.configure({ webClientId, offlineAccess: true, forceCodeForRefreshToken: true });
}

export function useGoogleAuth() {
  const router = useRouter();
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

  const signInWithGoogle = async () => {
    try {
      setIsGoogleLoading(true);
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const userCredential = await signInWithPopup(firebaseAuth, provider);
        const res = await firebaseGoogleLogin(await userCredential.user.getIdToken());
        await handleFinishLogin(res);
        return;
      }

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      try { await GoogleSignin.signOut(); } catch {}
      const signInResponse = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens().catch(() => null);
      const idToken = signInResponse?.data?.idToken || signInResponse?.idToken || tokens?.idToken;

      if (!idToken) throw new Error('Không nhận được mã idToken từ Google Play.');

      let res;
      try {
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(firebaseAuth, credential);
        res = await firebaseGoogleLogin(await userCredential.user.getIdToken());
      } catch {
        res = await googleLogin(idToken);
      }
      await handleFinishLogin(res);
    } catch (err) {
      if (err.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Đăng nhập thất bại', err.message || 'Lỗi Google Sign-In');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return { signInWithGoogle, isGoogleLoading };
}

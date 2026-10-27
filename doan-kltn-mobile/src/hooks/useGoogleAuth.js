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
  GoogleSignin.configure({
    webClientId,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
}

export function useGoogleAuth(targetRole = 'CUSTOMER') {
  const router = useRouter();
  const { firebaseGoogleLogin, googleLogin } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleFinishLogin = async (res) => {
    const loggedUser = res?.data?.user || res?.user;
    const jwtToken = res?.data?.accessToken || res?.accessToken || res?.data?.token || res?.token;
    const requirePhone = !!(res?.data?.requirePhoneUpdate ?? res?.requirePhoneUpdate ?? !loggedUser?.phone);
    const userRole = (loggedUser?.role || targetRole).toUpperCase();

    if (jwtToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      await tokenStorage.saveToken(jwtToken);
    }
    if (loggedUser) await tokenStorage.saveUser(loggedUser);

    if (requirePhone) {
      router.push({
        pathname: userRole === 'WORKER' ? '/(auth)/register-worker' : '/(auth)/register-customer',
        params: { isSocialOnboarding: 'true', role: userRole },
      });
      return;
    }
    router.replace(userRole === 'WORKER' ? '/(worker)/(tabs)' : '/(user)/(tabs)');
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
      const signInResponse = await GoogleSignin.signIn();
      let idToken = signInResponse?.data?.idToken || signInResponse?.idToken;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = tokens?.idToken;
      }

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
      setIsGoogleLoading(false);
      if (err.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Đăng nhập thất bại', err.message || 'Lỗi Google Sign-In');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return { signInWithGoogle, isGoogleLoading };
}

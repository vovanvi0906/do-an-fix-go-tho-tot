import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../features/auth';
import { apiClient } from '../services/api/apiClient';
import { tokenStorage } from '../services/storage/tokenStorage';
import {
  auth as firebaseAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from '../services/firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth(targetRole = 'CUSTOMER') {
  const router = useRouter();
  const { firebaseGoogleLogin, googleLogin } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '255047379055-cu8ifeqgfak7nj3sq8bcve9hqh9v85m4.apps.googleusercontent.com',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '255047379055-cu8ifeqgfak7nj3sq8bcve9hqh9v85m4.apps.googleusercontent.com',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '255047379055-fnfeg3subj9ej2vda53ho0fluo9f8rib.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
  });

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

  const processGoogleIdToken = async (googleIdToken) => {
    try {
      setIsGoogleLoading(true);
      let res;
      try {
        const credential = GoogleAuthProvider.credential(googleIdToken);
        const userCredential = await signInWithCredential(firebaseAuth, credential);
        res = await firebaseGoogleLogin(await userCredential.user.getIdToken());
      } catch {
        res = await googleLogin(googleIdToken);
      }
      await handleFinishLogin(res);
    } catch (err) {
      Alert.alert('Đăng nhập Google thất bại', err.message || 'Lỗi xác thực');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      const googleIdToken = response.params?.id_token || response.params?.authentication?.idToken;
      if (googleIdToken) processGoogleIdToken(googleIdToken);
      else setIsGoogleLoading(false);
    } else if (['cancel', 'dismiss', 'error'].includes(response?.type)) {
      setIsGoogleLoading(false);
    }
  }, [response]);

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
      await promptAsync();
    } catch (err) {
      setIsGoogleLoading(false);
      Alert.alert('Đăng nhập Google thất bại', err.message);
    }
  };

  return { signInWithGoogle, isGoogleLoading };
}

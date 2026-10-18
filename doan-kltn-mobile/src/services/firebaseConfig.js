import 'react-native-get-random-values';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cấu hình Firebase App từ biến môi trường Expo và google-services.json
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBAm_qPVoIMUbrHg2bNM3IbRvmYfsErZ9w',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'fixgo-a0c01.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'fixgo-a0c01',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'fixgo-a0c01.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '255047379055',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:255047379055:android:d984d72c63a8d10b22059a',
};

// Khởi tạo Firebase App (Singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Khởi tạo Firebase Auth hỗ trợ AsyncStorage persistence cho React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

export { app, auth, GoogleAuthProvider, signInWithCredential, signInWithPopup };
export default app;

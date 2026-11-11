import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getDefaultBaseUrl = () => {
  if (
    process.env.EXPO_PUBLIC_API_URL &&
    !process.env.EXPO_PUBLIC_API_URL.includes('localhost') &&
    !process.env.EXPO_PUBLIC_API_URL.includes('127.0.0.1')
  ) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000/api`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = getDefaultBaseUrl();

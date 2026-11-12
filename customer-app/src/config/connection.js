import { Platform } from 'react-native';
import Constants from 'expo-constants';

const trim = (value) => value?.trim().replace(/\/+$/, '');
export function resolveConnection({ apiUrl, socketUrl, hostUri, platform }) {
  const host = hostUri?.split(':')[0];
  const fallback = host && !['localhost', '127.0.0.1'].includes(host)
    ? `http://${host}:3000`
    : platform === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
  // Explicit URLs take precedence, including localhost for adb reverse.
  const API_BASE_URL = trim(apiUrl) || `${fallback}/api`;
  const SOCKET_BASE_URL = (trim(socketUrl) || API_BASE_URL.replace(/\/api$/, '')).replace(/\/orders$/, '');
  return { API_BASE_URL, SOCKET_BASE_URL, LOG_ENDPOINT: `${API_BASE_URL}/logs/client` };
}
export const { API_BASE_URL, SOCKET_BASE_URL, LOG_ENDPOINT } = resolveConnection({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL,
  hostUri: Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri || Constants.manifest?.debuggerHost,
  platform: Platform.OS,
});

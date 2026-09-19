/**
 * @file remoteLogger.ts
 * @description Hệ thống bắt lỗi tự động từ xa (Remote Crash & Error Logger).
 * Thu thập mọi crash, unhandled exception trên điện thoại (Expo Go) và Web rồi gửi về backend lưu vào logs/mobile.log.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface ClientLogPayload {
  level?: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  platform?: string;
  context?: string;
  timestamp?: string;
  route?: string;
}

const getLogEndpoint = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    const base = process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
    return `${base}/logs/client`;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest2 as any)?.extra?.expoClient?.hostUri ||
    (Constants.manifest as any)?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000/api/logs/client`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api/logs/client';
  }

  return 'http://localhost:3000/api/logs/client';
};

/**
 * Gửi thông tin lỗi trực tiếp về Backend để ghi vào logs/mobile.log
 */
export async function sendErrorToLog(
  error: any,
  context: string = 'MANUAL_LOG',
  level: 'error' | 'warn' | 'info' = 'error'
): Promise<void> {
  try {
    let message = 'Unknown error';
    let stack = '';

    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
      stack = error.stack || '';
    } else if (error && typeof error === 'object') {
      message = error.message || JSON.stringify(error);
      stack = error.stack || JSON.stringify(error);
    }

    const payload: ClientLogPayload = {
      level,
      message,
      stack,
      platform: Platform.OS,
      context,
      timestamp: new Date().toISOString(),
    };

    const endpoint = getLogEndpoint();

    // Dùng native fetch để độc lập, không phụ thuộc vào Axios
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Không ném lỗi ra ngoài để tránh lặp vô hạn
    console.warn('⚠️ [RemoteLogger] Không thể gửi log tới backend:', err);
  }
}

/**
 * Khởi tạo listener bắt lỗi toàn cầu
 */
export function initRemoteLogger(): void {
  // 1. Bắt lỗi JS Native trên Android/iOS
  // @ts-ignore
  if (typeof ErrorUtils !== 'undefined') {
    try {
      // @ts-ignore
      const originalHandler = ErrorUtils.getGlobalHandler?.();
      // @ts-ignore
      ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        sendErrorToLog(error, isFatal ? 'FATAL_CRASH' : 'UNCAUGHT_EXCEPTION', 'error');
        if (typeof originalHandler === 'function') {
          originalHandler(error, isFatal);
        }
      });
    } catch (e) {
      console.warn('⚠️ [RemoteLogger] Không thể thiết lập ErrorUtils handler:', e);
    }
  }

  // 2. Bắt lỗi Unhandled Rejection & Runtime Error trên Web
  if (typeof window !== 'undefined') {
    try {
      window.addEventListener('error', (event) => {
        sendErrorToLog(event.error || event.message, 'WEB_RUNTIME_ERROR', 'error');
      });

      window.addEventListener('unhandledrejection', (event) => {
        sendErrorToLog(event.reason, 'WEB_UNHANDLED_PROMISE', 'error');
      });
    } catch (e) {
      console.warn('⚠️ [RemoteLogger] Không thể thiết lập window error listener:', e);
    }
  }

  console.log(`📡 [RemoteLogger] Đã kích hoạt hệ thống theo dõi lỗi từ xa (Platform: ${Platform.OS})`);
}

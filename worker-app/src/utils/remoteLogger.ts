/**
 * @file remoteLogger.ts
 * @description Hệ thống bắt lỗi tự động từ xa (Remote Crash & Error Logger).
 * Thu thập mọi crash, unhandled exception trên điện thoại (Expo Go) và Web rồi gửi về backend lưu vào logs/mobile.log.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { LOG_ENDPOINT } from '../config/connection';

export interface ClientLogPayload {
  level?: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  platform?: string;
  context?: string;
  timestamp?: string;
  route?: string;
  app?: string;
  version?: string;
  build?: string;
  requestId?: string;
  orderId?: string;
}

let initialized = false;
let currentRoute: string | undefined;
export function setLogRoute(route: string): void { currentRoute = route; }

/**
 * Gửi thông tin lỗi trực tiếp về Backend để ghi vào logs/mobile.log
 */
export async function sendErrorToLog(
  error: any,
  context: string = 'MANUAL_LOG',
  level: 'error' | 'warn' | 'info' = 'error',
  details: { route?: string; requestId?: string; orderId?: string } = {}
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
      route: currentRoute,
      orderId: currentRoute?.match(/\/(?:order|job)\/([^/]+)/)?.[1],
      ...details,
      app: 'worker-app',
      version: Application.nativeApplicationVersion || Constants.expoConfig?.version,
      build: Application.nativeBuildVersion || undefined,
      level,
      message,
      stack,
      platform: Platform.OS,
      context,
      timestamp: new Date().toISOString(),
    };

    const endpoint = LOG_ENDPOINT;

    // Dùng native fetch để độc lập, không phụ thuộc vào Axios
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(endpoint, {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Log upload failed: ${response.status}`);
    } finally { clearTimeout(timer); }
  } catch (err) {
    // Không ném lỗi ra ngoài để tránh lặp vô hạn
    console.warn('⚠️ [RemoteLogger] Không thể gửi log tới backend:', err);
  }
}

/**
 * Khởi tạo listener bắt lỗi toàn cầu
 */
export function initRemoteLogger(): void {
  if (initialized) return;
  initialized = true;
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

  // 2. Bắt lỗi Unhandled Rejection & Runtime Error trên Web (chỉ khi có window.addEventListener)

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    try {
      window.addEventListener('error', (event: any) => {
        sendErrorToLog(event.error || event.message, 'WEB_RUNTIME_ERROR', 'error');
      });

      window.addEventListener('unhandledrejection', (event: any) => {
        sendErrorToLog(event.reason, 'WEB_UNHANDLED_PROMISE', 'error');
      });
    } catch (e) {
      console.warn('⚠️ [RemoteLogger] Không thể thiết lập window error listener:', e);
    }
  }

  console.log(`📡 [RemoteLogger] Đã kích hoạt hệ thống theo dõi lỗi từ xa (Platform: ${Platform.OS})`);
}

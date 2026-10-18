import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

let firebaseApp = null;

export function getFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (admin.apps && admin.apps.length > 0) {
    firebaseApp = admin.apps[0];
    return firebaseApp;
  }

  let credential = null;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'fixgo-a0c01';

  // Cách 1: Đọc từ biến FIREBASE_SERVICE_ACCOUNT_KEY (chuỗi JSON)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = admin.credential.cert(serviceAccount);
      console.log('🔥 [Firebase Admin] Đã nạp credentials từ biến FIREBASE_SERVICE_ACCOUNT_KEY');
    } catch (err) {
      console.error('⚠️ [Firebase Admin] Không thể parse FIREBASE_SERVICE_ACCOUNT_KEY:', err.message);
    }
  }

  // Cách 2: Đọc từ file JSON theo đường dẫn
  if (!credential) {
    const candidatePaths = [
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      path.resolve(process.cwd(), 'firebase-service-account.json'),
      path.resolve(process.cwd(), 'serviceAccountKey.json'),
      path.resolve(__dirname, 'firebase-service-account.json'),
    ].filter(Boolean);

    for (const filePath of candidatePaths) {
      if (fs.existsSync(filePath)) {
        try {
          const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          credential = admin.credential.cert(serviceAccount);
          console.log(`🔥 [Firebase Admin] Đã nạp credentials từ file: ${filePath}`);
          break;
        } catch (err) {
          console.warn(`⚠️ [Firebase Admin] Lỗi đọc file ${filePath}:`, err.message);
        }
      }
    }
  }

  // Cách 3: Khởi tạo với projectId mặc định nếu chưa có file credential
  if (!credential) {
    console.log(`🔥 [Firebase Admin] Khởi tạo với projectId: ${projectId} (applicationDefault/projectId)`);
    try {
      firebaseApp = admin.initializeApp({
        projectId,
      });
      return firebaseApp;
    } catch (err) {
      console.warn('⚠️ [Firebase Admin] Khởi tạo fallback projectId:', err.message);
    }
  }

  firebaseApp = admin.initializeApp({
    credential,
    projectId,
  });

  return firebaseApp;
}

export function getFirebaseAuth() {
  const app = getFirebaseAdmin();
  return getAuth(app);
}

export default getFirebaseAdmin;

// =========================================================
// Firebase (تسجيل الدخول بس) - الخطة المجانية Spark
// =========================================================
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG, isPlaceholder } from './config';

export const isFirebaseConfigured = !isPlaceholder(CONFIG.firebase.apiKey);

const app = getApps().length ? getApp() : initializeApp(CONFIG.firebase);

let auth;
try {
  // بيفضل المستخدم مسجل دخول حتى بعد ما يقفل التطبيق
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (e) {
  auth = getAuth(app); // اتعمل initialize قبل كده (Fast Refresh)
}

export { app, auth };

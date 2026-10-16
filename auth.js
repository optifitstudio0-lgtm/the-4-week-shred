// =========================================================
// تسجيل الدخول: إيميل وكلمة سر + جوجل + فيسبوك + Apple (آيفون)
// كله على Firebase Authentication (الخطة المجانية)
// المكتبات الـ native بتتحمّل وقت الاستخدام بس، عشان Expo Go ميقعش
// =========================================================
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  deleteUser,
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { CONFIG } from './config';
import { LANG, tr } from './i18n';
import { linkPurchasesUser, unlinkPurchasesUser } from './purchases';
import { deleteAllImages } from './files';

export const currentUser = () => auth.currentUser;
export const onUserChanged = (cb) => onAuthStateChanged(auth, cb);

const ensureConfigured = () => {
  if (!isFirebaseConfigured) {
    const e = new Error('not-configured');
    e.code = 'app/not-configured';
    throw e;
  }
};

// رسالة مفهومة لكل خطأ
export const authErrorMessage = (e) => {
  const code = e?.code || '';
  const map = {
    'app/not-configured': tr('تسجيل الدخول لسه مش متظبط في التطبيق.'),
    'app/native-missing': tr('الخاصية دي محتاجة نسخة التطبيق الكاملة (مش Expo Go).'),
    'auth/invalid-email': tr('الإيميل مكتوب غلط.'),
    'auth/missing-email': tr('اكتب الإيميل.'),
    'auth/user-not-found': tr('الإيميل أو كلمة السر غلط.'),
    'auth/wrong-password': tr('الإيميل أو كلمة السر غلط.'),
    'auth/invalid-credential': tr('الإيميل أو كلمة السر غلط.'),
    'auth/email-already-in-use': tr('الإيميل ده متسجل قبل كده. جرّب تدخل بيه.'),
    'auth/weak-password': tr('كلمة السر لازم تبقى 6 حروف أو أرقام على الأقل.'),
    'auth/too-many-requests': tr('محاولات كتير ورا بعض. استنى شوية وجرّب تاني.'),
    'auth/network-request-failed': tr('مفيش نت. اتأكد من الاتصال وجرّب تاني.'),
    'auth/user-disabled': tr('الحساب ده متوقف.'),
    'auth/requires-recent-login': tr('عشان أمانك، اخرج وادخل تاني وبعدين جرّب.'),
    'auth/account-exists-with-different-credential': tr('الإيميل ده متسجل بطريقة دخول تانية. ادخل بيها.'),
  };
  return map[code] || tr('حصلت مشكلة. جرّب تاني.');
};

// البيانات اللي على الموبايل بتاعة مين؟
// أندرويد بيرجّع النسخة الاحتياطية لوحده لو المستخدم مسح التطبيق ونزّله تاني (أو جاب موبايل جديد بنفس حساب جوجل)
// لو حد دخل بحساب تاني على نفس الموبايل، بنمسح بيانات الحساب القديم عشان ميشوفهاش
const OWNER_KEY = 'dataOwnerUid';
const KEEP_KEYS = (k) => k === 'appLanguage' || k === 'rtlReloadTried' || k.startsWith('firebase:');

const claimLocalData = async (uid) => {
  const owner = await AsyncStorage.getItem(OWNER_KEY);
  if (owner && owner !== uid) {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => !KEEP_KEYS(k)));
    await deleteAllImages();
    try { await require('expo-notifications').cancelAllScheduledNotificationsAsync(); } catch (e) {}
  }
  // أول مرة يدخل: البيانات اللي عملها قبل ما يسجل بتبقى بتاعته
  await AsyncStorage.setItem(OWNER_KEY, uid);
};

// بعد أي دخول: نحفظ الاسم والإيميل ونربط الاشتراك بالحساب
const afterSignIn = async (user, nameHint) => {
  if (!user) return null;
  await claimLocalData(user.uid);
  const name = nameHint || user.displayName || '';
  const savedName = await AsyncStorage.getItem('userName');
  if (name && !savedName) {
    await AsyncStorage.setItem('userName', name);
    await AsyncStorage.setItem('userFirstName', name.split(' ')[0]);
  }
  if (user.email) await AsyncStorage.setItem('userEmail', user.email);
  await linkPurchasesUser(user.uid);
  return user;
};

// ---------------- إيميل وكلمة سر ----------------
export const signUpWithEmail = async (name, email, password) => {
  ensureConfigured();
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name) await updateProfile(user, { displayName: name.trim() });
  try {
    auth.languageCode = LANG;
    await sendEmailVerification(user);
  } catch (e) {}
  return afterSignIn(user, name?.trim());
};

export const signInWithEmail = async (email, password) => {
  ensureConfigured();
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  return afterSignIn(user);
};

// Firebase بيبعت إيميل فيه لينك لتغيير كلمة السر (باللغة بتاعة التطبيق)
export const resetPassword = async (email) => {
  ensureConfigured();
  auth.languageCode = LANG;
  await sendPasswordResetEmail(auth, email.trim());
};

// ---------------- جوجل ----------------
export const signInWithGoogle = async () => {
  ensureConfigured();
  let mod;
  try { mod = require('@react-native-google-signin/google-signin'); } catch (e) { mod = null; }
  if (!mod || !mod.GoogleSignin) { const e = new Error('native'); e.code = 'app/native-missing'; throw e; }
  const { GoogleSignin } = mod;
  GoogleSignin.configure({ webClientId: CONFIG.googleWebClientId, iosClientId: CONFIG.googleIosClientId });
  if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  let res;
  try {
    res = await GoogleSignin.signIn();
  } catch (e) {
    if (e?.code === mod.statusCodes?.SIGN_IN_CANCELLED) return null;
    throw e;
  }
  if (res?.type === 'cancelled') return null;
  const idToken = res?.data?.idToken || res?.idToken;
  if (!idToken) return null;
  const { user } = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  return afterSignIn(user);
};

// ---------------- فيسبوك ----------------
const randomNonce = () => Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);

export const signInWithFacebook = async () => {
  ensureConfigured();
  let fb;
  try { fb = require('react-native-fbsdk-next'); } catch (e) { fb = null; }
  if (!fb || !fb.LoginManager) { const e = new Error('native'); e.code = 'app/native-missing'; throw e; }
  const { LoginManager, AccessToken, AuthenticationToken } = fb;
  const nonce = randomNonce();
  const result = Platform.OS === 'ios'
    ? await LoginManager.logInWithPermissions(['public_profile', 'email'], 'limited', nonce)
    : await LoginManager.logInWithPermissions(['public_profile', 'email']);
  if (result.isCancelled) return null;

  let credential = null;
  if (Platform.OS === 'ios') {
    // آيفون: Limited Login بيرجّع OIDC token
    const t = await AuthenticationToken.getAuthenticationTokenIOS();
    if (t?.authenticationToken) {
      credential = new OAuthProvider('facebook.com').credential({ idToken: t.authenticationToken, rawNonce: nonce });
    }
  }
  if (!credential) {
    const data = await AccessToken.getCurrentAccessToken();
    if (!data?.accessToken) return null;
    credential = FacebookAuthProvider.credential(data.accessToken);
  }
  const { user } = await signInWithCredential(auth, credential);
  return afterSignIn(user);
};

// ---------------- Apple (آيفون بس) ----------------
// أبل بتطلب "Sign in with Apple" في أي تطبيق فيه دخول بجوجل أو فيسبوك
export const isAppleAvailable = async () => {
  if (Platform.OS !== 'ios') return false;
  try {
    const Apple = require('expo-apple-authentication');
    return await Apple.isAvailableAsync();
  } catch (e) {
    return false;
  }
};

export const signInWithApple = async () => {
  ensureConfigured();
  let Apple, Crypto;
  try {
    Apple = require('expo-apple-authentication');
    Crypto = require('expo-crypto');
  } catch (e) {
    const err = new Error('native'); err.code = 'app/native-missing'; throw err;
  }
  const rawNonce = randomNonce();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let cred;
  try {
    cred = await Apple.signInAsync({
      requestedScopes: [Apple.AppleAuthenticationScope.FULL_NAME, Apple.AppleAuthenticationScope.EMAIL],
      nonce: hashed,
    });
  } catch (e) {
    if (e?.code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
  if (!cred?.identityToken) return null;
  const credential = new OAuthProvider('apple.com').credential({ idToken: cred.identityToken, rawNonce });
  const { user } = await signInWithCredential(auth, credential);
  const fullName = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ');
  if (fullName && !user.displayName) { try { await updateProfile(user, { displayName: fullName }); } catch (e) {} }
  return afterSignIn(user, fullName);
};

// ---------------- خروج ومسح ----------------
export const logOut = async () => {
  try { await signOut(auth); } catch (e) {}
  await unlinkPurchasesUser();
  await AsyncStorage.removeItem('userEmail');
};

// بيمسح الحساب من Firebase نهائيًا
export const deleteAccount = async () => {
  ensureConfigured();
  const user = auth.currentUser;
  if (!user) return;
  await deleteUser(user);
  await unlinkPurchasesUser();
  await AsyncStorage.removeItem('userEmail');
};

// =========================================================
// الاشتراكات الحقيقية عن طريق RevenueCat (App Store + Google Play)
// مجاني لحد 2,500 دولار إيرادات في الشهر، وبعدها 1%
// حالة "برو" بتتحفظ في isProMember عشان باقي الشاشات تقراها حتى من غير نت
// =========================================================
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG, isPlaceholder } from './config';
import { notifyPro } from './pro';

let Purchases = null;
try {
  Purchases = require('react-native-purchases').default;
} catch (e) {
  Purchases = null;
}

const apiKey = Platform.OS === 'ios' ? CONFIG.revenueCat.ios : CONFIG.revenueCat.android;
export const isPurchasesConfigured = !!Purchases && !isPlaceholder(apiKey);

let configured = false;

const hasPro = (info) => !!info?.entitlements?.active?.[CONFIG.entitlement];
const savePro = async (on) => {
  await AsyncStorage.setItem('isProMember', on ? 'true' : 'false');
  notifyPro(!!on); // الإعلانات بتختفي أو ترجع على طول
};

// بيتنادى مرة واحدة أول ما التطبيق يفتح
export const initPurchases = async (userId) => {
  if (!isPurchasesConfigured || configured) return;
  try {
    Purchases.configure({ apiKey, appUserID: userId || null });
    configured = true;
    Purchases.addCustomerInfoUpdateListener((info) => savePro(hasPro(info)));
    await savePro(hasPro(await Purchases.getCustomerInfo()));
  } catch (e) {
    console.log('RevenueCat init error', e);
  }
};

// لما التطبيق يرجع من الخلفية: نتأكد الاشتراك لسه شغال (لو خلص، الإعلانات بترجع)
export const refreshPro = async () => {
  if (!configured) return;
  try {
    await savePro(hasPro(await Purchases.getCustomerInfo()));
  } catch (e) {}
};

// الباقات من المتجر بالأسعار الحقيقية (بالعملة المحلية للمستخدم)
export const getPackages = async () => {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  return offerings?.current?.availablePackages || [];
};

// بيرجّع: 'pro' | 'cancelled' | 'not_pro'
export const buyPackage = async (pkg) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const pro = hasPro(customerInfo);
    await savePro(pro);
    return pro ? 'pro' : 'not_pro';
  } catch (e) {
    if (e?.userCancelled) return 'cancelled';
    throw e;
  }
};

export const restorePurchases = async () => {
  const info = await Purchases.restorePurchases();
  const pro = hasPro(info);
  await savePro(pro);
  return pro;
};

// لما المستخدم يسجل دخول: الاشتراك يتربط بحسابه (فلو غيّر الموبايل يرجعله)
export const linkPurchasesUser = async (uid) => {
  if (!configured || !uid) return;
  try {
    const { customerInfo } = await Purchases.logIn(uid);
    await savePro(hasPro(customerInfo));
  } catch (e) {}
};

export const unlinkPurchasesUser = async () => {
  if (!configured) return;
  try {
    const info = await Purchases.logOut();
    await savePro(hasPro(info));
  } catch (e) {}
};

// وضع التطوير بس: تجربة "برو" من غير دفع عشان تختبر القفل
export const devTogglePro = async (on) => {
  if (!__DEV__) return;
  await savePro(on);
};

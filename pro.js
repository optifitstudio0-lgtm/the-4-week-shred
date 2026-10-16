// =========================================================
// إيه المجاني وإيه اللي محتاج برو
// - مجاني: الأسبوع الأول كامل (7 أيام)، خطة الأكل وتدوير الكارب، المية، الوزن، التذكيرات، الستريك، صور قبل وبعد
// - برو: الأسابيع 2 و3 و4، تبديل الوجبات، شير كارت قبل وبعد، ومن غير إعلانات
// =========================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from './config';

export const FREE_DAYS = CONFIG.freeDays;

export const getIsPro = async () => (await AsyncStorage.getItem('isProMember')) === 'true';

// أي حتة في التطبيق تقدر تعرف لما برو يتفتح أو يخلص (الإعلانات بتستخدمها)
const proListeners = new Set();
export const onProChange = (cb) => {
  proListeners.add(cb);
  return () => proListeners.delete(cb);
};
let lastPro = null;
export const notifyPro = (on) => {
  if (on === lastPro) return;
  lastPro = on;
  proListeners.forEach((cb) => {
    try { cb(on); } catch (e) {}
  });
};

// الجولة 1: الأسبوع الأول ببلاش | الجولة 2 وبعدها: كلها برو
export const isDayPro = (dayId, round = 1) => round > 1 || dayId > FREE_DAYS;

// reason: 'weeks' | 'swap' | 'share' | 'rounds'
export const openPaywall = (navigation, reason) => navigation.navigate('Subscription', { reason });

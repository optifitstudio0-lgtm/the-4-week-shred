// =========================================================
// RTL + أيقونات الاتجاه
// - العربي = من اليمين للشمال، والإنجليزي = من الشمال لليمين (اختيار اللغة من الإعدادات)
// - React Native بيقلب flexDirection و margin/padding left/right و textAlign لوحده
//   لما I18nManager.isRTL = true، فمتكتبش row-reverse بإيدك (هتتقلب مرتين)
// - الأيقونات بس اللي مش بتتقلب لوحدها، فاستخدم ICON.back / ICON.next
// =========================================================
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyDirection, LANG_KEY, deviceLanguage } from './i18n';

export const isRTL = I18nManager.isRTL;

export const ICON = {
  back: isRTL ? 'arrow-forward' : 'arrow-back',
  next: isRTL ? 'arrow-back' : 'arrow-forward',
  chevronNext: isRTL ? 'chevron-back' : 'chevron-forward',
  chevronBack: isRTL ? 'chevron-forward' : 'chevron-back',
};

// اتجاه الحركة الأفقية (للأنيميشن اللي بيستخدم translateX)
export const dirX = (n) => (isRTL ? -n : n);

// بنظبط الاتجاه على اللغة المحفوظة (أول مرة = لغة الموبايل). أول فتحة بس ممكن تحتاج إعادة تشغيل
export const ensureRTL = async () => {
  try {
    let lang = await AsyncStorage.getItem(LANG_KEY);
    if (!lang) {
      lang = deviceLanguage();
      await AsyncStorage.setItem(LANG_KEY, lang);
    }
    if (I18nManager.isRTL === (lang === 'ar')) {
      I18nManager.swapLeftAndRightInRTL(true);
      await AsyncStorage.removeItem('rtlReloadTried');
      return;
    }
    const tried = await AsyncStorage.getItem('rtlReloadTried');
    if (tried === lang) return; // منعًا لأي لوب لو الجهاز رفض
    await AsyncStorage.setItem('rtlReloadTried', lang);
    await applyDirection(lang);
  } catch (e) {
    console.log('RTL error', e);
  }
};

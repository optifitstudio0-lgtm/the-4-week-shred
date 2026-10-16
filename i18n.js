// =========================================================
// اللغة: عربي (RTL) أو English (LTR)
// - اللغة الحالية بتتعرف من اتجاه الواجهة (I18nManager.isRTL)، فالنص والاتجاه دايمًا متطابقين
// - tr('النص العربي', ...args): بيرجّع العربي، أو الترجمة الإنجليزية من en.js
//   و{0} و{1} بيتبدلوا بالـ args
// - تغيير اللغة محتاج إعادة تشغيل التطبيق (عشان الاتجاه يتقلب)، وده بيحصل لوحده
// =========================================================
import { I18nManager, DevSettings, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { EN } from './en';

export const LANG = I18nManager.isRTL ? 'ar' : 'en';
export const isEnglish = LANG === 'en';
export const LANG_KEY = 'appLanguage';
export const LANGUAGES = [
  { id: 'ar', label: 'العربية' },
  { id: 'en', label: 'English' },
];

const fill = (s, args) =>
  args.length ? String(s).replace(/\{(\d+)\}/g, (m, i) => (args[i] !== undefined && args[i] !== null ? String(args[i]) : '')) : s;

export const tr = (ar, ...args) => fill(LANG === 'en' ? EN[ar] ?? ar : ar, args);

// أول مرة: لغة الموبايل (عربي لو الموبايل عربي، وأي لغة تانية = English)
export const deviceLanguage = () => {
  try {
    const L = require('expo-localization');
    const code = String(L.getLocales?.()[0]?.languageCode || L.locale || '').toLowerCase();
    return code.startsWith('ar') ? 'ar' : 'en';
  } catch (e) {
    return 'en';
  }
};

export const getSavedLanguage = async () => (await AsyncStorage.getItem(LANG_KEY)) || deviceLanguage();

export const reloadApp = async () => {
  try {
    await Updates.reloadAsync();
    return true;
  } catch (e) {}
  if (__DEV__ && DevSettings && DevSettings.reload) {
    DevSettings.reload();
    return true;
  }
  return false;
};

// بيظبط الاتجاه على اللغة ويعيد التشغيل لو محتاج. بيرجّع true لو بدأ إعادة تشغيل
export const applyDirection = async (lang) => {
  const rtl = lang === 'ar';
  I18nManager.swapLeftAndRightInRTL(true);
  if (I18nManager.isRTL === rtl) return false;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  return reloadApp();
};

export const setLanguage = async (lang) => {
  if (lang === LANG) return;
  await AsyncStorage.setItem(LANG_KEY, lang);
  await AsyncStorage.removeItem('rtlReloadTried');
  const reloading = await applyDirection(lang);
  if (!reloading) {
    Alert.alert(
      lang === 'en' ? 'Restart the app' : 'اقفل التطبيق وافتحه تاني',
      lang === 'en' ? 'Close the app completely and open it again to switch to English.' : 'عشان اللغة تتغير للعربي، اقفل التطبيق خالص وافتحه تاني.'
    );
  }
};

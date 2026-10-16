// =========================================================
// خطة على حسب الدورة (للستات بس، واختياري)
// - المستخدمة بتدخل أول يوم في آخر دورة + طول الدورة + عدد أيام الدورة
// - بنحسب المرحلة النهارده: الدورة / الذهبية / التبويض / بعد التبويض / قبل الدورة
// - أيام الدورة وقبلها: التمرين أخف 25% وراحة أطول | بعد التبويض: +100 سعر
// - كل البيانات على الموبايل بس. ده مش وسيلة لمنع الحمل ولا تشخيص طبي
// =========================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey, diffDays } from './dates';
import { tr } from './i18n';

const KEY = 'cycleSettings';
const OVERRIDE_KEY = 'cycleOverrideDate';
export const DEFAULT_CYCLE = { enabled: false, lastStart: null, cycleLen: 28, periodLen: 5 };

export const getCycleSettings = async () => {
  try {
    return { ...DEFAULT_CYCLE, ...(JSON.parse((await AsyncStorage.getItem(KEY)) || '{}')) };
  } catch (e) {
    return { ...DEFAULT_CYCLE };
  }
};
export const saveCycleSettings = async (s) => AsyncStorage.setItem(KEY, JSON.stringify({ ...(await getCycleSettings()), ...s }));
export const periodStartedToday = async () => saveCycleSettings({ enabled: true, lastStart: dateKey() });

export const PHASES = {
  menstrual: {
    key: 'menstrual', label: tr('أيام الدورة'), icon: 'water', color: '#E74C3C',
    hint: tr('التمرين النهارده أخف شوية وراحته أطول. ولو تعبانة، اعملي نسخة الـ7 دقايق عشان الستريك.'),
  },
  follicular: {
    key: 'follicular', label: tr('المرحلة الذهبية'), icon: 'flash', color: '#2ECC71',
    hint: tr('طاقتك عالية وجسمك بيستحمل أكتر. أحسن وقت تكسري أرقامك.'),
  },
  ovulation: {
    key: 'ovulation', label: tr('وقت التبويض'), icon: 'sunny', color: '#F1C40F',
    hint: tr('أعلى طاقة في الشهر. سخّني كويس قبل التمرين عشان المفاصل بتبقى أرخى.'),
  },
  luteal: {
    key: 'luteal', label: tr('بعد التبويض'), icon: 'moon', color: '#9B59B6',
    hint: tr('جسمك بيحرق أكتر شوية، فزوّدنالك 100 سعر. عادي تحسي بجوع أكتر.'),
  },
  pms: {
    key: 'pms', label: tr('قبل الدورة'), icon: 'cloudy-night', color: '#E67E22',
    hint: tr('وزنك ممكن يزيد 1-2 كيلو مية، دي مش دهون وهتروح بعد الدورة. التمرين أخف شوية.'),
  },
};

// المرحلة في يوم معين (أو null لو الخاصية مقفولة)
export const cycleInfoFor = (s, key = dateKey()) => {
  if (!s?.enabled || !s.lastStart) return null;
  const len = Math.min(45, Math.max(20, s.cycleLen || 28));
  const period = Math.min(10, Math.max(2, s.periodLen || 5));
  const diff = diffDays(s.lastStart, key);
  if (diff < 0) return null;
  const day = (diff % len) + 1;
  const ov = len - 14;
  let phase;
  if (day <= period) phase = 'menstrual';
  else if (day >= ov - 1 && day <= ov + 1) phase = 'ovulation';
  else if (day < ov - 1) phase = 'follicular';
  else if (day > len - 5) phase = 'pms';
  else phase = 'luteal';
  return {
    day,
    len,
    phase,
    ...PHASES[phase],
    daysToNext: len - day + 1,
    // لو آخر تاريخ قديم (أكتر من دورتين) بنطلب منها تحدّثه
    stale: diff >= len * 2,
    light: phase === 'menstrual' || phase === 'pms',
    calDelta: phase === 'luteal' || phase === 'pms' ? 100 : 0,
    waterRetention: phase === 'pms' || phase === 'menstrual',
  };
};

export const getCycleInfo = async (key = dateKey()) => {
  const gender = await AsyncStorage.getItem('userGender');
  if (gender !== 'female') return null;
  return cycleInfoFor(await getCycleSettings(), key);
};

// "أنا كويسة النهارده": التمرين يرجع عادي لليوم ده بس
export const isLightOverridden = async () => (await AsyncStorage.getItem(OVERRIDE_KEY)) === dateKey();
export const overrideLightToday = async () => AsyncStorage.setItem(OVERRIDE_KEY, dateKey());

// التمرين الأخف: الوقت والعدّات أقل 25%
export const softenForCycle = (list) =>
  list.map((x) => {
    if (x.id === 'rest') return x;
    if (x.type === 'time' && x.durationSec > 0) {
      const sec = Math.max(15, Math.round((x.durationSec * 0.75) / 5) * 5);
      return { ...x, durationSec: sec, duration: String(x.duration || '').replace(/\d+/, String(sec)) };
    }
    const m = String(x.duration || '').match(/\d+/);
    if (m) {
      const n = Math.max(5, Math.round(parseInt(m[0], 10) * 0.75));
      return { ...x, duration: String(x.duration).replace(/\d+/, String(n)) };
    }
    return x;
  });

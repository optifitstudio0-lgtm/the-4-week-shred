// =========================================================
// محقق الثبات: لو الميزان وقف أسبوع أو أكتر، بنشرح السبب من بيانات المستخدم نفسه
// - بيشتغل لهدف "خسارة وزن" بس
// - الأسباب: مية الدورة، تمرين جديد، مية قليلة، عضل بيزيد، ملح، وقت الوزن
// - لو وقف أسبوعين ومفيش سبب مؤقت (زي الدورة): بنعرض نقلل 100 سعر (لحد 300 بالكتير، ومن غير ما ننزل تحت الحد الآمن)
// =========================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tc } from './theme';
import { dateKey, addDays, diffDays } from './dates';
import { tr } from './i18n';
import { recalcTargets } from './nutrition';

const ADJ_KEY = 'calorieAdjust';
export const MAX_CUT = -300;
const MIN_CAL = { male: 1500, female: 1200 };

export const getCalorieAdjust = async () => parseInt(await AsyncStorage.getItem(ADJ_KEY)) || 0;
export const setCalorieAdjust = async (v) => {
  const val = Math.max(MAX_CUT, Math.min(0, Math.round(v)));
  if (val === 0) await AsyncStorage.removeItem(ADJ_KEY);
  else await AsyncStorage.setItem(ADJ_KEY, String(val));
  return recalcTargets();
};

const getJSON = async (k, fb) => {
  try { return JSON.parse((await AsyncStorage.getItem(k)) || 'null') ?? fb; } catch (e) { return fb; }
};

// log = [{ date, kg }] مترتب | cycle = نتيجة getCycleInfo أو null
export const analyzePlateau = async (log, cycle = null) => {
  const goal = await AsyncStorage.getItem('userGoal');
  if (goal !== 'lose_weight' || !log || log.length < 2) return null;

  const today = dateKey();
  const latest = log[log.length - 1];
  // أقل وزن وصله لحد دلوقتي، ومن إمتى
  let lowest = log[0];
  log.forEach((e) => { if (e.kg <= lowest.kg) lowest = e; });
  const stuckDays = diffDays(lowest.date, today);
  const span = diffDays(log[0].date, latest.date);
  if (span < 7 || stuckDays < 7) return null;
  // لو آخر وزن نازل عن اللي قبل أسبوع بـ 0.2 كيلو أو أكتر، يبقى مش واقف
  const weekAgo = [...log].reverse().find((e) => diffDays(e.date, latest.date) >= 7);
  if (weekAgo && Math.round((latest.kg - weekAgo.kg) * 10) / 10 <= -0.2) return null;

  const [waterHistory, waterGoalRaw, workoutDates, start, adjust, gender, calories] = await Promise.all([
    getJSON('waterHistory', {}),
    AsyncStorage.getItem('waterGoal'),
    getJSON('workoutDates', []),
    AsyncStorage.getItem('challengeStart'),
    getCalorieAdjust(),
    AsyncStorage.getItem('userGender'),
    AsyncStorage.getItem('calculatedCalories'),
  ]);

  const reasons = [];
  if (cycle?.waterRetention) {
    reasons.push({ icon: 'water', color: tc('#E74C3C', 'fg'), title: tr('مية بسبب الدورة'), text: tr('إنتي في مرحلة "{0}". الجسم بيشيل 1-2 كيلو مية دلوقتي، وهتنزل لوحدها بعد الدورة بكام يوم.', cycle.label) });
  }
  if (start && diffDays(start, today) <= 14) {
    reasons.push({ icon: 'barbell', color: tc('#3498DB', 'fg'), title: tr('العضل بيشيل مية مع التمرين الجديد'), text: tr('أول أسبوعين، العضل بيخزّن مية زيادة (حوالي 1-2 كيلو) عشان يتصلّح. ده بيداري الدهون اللي نزلت فعلًا.') });
  }
  const goal7 = parseInt(waterGoalRaw) || 3000;
  const last7 = [...Array(7)].map((_, i) => waterHistory[addDays(today, -i)] || 0);
  const waterPct = Math.round((last7.reduce((a, b) => a + b, 0) / 7 / goal7) * 100);
  if (waterPct < 70) {
    reasons.push({ icon: 'beaker', color: tc('#5DADE2', 'fg'), title: tr('مية قليلة'), text: tr('شربت في المتوسط {0}% بس من هدف المية آخر أسبوع. لما الجسم يعطش بيمسك المية، فاشرب أكتر عشان الميزان يتحرك.', waterPct) });
  }
  const trained14 = workoutDates.filter((d) => diffDays(d, today) <= 14).length;
  if (trained14 >= 8) {
    reasons.push({ icon: 'fitness', color: tc('#2ECC71', 'fg'), title: tr('عضل بيزيد ودهون بتنزل'), text: tr('اتمرنت {0} مرة في أسبوعين. العضل الجديد بيعوّض في الميزان، فقارن صورك وهدومك مش الميزان بس.', trained14) });
  }
  reasons.push({ icon: 'restaurant', color: tc('#F39C12', 'fg'), title: tr('ملح أو أكل برّه'), text: tr('وجبة مالحة أو أكل مطاعم ممكن تمسك 1-2 كيلو مية ليومين أو تلاتة.') });
  reasons.push({ icon: 'time', color: tc('#AAA', 'fg'), title: tr('وقت الوزن'), text: tr('اوزن نفسك الصبح بعد الحمام وقبل الأكل، كل مرة بنفس الطريقة. الوزن بيفرق لحد 2 كيلو في نفس اليوم.') });

  // نقلل السعرات بس لو واقف أسبوعين، ومفيش سبب مؤقت، ولسه فوق الحد الآمن
  const floor = MIN_CAL[gender] || MIN_CAL.female;
  const cal = parseInt(calories) || 0;
  const temporary = !!cycle?.waterRetention || (start && diffDays(start, today) <= 14);
  const canCut = stuckDays >= 14 && !temporary && adjust > MAX_CUT && cal - 100 >= floor;

  return { stuckDays, lowestKg: lowest.kg, reasons, canCut, adjust };
};

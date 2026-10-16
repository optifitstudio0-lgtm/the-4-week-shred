// =========================================================
// حساب السعرات والماكروز + تدوير الكارب
// - calculatePlan: نفس معادلة شاشة إنشاء الخطة (Mifflin-St Jeor + النشاط + الهدف)
// - البروتين: 1.6 لـ 2 جم لكل كيلو من الوزن المستهدف، وبحد أقصى 30% من السعرات
// - recalcTargets: بيعيد الحساب كل ما الوزن أو الطول أو السن يتغيروا
// - cycleMacros: كارب أعلى في أيام التمرين التقيل، وأقل في أيام الراحة
//   ومتوسط الأسبوع بيفضل نفس السعرات المحسوبة بالظبط
// الملف ده مش بيستورد أي حاجة من progressstore أو mealstore (عشان ميحصلش import دايري)
// =========================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tr } from './i18n';

const ACTIVITY = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725 };
const GOAL_DELTA = { lose_weight: -500, build_muscle: 300, keep_fit: 0 };
// أقل سعرات آمنة من غير إشراف طبي
const MIN_CAL = { male: 1500, female: 1200 };

// البروتين: جرامات لكل كيلو على حسب الهدف
const PRO_PER_KG = { lose_weight: 2.0, build_muscle: 1.8, keep_fit: 1.6 };
// أقصى نسبة بروتين من السعرات (أكتر من كده صعب توصله بأكل طبيعي)
const MAX_PRO_SHARE = 0.3;

// الوزن اللي البروتين بيتحسب عليه:
// الوزن المستهدف لو موجود ومنطقي، غير كده الوزن الحالي بس مش أكتر من وزن BMI 25
// (عشان اللي وزنه عالي ميطلعلوش رقم بروتين مستحيل)
const proteinWeight = ({ weight, height, targetWeight }) => {
  const t = parseFloat(targetWeight);
  if (t >= 35 && t <= 250) return t;
  const bmi25 = 25 * Math.pow(height / 100, 2);
  return bmi25 > 0 ? Math.min(weight, bmi25) : weight;
};

export const proteinFor = (profile, calories) => {
  const perKg = PRO_PER_KG[profile.goal] || PRO_PER_KG.lose_weight;
  const byWeight = perKg * proteinWeight(profile);
  const cap = (calories * MAX_PRO_SHARE) / 4;
  return Math.round(Math.min(byWeight, cap));
};

export const calculatePlan = ({ gender, age, weight, height, activity, goal, targetWeight }) => {
  if (!weight || !height || !age) return null;
  const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
  const tdee = bmr * (ACTIVITY[activity] || 1.2);
  const floor = MIN_CAL[gender] || MIN_CAL.female;
  const calories = Math.round(Math.max(tdee + (GOAL_DELTA[goal] || 0), floor));
  const protein = proteinFor({ weight, height, goal, targetWeight }, calories);
  // المية: 35 مل لكل كيلو، بين 2 و4 لتر
  const water = Math.min(4000, Math.max(2000, Math.round((weight * 35) / 250) * 250));
  return { calories, protein, water };
};

const readProfile = async () => {
  const [[, gender], [, age], [, weight], [, height], [, activity], [, goal], [, targetWeight]] = await AsyncStorage.multiGet([
    'userGender', 'userAge', 'userWeight', 'userHeight', 'userActivity', 'userGoal', 'targetWeight',
  ]);
  return {
    gender,
    age: parseInt(age),
    weight: parseFloat(weight),
    height: parseFloat(height),
    activity,
    goal,
    targetWeight: parseFloat(targetWeight) || null,
  };
};

// بيعيد حساب السعرات والبروتين والمية من آخر بيانات محفوظة
// بيرجّع { before, after } عشان الشاشة تقدر تقول للمستخدم إن الأرقام اتغيرت
export const recalcTargets = async () => {
  try {
    const profile = await readProfile();
    const plan = calculatePlan(profile);
    if (!plan) return null;
    // تعديل محقق الثبات (سالب، بحد أقصى -300) ومن غير ما ننزل تحت الحد الآمن
    const adjust = parseInt(await AsyncStorage.getItem('calorieAdjust')) || 0;
    if (adjust) {
      const floor = MIN_CAL[profile.gender] || MIN_CAL.female;
      plan.calories = Math.max(floor, plan.calories + adjust);
      plan.protein = proteinFor(profile, plan.calories); // السعرات قلت، فالحد الأقصى للبروتين يتظبط معاها
    }
    const before = parseInt(await AsyncStorage.getItem('calculatedCalories')) || null;
    await AsyncStorage.multiSet([
      ['calculatedCalories', String(plan.calories)],
      ['calculatedProtein', String(plan.protein)],
      ['waterGoal', String(plan.water)],
    ]);
    return { before, after: plan.calories, plan };
  } catch (e) {
    console.log('recalcTargets error', e);
    return null;
  }
};

// ---------------- تدوير الكارب ----------------
// نوع اليوم من عنوان التمرين (العنوان الإنجليزي الأصلي titleEn)
export const DAY_TYPES = {
  high: { key: 'high', label: tr('يوم تمرين تقيل'), hint: tr('كارب أعلى عشان الطاقة'), icon: 'flame', weight: 1.25 },
  normal: { key: 'normal', label: tr('يوم تمرين عادي'), hint: tr('كارب متوسط'), icon: 'barbell', weight: 1.0 },
  light: { key: 'light', label: tr('يوم تمرين خفيف'), hint: tr('كارب أقل شوية'), icon: 'walk', weight: 0.8 },
  rest: { key: 'rest', label: tr('يوم راحة'), hint: tr('كارب أقل ودهون أعلى شوية'), icon: 'bed', weight: 0.6 },
};

export const getDayType = (day) => {
  if (!day) return DAY_TYPES.normal;
  if (day.isRest) return DAY_TYPES.rest;
  const t = `${day.titleEn || day.title || ''}`;
  if (/recovery/i.test(t) || day.levelEn === 'Easy') return DAY_TYPES.light;
  if (/hiit|leg|lower body|full body|ultimate|final/i.test(t)) return DAY_TYPES.high;
  return DAY_TYPES.normal;
};

// base = { cal, pro } | weekDays = أيام الأسبوع ده (عشان متوسط الأسبوع يفضل زي ما هو)
export const cycleMacros = (base, day, weekDays = []) => {
  const cal = base.cal;
  const pro = base.pro;
  const baseFat = Math.round((cal * 0.25) / 9);
  const baseCarbs = Math.max(0, (cal - pro * 4 - baseFat * 9) / 4);

  const type = getDayType(day);
  const weights = weekDays.length ? weekDays.map((d) => getDayType(d).weight) : [type.weight];
  const avg = weights.reduce((a, b) => a + b, 0) / weights.length || 1;
  const factor = type.weight / avg; // متوسط الأسبوع = 1

  let carbs = baseCarbs * factor;
  // نص فرق سعرات الكارب بيتعوّض من الدهون (أيام الراحة دهون أكتر، الأيام التقيلة دهون أقل)
  let fat = baseFat - ((carbs - baseCarbs) * 4 * 0.5) / 9;
  fat = Math.max(fat, (cal * 0.2) / 9); // الدهون مش أقل من 20% أبدًا
  carbs = Math.max(0, carbs);

  return {
    cal: Math.round(pro * 4 + carbs * 4 + fat * 9),
    pro,
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    dayType: type,
  };
};

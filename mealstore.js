// =========================================================
// منطق خطة الأكل اليومية (Meal Plan Engine)
// - بيعمل خطة جديدة كل يوم على حسب سعرات وبروتين اليوزر
// - الوجبات الضعيفة في البروتين مش بتتختار (MIN_PRO_DENSITY)
// - بيحفظ التبديل والوجبات اللي اتاكلت، وبيصفّرهم كل يوم جديد
// =========================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCycleInfo } from './cycle';
import { MEALS_DB, MEALS_BY_ID } from './mealsdata';
import { markPerfectMealDay, getCompletedDays, getCurrentDay } from './progressstore';
import { WORKOUT_PLAN } from './exercisesdata';
import { cycleMacros } from './nutrition';
import { dateKey } from './dates';
import { tr } from './i18n';

export const SLOTS = [
  // type بيفضل إنجليزي لأنه مفتاح داخلي، و label هو اللي بيظهر لليوزر
  { type: 'Breakfast', key: 'breakfast', label: tr('الفطار'), time: tr('8:00 ص'), share: 0.25, icon: 'sunny-outline' },
  { type: 'Lunch', key: 'lunch', label: tr('الغدا'), time: tr('1:00 م'), share: 0.35, icon: 'restaurant-outline' },
  { type: 'Snack', key: 'snack', label: tr('سناك'), time: tr('4:30 م'), share: 0.10, icon: 'cafe-outline' },
  { type: 'Dinner', key: 'dinner', label: tr('العشا'), time: tr('8:00 م'), share: 0.30, icon: 'moon-outline' },
];

const K = {
  plan: 'mealPlanToday',
  history: 'mealPlanHistory',
  eaten: 'eatenMealsIds',       // نفس الاسم القديم عشان باقي الشاشات
  eatenDate: 'eatenMealsDate',
};

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// راندوم ثابت لكل يوم (نفس اليوم = نفس الخطة)
const seeded = (seed) => () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};
const hash = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 1000003, 7);

// يوم الخطة بتاع النهارده: لو اتمرنت النهارده يبقى اليوم اللي خلصته، غير كده اليوم الجاي
const getTodayPlanDay = async () => {
  const completed = await getCompletedDays();
  const today = dateKey();
  const doneToday = Object.keys(completed).find((d) => completed[d] === today);
  return parseInt(doneToday) || (await getCurrentDay());
};

// أهداف اليوم: السعرات والبروتين بتتحسب من بياناتك (وبتتعاد لما وزنك يتغير)
// وبعدها تدوير الكارب: كارب أعلى في أيام التمرين التقيل وأقل في أيام الراحة
// ومتوسط الأسبوع بيفضل نفس السعرات المحسوبة
export const getTargets = async () => {
  const cal =
    parseInt(await AsyncStorage.getItem('calculatedCalories')) ||
    parseInt(await AsyncStorage.getItem('userTargetCalories')) ||
    2000;
  const pro = parseInt(await AsyncStorage.getItem('calculatedProtein')) || Math.round((cal * 0.3) / 4);

  let dayId = 1;
  try { dayId = await getTodayPlanDay(); } catch (e) {}
  const weekStart = Math.floor((dayId - 1) / 7) * 7 + 1;
  const weekDays = [0, 1, 2, 3, 4, 5, 6].map((i) => WORKOUT_PLAN[weekStart + i]).filter(Boolean);

  // خطة الدورة: بعد التبويض وقبل الدورة +100 سعر
  let cycleDelta = 0;
  try { cycleDelta = (await getCycleInfo())?.calDelta || 0; } catch (e) {}

  const t = cycleMacros({ cal: cal + cycleDelta, pro }, WORKOUT_PLAN[dayId], weekDays);
  return { cal: t.cal, pro: t.pro, carbs: t.carbs, fat: t.fat, dayType: t.dayType, dayId, baseCal: cal };
};

// ---------------- اختيار الوجبات ----------------
// أقل نسبة بروتين من سعرات الوجبة (بروتين × 4 ÷ سعرات)
// الوجبات اللي تحت الحد ده مش بتتختار في الخطة ولا في التبديل (بس فاضلة في الداتا)
const MIN_PRO_DENSITY = { breakfast: 0.2, lunch: 0.2, snack: 0.15, dinner: 0.2 };
const POOL_SIZE = 8; // بنختار عشوائي من أحسن 8 عشان التنويع

const proDensity = (m) => (m.pro * 4) / Math.max(m.cal, 1);
const isProteinOk = (slotKey) => (m) => proDensity(m) >= (MIN_PRO_DENSITY[slotKey] || 0.2);

// كل ما الرقم يقل كل ما الوجبة تبقى أنسب:
// بعدها عن السعرات + نقص البروتين (عقابه أكبر) + زيادة البروتين (عقاب خفيف)
const scoreMeal = (m, targetCal, targetPro) => {
  const tCal = Math.max(targetCal, 1);
  const tPro = Math.max(targetPro, 5);
  const calErr = Math.abs(m.cal - tCal) / tCal;
  const short = Math.max(0, tPro - m.pro) / tPro;
  const extra = Math.max(0, m.pro - tPro) / tPro;
  return calErr + 1.5 * short + 0.2 * extra;
};

// بيختار وجبة قريبة من نصيبها من سعرات وبروتين اليوم
const pickMeal = (slotKey, targetCal, targetPro, rand, excludeIds = []) => {
  const all = MEALS_DB[slotKey];
  const ok = isProteinOk(slotKey);
  let list = all.filter((m) => ok(m) && !excludeIds.includes(m.id));
  if (list.length < 6) list = all.filter(ok);
  if (list.length < 6) list = all;
  const sorted = [...list].sort((a, b) => scoreMeal(a, targetCal, targetPro) - scoreMeal(b, targetCal, targetPro));
  const pool = sorted.slice(0, Math.min(POOL_SIZE, sorted.length));
  return pool[Math.floor(rand() * pool.length)];
};

export const getTotals = (ids) =>
  ids.reduce(
    (t, id) => {
      const m = MEALS_BY_ID[id];
      if (!m) return t;
      return { cal: t.cal + m.cal, pro: t.pro + m.pro, carbs: t.carbs + (m.carbs || 0), fat: t.fat + (m.fat || 0) };
    },
    { cal: 0, pro: 0, carbs: 0, fat: 0 }
  );

// الوجبات اللي اتاكلت النهارده بس (يوم جديد = تبدأ من الصفر)
export const getEatenToday = async () => {
  const today = todayKey();
  const savedDate = await AsyncStorage.getItem(K.eatenDate);
  if (savedDate !== today) {
    await AsyncStorage.multiSet([[K.eatenDate, today], [K.eaten, '[]']]);
    await saveTotals([]);
    return [];
  }
  const raw = await AsyncStorage.getItem(K.eaten);
  return raw ? JSON.parse(raw) : [];
};

const saveTotals = async (ids) => {
  const t = getTotals(ids);
  await AsyncStorage.multiSet([
    ['totalCaloriesEaten', String(t.cal)],
    ['totalProteinEaten', String(t.pro)],
  ]);
};

export const setEatenToday = async (ids) => {
  await AsyncStorage.multiSet([[K.eatenDate, todayKey()], [K.eaten, JSON.stringify(ids)]]);
  await saveTotals(ids);
};

export const toggleEaten = async (mealId) => {
  const ids = await getEatenToday();
  const next = ids.includes(mealId) ? ids.filter((id) => id !== mealId) : [...ids, mealId];
  await setEatenToday(next);
  // يوم "أكل نضيف" = كل وجبات خطة النهارده اتاكلت (للبادچ)
  try {
    const raw = await AsyncStorage.getItem(K.plan);
    const plan = raw ? JSON.parse(raw) : null;
    if (plan && plan.ids) await markPerfectMealDay(Object.values(plan.ids).every((id) => next.includes(id)));
  } catch (e) {}
  return next;
};

const buildMeals = (plan) =>
  SLOTS.map((s) => ({ ...MEALS_BY_ID[plan.ids[s.type]], type: s.type, label: s.label, time: s.time, icon: s.icon }));

// خطة النهارده: لو مش موجودة أو اليوم اتغير أو الهدف اتغير، بنعمل واحدة جديدة
export const loadTodayPlan = async () => {
  const today = todayKey();
  const targets = await getTargets();
  const eaten = await getEatenToday();
  const raw = await AsyncStorage.getItem(K.plan);
  let plan = raw ? JSON.parse(raw) : null;

  const validPlan = plan && plan.ids && SLOTS.every((s) => MEALS_BY_ID[plan.ids[s.type]]);
  if (!validPlan || plan.date !== today || plan.targetCal !== targets.cal || plan.targetPro !== targets.pro) {
    const histRaw = await AsyncStorage.getItem(K.history);
    let history = histRaw ? JSON.parse(histRaw) : [];
    if (validPlan && plan.date !== today) history = [...Object.values(plan.ids), ...history];
    history = history.slice(0, 12); // متكررش وجبات آخر 3 أيام

    const rand = seeded(hash(today + targets.cal));
    const ids = {};
    // الوجبات اللي اتاكلت النهارده بتفضل زي ما هي، وبنخصم سعراتها وبروتينها من الباقي
    let remCal = targets.cal;
    let remPro = targets.pro;
    let remShare = 1;
    SLOTS.forEach((s) => {
      const keep = validPlan && plan.date === today && eaten.includes(plan.ids[s.type]);
      if (!keep) return;
      const m = MEALS_BY_ID[plan.ids[s.type]];
      ids[s.type] = m.id;
      remCal -= m.cal;
      remPro -= m.pro;
      remShare -= s.share;
    });
    // كل وجبة بتاخد نصيبها من الباقي، فلو وجبة جت بروتينها قليل اللي بعدها بتعوّض
    SLOTS.forEach((s) => {
      if (ids[s.type]) return;
      const part = remShare > 0 ? s.share / remShare : 1;
      const m = pickMeal(s.key, Math.max(0, remCal) * part, Math.max(0, remPro) * part, rand, [...history, ...Object.values(ids)]);
      ids[s.type] = m.id;
      remCal -= m.cal;
      remPro -= m.pro;
      remShare -= s.share;
    });
    plan = { date: today, targetCal: targets.cal, targetPro: targets.pro, ids };
    await AsyncStorage.multiSet([[K.plan, JSON.stringify(plan)], [K.history, JSON.stringify(history)]]);
  }
  return { targets, eaten, meals: buildMeals(plan) };
};

// التبديل الذكي: وجبة تانية من نفس النوع، سعراتها قريبة (±25%) وبروتينها مش أقل كتير
export const swapMealInPlan = async (type) => {
  const raw = await AsyncStorage.getItem(K.plan);
  if (!raw) return null;
  const plan = JSON.parse(raw);
  const slot = SLOTS.find((s) => s.type === type);
  const current = MEALS_BY_ID[plan.ids[type]];
  if (!slot || !current) return null;

  const used = Object.values(plan.ids);
  const all = MEALS_DB[slot.key].filter((m) => !used.includes(m.id));
  const ok = isProteinOk(slot.key);
  const nearCal = (m) => Math.abs(m.cal - current.cal) <= current.cal * 0.25;
  const enoughPro = (m) => m.pro >= current.pro * 0.8;

  // من الأدق للأوسع لحد ما نلاقي 3 اختيارات على الأقل
  const tiers = [
    all.filter((m) => ok(m) && nearCal(m) && enoughPro(m)),
    all.filter((m) => ok(m) && nearCal(m)),
    all.filter(ok),
    all,
  ];
  const candidates = tiers.find((t) => t.length >= 3) || tiers.find((t) => t.length > 0);
  if (!candidates) return null;
  const next = candidates[Math.floor(Math.random() * candidates.length)];

  plan.ids[type] = next.id;
  await AsyncStorage.setItem(K.plan, JSON.stringify(plan));

  const eaten = await getEatenToday();
  if (eaten.includes(current.id)) await setEatenToday(eaten.filter((id) => id !== current.id));

  return { ...next, type: slot.type, label: slot.label, time: slot.time, icon: slot.icon };
};

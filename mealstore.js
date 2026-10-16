// =========================================================
// منطق خطة الأكل اليومية (Meal Plan Engine)
// - بيعمل خطة جديدة كل يوم على حسب سعرات اليوزر
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

// بيختار وجبة سعراتها قريبة من نصيب الوجبة دي من هدف اليوم
const pickMeal = (slotKey, targetCal, rand, excludeIds = []) => {
  let list = MEALS_DB[slotKey].filter((m) => !excludeIds.includes(m.id));
  if (list.length === 0) list = MEALS_DB[slotKey];
  const sorted = [...list].sort((a, b) => Math.abs(a.cal - targetCal) - Math.abs(b.cal - targetCal));
  const pool = sorted.slice(0, Math.max(8, Math.ceil(sorted.length * 0.3)));
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
  if (!validPlan || plan.date !== today || plan.targetCal !== targets.cal) {
    const histRaw = await AsyncStorage.getItem(K.history);
    let history = histRaw ? JSON.parse(histRaw) : [];
    if (validPlan && plan.date !== today) history = [...Object.values(plan.ids), ...history];
    history = history.slice(0, 12); // متكررش وجبات آخر 3 أيام

    const rand = seeded(hash(today + targets.cal));
    const ids = {};
    SLOTS.forEach((s) => {
      const keep = validPlan && plan.date === today && eaten.includes(plan.ids[s.type]);
      ids[s.type] = keep ? plan.ids[s.type] : pickMeal(s.key, targets.cal * s.share, rand, history).id;
    });
    plan = { date: today, targetCal: targets.cal, ids };
    await AsyncStorage.multiSet([[K.plan, JSON.stringify(plan)], [K.history, JSON.stringify(history)]]);
  }
  return { targets, eaten, meals: buildMeals(plan) };
};

// التبديل الذكي: وجبة تانية من نفس النوع وبسعرات قريبة (±25%)
export const swapMealInPlan = async (type) => {
  const raw = await AsyncStorage.getItem(K.plan);
  if (!raw) return null;
  const plan = JSON.parse(raw);
  const slot = SLOTS.find((s) => s.type === type);
  const current = MEALS_BY_ID[plan.ids[type]];
  if (!slot || !current) return null;

  const used = Object.values(plan.ids);
  const all = MEALS_DB[slot.key].filter((m) => !used.includes(m.id));
  let candidates = all.filter((m) => Math.abs(m.cal - current.cal) <= current.cal * 0.25);
  if (candidates.length < 3) candidates = all;
  if (candidates.length === 0) return null;
  const next = candidates[Math.floor(Math.random() * candidates.length)];

  plan.ids[type] = next.id;
  await AsyncStorage.setItem(K.plan, JSON.stringify(plan));

  const eaten = await getEatenToday();
  if (eaten.includes(current.id)) await setEatenToday(eaten.filter((id) => id !== current.id));

  return { ...next, type: slot.type, label: slot.label, time: slot.time, icon: slot.icon };
};

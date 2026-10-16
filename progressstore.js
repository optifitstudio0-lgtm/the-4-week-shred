// =========================================================
// محرك التقدم: الأيام المكتملة، الستريك، الوزن، صور قبل وبعد، البادچات
// كل حاجة محفوظة على الموبايل (AsyncStorage) ومفيش أي سيرفر
// =========================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateKey, addDays, diffDays } from './dates';
import { BADGES } from './badges';
import { recalcTargets } from './nutrition';

export const TOTAL_DAYS = 28;

const K = {
  completed: 'completedDays',     // { [dayId]: 'YYYY-MM-DD' }
  workoutDates: 'workoutDates',   // ['YYYY-MM-DD', ...] الأيام اللي اتمرن فيها
  start: 'challengeStart',
  finished: 'challengeFinished',
  weights: 'weightLog',           // [{ date, kg }]
  photos: 'progressPhotos',       // [{ id, uri, date, day, kg }]
  perfectMeals: 'perfectMealDays',
  badges: 'earnedBadges',         // { [badgeId]: 'YYYY-MM-DD' }
  workoutPrefs: 'workoutPrefs',
  round: 'currentRound',          // رقم الجولة الحالية (1، 2، 3، ...)
  rounds: 'roundsHistory',        // [{ round, start, finish }] الجولات اللي خلصت
};

const getJSON = async (key, fallback) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};
const setJSON = (key, value) => AsyncStorage.setItem(key, JSON.stringify(value));

// ---------------- إعدادات التمرين ----------------
export const DEFAULT_WORKOUT_PREFS = { voice: true, restSec: 20, getReadySec: 5 };
export const getWorkoutPrefs = async () => ({ ...DEFAULT_WORKOUT_PREFS, ...(await getJSON(K.workoutPrefs, {})) });
export const saveWorkoutPrefs = async (prefs) => setJSON(K.workoutPrefs, { ...(await getWorkoutPrefs()), ...prefs });

// ---------------- بداية التحدي ----------------
export const ensureChallengeStart = async () => {
  let start = await AsyncStorage.getItem(K.start);
  if (!start) {
    start = dateKey();
    await AsyncStorage.setItem(K.start, start);
  }
  return start;
};

// ---------------- الأيام المكتملة ----------------
export const getCompletedDays = async () => getJSON(K.completed, {});

// اليوم الجاي في الخطة (أول يوم لسه ما خلصش)
export const getCurrentDay = async () => {
  const completed = await getCompletedDays();
  for (let d = 1; d <= TOTAL_DAYS; d++) if (!completed[d]) return d;
  return TOTAL_DAYS;
};

export const isChallengeComplete = async () => {
  const completed = await getCompletedDays();
  return Object.keys(completed).length >= TOTAL_DAYS || !!completed[TOTAL_DAYS];
};

// ---------------- الجولات ----------------
export const getRound = async () => parseInt(await AsyncStorage.getItem(K.round), 10) || 1;
export const getRoundsHistory = async () => getJSON(K.rounds, []);

// يبدأ جولة جديدة: الأيام بترجع من 1، والستريك والبادچات والوزن والصور والشهادات القديمة كلها محفوظة
export const startNextRound = async () => {
  if (!(await isChallengeComplete())) return null;
  const round = await getRound();
  const completed = await getCompletedDays();
  const history = await getRoundsHistory();
  if (!history.some((h) => h.round === round)) {
    history.push({
      round,
      start: (await AsyncStorage.getItem(K.start)) || null,
      finish: (await AsyncStorage.getItem(K.finished)) || completed[TOTAL_DAYS] || dateKey(),
    });
    await setJSON(K.rounds, history);
  }
  const next = round + 1;
  await AsyncStorage.multiRemove([K.completed, K.finished, 'dayProgress']);
  await AsyncStorage.multiSet([[K.start, dateKey()], [K.round, String(next)], ['dayProgress', '1']]);
  return next;
};

// وضع التطوير بس: يخلّص الـ28 يوم عشان تجرّب الجولة الجاية
export const devCompleteRound = async () => {
  if (!__DEV__) return;
  const today = dateKey();
  const completed = {};
  for (let d = 1; d <= TOTAL_DAYS; d++) completed[d] = today;
  await setJSON(K.completed, completed);
  await AsyncStorage.setItem(K.finished, today);
};

// ---------------- الستريك ----------------
const computeStreaks = (dates) => {
  const set = new Set(dates);
  const today = dateKey();
  // الستريك الحالي: بيعد لورا من النهارده (أو من امبارح لو لسه ما اتمرنتش النهارده)
  let cursor = set.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  // أحسن ستريك
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  sorted.forEach((d) => {
    run = prev && diffDays(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  });
  return { current, best: Math.max(best, current), trainedToday: set.has(today) };
};

export const getStreak = async () => computeStreaks(await getJSON(K.workoutDates, []));

// ---------------- الوزن ----------------
export const getWeightLog = async () => {
  const log = await getJSON(K.weights, []);
  return log.sort((a, b) => (a.date < b.date ? -1 : 1));
};

// تسجيل وزن (وزن واحد لكل يوم، آخر تسجيل في اليوم هو اللي بيتحسب)
export const logWeight = async (kg, date = dateKey()) => {
  const value = Math.round(parseFloat(kg) * 10) / 10;
  if (!value || isNaN(value)) return getWeightLog();
  const log = (await getWeightLog()).filter((e) => e.date !== date);
  log.push({ date, kg: value });
  log.sort((a, b) => (a.date < b.date ? -1 : 1));
  await setJSON(K.weights, log);
  // آخر وزن متسجل هو الوزن الحالي، وبنعيد حساب السعرات والبروتين والمية عليه
  const latest = log[log.length - 1].kg;
  await AsyncStorage.setItem('userWeight', String(latest));
  await recalcTargets();
  return log;
};

export const deleteWeight = async (date) => {
  const log = (await getWeightLog()).filter((e) => e.date !== date);
  await setJSON(K.weights, log);
  if (log.length) {
    await AsyncStorage.setItem('userWeight', String(log[log.length - 1].kg));
    await recalcTargets();
  }
  return log;
};

// ---------------- الصور ----------------
export const getPhotos = async () => {
  const list = await getJSON(K.photos, []);
  return list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));
};
export const savePhotos = (list) => setJSON(K.photos, list);

export const addPhoto = async (uri) => {
  const list = await getPhotos();
  const log = await getWeightLog();
  const day = await getCurrentDay();
  const entry = {
    id: Date.now(),
    uri,
    date: dateKey(),
    day,
    kg: log.length ? log[log.length - 1].kg : null,
  };
  list.push(entry);
  await savePhotos(list);
  return list;
};

// ---------------- الأكل ----------------
export const markPerfectMealDay = async (isPerfect) => {
  const today = dateKey();
  let days = await getJSON(K.perfectMeals, []);
  days = days.filter((d) => d !== today);
  if (isPerfect) days.push(today);
  await setJSON(K.perfectMeals, days);
};

// ---------------- إحصائيات شاملة (للبادچات والشهادة) ----------------
export const getStats = async () => {
  const [completed, dates, weights, photos, perfect, waterHistory, start, goalRaw, round, history, finished] = await Promise.all([
    getCompletedDays(),
    getJSON(K.workoutDates, []),
    getWeightLog(),
    getPhotos(),
    getJSON(K.perfectMeals, []),
    getJSON('waterHistory', {}),
    AsyncStorage.getItem(K.start),
    AsyncStorage.getItem('waterGoal'),
    getRound(),
    getRoundsHistory(),
    AsyncStorage.getItem(K.finished),
  ]);
  const waterGoal = parseInt(goalRaw) || 3000;
  const streak = computeStreaks(dates);
  const startKg = weights.length ? weights[0].kg : null;
  const currentKg = weights.length ? weights[weights.length - 1].kg : null;
  const completedCount = Object.keys(completed).length;
  const challengeComplete = completedCount >= TOTAL_DAYS || !!completed[TOTAL_DAYS];
  const roundsCompleted = history.filter((h) => h.round !== round).length + (challengeComplete ? 1 : 0);
  // الشهادة: الجولة الحالية لو خلصت، وإلا آخر جولة خلصت قبل كده
  const last = history[history.length - 1];
  const cert = challengeComplete
    ? { round, startDate: start, finishDate: finished || completed[TOTAL_DAYS] || null }
    : last
    ? { round: last.round, startDate: last.start, finishDate: last.finish }
    : null;
  return {
    completed,
    completedCount,
    sessions: dates.length,
    streak: streak.current,
    bestStreak: streak.best,
    trainedToday: streak.trainedToday,
    startKg,
    currentKg,
    kgChange: startKg != null && currentKg != null ? Math.round((currentKg - startKg) * 10) / 10 : 0,
    weightEntries: weights.length,
    photosCount: photos.length,
    perfectMealDays: perfect.length,
    waterGoalDays: Object.values(waterHistory).filter((ml) => ml >= waterGoal).length,
    challengeComplete,
    startDate: start,
    finishDate: completed[TOTAL_DAYS] || null,
    round,
    roundsCompleted,
    cert,
  };
};

// بيراجع البادچات ويحفظ الجديد. بيرجع البادچات اللي اتفتحت دلوقتي بس
export const syncBadges = async (statsArg) => {
  const stats = statsArg || (await getStats());
  const earned = await getJSON(K.badges, {});
  const fresh = [];
  BADGES.forEach((b) => {
    if (!earned[b.id] && b.check(stats)) {
      earned[b.id] = dateKey();
      fresh.push(b);
    }
  });
  if (fresh.length) await setJSON(K.badges, earned);
  return { earned, fresh, stats };
};

// ---------------- إنهاء تمرين يوم ----------------
export const markDayComplete = async (dayId) => {
  const today = dateKey();
  await ensureChallengeStart();
  const completed = await getCompletedDays();
  const alreadyDone = !!completed[dayId];
  if (!alreadyDone) completed[dayId] = today;
  await setJSON(K.completed, completed);

  const dates = await getJSON(K.workoutDates, []);
  if (!dates.includes(today)) dates.push(today);
  await setJSON(K.workoutDates, dates);

  // dayProgress القديم: بنخليه دايمًا = أول يوم لسه ما خلصش (عشان الشاشات القديمة)
  const next = await getCurrentDay();
  await AsyncStorage.setItem('dayProgress', String(next));

  const { fresh, stats } = await syncBadges();
  if (stats.challengeComplete) {
    const wasFinished = await AsyncStorage.getItem(K.finished);
    if (!wasFinished) await AsyncStorage.setItem(K.finished, today);
  }
  return { alreadyDone, newBadges: fresh, stats, round: stats.round, justFinishedChallenge: stats.challengeComplete && dayId === TOTAL_DAYS && !alreadyDone };
};

// ---------------- يوم "أقل حاجة" (نسخة 7 دقايق) ----------------
// بيحسب في الستريك، بس اليوم نفسه بيفضل مفتوح في الخطة عشان يكمّله كامل بعدين
export const markMiniWorkout = async () => {
  const today = dateKey();
  await ensureChallengeStart();
  const dates = await getJSON(K.workoutDates, []);
  if (!dates.includes(today)) dates.push(today);
  await setJSON(K.workoutDates, dates);
  const { fresh, stats } = await syncBadges();
  return { alreadyDone: false, newBadges: fresh, stats, mini: true, justFinishedChallenge: false };
};

// مسح التقدم بس (من غير ما نمسح بيانات الجسم والخطة). بيعيد الجولة الحالية من الأول، والجولات اللي خلصت بتفضل محفوظة
export const resetProgress = async () => {
  await AsyncStorage.multiRemove([K.completed, K.workoutDates, K.start, K.finished, K.badges, K.perfectMeals, 'dayProgress']);
  await AsyncStorage.setItem(K.start, dateKey());
};

// نسخة قديمة كانت بتحفظ dayProgress بس: نحوّلها لأيام مكتملة مرة واحدة
export const migrateLegacyProgress = async () => {
  try {
    const done = await AsyncStorage.getItem('progressMigrated');
    if (done) return;
    const completed = await getCompletedDays();
    const legacy = parseInt(await AsyncStorage.getItem('dayProgress')) || 1;
    if (!Object.keys(completed).length && legacy > 1) {
      const today = dateKey();
      for (let d = 1; d < Math.min(legacy, TOTAL_DAYS + 1); d++) completed[d] = today;
      await setJSON(K.completed, completed);
    }
    const w = parseFloat(await AsyncStorage.getItem('userWeight'));
    const log = await getWeightLog();
    if (!log.length && w) await setJSON(K.weights, [{ date: dateKey(), kg: w }]);
    await AsyncStorage.setItem('progressMigrated', '1');
  } catch (e) {
    console.log('migrate', e);
  }
};

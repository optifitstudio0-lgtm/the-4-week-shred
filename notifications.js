// =========================================================
// الإشعارات المحلية: تمرين + مية + وجبات + صورة/وزن أسبوعي + "الستريك هيضيع"
// كلها Local Notifications (مش محتاجة سيرفر) وبتشتغل في Expo Go
// =========================================================
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatTime, daysLabel } from './dates';
import { tr } from './i18n';

const CHANNEL = 'reminders';
const KEY = 'reminderSettings';
const STREAK_ID = 'streak-saver';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const DEFAULT_REMINDERS = {
  enabled: false,
  workout: { on: true, hour: 18, minute: 0 },
  water: { on: true, from: 9, to: 21, every: 2 },
  meals: {
    on: true,
    breakfast: { hour: 8, minute: 0 },
    lunch: { hour: 13, minute: 0 },
    snack: { hour: 16, minute: 30 },
    dinner: { hour: 20, minute: 0 },
  },
  weekly: { on: true, weekday: 6, hour: 11, minute: 0 }, // 1 = الأحد ... 6 = الجمعة
  streak: { on: true, hour: 21, minute: 0 },
};

const merge = (base, saved) => {
  const out = { ...base };
  Object.keys(saved || {}).forEach((k) => {
    out[k] = base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) ? merge(base[k], saved[k]) : saved[k];
  });
  return out;
};

export const getReminders = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return merge(DEFAULT_REMINDERS, raw ? JSON.parse(raw) : {});
  } catch (e) {
    return DEFAULT_REMINDERS;
  }
};

// ---------------- الصلاحيات ----------------
const ensureChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: tr('التذكيرات'),
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#2ECC71',
    sound: 'default',
  });
};

export const requestPermission = async () => {
  try {
    await ensureChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted || (current.ios && current.ios.status === 3)) return true; // 3 = provisional على iOS
    if (!current.canAskAgain && current.status === 'denied') return false;
    const res = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
    return !!res.granted;
  } catch (e) {
    console.log('notif permission', e);
    return false;
  }
};

// ---------------- أشكال الـ Trigger (الجديد SDK 52+ والقديم) ----------------
const TT = Notifications.SchedulableTriggerInputTypes;
const daily = (hour, minute) =>
  TT ? { type: TT.DAILY, hour, minute, channelId: CHANNEL } : { hour, minute, repeats: true, channelId: CHANNEL };
const weekly = (weekday, hour, minute) =>
  TT ? { type: TT.WEEKLY, weekday, hour, minute, channelId: CHANNEL } : { weekday, hour, minute, repeats: true, channelId: CHANNEL };
const atDate = (date) => (TT ? { type: TT.DATE, date, channelId: CHANNEL } : { date, channelId: CHANNEL });
const inSeconds = (seconds) =>
  TT ? { type: TT.TIME_INTERVAL, seconds, repeats: false, channelId: CHANNEL } : { seconds, channelId: CHANNEL };

const schedule = (title, body, trigger, screen, identifier) =>
  Notifications.scheduleNotificationAsync({
    ...(identifier ? { identifier } : {}),
    content: { title, body, sound: 'default', data: { screen } },
    trigger,
  });

// ---------------- النصوص ----------------
const WATER_LINES = [
  [tr('كوباية مية؟ 💧'), tr('ابدأ يومك بكوباية مية. جسمك محتاجها عشان يحرق.')],
  [tr('وقت المية 💧'), tr('اشرب كوباية دلوقتي وسجّلها في التطبيق.')],
  [tr('جسمك عطشان 🥤'), tr('العطش ساعات بيتلبس جوع. اشرب الأول.')],
  [tr('استراحة مية 💦'), tr('كوباية واحدة بتفرق في الطاقة والتركيز.')],
  [tr('متنساش المية 💧'), tr('قربت توصل لهدفك؟ ادخل شوف فاضلك قد إيه.')],
  [tr('كمان كوباية 🚰'), tr('المية بتقلل احتباس السوايل وبتبيّن النتيجة أسرع.')],
  [tr('آخر كوبايات اليوم 🌙'), tr('كمّل هدف المية قبل ما تنام.')],
];

const MEAL_LINES = {
  breakfast: [tr('الفطار جاهز؟ 🍳'), tr('افتح خطة النهارده وشوف فطارك، وعلّم عليه لما تاكله.')],
  lunch: [tr('وقت الغدا 🍗'), tr('وجبة الغدا مستنياك في الخطة. متفوّتهاش.')],
  snack: [tr('سناك خفيف 🍎'), tr('سناك صغير دلوقتي يحميك من الجوع بالليل.')],
  dinner: [tr('العشا 🌙'), tr('عشا خفيف ونضيف، وبكده تقفل يومك صح.')],
};

// ---------------- الجدولة ----------------
export const rescheduleAll = async (settingsArg) => {
  const s = settingsArg || (await getReminders());
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!s.enabled) return;
    await ensureChannel();
    const jobs = [];

    if (s.workout.on) {
      jobs.push(schedule(tr('وقت التمرين 💪'), tr('تمرين النهارده مستنيك. كام دقيقة وتبقى خلّصت وزوّدت الستريك 🔥'), daily(s.workout.hour, s.workout.minute), 'Workout'));
    }

    if (s.water.on) {
      let i = 0;
      for (let h = s.water.from; h <= s.water.to; h += Math.max(1, s.water.every)) {
        const [title, body] = WATER_LINES[i % WATER_LINES.length];
        jobs.push(schedule(title, body, daily(h, 0), 'WaterScreen'));
        i++;
      }
    }

    if (s.meals.on) {
      ['breakfast', 'lunch', 'snack', 'dinner'].forEach((k) => {
        const t = s.meals[k];
        const [title, body] = MEAL_LINES[k];
        jobs.push(schedule(title, body, daily(t.hour, t.minute), 'MealsTab'));
      });
    }

    if (s.weekly.on) {
      jobs.push(schedule(tr('صورة الأسبوع 📸'), tr('صوّر صورة تقدم وسجّل وزنك. الفرق بيبان في الصور قبل الميزان.'), weekly(s.weekly.weekday, s.weekly.hour, s.weekly.minute), 'ProgressPhotos'));
    }

    await Promise.all(jobs);
  } catch (e) {
    console.log('reschedule error', e);
  }
};

export const saveReminders = async (settings) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  await rescheduleAll(settings);
};

// تفعيل التذكيرات بالإعدادات الافتراضية (من كارت الهوم أو الإعدادات)
export const enableReminders = async () => {
  const ok = await requestPermission();
  if (!ok) return false;
  const s = await getReminders();
  await saveReminders({ ...s, enabled: true });
  return true;
};

// إشعار "الستريك هيضيع" لليوم ده بس، وبيتلغي أول ما تخلّص تمرين
export const refreshStreakSaver = async ({ trainedToday, streak }) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(STREAK_ID).catch(() => {});
    const s = await getReminders();
    if (!s.enabled || !s.streak.on || trainedToday) return;
    const when = new Date();
    when.setHours(s.streak.hour, s.streak.minute, 0, 0);
    if (when <= new Date()) return;
    const body = streak > 0
      ? tr('عندك ستريك {0} 🔥 ادخل خلّص تمرينك قبل ما اليوم يخلص.', daysLabel(streak))
      : tr('لسه فيه وقت تتمرن النهارده. ابدأ ستريك جديد 🔥');
    await schedule(streak > 0 ? tr('الستريك هيضيع! 🔥') : tr('يلا نبدأ ستريك 🔥'), body, atDate(when), 'Workout', STREAK_ID);
  } catch (e) {
    console.log('streak saver', e);
  }
};

export const sendTestNotification = async () => {
  const ok = await requestPermission();
  if (!ok) return false;
  await schedule(tr('التذكيرات شغالة ✅'), tr('كده هتوصلك تذكيرات التمرين والمية والأكل في مواعيدها.'), inSeconds(3), 'HomeTab');
  return true;
};

export const describeReminder = (t) => formatTime(t.hour, t.minute);

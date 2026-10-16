// =========================================================
// زرار "بيوجعني": بنبدّل أي تمرين بيضغط على مكان الوجع ببديل آمن
// - كل تمرين ليه نوع (كارديو/رجل/علوي/بطن/إطالة) + الأماكن اللي بيضغط عليها
// - البديل من نفس النوع لو ينفع، وبنفس طريقة العد (وقت/عدّات)، ومن غير تكرار كتير
// - الأماكن بتتحفظ، فباقي الخطة كلها بتتظبط لحد ما المستخدم يقول "خف خلاص"
// =========================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXERCISE_LIBRARY } from './exercisesdata';
import { durationAr } from './ar_exercises';
import { LANG, tr } from './i18n';
import { dateKey } from './dates';

export const PAIN_AREAS = [
  { id: 'knee', label: tr('الركبة'), icon: 'walk' },
  { id: 'back', label: tr('أسفل الضهر'), icon: 'body' },
  { id: 'shoulder', label: tr('الكتف'), icon: 'barbell' },
  { id: 'wrist', label: tr('الرسغ / الإيد'), icon: 'hand-left' },
];

// C كارديو | L رجل | U علوي | K بطن ووسط | M إحماء وإطالة
// k ركبة | b ضهر | s كتف | w رسغ
const INFO = {
  jumping_jacks: ['C', 'k'], high_knees: ['C', 'k'], burpees: ['C', 'kbsw'], mountain_climbers: ['C', 'sw'],
  butt_kicks: ['C', 'k'], step_jacks: ['C', ''], seal_jacks: ['C', 'k'], half_burpees: ['C', 'kbsw'],
  cross_mountain_climbers: ['C', 'sw'], spot_running: ['C', 'k'], lunge_jumps: ['C', 'k'], fast_feet: ['C', 'k'],
  skater_jumps: ['C', 'k'], squat_jumps: ['C', 'k'], tuck_jumps: ['C', 'kb'], frog_jumps: ['C', 'kb'],
  lateral_shuffle: ['C', 'k'], bear_crawl: ['C', 'sw'], crab_walk: ['C', 'sw'], plank_jacks: ['C', 'sw'],
  rope_skipping: ['C', 'k'], punches: ['C', 's'],

  squats: ['L', 'k'], lunges: ['L', 'k'], glute_bridges: ['L', ''], calf_raises: ['L', ''], wall_sit: ['L', 'k'],
  side_lunges: ['L', 'k'], pulsing_squats: ['L', 'k'], curtsy_lunges: ['L', 'k'], single_leg_glute_bridge: ['L', ''],
  step_ups: ['L', 'k'], bulgarian_split_squats: ['L', 'k'], fire_hydrant_left: ['L', 'w'], fire_hydrant_right: ['L', 'w'],
  single_leg_romanian_deadlift: ['L', 'b'], reverse_lunges: ['L', 'k'], sumo_squat: ['L', 'k'],
  donkey_kicks_left: ['L', 'w'], donkey_kicks_right: ['L', 'w'], side_leg_raise_left: ['L', ''], side_leg_raise_right: ['L', ''],

  push_ups: ['U', 'sw'], diamond_push_ups: ['U', 'sw'], tricep_dips: ['U', 'sw'], pike_push_ups: ['U', 'sw'],
  shoulder_taps: ['U', 'sw'], push_up_and_rotation: ['U', 'sw'], cobra_push_ups: ['U', 'bsw'], archer_push_ups: ['U', 'sw'],
  wall_push_ups: ['U', 'sw'], arm_circles: ['U', 's'], arm_scissors: ['U', 's'], plank_up_downs: ['U', 'sw'],
  knee_push_ups: ['U', 'sw'], wide_arm_push_ups: ['U', 'sw'], incline_push_ups: ['U', 'sw'], decline_push_ups: ['U', 'sw'],
  box_push_ups: ['U', 'sw'], hindu_push_ups: ['U', 'bsw'], tricep_extension_floor: ['U', 'sw'], reverse_snow_angels: ['U', 'bs'],

  plank: ['K', 's'], high_plank: ['K', 'sw'], crunches: ['K', ''], leg_raises: ['K', 'b'], russian_twists: ['K', 'b'],
  bicycle_crunches: ['K', 'b'], heel_touch: ['K', ''], ab_pulse: ['K', ''], bird_dog: ['K', 'w'], hollow_body_hold: ['K', 'b'],
  toe_touch_crunches: ['K', ''], scissor_kicks: ['K', 'b'], windshield_wipers: ['K', 'b'], sit_ups: ['K', 'b'],
  flutter_kicks: ['K', 'b'], reverse_crunches: ['K', ''], side_plank_left: ['K', 's'], side_plank_right: ['K', 's'],
  v_up: ['K', 'b'], dead_bug: ['K', ''], superman: ['K', 'b'],

  neck_rolls: ['M', ''], shoulder_rolls: ['M', ''], hip_circles: ['M', ''], knee_circles: ['M', 'k'], ankle_circles: ['M', ''],
  cat_cow_stretch: ['M', 'w'], standing_toe_touch: ['M', 'b'], inchworms: ['M', 'bsw'], downward_dog: ['M', 'sw'],
  hamstring_stretch: ['M', ''], hip_flexor_stretch: ['M', 'k'], torso_twist: ['M', ''], cobra_stretch: ['M', 'w'],
  childs_pose: ['M', 'k'], quad_stretch: ['M', 'k'], chest_stretch: ['M', ''], butterfly_stretch: ['M', ''],
};

// نوع التمرين: C كارديو | L رجل | U علوي | K بطن | M إحماء وإطالة
export const exerciseCategory = (id) => INFO[id]?.[0] || 'M';

const AREA_CODE = { knee: 'k', back: 'b', shoulder: 's', wrist: 'w' };

// البدايل بالترتيب (الأول هو الأفضل)
const POOLS = {
  C: ['jumping_jacks', 'step_jacks', 'high_knees', 'butt_kicks', 'spot_running', 'seal_jacks', 'fast_feet', 'mountain_climbers', 'cross_mountain_climbers', 'punches', 'arm_scissors'],
  L: ['glute_bridges', 'squats', 'reverse_lunges', 'sumo_squat', 'calf_raises', 'side_leg_raise_left', 'side_leg_raise_right', 'single_leg_glute_bridge', 'donkey_kicks_left', 'donkey_kicks_right', 'wall_sit'],
  U: ['push_ups', 'knee_push_ups', 'incline_push_ups', 'wall_push_ups', 'tricep_dips', 'pike_push_ups', 'arm_circles', 'arm_scissors', 'punches', 'reverse_snow_angels', 'superman'],
  K: ['plank', 'dead_bug', 'heel_touch', 'crunches', 'reverse_crunches', 'bicycle_crunches', 'side_plank_left', 'side_plank_right', 'bird_dog', 'toe_touch_crunches', 'ab_pulse', 'leg_raises'],
  M: ['hip_circles', 'shoulder_rolls', 'neck_rolls', 'ankle_circles', 'hamstring_stretch', 'chest_stretch', 'butterfly_stretch', 'torso_twist', 'cat_cow_stretch', 'childs_pose', 'cobra_stretch', 'quad_stretch', 'hip_flexor_stretch'],
};
// لو مفيش بديل آمن من نفس النوع، بندوّر في الأنواع دي بالترتيب
const FALLBACK = { C: ['C', 'L', 'K', 'M'], L: ['L', 'K', 'M'], U: ['U', 'K', 'L', 'M'], K: ['K', 'L', 'M'], M: ['M'] };

const stresses = (id, codes) => {
  const s = INFO[id]?.[1] || '';
  return codes.some((c) => s.includes(c));
};

const localize = (txt) => (LANG === 'ar' ? durationAr(txt) : txt);

// بنحوّل المدة لو البديل بيتعد بطريقة تانية (وقت بدل عدّات أو العكس)
const convertDuration = (item, toType) => {
  if (toType === 'time') {
    const sec = item.durationSec > 0 ? item.durationSec : 30;
    return { duration: localize(`${sec}s`), durationSec: sec };
  }
  return { duration: localize('12 reps'), durationSec: 0 };
};

// list = تمارين اليوم بعد ما اتدمجت مع EXERCISE_LIBRARY | areas = ['knee', ...]
export const adaptForPain = (list, areas = []) => {
  if (!areas.length) return list;
  const codes = areas.map((a) => AREA_CODE[a]).filter(Boolean);
  const used = {};
  list.forEach((x) => { used[x.id] = (used[x.id] || 0) + 1; });

  return list.map((item) => {
    if (item.id === 'rest' || !stresses(item.id, codes)) return item;
    const cat = INFO[item.id]?.[0] || 'M';
    const type = item.type;
    let best = null;
    let bestScore = Infinity;
    (FALLBACK[cat] || ['M']).forEach((c, ci) => {
      POOLS[c].forEach((id, pi) => {
        const lib = EXERCISE_LIBRARY[id];
        if (!lib || id === item.id || stresses(id, codes)) return;
        // نفس النوع أولًا، ونفس طريقة العد، ومن غير ما نكرر نفس البديل كتير (التكرار التالت بيروح لنوع تاني)
        const score = ci * 300 + (lib.type === type ? 0 : 100) + (used[id] || 0) * 250 + pi;
        if (score < bestScore) { bestScore = score; best = lib; }
      });
    });
    if (!best) return item;
    used[best.id] = (used[best.id] || 0) + 1;
    const dur = best.type === type ? { duration: item.duration, durationSec: item.durationSec } : convertDuration(item, best.type);
    return { ...best, ...dur, swappedFrom: item.name };
  });
};

// ---------------- الحفظ ----------------
const KEY = 'painAreas';
export const getPainAreas = async () => {
  try {
    const v = JSON.parse((await AsyncStorage.getItem(KEY)) || 'null');
    return v?.areas || [];
  } catch (e) {
    return [];
  }
};
export const savePainAreas = async (areas) => {
  if (!areas?.length) return AsyncStorage.removeItem(KEY);
  return AsyncStorage.setItem(KEY, JSON.stringify({ areas, since: dateKey() }));
};
export const painLabel = (areas) => areas.map((a) => PAIN_AREAS.find((p) => p.id === a)?.label).filter(Boolean).join(tr('، '));

// ---------------- يوم "أقل حاجة" ----------------
// نسخة حوالي 7 دقايق من تمرين النهارده: أول تمرين (إحماء) + آخر تمرين (إطالة) + تمارين من النص بالتساوي
const MINI_BUDGET = 7 * 60;
const estSec = (x) => (x.type === 'time' ? x.durationSec || 30 : 40);

export const buildMini = (list, restSec = 20) => {
  if (list.length < 4) return list;
  const cap = (x) => (x.type === 'time' && x.durationSec > 30 ? { ...x, durationSec: 30, duration: localize('30s') } : x);
  const first = cap(list[0]);
  const last = cap(list[list.length - 1]);
  const middle = list.slice(1, -1).map(cap);
  const total = (arr) => arr.reduce((t, x) => t + estSec(x), 0) + restSec * (arr.length - 1);
  for (let k = middle.length; k >= 1; k--) {
    const step = middle.length / k;
    const pick = [...Array(k)].map((_, i) => middle[Math.floor(i * step + step / 2)]);
    const arr = [first, ...pick, last];
    if (total(arr) <= MINI_BUDGET) return arr;
  }
  return [first, middle[Math.floor(middle.length / 2)], last];
};

export const estimateMinutes = (list, restSec = 20) =>
  Math.max(1, Math.round((list.reduce((t, x) => t + estSec(x), 0) + restSec * Math.max(0, list.length - 1)) / 60));

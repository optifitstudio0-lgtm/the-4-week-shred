// =========================================================
// الجولات + مستوى التمرين
// الجولات: بعد ما يخلّص الـ28 يوم يبدأ جولة جديدة، وكل جولة أصعب من اللي قبلها
// - عداد الجولات بيزيد طول العمر (مفيش آخر)
// - الصعوبة بتزيد لحد الجولة 4 وبعدها بتثبت على أعلى مستوى (عشان محدش يتعوّر)
// - الإحماء والإطالة مش بيتغيروا، الشغل بس اللي بيزيد
// - البادچات والستريك والشهادات القديمة كلها بتفضل محفوظة
// المستوى (مبتدئ / متوسط / متقدم): نفس الـ28 يوم بس بصعوبة مختلفة
// - المتوسط = الخطة الأصلية بالظبط (وده الافتراضي لأي حد قديم)
// - المبتدئ: أخف 20% + راحة أطول 10 ث + التمارين الصعبة جدًا بتتبدل بأسهل منها
// - المتقدم: أصعب 25% + راحة أقل 5 ث
// - المستوى بيتضرب في صعوبة الجولة، وبحد أقصى عشان محدش يتعوّر
// =========================================================
import { exerciseCategory } from './pain';
import { LANG, tr } from './i18n';
import { durationAr } from './ar_exercises';
import { EXERCISE_LIBRARY } from './exercisesdata';

export const MAX_ROUND_LEVEL = 4;
// الجولة 1 = الخطة الأصلية | 2 = +20% | 3 = +35% | 4 وبعدها = +50%
const MULT = { 1: 1, 2: 1.2, 3: 1.35, 4: 1.5 };
const REST_CUT = { 1: 0, 2: 5, 3: 10, 4: 10 };
const MAX_HOLD_SEC = 90; // أطول تمرين بالوقت
const MIN_HOLD_SEC = 15; // أقصر تمرين بالوقت (للمبتدئ)
const MIN_REPS = 4; // أقل عدد عدّات (للمبتدئ)
const MIN_TOTAL_MULT = 0.6;
const MAX_TOTAL_MULT = 1.75; // المتقدم في الجولة 4 مش هيعدّي +75%

// ---------------- المستوى ----------------
export const DEFAULT_LEVEL = 'intermediate';
export const FITNESS_LEVELS = [
  { id: 'beginner', label: tr('مبتدئ'), subtitle: tr('لسه بادئ أو بقالك فترة مش بتتمرن'), hint: tr('تمارين أخف 20% وراحة أطول'), icon: 'leaf-outline' },
  { id: 'intermediate', label: tr('متوسط'), subtitle: tr('بتتمرن من وقت للتاني'), hint: tr('الخطة الأصلية زي ما هي'), icon: 'flash-outline' },
  { id: 'advanced', label: tr('متقدم'), subtitle: tr('بتتمرن بانتظام وعايز تحدي أكبر'), hint: tr('تمارين أصعب 25% وراحة أقل'), icon: 'flame-outline' },
];
const LEVEL_MULT = { beginner: 0.8, intermediate: 1, advanced: 1.25 };
const LEVEL_REST = { beginner: 10, intermediate: 0, advanced: -5 };

export const normalizeLevel = (level) => (LEVEL_MULT[level] ? level : DEFAULT_LEVEL);
export const levelInfo = (level) => FITNESS_LEVELS.find((l) => l.id === normalizeLevel(level));

// المبتدئ: التمارين الصعبة جدًا بتتبدل بأسهل منها (نفس طريقة العد ونفس العضلة)
const EASIER = {
  burpees: 'half_burpees',
  tuck_jumps: 'squat_jumps',
  frog_jumps: 'squat_jumps',
  lunge_jumps: 'reverse_lunges',
  skater_jumps: 'lateral_shuffle',
  archer_push_ups: 'knee_push_ups',
  diamond_push_ups: 'knee_push_ups',
  decline_push_ups: 'incline_push_ups',
  hindu_push_ups: 'knee_push_ups',
  cobra_push_ups: 'knee_push_ups',
  pike_push_ups: 'incline_push_ups',
  push_up_and_rotation: 'knee_push_ups',
  plank_up_downs: 'shoulder_taps',
  v_up: 'crunches',
  sit_ups: 'crunches',
  hollow_body_hold: 'plank',
  windshield_wipers: 'reverse_crunches',
  bulgarian_split_squats: 'reverse_lunges',
  single_leg_romanian_deadlift: 'glute_bridges',
};

const easierForBeginner = (list) =>
  list.map((x) => {
    const lib = EXERCISE_LIBRARY[EASIER[x.id]];
    if (!lib || lib.type !== x.type) return x;
    return { ...lib, duration: x.duration, durationSec: x.durationSec, swappedFrom: x.name };
  });

// ---------------- الجولات ----------------
export const roundLevel = (round) => Math.min(Math.max(parseInt(round, 10) || 1, 1), MAX_ROUND_LEVEL);
export const roundMultiplier = (round) => MULT[roundLevel(round)];
export const roundPercent = (round) => Math.round((roundMultiplier(round) - 1) * 100);
export const isMaxRound = (round) => roundLevel(round) >= MAX_ROUND_LEVEL;

const totalMultiplier = (round, level) =>
  Math.min(MAX_TOTAL_MULT, Math.max(MIN_TOTAL_MULT, roundMultiplier(round) * LEVEL_MULT[normalizeLevel(level)]));

// الراحة: الجولات الجاية بتقللها، والمبتدئ بيزودها، والمتقدم بيقللها شوية
// عمرها ما تنزل تحت 10 ث (ولو المستخدم مختار 10 ث أو أقل مش بتقل عن اختياره)
export const restForRound = (restSec, round, level = DEFAULT_LEVEL) => {
  if (!restSec) return restSec;
  const r = restSec + LEVEL_REST[normalizeLevel(level)] - REST_CUT[roundLevel(round)];
  return restSec <= 10 ? Math.max(restSec, r) : Math.max(10, r);
};

const localize = (txt) => (LANG === 'ar' ? durationAr(txt) : txt);

export const scaleForRound = (list, round, level = DEFAULT_LEVEL) => {
  const lv = normalizeLevel(level);
  const base = lv === 'beginner' ? easierForBeginner(list) : list;
  const m = totalMultiplier(round, lv);
  if (m === 1) return base;
  return base.map((x) => {
    if (x.id === 'rest' || exerciseCategory(x.id) === 'M') return x;
    if (x.type === 'time' && x.durationSec > 0) {
      const sec = Math.min(MAX_HOLD_SEC, Math.max(MIN_HOLD_SEC, Math.round((x.durationSec * m) / 5) * 5));
      return { ...x, durationSec: sec, duration: localize(`${sec}s`) };
    }
    const n = String(x.duration || '').match(/\d+/);
    if (n) {
      const reps = Math.max(MIN_REPS, Math.round(parseInt(n[0], 10) * m));
      return { ...x, duration: String(x.duration).replace(/\d+/, String(reps)) };
    }
    return x;
  });
};

// "الجولة 2 • +20%"
export const roundLabel = (round) => (round > 1 ? tr('الجولة {0}', round) : '');
export const roundHint = (round) =>
  isMaxRound(round)
    ? tr('أعلى مستوى: التمارين أصعب {0}% والراحة أقل', roundPercent(round))
    : tr('التمارين أصعب {0}% والراحة أقل', roundPercent(round));

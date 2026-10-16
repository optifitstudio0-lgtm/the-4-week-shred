// =========================================================
// الجولات: بعد ما يخلّص الـ28 يوم يبدأ جولة جديدة، وكل جولة أصعب من اللي قبلها
// - عداد الجولات بيزيد طول العمر (مفيش آخر)
// - الصعوبة بتزيد لحد الجولة 4 وبعدها بتثبت على أعلى مستوى (عشان محدش يتعوّر)
// - الإحماء والإطالة مش بيتغيروا، الشغل بس اللي بيزيد
// - البادچات والستريك والشهادات القديمة كلها بتفضل محفوظة
// =========================================================
import { exerciseCategory } from './pain';
import { LANG, tr } from './i18n';
import { durationAr } from './ar_exercises';

export const MAX_ROUND_LEVEL = 4;
// الجولة 1 = الخطة الأصلية | 2 = +20% | 3 = +35% | 4 وبعدها = +50%
const MULT = { 1: 1, 2: 1.2, 3: 1.35, 4: 1.5 };
const REST_CUT = { 1: 0, 2: 5, 3: 10, 4: 10 };
const MAX_HOLD_SEC = 90; // أطول تمرين بالوقت

export const roundLevel = (round) => Math.min(Math.max(parseInt(round, 10) || 1, 1), MAX_ROUND_LEVEL);
export const roundMultiplier = (round) => MULT[roundLevel(round)];
export const roundPercent = (round) => Math.round((roundMultiplier(round) - 1) * 100);
export const isMaxRound = (round) => roundLevel(round) >= MAX_ROUND_LEVEL;

// الراحة بتقل في الجولات الجاية، بس عمرها ما تنزل تحت 10 ث (ولو المستخدم مختار أقل من كده بتفضل زي ما هي)
export const restForRound = (restSec, round) => {
  if (!restSec || restSec <= 10) return restSec;
  return Math.max(10, restSec - REST_CUT[roundLevel(round)]);
};

const localize = (txt) => (LANG === 'ar' ? durationAr(txt) : txt);

export const scaleForRound = (list, round) => {
  const m = roundMultiplier(round);
  if (m === 1) return list;
  return list.map((x) => {
    if (x.id === 'rest' || exerciseCategory(x.id) === 'M') return x;
    if (x.type === 'time' && x.durationSec > 0) {
      const sec = Math.min(MAX_HOLD_SEC, Math.round((x.durationSec * m) / 5) * 5);
      return { ...x, durationSec: sec, duration: localize(`${sec}s`) };
    }
    const n = String(x.duration || '').match(/\d+/);
    if (n) {
      const reps = Math.round(parseInt(n[0], 10) * m);
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

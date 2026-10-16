import { tr } from './i18n';
import { tc } from './theme';
// =========================================================
// البادچات: كل بادچ ليها شرط بيتحسب من getStats()
// progress بيرجع رقم من 0 لـ 1 عشان نعرض شريط تقدم للبادچ المقفولة
// =========================================================
export const BADGES = [
  { id: 'first_workout', title: tr('أول خطوة'), desc: tr('خلّص أول تمرين'), icon: 'footsteps', color: tc('#2ECC71', 'fg'),
    check: (s) => s.completedCount >= 1, progress: (s) => Math.min(s.completedCount / 1, 1) },
  { id: 'streak_3', title: tr('ستريك 3 أيام'), desc: tr('اتمرن 3 أيام ورا بعض'), icon: 'flash', color: tc('#F1C40F', 'fg'),
    check: (s) => s.bestStreak >= 3, progress: (s) => Math.min(s.bestStreak / 3, 1) },
  { id: 'week_1', title: tr('الأسبوع الأول'), desc: tr('خلّص 7 أيام من التحدي'), icon: 'flame', color: tc('#E67E22', 'fg'),
    check: (s) => s.completedCount >= 7, progress: (s) => Math.min(s.completedCount / 7, 1) },
  { id: 'streak_7', title: tr('أسبوع من غير وقفة'), desc: tr('ستريك 7 أيام'), icon: 'bonfire', color: tc('#E74C3C', 'fg'),
    check: (s) => s.bestStreak >= 7, progress: (s) => Math.min(s.bestStreak / 7, 1) },
  { id: 'half_way', title: tr('نص الطريق'), desc: tr('خلّص 14 يوم'), icon: 'trending-up', color: tc('#1ABC9C', 'fg'),
    check: (s) => s.completedCount >= 14, progress: (s) => Math.min(s.completedCount / 14, 1) },
  { id: 'streak_14', title: tr('أسبوعين نار'), desc: tr('ستريك 14 يوم'), icon: 'rocket', color: tc('#9B59B6', 'fg'),
    check: (s) => s.bestStreak >= 14, progress: (s) => Math.min(s.bestStreak / 14, 1) },
  { id: 'week_3', title: tr('صمود 3 أسابيع'), desc: tr('خلّص 21 يوم'), icon: 'shield-checkmark', color: tc('#3498DB', 'fg'),
    check: (s) => s.completedCount >= 21, progress: (s) => Math.min(s.completedCount / 21, 1) },
  { id: 'champion', title: tr('بطل الـ4 أسابيع'), desc: tr('خلّص الـ28 يوم كلهم'), icon: 'trophy', color: tc('#FFD700', 'fg'),
    check: (s) => s.challengeComplete, progress: (s) => Math.min(s.completedCount / 28, 1) },
  { id: 'round_2', title: tr('الجولة التانية'), desc: tr('خلّص جولتين'), icon: 'repeat', color: tc('#FFB142', 'fg'),
    check: (s) => (s.roundsCompleted || 0) >= 2, progress: (s) => Math.min((s.roundsCompleted || 0) / 2, 1) },
  { id: 'round_3', title: tr('تلات جولات'), desc: tr('خلّص 3 جولات'), icon: 'barbell', color: tc('#FF793F', 'fg'),
    check: (s) => (s.roundsCompleted || 0) >= 3, progress: (s) => Math.min((s.roundsCompleted || 0) / 3, 1) },
  { id: 'round_5', title: tr('أسطورة'), desc: tr('خلّص 5 جولات'), icon: 'star', color: tc('#E056FD', 'fg'),
    check: (s) => (s.roundsCompleted || 0) >= 5, progress: (s) => Math.min((s.roundsCompleted || 0) / 5, 1) },
  { id: 'round_10', title: tr('مالوش آخر'), desc: tr('خلّص 10 جولات'), icon: 'infinite', color: tc('#F9CA24', 'fg'),
    check: (s) => (s.roundsCompleted || 0) >= 10, progress: (s) => Math.min((s.roundsCompleted || 0) / 10, 1) },
  { id: 'before_photo', title: tr('صورة البداية'), desc: tr('صوّر أول صورة "قبل"'), icon: 'camera', color: tc('#FF6B81', 'fg'),
    check: (s) => s.photosCount >= 1, progress: (s) => Math.min(s.photosCount / 1, 1) },
  { id: 'photo_4', title: tr('موثّق التحول'), desc: tr('صوّر 4 صور تقدم'), icon: 'images', color: tc('#FD79A8', 'fg'),
    check: (s) => s.photosCount >= 4, progress: (s) => Math.min(s.photosCount / 4, 1) },
  { id: 'first_kg', title: tr('أول كيلو'), desc: tr('انزل أول كيلو من وزن البداية'), icon: 'trending-down', color: tc('#00CEC9', 'fg'),
    check: (s) => s.kgChange <= -1, progress: (s) => Math.min(Math.max(-s.kgChange, 0) / 1, 1) },
  { id: 'tracker', title: tr('متابع شاطر'), desc: tr('سجّل وزنك 4 مرات'), icon: 'analytics', color: tc('#74B9FF', 'fg'),
    check: (s) => s.weightEntries >= 4, progress: (s) => Math.min(s.weightEntries / 4, 1) },
  { id: 'hydrated', title: tr('مية مية'), desc: tr('حقق هدف المية 5 أيام'), icon: 'water', color: tc('#3498DB', 'fg'),
    check: (s) => s.waterGoalDays >= 5, progress: (s) => Math.min(s.waterGoalDays / 5, 1) },
  { id: 'clean_eater', title: tr('أكل نضيف'), desc: tr('كُل الـ4 وجبات في 3 أيام'), icon: 'nutrition', color: tc('#55EFC4', 'fg'),
    check: (s) => s.perfectMealDays >= 3, progress: (s) => Math.min(s.perfectMealDays / 3, 1) },
];

export const BADGES_BY_ID = BADGES.reduce((m, b) => ({ ...m, [b.id]: b }), {});

import { tr } from './i18n';
// تواريخ محلية (مش UTC) عشان اليوم يتحسب صح في مصر وأي مكان
export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const parseKey = (key) => {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const addDays = (key, n) => {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
};

export const diffDays = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);

const MONTHS = [tr('يناير'), tr('فبراير'), tr('مارس'), tr('أبريل'), tr('مايو'), tr('يونيو'), tr('يوليو'), tr('أغسطس'), tr('سبتمبر'), tr('أكتوبر'), tr('نوفمبر'), tr('ديسمبر')];
export const WEEKDAYS = [tr('الأحد'), tr('الاتنين'), tr('التلات'), tr('الأربع'), tr('الخميس'), tr('الجمعة'), tr('السبت')];
export const WEEKDAYS_SHORT = [tr('ح'), tr('ن'), tr('ث'), tr('ر'), tr('خ'), tr('ج'), tr('س')];

// "15 أكتوبر 2026"
export const formatDate = (key, withYear = true) => {
  if (!key) return '';
  const d = parseKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`;
};

// "الخميس، 15 أكتوبر"
export const formatToday = (d = new Date()) => tr('{0}، {1} {2}', WEEKDAYS[d.getDay()], d.getDate(), MONTHS[d.getMonth()]);

// 8:30 ص / 6:00 م
export const formatTime = (hour, minute = 0) => {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${hour < 12 ? tr('ص') : tr('م')}`;
};

// صيغة الجمع البسيطة: 1 يوم / 2 يومين / 3-10 أيام / 11+ يوم
export const daysLabel = (n) => {
  if (n === 1) return tr('يوم واحد');
  if (n === 2) return tr('يومين');
  if (n >= 3 && n <= 10) return tr('{0} أيام', n);
  return tr('{0} يوم', n);
};

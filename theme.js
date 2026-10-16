// =========================================================
// الوضع الداكن / الفاتح (Dark / Light Mode)
// - الاختيار بيتحفظ في AsyncStorage: 'dark' أو 'light' أو 'system' (زي الموبايل)
// - بيتقري في entry.js قبل ما أي شاشة تتحمّل، فكل الألوان والـ styles بتتحسب صح من الأول
// - tc(color, role): بياخد لون التصميم الداكن الأصلي ويرجّع اللون المناسب للوضع الحالي
//   role: 'bg' خلفية | 'fg' نص وأيقونات | 'border' حدود | 'shadow' ظل (مبيتغيرش)
// - تغيير الوضع بيعمل إعادة تشغيل سريعة للتطبيق (زي تغيير اللغة)
// =========================================================
import { Appearance } from 'react-native';

export const THEME_KEY = 'appTheme';
export const THEME_MODES = ['dark', 'light', 'system'];

let mode = 'dark'; // الاختيار المحفوظ
let scheme = 'dark'; // اللي شغال فعلًا (dark | light)

const resolve = (m) => {
  if (m === 'light' || m === 'dark') return m;
  return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
};

// بيتنادى مرة واحدة في entry.js قبل تحميل التطبيق
export const initTheme = (saved) => {
  mode = THEME_MODES.includes(saved) ? saved : 'dark';
  scheme = resolve(mode);
};

export const getThemeMode = () => mode;
export const isDark = () => scheme === 'dark';
export const isLight = () => scheme === 'light';

// للـ StatusBar
export const statusStyle = () => (scheme === 'dark' ? 'light' : 'dark'); // expo-status-bar
export const barStyle = () => (scheme === 'dark' ? 'light-content' : 'dark-content'); // react-native

// =========================================================
// تحويل الألوان
// =========================================================
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const hex2 = (n) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0').toUpperCase();

const parse = (c) => {
  if (typeof c !== 'string') return null;
  const s = c.trim().toLowerCase();
  if (s === 'white') return { r: 255, g: 255, b: 255, a: 1, hex: true };
  if (s === 'black') return { r: 0, g: 0, b: 0, a: 1, hex: true };
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((x) => x + x).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
      hex: true,
      alphaHex: h.length === 8,
    };
  }
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(',').map((x) => parseFloat(x));
    if (p.length < 3 || p.some((x) => isNaN(x))) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1, hex: false };
  }
  return null;
};

const out = (o, { r, g, b }, a = o.a) => {
  if (o.hex) return `#${hex2(r)}${hex2(g)}${hex2(b)}${o.alphaHex ? hex2(a * 255) : ''}`;
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${+a.toFixed(3)})`;
};

const toHsl = ({ r, g, b }) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h / 6, s, l };
};

const fromHsl = ({ h, s, l }) => {
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return { r: f(h + 1 / 3) * 255, g: f(h) * 255, b: f(h - 1 / 3) * 255 };
};

const gray = (l) => ({ r: l * 255, g: l * 255, b: l * 255 });

// الخلفيات الرمادية في الداكن -> خلفيات الفاتح
// أسود (خلفية الشاشة) -> رمادي فاتح جدًا، الكروت (#111 لحد #1F1F1F) -> أبيض، الأفتح -> رمادي فاتح
const bgNeutral = (l) => {
  if (l < 0.03) return 0.955; // #000 -> #F4F4F6 تقريبًا
  if (l < 0.13) return 1; // #111 / #161616 / #1A1A1A / #1E1E1E -> أبيض
  if (l < 0.19) return 0.93; // #222 / #2A2A2A -> #EDEDED
  if (l < 0.26) return 0.89; // #333 / #3A3A3C
  if (l < 0.5) return 0.84; // #444 لحد #777
  return null; // الخلفيات الفاتحة أصلًا (زراير بيضا مثلًا) بتفضل زي ما هي
};

export const mapColor = (color, role = 'fg') => {
  if (scheme === 'dark' || role === 'shadow') return color;
  const o = parse(color);
  if (!o) return color;
  const hsl = toHsl(o);
  const neutral = hsl.s < 0.12 || Math.max(o.r, o.g, o.b) - Math.min(o.r, o.g, o.b) < 20;

  // ألوان شفافة جدًا أو شفافة خالص
  if (o.a === 0) return color;

  // أبيض شفاف (طبقات خفيفة فوق الأسود) -> أسود شفاف
  if (!o.hex && neutral && hsl.l > 0.9 && o.a < 1) return out(o, gray(0), Math.min(o.a * 0.8, 0.9));
  // أسود شفاف (خلفيات المودال والظلال) -> زي ما هو
  if (!o.hex && neutral && hsl.l < 0.1 && o.a < 1) return color;

  if (neutral) {
    const l = hsl.l;
    if (role === 'bg') {
      const nl = bgNeutral(l);
      return nl === null ? color : out(o, gray(nl));
    }
    if (role === 'border') {
      if (l < 0.5) return out(o, gray(clamp(0.9 - l * 0.45, 0.78, 0.9)));
      return out(o, gray(clamp(1.05 - l, 0.07, 0.6)));
    }
    // fg: النص الفاتح على الخلفية الداكنة -> نص غامق، والنص الأسود (بيبقى فوق ألوان) زي ما هو
    if (l < 0.15) return color;
    return out(o, gray(clamp(0.07 + (1 - l) * 0.82, 0.07, 0.72)));
  }

  // ألوان ملونة
  if (role === 'bg' || role === 'border') {
    // خلفيات ملونة غامقة جدًا (كروت متدرجة) -> نفس اللون بس فاتح
    if (hsl.l < 0.28) return out(o, fromHsl({ h: hsl.h, s: clamp(hsl.s * 0.55, 0, 0.6), l: role === 'bg' ? 0.92 : 0.8 }));
    return color;
  }
  // نص أصفر/دهبي -> أغمق شوية عشان يتقري على الأبيض
  if (hsl.h > 0.1 && hsl.h < 0.2 && hsl.l > 0.42) return out(o, fromHsl({ h: hsl.h, s: hsl.s, l: 0.4 }));
  // نص ملون فاتح جدًا -> أغمق شوية
  if (hsl.l > 0.62) return out(o, fromHsl({ h: hsl.h, s: hsl.s, l: 0.45 }));
  if (hsl.l < 0.25) return out(o, fromHsl({ h: hsl.h, s: hsl.s, l: 0.35 }));
  return color;
};

// الاختصار اللي بيستخدم في كل الملفات
export const tc = mapColor;

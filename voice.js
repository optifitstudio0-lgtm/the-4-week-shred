// =========================================================
// العدّ بالصوت 3، 2، 1 + اهتزاز
// - لو فيه صوت عربي على الموبايل: بيعد بالعربي
// - لو مفيش: بيصفّر (صفارة لكل رقم وصفارة طويلة لـ"ابدأ") بدل ما يعد بالإنجليزي
// الصفارات في assets/sounds ومتشغلة بـexpo-audio (من غير نت)
// =========================================================
import { Vibration, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { LANG } from './i18n';

let voice; // undefined = لسه بندور، null = مفيش صوت عربي (هنصفّر)
let enabled = true;
let checking = null;

const AR = { 3: 'ثلاثة', 2: 'اثنان', 1: 'واحد', go: 'ابدأ', rest: 'راحة', done: 'أحسنت يا بطل', ready: 'استعد' };
// لو لغة التطبيق إنجليزي: بيعد بالإنجليزي (كل الموبايلات فيها صوت إنجليزي)
const EN = { 3: 'three', 2: 'two', 1: 'one', go: 'go', rest: 'rest', done: 'well done', ready: 'get ready' };

// صفارة لكل حاجة بنقولها
const SOUND_FILES = {
  tick: require('./assets/sounds/tick.wav'), // 3، 2، 1
  go: require('./assets/sounds/go.wav'), // ابدأ
  ready: require('./assets/sounds/ready.wav'), // استعد
  rest: require('./assets/sounds/rest.wav'), // راحة
  done: require('./assets/sounds/done.wav'), // خلصت
};
const soundFor = (key) => (key === 3 || key === 2 || key === 1 || key === '3' || key === '2' || key === '1' ? 'tick' : key);

let players = null;
const loadPlayers = () => {
  if (players) return players;
  players = {};
  try {
    // الصفارة تشتغل حتى لو الموبايل صامت (iOS)، وتوطّي المزيكا اللي شغالة بدل ما توقفها
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
      interruptionModeAndroid: 'duckOthers',
    }).catch(() => {});
    Object.keys(SOUND_FILES).forEach((k) => {
      players[k] = createAudioPlayer(SOUND_FILES[k]);
    });
  } catch (e) {
    console.log('beep load error', e);
  }
  return players;
};

const beep = (key) => {
  try {
    const p = loadPlayers()[soundFor(key)];
    if (!p) return;
    p.seekTo(0);
    p.play();
  } catch (e) {}
};

const findArabic = async () => {
  if (LANG === 'en') return { language: 'en-US', english: true };
  let list = [];
  try { list = await Speech.getAvailableVoicesAsync(); } catch (e) {}
  // أندرويد ساعات بيرجّع لستة فاضية لحد ما محرك الصوت يصحى، فنستنى شوية ونجرب تاني
  if (!list || list.length === 0) {
    await new Promise((r) => setTimeout(r, 1200));
    try { list = await Speech.getAvailableVoicesAsync(); } catch (e) {}
  }
  if (!list || list.length === 0) {
    // آيفون فيه صوت عربي جاهز (Maged)، أندرويد مش مضمون فبنصفّر أحسن من الإنجليزي
    return Platform.OS === 'ios' ? { language: 'ar-SA' } : null;
  }
  const ar = list
    .filter((v) => (v.language || '').toLowerCase().startsWith('ar'))
    .sort((a, b) => (b.quality === 'Enhanced') - (a.quality === 'Enhanced'))[0];
  return ar ? { language: ar.language, identifier: ar.identifier } : null;
};

export const prepareVoice = async () => {
  if (voice !== undefined) return;
  if (!checking) {
    checking = findArabic().then((v) => { voice = v; checking = null; });
  }
  loadPlayers();
  return checking;
};

// ندوّر تاني (مثلًا بعد ما المستخدم نزّل صوت عربي من إعدادات الموبايل)
export const refreshVoice = async () => {
  voice = undefined;
  checking = null;
  return prepareVoice();
};

// true = بيعد بالعربي، false = بيصفّر
export const hasArabicVoice = () => !!voice; // في الإنجليزي دايمًا true

export const setVoiceEnabled = (on) => {
  enabled = on;
  if (!on) Speech.stop();
};

export const say = (key) => {
  if (!enabled) return;
  if (!voice) { beep(key); return; } // مفيش عربي (أو لسه بندور): صفارة
  try {
    Speech.stop();
    const words = voice.english ? EN : AR;
    Speech.speak(words[key] || String(key), {
      language: voice.language,
      ...(voice.identifier ? { voice: voice.identifier } : {}),
      rate: 1.05,
      onError: () => { voice = null; beep(key); }, // الصوت العربي فشل: نصفّر من هنا ورايح
    });
  } catch (e) {
    beep(key);
  }
};

// تيك العد: صوت + اهتزاز خفيف
export const tick = (n) => {
  Vibration.vibrate(n === 'go' ? 300 : 60);
  say(n);
};

export const stopVoice = () => {
  try { Speech.stop(); } catch (e) {}
};

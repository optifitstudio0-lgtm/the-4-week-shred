// =========================================================
// الإعلانات (Google AdMob) - للمستخدم المجاني بس
// - برو بيشيل الإعلانات طول ما الاشتراك شغال، ولو الاشتراك خلص بترجع لوحدها
// - مفيش إعلان أبدًا في نص التمرين
// - الأماكن: إعلان كامل بعد التمرين، بانر في الأكل وتقدمي، وإعلان بمكافأة لتبديل وجبة
// - وضع التطوير: إعلانات اختبار بس (TestIds). أوعى تدوس على إعلاناتك الحقيقية
// =========================================================
import React, { useEffect, useState } from 'react';
import { Platform, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG, isPlaceholder } from './config';
import { getIsPro, onProChange, openPaywall } from './pro';
import { tr } from './i18n';
import { dateKey } from './dates';

// المكتبة مش شغالة في Expo Go، فبنحمّلها بأمان (زي purchases.js)
let Ads = null;
try {
  Ads = require('react-native-google-mobile-ads');
} catch (e) {
  Ads = null;
}

const PLATFORM_IDS = Platform.OS === 'ios' ? CONFIG.ads.ios : CONFIG.ads.android;
const TEST = Ads?.TestIds || {};
const unitId = (kind) => {
  if (!Ads) return null;
  if (__DEV__) return { banner: TEST.ADAPTIVE_BANNER || TEST.BANNER, interstitial: TEST.INTERSTITIAL, rewarded: TEST.REWARDED }[kind];
  const id = PLATFORM_IDS?.[kind];
  return isPlaceholder(id) ? null : id;
};

export const adsAvailable = !!Ads;

// ---------------- حالة برو (كاش في الذاكرة + بيتحدث لوحده) ----------------
let proNow = null;
const readPro = async () => {
  if (proNow === null) proNow = await getIsPro();
  return proNow;
};
onProChange((on) => {
  proNow = on;
  if (!on) initAds(); // الاشتراك خلص: نجهّز الإعلانات تاني
  else dropPreloaded();
});

// ---------------- الموافقة (UMP) + ATT + تشغيل الـ SDK ----------------
let canRequest = false;
let initPromise = null;

export const initAds = () => {
  if (!Ads) return Promise.resolve(false);
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      if (await readPro()) {
        initPromise = null; // نجرّب تاني لو برو خلص
        return false;
      }
      // شاشة الموافقة (بتظهر بس للي في أوروبا/بريطانيا أو حسب إعداداتك في AdMob)
      try {
        const info = await Ads.AdsConsent.gatherConsent();
        canRequest = info?.canRequestAds !== false;
      } catch (e) {
        // لو الموافقة فشلت (مثلًا مفيش نت) نشوف آخر حالة متسجلة
        try {
          const info = await Ads.AdsConsent.getConsentInfo();
          canRequest = info?.canRequestAds !== false;
        } catch (e2) {
          canRequest = true;
        }
      }
      // آيفون: إذن التتبع (ATT) بعد شاشة الموافقة
      if (Platform.OS === 'ios') {
        try {
          const TT = require('expo-tracking-transparency');
          const { status } = await TT.getTrackingPermissionsAsync();
          if (status === 'undetermined') await TT.requestTrackingPermissionsAsync();
        } catch (e) {}
      }
      if (!canRequest) return false;
      await Ads.default().initialize();
      preloadInterstitial();
      return true;
    } catch (e) {
      console.log('ads init error', e);
      initPromise = null;
      return false;
    }
  })();
  return initPromise;
};

const ready = async () => {
  if (!Ads || (await readPro())) return false;
  return initAds();
};

// زرار "إعدادات الخصوصية للإعلانات" في الإعدادات (مطلوب لو المستخدم في أوروبا)
export const privacyOptionsRequired = async () => {
  if (!Ads || (await readPro())) return false;
  try {
    const info = await Ads.AdsConsent.getConsentInfo();
    return info?.privacyOptionsRequirementStatus === Ads.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch (e) {
    return false;
  }
};
export const showPrivacyOptions = async () => {
  try {
    await Ads.AdsConsent.showPrivacyOptionsForm();
  } catch (e) {}
};

// ---------------- إعلان كامل (Interstitial) بعد التمرين ----------------
const MIN_GAP_MS = 3 * 60 * 1000; // مش أكتر من إعلان كامل كل 3 دقايق
let interstitial = null;
let interstitialLoaded = false;
let lastShown = 0;

const preloadInterstitial = () => {
  const id = unitId('interstitial');
  if (!Ads || !id || interstitial) return;
  interstitialLoaded = false;
  interstitial = Ads.InterstitialAd.createForAdRequest(id);
  interstitial.addAdEventListener(Ads.AdEventType.LOADED, () => { interstitialLoaded = true; });
  interstitial.addAdEventListener(Ads.AdEventType.ERROR, () => {
    interstitial = null;
    interstitialLoaded = false;
  });
  interstitial.load();
};

const dropPreloaded = () => {
  interstitial = null;
  interstitialLoaded = false;
};

export const prepareInterstitial = async () => {
  if (await ready()) preloadInterstitial();
};

// بيعرض الإعلان لو جاهز، وبيرجع بعد ما المستخدم يقفله (أو على طول لو مفيش إعلان)
export const showInterstitial = async () => {
  if (!(await ready())) return false;
  if (!interstitial || !interstitialLoaded || Date.now() - lastShown < MIN_GAP_MS) {
    preloadInterstitial();
    return false;
  }
  const ad = interstitial;
  interstitial = null;
  interstitialLoaded = false;
  return new Promise((resolve) => {
    let done = false;
    const finish = (shown) => {
      if (done) return;
      done = true;
      offClose && offClose();
      offErr && offErr();
      preloadInterstitial();
      resolve(shown);
    };
    const offClose = ad.addAdEventListener(Ads.AdEventType.CLOSED, () => finish(true));
    const offErr = ad.addAdEventListener(Ads.AdEventType.ERROR, () => finish(false));
    lastShown = Date.now();
    ad.show().catch(() => finish(false));
  });
};

// ---------------- إعلان بمكافأة (Rewarded): تبديل وجبة من غير برو ----------------
export const REWARDED_SWAPS_PER_DAY = 3;
const SWAP_KEY = 'rewardedSwaps';

export const rewardedSwapsLeft = async () => {
  try {
    const raw = JSON.parse((await AsyncStorage.getItem(SWAP_KEY)) || '{}');
    return raw.day === dateKey(new Date()) ? Math.max(REWARDED_SWAPS_PER_DAY - (raw.count || 0), 0) : REWARDED_SWAPS_PER_DAY;
  } catch (e) {
    return REWARDED_SWAPS_PER_DAY;
  }
};
const countRewardedSwap = async () => {
  const today = dateKey(new Date());
  const raw = JSON.parse((await AsyncStorage.getItem(SWAP_KEY)) || '{}');
  const count = raw.day === today ? (raw.count || 0) + 1 : 1;
  await AsyncStorage.setItem(SWAP_KEY, JSON.stringify({ day: today, count }));
};

export const canOfferRewarded = async () => !!unitId('rewarded') && (await ready()) && (await rewardedSwapsLeft()) > 0;

// بيرجّع true لو المستخدم كمّل الإعلان وخد المكافأة
export const showRewarded = async () => {
  const id = unitId('rewarded');
  if (!id || !(await ready())) return false;
  const ad = Ads.RewardedAd.createForAdRequest(id);
  return new Promise((resolve) => {
    let earned = false;
    let done = false;
    const offs = [];
    const finish = async (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      offs.forEach((off) => off && off());
      if (ok) await countRewardedSwap();
      resolve(ok);
    };
    // لو الإعلان مجاش في 10 ثواني نلغي
    const timer = setTimeout(() => finish(false), 10000);
    offs.push(ad.addAdEventListener(Ads.RewardedAdEventType.LOADED, () => {
      clearTimeout(timer);
      ad.show().catch(() => finish(false));
    }));
    offs.push(ad.addAdEventListener(Ads.RewardedAdEventType.EARNED_REWARD, () => { earned = true; }));
    offs.push(ad.addAdEventListener(Ads.AdEventType.CLOSED, () => finish(earned)));
    offs.push(ad.addAdEventListener(Ads.AdEventType.ERROR, () => finish(false)));
    ad.load();
  });
};

// زرار التبديل للمجاني: يا يتفرج على إعلان ويبدّل (3 مرات في اليوم)، يا يشترك برو
// بيرجّع true لو مسموح يبدّل دلوقتي
export const unlockSwap = async (navigation) => {
  if (await getIsPro()) return true;
  if (!(await canOfferRewarded())) {
    openPaywall(navigation, 'swap');
    return false;
  }
  const left = await rewardedSwapsLeft();
  const choice = await new Promise((resolve) => {
    Alert.alert(
      tr('بدّل الوجبة'),
      tr('اتفرج على إعلان قصير وبدّل الوجبة دي ببلاش (فاضلك {0} النهارده)، أو اشترك برو وبدّل براحتك من غير إعلانات.', left),
      [
        { text: tr('إلغاء'), style: 'cancel', onPress: () => resolve('cancel') },
        { text: tr('اشترك برو'), onPress: () => resolve('pro') },
        { text: tr('اتفرج وبدّل'), onPress: () => resolve('ad') },
      ],
      { cancelable: true, onDismiss: () => resolve('cancel') }
    );
  });
  if (choice === 'pro') {
    openPaywall(navigation, 'swap');
    return false;
  }
  if (choice !== 'ad') return false;
  const ok = await showRewarded();
  if (!ok) Alert.alert(tr('الإعلان مكملش'), tr('لازم تكمّل الإعلان للآخر عشان التبديل يشتغل. جرّب تاني كمان شوية.'));
  return ok;
};

// ---------------- بانر ----------------
export const AdBanner = ({ style }) => {
  const [show, setShow] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    ready().then((ok) => active && setShow(ok));
    const off = onProChange((on) => {
      if (!active) return;
      if (on) setShow(false);
      else ready().then((ok) => active && setShow(ok));
    });
    return () => {
      active = false;
      off && off();
    };
  }, []);

  const id = unitId('banner');
  if (!Ads || !show || !id || failed) return null;
  const { BannerAd, BannerAdSize } = Ads;
  return (
    <View style={[{ alignItems: 'center', marginVertical: 16 }, style]}>
      <BannerAd unitId={id} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} onAdFailedToLoad={() => setFailed(true)} />
    </View>
  );
};

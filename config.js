// =========================================================
// كل المفاتيح في مكان واحد. غيّر كل اللي مكتوب فيه PASTE
// (الخطوات بالتفصيل في README-AR.md)
// =========================================================
export const CONFIG = {
  // Firebase Console > Project settings > Your apps > Web app > SDK config
  firebase: {
    apiKey: 'PASTE_FIREBASE_API_KEY',
    authDomain: 'PASTE_PROJECT_ID.firebaseapp.com',
    projectId: 'PASTE_PROJECT_ID',
    storageBucket: 'PASTE_PROJECT_ID.firebasestorage.app',
    messagingSenderId: 'PASTE_SENDER_ID',
    appId: 'PASTE_APP_ID',
  },

  // Firebase > Authentication > Sign-in method > Google > Web SDK configuration > Web client ID
  googleWebClientId: 'PASTE_WEB_CLIENT_ID.apps.googleusercontent.com',
  // من ملف GoogleService-Info.plist (CLIENT_ID) - لـ iOS بس
  googleIosClientId: 'PASTE_IOS_CLIENT_ID.apps.googleusercontent.com',

  // RevenueCat > Project > API keys (Public app-specific keys)
  revenueCat: {
    ios: 'appl_PASTE_KEY',
    android: 'goog_PASTE_KEY',
  },
  // اسم الـ Entitlement في RevenueCat
  entitlement: 'pro',

  // AdMob > Apps > (التطبيق) > Ad units. اعمل 3 وحدات لكل منصة: Banner و Interstitial و Rewarded
  // (الـ App ID نفسه بيتحط في app.json، مش هنا). في وضع التطوير بتشتغل إعلانات اختبار لوحدها
  ads: {
    android: {
      banner: 'ca-app-pub-PASTE/BANNER_ANDROID',
      interstitial: 'ca-app-pub-PASTE/INTERSTITIAL_ANDROID',
      rewarded: 'ca-app-pub-PASTE/REWARDED_ANDROID',
    },
    ios: {
      banner: 'ca-app-pub-PASTE/BANNER_IOS',
      interstitial: 'ca-app-pub-PASTE/INTERSTITIAL_IOS',
      rewarded: 'ca-app-pub-PASTE/REWARDED_IOS',
    },
  },

  // عدد الأيام المجانية (الأسبوع الأول)
  freeDays: 7,
};

export const isPlaceholder = (v) => !v || String(v).includes('PASTE');

// =========================================================
// نقطة البداية: بنقرا الوضع (داكن / فاتح / زي الموبايل) الأول
// وبعدين بس بنحمّل التطبيق، عشان كل الشاشات تتحسب ألوانها صح من أول مرة
// =========================================================
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { registerRootComponent } from 'expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initTheme, THEME_KEY } from './theme';

function Root() {
  const [App, setApp] = useState(null);

  useEffect(() => {
    (async () => {
      let saved = null;
      try {
        saved = await AsyncStorage.getItem(THEME_KEY);
      } catch (e) {}
      initTheme(saved);
      // require هنا (مش import فوق) عشان الشاشات متتحملش قبل ما الوضع يتحدد
      setApp(() => require('./App').default);
    })();
  }, []);

  // نفس لون شاشة البداية عشان مفيش وميض
  if (!App) return <View style={{ flex: 1, backgroundColor: '#e8f5e9' }} />;
  return <App />;
}

registerRootComponent(Root);

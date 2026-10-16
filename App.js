import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// RTL + التقدم + الإشعارات
import { ensureRTL, isRTL } from './rtl';
import { migrateLegacyProgress, getStreak } from './progressstore';
import { rescheduleAll, refreshStreakSaver } from './notifications';
import { prepareVoice } from './voice';
import { initPurchases, linkPurchasesUser, refreshPro } from './purchases';
import { initAds } from './ads';
import { onUserChanged, currentUser } from './auth';
import { repairImagePaths } from './files';

// =========================================================
// استيراد الشاشات
// =========================================================
import SplashScreen from './Splash';
import IndexScreen from './Index';

import SignUpScreen from './signup';
import LoginScreen from './signin';
import ForgotPassword from './forgotpassword';

import GenderScreen from './Gender';
import AgeWeightScreen from './BasicInfo';
import ActivityLevelScreen from './activitylevel';
import GoalScreen from './goal';
import PlanGenerationScreen from './plangeneration';

import HomeScreen from './home';
import ScheduleScreen from './schedule';
import MealsScreen from './meals';
import StatsScreen from './stats';

import ProfileScreen from './profile';
import EditProfileScreen from './editprofile';
import WorkoutScreen from './workout';
import MealDetailScreen from './mealdetail';
import SubscriptionScreen from './subscription';
import TermsOfUse from './termsofuse';
import SettingScreen from './setting';
import HelpScreen from './help';
import AboutScreen from './about';
import WaterScreen from './watertracker';

// الجديد
import RemindersScreen from './reminders';
import CycleSetupScreen from './cyclesetup';
import ProgressPhotosScreen from './progressphotos';
import AchievementsScreen from './achievements';
import { tr } from './i18n';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
export const navigationRef = createNavigationContainerRef();

const ACTIVE_COLOR = '#2ECC71';
const BAR_BACKGROUND = '#111111';
const INACTIVE_ICON_COLOR = '#666666';

const TABS = {
  HomeTab: { icon: 'home', label: tr('الرئيسية') },
  WorkoutTab: { icon: 'barbell', label: tr('التمارين') },
  MealsTab: { icon: 'restaurant', label: tr('الأكل') },
  StatsTab: { icon: 'pie-chart', label: tr('تقدمي') },
};

// =========================================================
// شريط التنقل السفلي
// =========================================================
function MyTabBar({ state, navigation }) {
  return (
    <View style={styles.bottomNavWrapper}>
      <View style={styles.bottomNav}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = TABS[route.name];
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.navItem, isFocused && styles.navItemFocused]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
            >
              <Ionicons name={isFocused ? tab.icon : `${tab.icon}-outline`} size={22} color={isFocused ? '#000' : INACTIVE_ICON_COLOR} />
              {isFocused && <Text style={styles.navTextFocused}>{tab.label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="WorkoutTab" component={ScheduleScreen} />
      <Tab.Screen name="MealsTab" component={MealsScreen} />
      <Tab.Screen name="StatsTab" component={StatsScreen} />
    </Tab.Navigator>
  );
}

// الضغط على الإشعار بيفتح الشاشة المناسبة
const TAB_SCREENS = ['HomeTab', 'WorkoutTab', 'MealsTab', 'StatsTab'];
const openFromNotification = async (screen) => {
  if (!screen || !navigationRef.isReady()) return;
  const hasPlan = (await AsyncStorage.getItem('isPlanCreated')) === 'true';
  if (!hasPlan) return;
  if (TAB_SCREENS.includes(screen)) {
    navigationRef.navigate('MainTabs', { screen });
  } else if (screen === 'Workout') {
    navigationRef.navigate('MainTabs', { screen: 'HomeTab' });
  } else {
    navigationRef.navigate(screen);
  }
};

const App = () => {
  const [isShowSplash, setIsShowSplash] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Onboarding');

  useEffect(() => {
    const boot = async () => {
      try {
        await ensureRTL();
        await migrateLegacyProgress();
        // لو أندرويد رجّع النسخة الاحتياطية، نظبط مسارات الصور
        await repairImagePaths();
        const hasPlan = await AsyncStorage.getItem('isPlanCreated');
        setInitialRoute(hasPlan === 'true' ? 'MainTabs' : 'Onboarding');
        prepareVoice();
        // الاشتراكات (RevenueCat) + ربطها بالحساب لو مسجل دخول
        await initPurchases(currentUser()?.uid);
        // الإعلانات (للمجاني بس): شاشة الموافقة + تشغيل AdMob
        initAds();
        // نتأكد إن التذكيرات متجدولة + "الستريك هيضيع" بتاع النهارده
        await rescheduleAll();
        refreshStreakSaver(await getStreak());
      } catch (e) {
        console.log(e);
      } finally {
        setTimeout(() => setIsShowSplash(false), 2500);
      }
    };
    boot();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const screen = response?.notification?.request?.content?.data?.screen;
      setTimeout(() => openFromNotification(screen), 400);
    });
    // أول ما Firebase يرجّع المستخدم المسجل، نربط الاشتراك بحسابه
    const unsubAuth = onUserChanged((user) => {
      if (user) linkPurchasesUser(user.uid);
    });
    // كل ما التطبيق يرجع من الخلفية نتأكد من الاشتراك (لو خلص الإعلانات بترجع)
    const appStateSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refreshPro();
    });
    return () => {
      sub.remove();
      appStateSub.remove();
      unsubAuth && unsubAuth();
    };
  }, []);

  if (isShowSplash) return <SplashScreen />;

  return (
    <NavigationContainer ref={navigationRef} direction={isRTL ? 'rtl' : 'ltr'}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="Onboarding" component={IndexScreen} />

        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />

        <Stack.Screen name="Gender" component={GenderScreen} />
        <Stack.Screen name="AgeWeight" component={AgeWeightScreen} />
        <Stack.Screen name="ActivityLevel" component={ActivityLevelScreen} />
        <Stack.Screen name="Goal" component={GoalScreen} />
        <Stack.Screen name="PlanGeneration" component={PlanGenerationScreen} />

        <Stack.Screen name="MainTabs" component={MainTabs} />

        <Stack.Screen name="Workout" component={WorkoutScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="WaterScreen" component={WaterScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="MealDetail" component={MealDetailScreen} />
        <Stack.Screen name="Setting" component={SettingScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Reminders" component={RemindersScreen} />
        <Stack.Screen name="Cycle" component={CycleSetupScreen} />
        <Stack.Screen name="ProgressPhotos" component={ProgressPhotosScreen} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />

        <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="TermsOfUse" component={TermsOfUse} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  bottomNavWrapper: { position: 'absolute', bottom: 20, left: 20, right: 20, alignItems: 'center', justifyContent: 'center' },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: BAR_BACKGROUND,
    borderRadius: 35,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 25 },
  navItemFocused: { backgroundColor: ACTIVE_COLOR, flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 10 },
  navTextFocused: { color: '#000', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
});

export default App;

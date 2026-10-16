import React, { useState, useRef, useEffect, useCallback } from 'react';
import { tc, barStyle as themeBarStyle, getThemeMode, THEME_KEY } from './theme';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getWorkoutPrefs, saveWorkoutPrefs, resetProgress } from './progressstore';
import { getReminders } from './notifications';
import { setVoiceEnabled, say, refreshVoice, hasArabicVoice } from './voice';
import { ICON, dirX } from './rtl';
import * as Notifications from 'expo-notifications';
import { CommonActions } from '@react-navigation/native';
import ActionSheet from './actionsheet';
import { LANG, LANGUAGES, setLanguage, tr, reloadApp } from './i18n';
import { currentUser, logOut, deleteAccount, authErrorMessage } from './auth';
import { getCycleSettings } from './cycle';
import { privacyOptionsRequired, showPrivacyOptions } from './ads';
import { FITNESS_LEVELS, levelInfo, normalizeLevel } from './rounds';

const COLORS = {
  background: tc('#000000', 'bg'),
  card: tc('#1C1C1E', 'bg'),
  text: tc('#FFFFFF', 'fg'),
  subText: tc('#8E8E93', 'fg'),
  active: tc('#2ECC71', 'fg'),
  inactive: tc('#3A3A3C', 'bg'),
  separator: tc('#2C2C2E', 'border'),
};

// السويتش: الاتجاه بيتظبط لوحده في RTL
const CustomSwitch = ({ value, onValueChange }) => {
  const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(animValue, { toValue: value ? 1 : 0, duration: 250, useNativeDriver: false }).start();
  }, [value]);
  const translateX = animValue.interpolate({ inputRange: [0, 1], outputRange: [dirX(2), dirX(22)] });
  const backgroundColor = animValue.interpolate({ inputRange: [0, 1], outputRange: [COLORS.inactive, COLORS.active] });
  return (
    <TouchableOpacity activeOpacity={1} onPress={() => onValueChange(!value)} style={{ width: 50, height: 30, justifyContent: 'center' }}>
      <Animated.View style={[styles.switchTrack, { backgroundColor }]}>
        <Animated.View style={[styles.switchCircle, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const SettingItem = ({ icon, title, type, value, onToggle, onPress, extraLabel, danger }) => (
  <TouchableOpacity
    activeOpacity={type === 'link' ? 0.7 : 1}
    onPress={type === 'link' ? onPress : type === 'switch' ? () => onToggle(!value) : undefined}
    disabled={type === 'info'}
    style={styles.itemContainer}
  >
    <View style={styles.itemLeft}>
      <View style={[styles.iconBox, danger && { backgroundColor: tc('rgba(231,76,60,0.15)', 'bg') }]}>
        <Ionicons name={icon} size={22} color={danger ? tc('#E74C3C', 'fg') : tc('#fff', 'fg')} />
      </View>
      <Text style={[styles.itemText, danger && { color: tc('#E74C3C', 'fg') }, { flexShrink: 1 }]} numberOfLines={1}>{title}</Text>
    </View>
    {type === 'switch' ? (
      <CustomSwitch value={value} onValueChange={onToggle} />
    ) : (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {!!extraLabel && <Text style={styles.extra}>{extraLabel}</Text>}
        {type !== 'info' && <Ionicons name={ICON.chevronNext} size={20} color={COLORS.subText} />}
      </View>
    )}
  </TouchableOpacity>
);

const REST_OPTIONS = [0, 10, 20, 30, 45, 60];

// المظهر: داكن / فاتح / زي الموبايل
const THEME_OPTIONS = [
  { id: 'dark', label: tr('داكن'), icon: 'moon' },
  { id: 'light', label: tr('فاتح'), icon: 'sunny' },
  { id: 'system', label: tr('زي الموبايل'), icon: 'phone-portrait-outline' },
];

const setThemeMode = async (id) => {
  if (id === getThemeMode()) return;
  await AsyncStorage.setItem(THEME_KEY, id);
  const ok = await reloadApp();
  if (!ok) {
    Alert.alert(tr('اقفل التطبيق وافتحه تاني'), tr('عشان المظهر الجديد يشتغل، اقفل التطبيق خالص وافتحه تاني.'));
  }
};

function SettingScreen({ navigation }) {
  const [useMetricSystem, setUseMetricSystem] = useState(true);
  const [prefs, setPrefs] = useState({ voice: true, restSec: 20 });
  const [remindersOn, setRemindersOn] = useState(false);
  const [langSheet, setLangSheet] = useState(false);
  const [themeSheet, setThemeSheet] = useState(false);
  const [levelSheet, setLevelSheet] = useState(false);
  const [user, setUser] = useState(currentUser());
  const [isFemale, setIsFemale] = useState(false);
  const [cycleOn, setCycleOn] = useState(false);
  const [adsPrivacy, setAdsPrivacy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setPrefs(await getWorkoutPrefs());
        setRemindersOn((await getReminders()).enabled);
        setUser(currentUser());
        setUseMetricSystem((await AsyncStorage.getItem('useMetric')) !== 'false');
        setIsFemale((await AsyncStorage.getItem('userGender')) === 'female');
        setCycleOn((await getCycleSettings()).enabled);
        setAdsPrivacy(await privacyOptionsRequired());
      })();
    }, [])
  );

  const setVoice = async (v) => {
    setPrefs((p) => ({ ...p, voice: v }));
    setVoiceEnabled(v);
    await saveWorkoutPrefs({ voice: v });
    if (!v) return;
    await refreshVoice(); // ندوّر تاني، يمكن نزّل صوت عربي من آخر مرة
    say(3);
    if (!hasArabicVoice()) {
      Alert.alert(
        tr('مفيش صوت عربي على موبايلك'),
        tr('العد هيبقى بصفارات بدل الكلام. عشان تسمعه بالعربي: افتح إعدادات الموبايل > تحويل النص إلى كلام (Text-to-Speech)، ونزّل اللغة العربية، وبعدين اقفل العد بالصوت هنا وافتحه تاني.')
      );
    }
  };

  // مستوى التمرين: بيتطبق من التمرين الجاي
  const setLevel = async (level) => {
    setPrefs((p) => ({ ...p, level }));
    await saveWorkoutPrefs({ level });
  };

  const setRest = async (sec) => {
    setPrefs((p) => ({ ...p, restSec: sec }));
    await saveWorkoutPrefs({ restSec: sec });
  };

  const setMetric = async (v) => {
    setUseMetricSystem(v);
    await AsyncStorage.setItem('useMetric', String(v));
  };

  const confirmLogout = () => {
    Alert.alert(tr('تسجيل الخروج'), tr('هتخرج من حسابك، وبياناتك هتفضل على الموبايل.'), [
      { text: tr('لا'), style: 'cancel' },
      { text: tr('اخرج'), style: 'destructive', onPress: async () => { await logOut(); setUser(null); } },
    ]);
  };

  // أبل وجوجل بيطلبوا إن المستخدم يقدر يمسح حسابه من جوه التطبيق
  const confirmDelete = () => {
    Alert.alert(tr('تمسح حسابك نهائيًا؟'), tr('هيتمسح حسابك وكل بياناتك من الموبايل (التقدم والصور والوزن)، ومفيش رجوع. لو مشترك برو، الغي الاشتراك من المتجر الأول.'), [
      { text: tr('لا'), style: 'cancel' },
      {
        text: tr('امسح نهائيًا'), style: 'destructive', onPress: async () => {
          try {
            await deleteAccount();
            await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
            const lang = await AsyncStorage.getItem('appLanguage');
            await AsyncStorage.clear();
            if (lang) await AsyncStorage.setItem('appLanguage', lang);
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Onboarding' }] }));
          } catch (e) {
            Alert.alert('', authErrorMessage(e));
          }
        },
      },
    ]);
  };

  const confirmReset = () => {
    Alert.alert(tr('تبدأ التحدي من الأول؟'), tr('هيتمسح التقدم والستريك والبادچات. صورك ووزنك مش هيتمسحوا.'), [
      { text: tr('لا'), style: 'cancel' },
      { text: tr('ابدأ من الأول'), style: 'destructive', onPress: async () => { await resetProgress(); Alert.alert(tr('تمام ✅'), tr('التحدي بدأ من اليوم 1.')); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={themeBarStyle()} backgroundColor={tc("#000", 'bg')} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.iconBtn}>
          <Ionicons name={ICON.back} size={28} color={tc("#FFF", 'fg')} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr('الإعدادات')}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>{tr('التذكيرات')}</Text>
        <View style={styles.sectionContainer}>
          <SettingItem
            icon="notifications"
            title={tr('تذكيرات التمرين والمية والأكل')}
            type="link"
            extraLabel={remindersOn ? tr('شغالة') : tr('مقفولة')}
            onPress={() => navigation.navigate('Reminders')}
          />
        </View>

        <Text style={styles.sectionTitle}>{tr('التمرين')}</Text>
        <View style={styles.sectionContainer}>
          {isFemale && (
            <>
              <SettingItem icon="flower" title={tr('خطة على حسب دورتك')} type="link" extraLabel={cycleOn ? tr('شغالة') : tr('مقفولة')} onPress={() => navigation.navigate('Cycle')} />
              <View style={styles.separator} />
            </>
          )}
          <SettingItem icon="speedometer-outline" title={tr('مستوى التمرين')} type="link" extraLabel={levelInfo(prefs.level).label} onPress={() => setLevelSheet(true)} />
          <View style={styles.separator} />
          <SettingItem icon="volume-high" title={tr('العد بالصوت 3، 2، 1')} type="switch" value={prefs.voice} onToggle={setVoice} />
          <View style={styles.separator} />
          <View style={styles.restBlock}>
            <View style={styles.itemLeft}>
              <View style={styles.iconBox}><Ionicons name="timer-outline" size={22} color={tc("#fff", 'fg')} /></View>
              <Text style={styles.itemText}>{tr('الراحة بين التمارين')}</Text>
            </View>
            <View style={styles.chips}>
              {REST_OPTIONS.map((sec) => (
                <TouchableOpacity key={sec} style={[styles.chip, prefs.restSec === sec && styles.chipOn]} onPress={() => setRest(sec)}>
                  <Text style={[styles.chipText, prefs.restSec === sec && styles.chipTextOn]}>{sec === 0 ? tr('من غير') : tr('{0} ث', sec)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{tr('عام')}</Text>
        <View style={styles.sectionContainer}>
          <SettingItem icon="language" title={tr('اللغة')} type="link" extraLabel={LANGUAGES.find((l) => l.id === LANG)?.label} onPress={() => setLangSheet(true)} />
          <View style={styles.separator} />
          <SettingItem icon="contrast" title={tr('المظهر')} type="link" extraLabel={THEME_OPTIONS.find((t) => t.id === getThemeMode())?.label} onPress={() => setThemeSheet(true)} />
          <View style={styles.separator} />
          <SettingItem icon="barbell" title={tr('نظام القياس (كجم/سم)')} type="switch" value={useMetricSystem} onToggle={setMetric} />
          <View style={styles.separator} />
          <SettingItem icon="document-text-outline" title={tr('شروط الاستخدام')} type="link" onPress={() => navigation.navigate('TermsOfUse', { type: 'terms' })} />
          <View style={styles.separator} />
          <SettingItem icon="shield-checkmark-outline" title={tr('سياسة الخصوصية')} type="link" onPress={() => navigation.navigate('TermsOfUse', { type: 'privacy' })} />
          {adsPrivacy && (
            <>
              <View style={styles.separator} />
              <SettingItem icon="megaphone-outline" title={tr('خصوصية الإعلانات')} type="link" onPress={showPrivacyOptions} />
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>{tr('الحساب')}</Text>
        <View style={styles.sectionContainer}>
          {user ? (
            <>
              <SettingItem icon="person-circle-outline" title={user.email || user.displayName || tr('حسابك')} type="info" />
              <View style={styles.separator} />
              <SettingItem icon="log-out-outline" title={tr('تسجيل الخروج')} type="link" onPress={confirmLogout} />
              <View style={styles.separator} />
              <SettingItem icon="trash-outline" title={tr('مسح الحساب نهائيًا')} type="link" danger onPress={confirmDelete} />
            </>
          ) : (
            <SettingItem icon="log-in-outline" title={tr('سجّل دخول أو اعمل حساب')} type="link" onPress={() => navigation.navigate('Login')} />
          )}
        </View>

        <Text style={styles.sectionTitle}>{tr('البيانات')}</Text>
        <View style={styles.sectionContainer}>
          <SettingItem icon="refresh" title={tr('ابدأ التحدي من الأول')} type="link" danger onPress={confirmReset} />
        </View>

        <View style={{ marginTop: 30, marginBottom: 40 }}>
          <Text style={styles.versionText}>{tr('الإصدار {0}', '1.6.0')}</Text>
        </View>
      </ScrollView>

      <ActionSheet
        visible={langSheet}
        title={tr('اللغة')}
        message={tr('التطبيق هيقفل ويفتح تاني عشان يغيّر اللغة.')}
        options={LANGUAGES.map((l) => ({
          text: l.id === LANG ? `${l.label}  ✓` : l.label,
          icon: 'language',
          onPress: () => setLanguage(l.id),
        }))}
        onClose={() => setLangSheet(false)}
      />

      <ActionSheet
        visible={levelSheet}
        title={tr('مستوى التمرين')}
        message={tr('التمارين بتتظبط على مستواك من التمرين الجاي.')}
        options={FITNESS_LEVELS.map((l) => ({
          text: l.id === normalizeLevel(prefs.level) ? `${l.label}  ✓` : `${l.label} (${l.hint})`,
          icon: l.icon,
          onPress: () => setLevel(l.id),
        }))}
        onClose={() => setLevelSheet(false)}
      />

      <ActionSheet
        visible={themeSheet}
        title={tr('المظهر')}
        message={tr('التطبيق هيقفل ويفتح تاني عشان يغيّر المظهر.')}
        options={THEME_OPTIONS.map((t) => ({
          text: t.id === getThemeMode() ? `${t.label}  ✓` : t.label,
          icon: t.icon,
          onPress: () => setThemeMode(t.id),
        }))}
        onClose={() => setThemeSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: tc('#FFF', 'fg') },
  iconBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  sectionTitle: { color: COLORS.subText, fontSize: 14, fontWeight: 'bold', marginBottom: 10, marginTop: 18, marginHorizontal: 10, textAlign: 'left' },
  sectionContainer: { backgroundColor: COLORS.card, borderRadius: 12, overflow: 'hidden' },
  itemContainer: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16, flexDirection: 'row' },
  itemLeft: { alignItems: 'center', flex: 1, flexDirection: 'row' },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: tc('rgba(255, 255, 255, 0.1)', 'bg'), justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemText: { color: tc('#FFF', 'fg'), fontSize: 16, fontWeight: '600', flexShrink: 1, textAlign: 'left' },
  extra: { color: COLORS.subText, fontSize: 14, marginHorizontal: 8 },
  separator: { height: 1, backgroundColor: COLORS.separator, marginLeft: 50 },
  restBlock: { paddingVertical: 16, paddingHorizontal: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: tc('#2A2A2C', 'bg') },
  chipOn: { backgroundColor: COLORS.active },
  chipText: { color: tc('#BBB', 'fg'), fontWeight: '600', fontSize: 13 },
  chipTextOn: { color: tc('#000', 'fg') },
  versionText: { textAlign: 'center', color: tc('#444', 'fg'), fontSize: 12 },
  switchTrack: { width: 50, height: 30, borderRadius: 15, justifyContent: 'center' },
  switchCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: tc('#FFF', 'bg'), shadowColor: tc('#000', 'shadow'), shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2.5, elevation: 4 },
});

export default SettingScreen;

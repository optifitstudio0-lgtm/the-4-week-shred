import React, { useState, useCallback } from 'react';
import { tc, statusStyle } from './theme';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { WORKOUT_PLAN, EXERCISE_LIBRARY } from './exercisesdata';
import { getCurrentDay, getStreak, getCompletedDays, TOTAL_DAYS, getRound, startNextRound } from './progressstore';
import { roundLabel, roundHint } from './rounds';
import { getTargets } from './mealstore';
import { getReminders, enableReminders, refreshStreakSaver } from './notifications';
import { dateKey, formatToday } from './dates';
import { ICON } from './rtl';
import { tr } from './i18n';
import { getIsPro, isDayPro, openPaywall } from './pro';
import { getCycleInfo, getCycleSettings, periodStartedToday } from './cycle';

const MAIN_COLOR = tc('#2ECC71', 'fg');
const WATER_COLOR = tc('#3498DB', 'fg');

const HomeScreen = ({ navigation }) => {
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal, setWaterGoal] = useState(3000);
  const [calories, setCalories] = useState(2000);
  const [protein, setProtein] = useState(150);
  const [currentDay, setCurrentDay] = useState(1);
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [userImage, setUserImage] = useState(null);
  const [name, setName] = useState('');
  const [streak, setStreak] = useState({ current: 0, best: 0, trainedToday: false });
  const [doneDays, setDoneDays] = useState(0);
  const [showReminderCard, setShowReminderCard] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [cycle, setCycle] = useState(null);
  const [showCycleSetup, setShowCycleSetup] = useState(false);
  const [round, setRound] = useState(1);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const today = dateKey();
      const history = JSON.parse((await AsyncStorage.getItem('waterHistory')) || '{}');
      setWaterIntake(history[today] || 0);
      setWaterGoal(parseInt(await AsyncStorage.getItem('waterGoal')) || 3000);

      const day = await getCurrentDay();
      setCurrentDay(day);
      setTodaysWorkout(WORKOUT_PLAN[day] || WORKOUT_PLAN[1]);
      setDoneDays(Object.keys(await getCompletedDays()).length);
      setIsPro(await getIsPro());
      setRound(await getRound());

      const st = await getStreak();
      setStreak(st);
      refreshStreakSaver({ trainedToday: st.trainedToday, streak: st.current });

      // هدف النهارده بعد تدوير الكارب (نفس اللي في شاشة الأكل)
      const t = await getTargets();
      setCalories(String(t.cal));
      setProtein(String(t.pro));

      setUserImage(await AsyncStorage.getItem('userProfileImage'));
      const n = (await AsyncStorage.getItem('userFirstName')) || (await AsyncStorage.getItem('userName')) || '';
      setName(n.split(' ')[0]);

      // خطة الدورة (للستات بس)
      const gender = await AsyncStorage.getItem('userGender');
      setCycle(await getCycleInfo());
      const cs = await getCycleSettings();
      setShowCycleSetup(gender === 'female' && !cs.enabled && !(await AsyncStorage.getItem('cycleCardDismissed')));

      const r = await getReminders();
      const dismissed = await AsyncStorage.getItem('reminderCardDismissed');
      setShowReminderCard(!r.enabled && !dismissed);
    } catch (e) {
      console.log('Error loading home data:', e);
    }
  };

  const addWaterCup = async () => {
    const newIntake = waterIntake + 250;
    setWaterIntake(newIntake);
    const today = dateKey();
    try {
      const history = JSON.parse((await AsyncStorage.getItem('waterHistory')) || '{}');
      history[today] = newIntake;
      await AsyncStorage.multiSet([
        ['waterHistory', JSON.stringify(history)],
        ['waterIntake', String(newIntake)],
        ['waterDate', today],
      ]);
    } catch (error) {
      console.log('Error saving water:', error);
    }
  };

  const turnOnReminders = async () => {
    const ok = await enableReminders();
    if (ok) setShowReminderCard(false);
    else navigation.navigate('Reminders');
  };

  const dismissCycleCard = async () => {
    setShowCycleSetup(false);
    await AsyncStorage.setItem('cycleCardDismissed', '1');
  };

  const markPeriodToday = async () => {
    await periodStartedToday();
    loadData();
  };

  const dismissReminderCard = async () => {
    setShowReminderCard(false);
    await AsyncStorage.setItem('reminderCardDismissed', '1');
  };

  if (!todaysWorkout) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: MAIN_COLOR }}>{tr('بنجهّز بيانات البطل...')}</Text>
      </View>
    );
  }

  const cover = EXERCISE_LIBRARY[todaysWorkout.exercises[Math.min(2, todaysWorkout.exercises.length - 1)].id]?.image;
  const filledCups = Math.min(8, Math.floor((waterIntake / waterGoal) * 8));
  const challengeDone = doneDays >= TOTAL_DAYS;
  // اليوم 8 وبعده للمستخدم المجاني: الكارت عليه قفل، والضغط بيفتح صفحة برو على طول
  const locked = isDayPro(currentDay, round) && !isPro;
  const openToday = () => (locked ? openPaywall(navigation, round > 1 ? 'rounds' : 'weeks') : navigation.navigate('Workout', { dayId: currentDay }));

  // الجولة الجاية: لبرو بس، وبتبدأ من اليوم 1 والبادچات والستريك والشهادة محفوظين
  const nextRound = round + 1;
  const beginNextRound = () => {
    if (!isPro) return openPaywall(navigation, 'rounds');
    Alert.alert(
      tr('تبدأ الجولة {0}؟', nextRound),
      tr('{0}. هتبدأ من اليوم 1، والبادچات والستريك وشهادتك محفوظين.', roundHint(nextRound)),
      [
        { text: tr('مش دلوقتي'), style: 'cancel' },
        { text: tr('يلا بينا 🔥'), onPress: async () => { await startNextRound(); loadData(); } },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style={statusStyle()} />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {tr('أهلًا يا ')}{name || tr('بطل')} <Ionicons name="flame" size={24} color={tc("#E74C3C", 'fg')} />
          </Text>
          <Text style={styles.date}>
            {formatToday()}{tr(' • اليوم ')}<Text style={{ color: MAIN_COLOR }}>{currentDay}</Text>{tr(' من 28')}
          </Text>
        </View>
        <TouchableOpacity style={styles.streakChip} onPress={() => navigation.navigate('Achievements')}>
          <Ionicons name="flame" size={18} color={streak.current > 0 ? tc('#FF7A00', 'fg') : tc('#555', 'fg')} />
          <Text style={[styles.streakChipText, streak.current === 0 && { color: tc('#777', 'fg') }]}>{streak.current}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
          <Image source={userImage ? { uri: userImage } : require('./assets/profile.png')} style={styles.profileImage} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {showReminderCard && (
          <View style={styles.reminderCard}>
            <View style={styles.reminderIcon}>
              <Ionicons name="notifications" size={22} color={tc("#000", 'fg')} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTitle}>{tr('فعّل التذكيرات')}</Text>
              <Text style={styles.reminderText}>{tr('هنفكّرك بالتمرين والمية والوجبات في مواعيدها.')}</Text>
              <View style={styles.reminderActions}>
                <TouchableOpacity style={styles.reminderBtn} onPress={turnOnReminders}>
                  <Text style={styles.reminderBtnText}>{tr('فعّلها')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Reminders')}>
                  <Text style={styles.reminderLink}>{tr('اختار المواعيد')}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={dismissReminderCard} hitSlop={10}>
              <Ionicons name="close" size={20} color={tc("#666", 'fg')} />
            </TouchableOpacity>
          </View>
        )}

        {showCycleSetup && (
          <View style={[styles.reminderCard, styles.cycleSetupCard]}>
            <View style={[styles.reminderIcon, { backgroundColor: tc('#FF6B81', 'bg') }]}>
              <Ionicons name="flower" size={22} color={tc("#000", 'fg')} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTitle}>{tr('خطة على حسب دورتك')}</Text>
              <Text style={styles.reminderText}>{tr('التمرين والسعرات يتظبطوا على كل مرحلة، وتعرفي إمتى الوزن الزيادة مية بس.')}</Text>
              <View style={styles.reminderActions}>
                <TouchableOpacity style={[styles.reminderBtn, { backgroundColor: tc('#FF6B81', 'bg') }]} onPress={() => navigation.navigate('Cycle')}>
                  <Text style={styles.reminderBtnText}>{tr('ظبّطيها')}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={dismissCycleCard} hitSlop={10}>
              <Ionicons name="close" size={20} color={tc("#666", 'fg')} />
            </TouchableOpacity>
          </View>
        )}

        {!!cycle && (
          <TouchableOpacity activeOpacity={0.85} style={[styles.cycleCard, { borderColor: cycle.color + '55' }]} onPress={() => navigation.navigate('Cycle')}>
            <View style={[styles.cycleIcon, { backgroundColor: cycle.color + '26' }]}>
              <Ionicons name={cycle.icon} size={20} color={cycle.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cycleTitle, { color: cycle.color }]}>{tr('{0} • اليوم {1} من دورتك', cycle.label, cycle.day)}</Text>
              <Text style={styles.cycleText} numberOfLines={3}>{cycle.stale ? tr('حدّثي تاريخ آخر دورة عشان الخطة تفضل مظبوطة.') : cycle.hint}</Text>
              {(cycle.stale || cycle.daysToNext <= 4) && (
                <TouchableOpacity style={styles.cycleBtn} onPress={markPeriodToday}>
                  <Text style={styles.cycleBtnText}>{tr('الدورة بدأت النهارده')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.iconBg}><Ionicons name="flame" size={24} color={tc("#E74C3C", 'fg')} /></View>
            <View>
              <Text style={styles.statValue}>{calories}</Text>
              <Text style={styles.statLabel}>{tr('سعرات اليوم')}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.iconBg, { backgroundColor: tc('rgba(52, 152, 219, 0.2)', 'bg') }]}><Ionicons name="nutrition" size={24} color={WATER_COLOR} /></View>
            <View>
              <Text style={styles.statValue}>{protein}{tr(' جم')}</Text>
              <Text style={styles.statLabel}>{tr('هدف البروتين')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{tr('تمرين النهارده')}</Text>
          {streak.trainedToday && (
            <View style={styles.doneTodayChip}>
              <Ionicons name="checkmark-circle" size={14} color={tc("#000", 'fg')} />
              <Text style={styles.doneTodayText}>{tr('اتمرنت النهارده')}</Text>
            </View>
          )}
        </View>

        {challengeDone ? (
          <LinearGradient colors={['#1E5631', '#0B2414']} style={[styles.workoutCard, styles.finishedCard]}>
            <Ionicons name="ribbon" size={40} color={"#FFD700"} />
            <Text style={styles.workoutTitle}>{round > 1 ? tr('خلّصت الجولة {0}! 🏆', round) : tr('خلّصت التحدي! 🏆')}</Text>
            <Text style={styles.metaText}>{tr('الجولة {0}: {1}', nextRound, roundHint(nextRound))}</Text>
            <View style={styles.finishedBtns}>
              <TouchableOpacity style={styles.nextRoundBtn} onPress={beginNextRound}>
                <Ionicons name={isPro ? 'repeat' : 'lock-closed'} size={16} color={"#000"} />
                <Text style={styles.nextRoundText}>{tr('ابدأ الجولة {0}', nextRound)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.certBtn} onPress={() => navigation.navigate('Achievements', { showCertificate: true })}>
                <Ionicons name="share-social" size={16} color={"#FFD700"} />
                <Text style={styles.certBtnText}>{tr('شهادتك')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        ) : (
          <TouchableOpacity activeOpacity={0.9} onPress={openToday}>
            <ImageBackground source={cover} style={styles.workoutCard} imageStyle={{ borderRadius: 20 }}>
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.workoutGradient}>
                <View style={styles.workoutInfo}>
                  <View style={styles.tagRow}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{todaysWorkout.level}</Text>
                    </View>
                    {round > 1 && (
                      <View style={styles.roundTag}>
                        <Ionicons name="repeat" size={12} color={"#000"} />
                        <Text style={styles.proTagText}>{roundLabel(round)}</Text>
                      </View>
                    )}
                    {locked && (
                      <View style={styles.proTag}>
                        <Ionicons name="star" size={12} color={"#000"} />
                        <Text style={styles.proTagText}>PRO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.workoutTitle}>{todaysWorkout.title}</Text>
                  <View style={styles.workoutMeta}>
                    <Ionicons name="time-outline" size={16} color={MAIN_COLOR} />
                    <Text style={styles.metaText}> {todaysWorkout.duration}</Text>
                    <Text style={[styles.metaText, { marginHorizontal: 5 }]}>|</Text>
                    <Ionicons name="calendar-outline" size={16} color={MAIN_COLOR} />
                    <Text style={styles.metaText}> {todaysWorkout.subtitle}</Text>
                  </View>
                  {locked && <Text style={styles.lockedHint}>{round > 1 ? tr('الجولة {0} متاحة لمشتركين برو.', round) : tr('خلّصت الأسبوع المجاني؟ كمّل الأسابيع 2 و3 و4 مع برو.')}</Text>}
                </View>
                <View style={[styles.playButton, locked && styles.lockButton]}>
                  <Ionicons name={locked ? 'lock-closed' : 'play'} size={locked ? 22 : 24} color={locked ? '#000' : '#FFF'} />
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        )}

        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('ProgressPhotos')}>
            <Ionicons name="camera" size={24} color={tc("#FF6B81", 'fg')} />
            <Text style={styles.quickTitle}>{tr('قبل وبعد')}</Text>
            <Text style={styles.quickSub}>{tr('صوّر تقدمك')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickTile} onPress={() => navigation.navigate('Achievements')}>
            <Ionicons name="medal" size={24} color={tc("#FFD700", 'fg')} />
            <Text style={styles.quickTitle}>{tr('إنجازاتك')}</Text>
            <Text style={styles.quickSub}>{tr('بادچات وشهادة')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{tr('المية')}</Text>
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('WaterScreen')}>
          <View style={styles.waterContainer}>
            <View style={styles.waterInfo}>
              <Text style={styles.waterValue}>{(waterIntake / 1000).toFixed(1)}</Text>
              <Text style={styles.waterLabel}>{tr('من {0} لتر', waterGoal / 1000)}</Text>
            </View>
            <View style={styles.cupsContainer}>
              {[...Array(8)].map((_, i) => (
                <Ionicons key={i} name={i < filledCups ? 'water' : 'water-outline'} size={26} color={i < filledCups ? WATER_COLOR : tc('#555', 'fg')} style={{ marginBottom: 5 }} />
              ))}
            </View>
            <TouchableOpacity
              style={styles.addWaterBtn}
              onPress={(e) => { e.stopPropagation(); addWaterCup(); }}
              accessibilityLabel={tr('زوّد كوباية مية')}
            >
              <Ionicons name="add" size={24} color={tc("#FFF", 'fg')} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.planLink} onPress={() => navigation.navigate('WorkoutTab')}>
          <Text style={styles.planLinkText}>{tr('شوف خطة الـ28 يوم كاملة')}</Text>
          <Ionicons name={ICON.chevronNext} size={18} color={MAIN_COLOR} />
        </TouchableOpacity>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tc('#000000', 'bg') },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: tc('#FFF', 'fg'), textAlign: 'left' },
  date: { fontSize: 13, color: tc('#888', 'fg'), fontWeight: '600', marginTop: 4, textAlign: 'left' },
  streakChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: tc('#1A1A1A', 'bg'), borderRadius: 20, paddingHorizontal: 12, height: 40, gap: 4, borderWidth: 1, borderColor: tc('#333', 'border') },
  streakChipText: { color: tc('#FFF', 'fg'), fontWeight: 'bold', fontSize: 16 },
  profileBtn: { padding: 2 },
  profileImage: { width: 45, height: 45, borderRadius: 25, borderWidth: 1.5, borderColor: tc('#333', 'border'), backgroundColor: tc('#333', 'bg') },
  scrollContent: { paddingHorizontal: 20 },

  reminderCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: tc('#13261A', 'bg'), borderRadius: 18, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: tc('#1F4A2C', 'border'), gap: 12 },
  reminderIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: MAIN_COLOR, justifyContent: 'center', alignItems: 'center' },
  reminderTitle: { color: tc('#FFF', 'fg'), fontSize: 16, fontWeight: 'bold', textAlign: 'left' },
  reminderText: { color: tc('#A9C7B2', 'fg'), fontSize: 13, marginTop: 2, textAlign: 'left' },
  reminderActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 10 },
  reminderBtn: { backgroundColor: MAIN_COLOR, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 7 },
  reminderBtnText: { color: tc('#000', 'fg'), fontWeight: 'bold' },
  reminderLink: { color: MAIN_COLOR, fontWeight: '600' },

  cycleSetupCard: { backgroundColor: tc('#2A1218', 'bg'), borderColor: tc('#5A2533', 'border') },
  cycleCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: tc('#141414', 'bg'), borderRadius: 18, padding: 14, marginBottom: 18, borderWidth: 1 },
  cycleIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cycleTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'left' },
  cycleText: { color: tc('#BBB', 'fg'), fontSize: 13, marginTop: 3, lineHeight: 19, textAlign: 'left' },
  cycleBtn: { alignSelf: 'flex-start', backgroundColor: tc('#FF6B81', 'bg'), borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6, marginTop: 10 },
  cycleBtnText: { color: tc('#000', 'fg'), fontWeight: 'bold', fontSize: 13 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { width: '48%', backgroundColor: tc('#1A1A1A', 'bg'), borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: tc('#333', 'border') },
  iconBg: { width: 40, height: 40, borderRadius: 10, backgroundColor: tc('rgba(231, 76, 60, 0.2)', 'bg'), justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: tc('#FFF', 'fg'), textAlign: 'left' },
  statLabel: { fontSize: 12, color: tc('#888', 'fg'), textAlign: 'left' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: tc('#FFF', 'fg'), marginBottom: 12, textAlign: 'left' },
  doneTodayChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: MAIN_COLOR, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, gap: 4, marginBottom: 12 },
  doneTodayText: { color: tc('#000', 'fg'), fontSize: 12, fontWeight: 'bold' },

  workoutCard: { width: '100%', height: 200, borderRadius: 20, marginBottom: 16, justifyContent: 'flex-end' },
  finishedCard: { justifyContent: 'center', alignItems: 'center', gap: 6, height: undefined, minHeight: 200, padding: 18 },
  finishedBtns: { flexDirection: 'row', gap: 10, marginTop: 10 },
  nextRoundBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: MAIN_COLOR, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 },
  nextRoundText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  certBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,215,0,0.5)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  certBtnText: { color: '#FFD700', fontWeight: 'bold', fontSize: 14 },
  roundTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFB142', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  workoutGradient: { width: '100%', height: '100%', borderRadius: 20, justifyContent: 'flex-end', padding: 15, flexDirection: 'row', alignItems: 'flex-end' },
  workoutInfo: { flex: 1 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tag: { backgroundColor: MAIN_COLOR, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, alignSelf: 'flex-start' },
  proTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFC107', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  proTagText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  lockedHint: { color: '#FFC107', fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'left' },
  lockButton: { backgroundColor: '#FFC107' },
  tagText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  workoutTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 5, textAlign: 'left' },
  workoutMeta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: '#DDD', fontSize: 12 },
  playButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: MAIN_COLOR, justifyContent: 'center', alignItems: 'center' },

  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  quickTile: { flex: 1, backgroundColor: tc('#1A1A1A', 'bg'), borderRadius: 18, padding: 16, borderWidth: 1, borderColor: tc('#2A2A2A', 'border') },
  quickTitle: { color: tc('#FFF', 'fg'), fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'left' },
  quickSub: { color: tc('#888', 'fg'), fontSize: 12, marginTop: 2, textAlign: 'left' },

  waterContainer: { backgroundColor: tc('#1A1A1A', 'bg'), borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  waterInfo: { alignItems: 'center' },
  waterValue: { fontSize: 24, fontWeight: 'bold', color: WATER_COLOR },
  waterLabel: { fontSize: 12, color: tc('#888', 'fg') },
  cupsContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5, paddingHorizontal: 10 },
  addWaterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: WATER_COLOR, justifyContent: 'center', alignItems: 'center' },

  planLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, paddingVertical: 10 },
  planLinkText: { color: MAIN_COLOR, fontWeight: 'bold', fontSize: 15 },
});

export default HomeScreen;

import React, { useState, useCallback } from 'react';
import { tc, statusStyle } from './theme';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';

import { WORKOUT_PLAN } from './exercisesdata';
import { getCompletedDays, getCurrentDay, getRound } from './progressstore';
import { roundLabel } from './rounds';
import { getIsPro, isDayPro, openPaywall, FREE_DAYS } from './pro';
import { tr } from './i18n';

const MAIN_COLOR = tc('#2ECC71', 'fg');

const WEEKS = [
  { id: 1, title: tr('الأسبوع 1'), subtitle: tr('مرحلة الإشعال') },
  { id: 2, title: tr('الأسبوع 2'), subtitle: tr('مرحلة الحرق') },
  { id: 3, title: tr('الأسبوع 3'), subtitle: tr('مرحلة النحت') },
  { id: 4, title: tr('الأسبوع 4'), subtitle: tr('مرحلة التنشيف') },
];

const ScheduleScreen = ({ navigation }) => {
  const [activeWeek, setActiveWeek] = useState(1);
  const [completed, setCompleted] = useState({});
  const [currentDay, setCurrentDay] = useState(1);
  const [isPro, setIsPro] = useState(false);
  const [round, setRound] = useState(1);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const done = await getCompletedDays();
        const day = await getCurrentDay();
        setCompleted(done);
        setIsPro(await getIsPro());
        setRound(await getRound());
        setCurrentDay(day);
        setActiveWeek(Math.ceil(day / 7));
      })();
    }, [])
  );

  // الأسبوع بيتفتح لما توصل لأول يوم فيه
  const unlockedWeekLimit = Math.ceil(currentDay / 7);
  const doneCount = Object.keys(completed).length;

  const getWeekDays = (weekNum) => {
    const days = [];
    const startDay = (weekNum - 1) * 7 + 1;
    for (let i = 0; i < 7; i++) if (WORKOUT_PLAN[startDay + i]) days.push(WORKOUT_PLAN[startDay + i]);
    return days;
  };

  const currentWeekDays = getWeekDays(activeWeek);
  const isCurrentWeekLocked = activeWeek > unlockedWeekLimit;

  return (
    <View style={styles.container}>
      <StatusBar style={statusStyle()} />
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{tr('خطتك')}</Text>
          <Ionicons name="calendar" size={28} color={tc("#FFC107", 'fg')} style={{ marginLeft: 10 }} />
        </View>
        <Text style={styles.headerSubtitle}>{round > 1 ? `${roundLabel(round)} • ` : tr('تحوّل في 4 أسابيع • ')}{tr('خلّصت ')}{doneCount}{tr(' من 28 يوم')}</Text>
        <View style={styles.overallTrack}>
          <View style={[styles.overallFill, { width: `${(doneCount / 28) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.weeksContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {WEEKS.map((week) => {
            const isLocked = week.id > unlockedWeekLimit;
            return (
              <TouchableOpacity
                key={week.id}
                style={[styles.weekBtn, activeWeek === week.id && styles.activeWeekBtn, isLocked && styles.lockedWeekBtn]}
                onPress={() => setActiveWeek(week.id)}
              >
                <Text style={[styles.weekText, activeWeek === week.id && styles.activeWeekText, isLocked && { color: tc('#888', 'fg') }]}>
                  {week.title}
                </Text>
                {!isPro && (round > 1 || week.id > Math.ceil(FREE_DAYS / 7)) ? (
                  <Ionicons name="star" size={12} color={tc("#FFC107", 'fg')} style={{ marginLeft: 5 }} />
                ) : (
                  isLocked && <Ionicons name="lock-closed" size={12} color={tc("#666", 'fg')} style={{ marginLeft: 5 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>
          {WEEKS[activeWeek - 1].title}: {WEEKS[activeWeek - 1].subtitle}
          {isCurrentWeekLocked && <Text style={{ color: tc('#666', 'fg'), fontSize: 14 }}>{tr(' (مقفول 🔒)')}</Text>}
        </Text>

        {currentWeekDays.map((day) => {
          const isDone = !!completed[day.dayId];
          const isToday = day.dayId === currentDay && !isDone;
          return (
            <TouchableOpacity
              key={day.dayId}
              style={[styles.dayCard, isCurrentWeekLocked && styles.lockedCard, isToday && styles.todayCard]}
              activeOpacity={isCurrentWeekLocked ? 1 : 0.7}
              onPress={() => {
                if (!isPro && isDayPro(day.dayId, round)) {
                  openPaywall(navigation, round > 1 ? 'rounds' : 'weeks');
                } else if (isCurrentWeekLocked) {
                  Alert.alert(tr('الأسبوع مقفول 🔒'), tr('خلّص الأسبوع اللي قبله عشان تفتح المرحلة دي!'));
                } else {
                  navigation.navigate('Workout', { dayId: day.dayId });
                }
              }}
            >
              <View style={[styles.dayIndicator, isDone && { backgroundColor: MAIN_COLOR }, isCurrentWeekLocked && { backgroundColor: tc('#333', 'bg') }]}>
                {isDone ? (
                  <Ionicons name="checkmark" size={22} color={tc("#000", 'fg')} />
                ) : (
                  <Text style={[styles.dayNumber, isCurrentWeekLocked && { color: tc('#666', 'fg') }]}>{day.dayId}</Text>
                )}
              </View>

              <View style={styles.cardInfo}>
                <Text style={[styles.dayTitle, isCurrentWeekLocked && { color: tc('#888', 'fg') }]}>{day.title}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color={tc("#666", 'fg')} />
                  <Text style={styles.metaText}> {day.duration}</Text>
                  <Text style={[styles.metaText, { marginHorizontal: 5 }]}>|</Text>
                  <Ionicons name="barbell-outline" size={14} color={tc("#666", 'fg')} />
                  <Text style={styles.metaText}> {day.level}</Text>
                  {isToday && <Text style={styles.todayTag}>{tr(' • النهارده')}</Text>}
                </View>
              </View>

              <View style={styles.actionIcon}>
                {isCurrentWeekLocked ? (
                  <Ionicons name="lock-closed" size={24} color={tc("#444", 'fg')} />
                ) : isDone ? (
                  <Ionicons name="refresh-circle" size={32} color={tc("#555", 'fg')} />
                ) : (
                  <Ionicons name="play-circle" size={32} color={MAIN_COLOR} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tc('#000000', 'bg') },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: tc('#FFF', 'fg') },
  headerSubtitle: { fontSize: 14, color: tc('#888', 'fg'), marginTop: 5, textAlign: 'left' },
  overallTrack: { height: 6, backgroundColor: tc('#222', 'bg'), borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  overallFill: { height: '100%', backgroundColor: MAIN_COLOR, borderRadius: 3 },

  weeksContainer: { height: 50, marginBottom: 10 },
  weekBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: tc('#1A1A1A', 'bg'), marginRight: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: tc('#333', 'border') },
  activeWeekBtn: { backgroundColor: MAIN_COLOR, borderColor: MAIN_COLOR },
  lockedWeekBtn: { opacity: 0.6, borderColor: tc('#222', 'border') },
  weekText: { color: tc('#888', 'fg'), fontWeight: 'bold' },
  activeWeekText: { color: tc('#000', 'fg') },

  scrollContent: { paddingHorizontal: 20 },
  sectionTitle: { color: tc('#FFF', 'fg'), fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 10, textAlign: 'left' },
  dayCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: tc('#1A1A1A', 'bg'), padding: 15, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: tc('#333', 'border') },
  todayCard: { borderColor: MAIN_COLOR },
  lockedCard: { backgroundColor: tc('#111', 'bg'), borderColor: tc('#222', 'border'), opacity: 0.5 },
  dayIndicator: { width: 40, height: 40, borderRadius: 20, backgroundColor: tc('#222', 'bg'), justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  dayNumber: { color: tc('#FFF', 'fg'), fontWeight: 'bold', fontSize: 16 },
  cardInfo: { flex: 1 },
  dayTitle: { color: tc('#FFF', 'fg'), fontSize: 16, fontWeight: 'bold', marginBottom: 4, textAlign: 'left' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: tc('#888', 'fg'), fontSize: 12 },
  todayTag: { color: MAIN_COLOR, fontSize: 12, fontWeight: 'bold' },
  actionIcon: { paddingLeft: 10 },
});

export default ScheduleScreen;

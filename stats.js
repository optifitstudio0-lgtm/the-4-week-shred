import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getEatenToday, getTotals, getTargets } from './mealstore';
import { getStats, getWeightLog, logWeight, deleteWeight, getPhotos } from './progressstore';
import { BADGES } from './badges';
import { formatDate, parseKey, daysLabel } from './dates';
import { analyzePlateau, getCalorieAdjust, setCalorieAdjust } from './plateau';
import { getCycleInfo } from './cycle';
import { ICON } from './rtl';
import WeightModal from './weightmodal';
import { tr } from './i18n';
import { AdBanner } from './ads';

const MAIN_COLOR = '#2ECC71';
const ACCENT_COLOR_CALORIES = '#E74C3C';
const ACCENT_COLOR_PROTEIN = '#3498DB';

const ProgressBar = ({ label, value, target, color, unit = '' }) => {
  const pct = Math.min((value / (target || 1)) * 100, 100);
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressInfo}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{Math.round(value)} / {Math.round(target)}{unit}</Text>
      </View>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

// رسم الوزن: أعمدة لآخر 10 تسجيلات (من غير مكتبات)
const WeightChart = ({ log, onLongPress }) => {
  const data = log.slice(-10);
  if (data.length < 2) {
    return (
      <View style={styles.chartEmpty}>
        <Ionicons name="stats-chart" size={36} color="#444" />
        <Text style={styles.chartEmptyText}>{tr('سجّل وزنك مرتين على الأقل عشان الرسم يظهر')}</Text>
      </View>
    );
  }
  const values = data.map((d) => d.kg);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  return (
    <View style={styles.chartBox}>
      <View style={styles.chartBars}>
        {data.map((d, i) => {
          const h = 18 + ((d.kg - min) / (max - min || 1)) * 110;
          const isLast = i === data.length - 1;
          const day = parseKey(d.date);
          return (
            <TouchableOpacity key={d.date} style={styles.barCol} onLongPress={() => onLongPress(d)} activeOpacity={0.8}>
              <Text style={[styles.barValue, isLast && { color: MAIN_COLOR }]}>{d.kg}</Text>
              <View style={[styles.bar, { height: h }, isLast && { backgroundColor: MAIN_COLOR }]} />
              <Text style={styles.barLabel}>{day.getDate()}/{day.getMonth() + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.chartHint}>{tr('اضغط مطوّل على أي عمود عشان تمسحه')}</Text>
    </View>
  );
};

const StatsScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [log, setLog] = useState([]);
  const [targets, setTargets] = useState({ cal: 2000, pro: 150 });
  const [eaten, setEaten] = useState({ cal: 0, pro: 0 });
  const [photos, setPhotos] = useState([]);
  const [modal, setModal] = useState(false);
  const [plateau, setPlateau] = useState(null);
  const [adjust, setAdjust] = useState(0);
  const [cycle, setCycle] = useState(null);

  const load = async () => {
    try {
      setStats(await getStats());
      const lg = await getWeightLog();
      setLog(lg);
      const c = await getCycleInfo();
      setCycle(c);
      setPlateau(await analyzePlateau(lg, c));
      setAdjust(await getCalorieAdjust());
      setPhotos(await getPhotos());
      // هدف النهارده (بعد تدوير الكارب) عشان يطابق شاشة الأكل
      const t = await getTargets();
      setTargets({ cal: t.cal, pro: t.pro });
      setEaten(getTotals(await getEatenToday()));
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const saveWeight = async (kg) => {
    setModal(false);
    const prev = log.length ? log[log.length - 1].kg : null;
    const before = parseInt(await AsyncStorage.getItem('calculatedCalories')) || null;
    await logWeight(kg); // بيعيد حساب السعرات لوحده
    const after = parseInt(await AsyncStorage.getItem('calculatedCalories')) || null;
    load();
    const msgs = [];
    // الوزن زاد في أيام الدورة أو قبلها: غالبًا مية
    const waterNote = !!cycle?.waterRetention && prev != null && parseFloat(kg) > prev;
    if (waterNote) msgs.push(tr('الزيادة دي غالبًا مية بسبب مرحلة "{0}"، وهتنزل لوحدها بعد الدورة بكام يوم.', cycle.label));
    if (before && after && before !== after) msgs.push(tr('على وزنك الجديد، سعراتك اليومية بقت {0} بدل {1}.', after, before));
    if (msgs.length) Alert.alert(waterNote ? tr('متقلقيش 💧') : tr('خطتك اتحدثت ✅'), msgs.join('\n\n'));
  };

  const cutCalories = async () => {
    await setCalorieAdjust(adjust - 100);
    const cal = parseInt(await AsyncStorage.getItem('calculatedCalories')) || null;
    load();
    if (cal) Alert.alert(tr('تمام ✅'), tr('سعراتك اليومية بقت {0}. ادّيها أسبوعين قبل ما تحكم.', cal));
  };

  const undoAdjust = async () => {
    await setCalorieAdjust(0);
    load();
  };

  const askDelete = (entry) => {
    Alert.alert(tr('تمسح التسجيل ده؟'), tr('{0} كجم • {1}', entry.kg, formatDate(entry.date)), [
      { text: tr('لا'), style: 'cancel' },
      { text: tr('امسح'), style: 'destructive', onPress: async () => { await deleteWeight(entry.date); load(); } },
    ]);
  };

  const s = stats || { completedCount: 0, streak: 0, bestStreak: 0, kgChange: 0 };
  const current = log.length ? log[log.length - 1].kg : null;
  const start = log.length ? log[0].kg : null;
  const change = s.kgChange;
  const earnedCount = stats ? BADGES.filter((b) => b.check(stats)).length : 0;
  const before = photos[0];
  const after = photos.length > 1 ? photos[photos.length - 1] : null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{tr('تقدمك')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* الستريك والبادچات */}
        <TouchableOpacity style={styles.streakCard} activeOpacity={0.85} onPress={() => navigation.navigate('Achievements')}>
          <View style={styles.streakBig}>
            <Ionicons name="flame" size={34} color="#FF7A00" />
            <Text style={styles.streakNum}>{s.streak}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>{tr('أيام ستريك')}</Text>
            <Text style={styles.streakSub}>{tr('أحسن ستريك: ')}{s.bestStreak}{tr(' • بادچات: ')}{earnedCount}/{BADGES.length}</Text>
          </View>
          <Ionicons name={ICON.chevronNext} size={22} color="#666" />
        </TouchableOpacity>

        {/* الوزن */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{tr('الوزن')}</Text>
          <TouchableOpacity style={styles.updateButton} onPress={() => setModal(true)}>
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.updateButtonText}>{tr('سجّل وزنك')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weightRow}>
          <View style={styles.weightBox}>
            <Text style={styles.weightLabel}>{tr('البداية')}</Text>
            <Text style={styles.weightValue}>{start ?? '--'}<Text style={styles.weightUnit}>{tr(' كجم')}</Text></Text>
          </View>
          <View style={styles.weightBox}>
            <Text style={styles.weightLabel}>{tr('دلوقتي')}</Text>
            <Text style={styles.weightValue}>{current ?? '--'}<Text style={styles.weightUnit}>{tr(' كجم')}</Text></Text>
          </View>
          <View style={styles.weightBox}>
            <Text style={styles.weightLabel}>{tr('الفرق')}</Text>
            <Text style={[styles.weightValue, { color: change < 0 ? MAIN_COLOR : change > 0 ? '#F39C12' : '#FFF' }]}>
              {change > 0 ? '+' : ''}{change}<Text style={styles.weightUnit}>{tr(' كجم')}</Text>
            </Text>
          </View>
        </View>

        <WeightChart log={log} onLongPress={askDelete} />

        {/* محقق الثبات */}
        {!!plateau && (
          <View style={styles.plateauCard}>
            <View style={styles.plateauHead}>
              <View style={styles.plateauIcon}><Ionicons name="search" size={18} color="#000" /></View>
              <Text style={styles.plateauTitle}>{tr('محقق الثبات')}</Text>
            </View>
            <Text style={styles.plateauLead}>
              {tr('أقل وزن وصلتله كان {0} كجم من {1}، ومن ساعتها الميزان مش بينزل. ده عادي جدًا، وغالبًا السبب واحد من دول:', plateau.lowestKg, daysLabel(plateau.stuckDays))}
            </Text>
            {plateau.reasons.slice(0, 4).map((r, i) => (
              <View key={i} style={styles.reasonRow}>
                <Ionicons name={r.icon} size={18} color={r.color} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reasonTitle}>{r.title}</Text>
                  <Text style={styles.reasonText}>{r.text}</Text>
                </View>
              </View>
            ))}
            {plateau.canCut && (
              <>
                <Text style={styles.plateauNote}>{tr('لو ماشي على الأكل كويس بقالك أسبوعين والوزن مش بينزل، نقلل 100 سعر بس. ده الحل الآمن.')}</Text>
                <TouchableOpacity style={styles.plateauBtn} onPress={cutCalories}>
                  <Text style={styles.plateauBtnText}>{tr('قلّل 100 سعر في اليوم')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
        {adjust < 0 && (
          <View style={styles.adjustRow}>
            <Text style={styles.adjustText}>{tr('سعراتك متقللة {0} من محقق الثبات', Math.abs(adjust))}</Text>
            <TouchableOpacity onPress={undoAdjust}><Text style={styles.adjustLink}>{tr('رجّعها')}</Text></TouchableOpacity>
          </View>
        )}

        {/* قبل وبعد */}
        <Text style={styles.sectionTitle}>{tr('قبل وبعد')}</Text>
        <TouchableOpacity style={styles.photosCard} activeOpacity={0.85} onPress={() => navigation.navigate('ProgressPhotos')}>
          <View style={styles.photosRow}>
            {[before, after].map((p, i) => (
              <View key={i} style={styles.photoSlot}>
                {p ? (
                  <Image source={{ uri: p.uri }} style={styles.photoImg} />
                ) : (
                  <View style={styles.photoEmpty}>
                    <Ionicons name="camera-outline" size={28} color="#555" />
                  </View>
                )}
                <Text style={styles.photoTag}>{i === 0 ? tr('قبل') : tr('بعد')}</Text>
              </View>
            ))}
          </View>
          <View style={styles.photosFooter}>
            <Text style={styles.photosText}>
              {photos.length === 0 ? tr('صوّر صورة "قبل" النهارده، هتشكر نفسك بعد 4 أسابيع') : tr('{0} صورة • قارن وشيّر', photos.length)}
            </Text>
            <Ionicons name={ICON.chevronNext} size={20} color="#666" />
          </View>
        </TouchableOpacity>

        {/* التحدي */}
        <Text style={styles.sectionTitle}>{tr('تحدي الـ28 يوم')}</Text>
        <ProgressBar label={tr('أيام مكتملة')} value={s.completedCount} target={28} color={MAIN_COLOR} />

        {/* الأكل */}
        <Text style={styles.sectionTitle}>{tr('أكل النهارده')}</Text>
        <ProgressBar label={tr('السعرات')} value={eaten.cal} target={targets.cal} color={ACCENT_COLOR_CALORIES} />
        <ProgressBar label={tr('البروتين')} value={eaten.pro} target={targets.pro} color={ACCENT_COLOR_PROTEIN} unit={tr(' جم')} />

        {/* بانر للمجاني بس */}
        <AdBanner />
      </ScrollView>

      <WeightModal visible={modal} initial={current} onClose={() => setModal(false)} onSave={saveWeight} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { width: '100%', paddingTop: 30, paddingBottom: 25, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  scrollContent: { padding: 20, paddingBottom: 130 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 12, marginTop: 20, textAlign: 'left' },

  streakCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F1408', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#4A2A0A', gap: 14 },
  streakBig: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakNum: { color: '#FFF', fontSize: 34, fontWeight: '900' },
  streakTitle: { color: '#FFF', fontSize: 17, fontWeight: 'bold', textAlign: 'left' },
  streakSub: { color: '#C8A27A', fontSize: 13, marginTop: 2, textAlign: 'left' },

  updateButton: { backgroundColor: MAIN_COLOR, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 },
  updateButtonText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  weightRow: { flexDirection: 'row', gap: 10 },
  weightBox: { flex: 1, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#222' },
  weightLabel: { fontSize: 13, color: '#888', textAlign: 'left' },
  weightValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginTop: 4, textAlign: 'left' },
  weightUnit: { fontSize: 12, color: '#888', fontWeight: 'normal' },

  chartBox: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#222' },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 170 },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 14, borderRadius: 7, backgroundColor: '#3A3A3A' },
  barValue: { color: '#AAA', fontSize: 10, marginBottom: 4 },
  barLabel: { color: '#666', fontSize: 10, marginTop: 6 },
  chartHint: { color: '#555', fontSize: 12, textAlign: 'center', marginTop: 10 },
  chartEmpty: { height: 130, backgroundColor: '#1A1A1A', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#222', paddingHorizontal: 20 },
  chartEmptyText: { marginTop: 10, color: '#666', fontSize: 14, textAlign: 'center' },

  plateauCard: { backgroundColor: '#101A24', borderRadius: 18, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#1E3A52' },
  plateauHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  plateauIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#5DADE2', justifyContent: 'center', alignItems: 'center' },
  plateauTitle: { color: '#FFF', fontSize: 17, fontWeight: 'bold', textAlign: 'left' },
  plateauLead: { color: '#C8D6E5', fontSize: 14, marginTop: 10, lineHeight: 20, textAlign: 'left' },
  reasonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  reasonTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', textAlign: 'left' },
  reasonText: { color: '#9FB3C8', fontSize: 13, marginTop: 2, lineHeight: 19, textAlign: 'left' },
  plateauNote: { color: '#C8D6E5', fontSize: 13, marginTop: 14, lineHeight: 19, textAlign: 'left' },
  plateauBtn: { backgroundColor: '#5DADE2', borderRadius: 20, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  plateauBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
  adjustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 4 },
  adjustText: { color: '#888', fontSize: 13, flex: 1, textAlign: 'left' },
  adjustLink: { color: MAIN_COLOR, fontWeight: 'bold', fontSize: 13 },

  photosCard: { backgroundColor: '#1A1A1A', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#222' },
  photosRow: { flexDirection: 'row', gap: 10 },
  photoSlot: { flex: 1, aspectRatio: 3 / 4, borderRadius: 14, overflow: 'hidden', backgroundColor: '#111' },
  photoImg: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#333', borderRadius: 14 },
  photoTag: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.7)', color: '#FFF', fontWeight: 'bold', fontSize: 13, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  photosFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  photosText: { color: '#BBB', fontSize: 14, flex: 1, textAlign: 'left' },

  progressCard: { backgroundColor: '#1A1A1A', borderRadius: 15, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontSize: 16, color: '#DDD', fontWeight: '600' },
  progressValue: { fontSize: 14, color: '#AAA', fontWeight: 'bold' },
  progressBarBackground: { height: 10, backgroundColor: '#333', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5 },
});

export default StatsScreen;

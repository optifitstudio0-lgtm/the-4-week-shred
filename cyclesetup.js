// =========================================================
// شاشة "خطة على حسب دورتك" (للستات)
// كل البيانات بتفضل على الموبايل بس
// =========================================================
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { getCycleSettings, saveCycleSettings, cycleInfoFor, PHASES } from './cycle';
import { recalcTargets } from './nutrition';
import { dateKey, addDays, diffDays, formatDate, daysLabel } from './dates';
import { ICON, dirX } from './rtl';
import { tr } from './i18n';

const MAIN_COLOR = '#2ECC71';
const CYCLE_COLOR = '#FF6B81';

const Switch = ({ value, onChange }) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [dirX(2), dirX(22)] });
  const backgroundColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['#3A3A3C', CYCLE_COLOR] });
  return (
    <TouchableOpacity activeOpacity={1} onPress={() => onChange(!value)} style={{ width: 50, height: 30, justifyContent: 'center' }}>
      <Animated.View style={[styles.track, { backgroundColor }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const Stepper = ({ label, value, sub, onMinus, onPlus }) => (
  <View style={styles.stepRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.stepLabel}>{label}</Text>
      {!!sub && <Text style={styles.stepSub}>{sub}</Text>}
    </View>
    <TouchableOpacity style={styles.stepBtn} onPress={onMinus}><Ionicons name="remove" size={22} color="#FFF" /></TouchableOpacity>
    <Text style={styles.stepValue}>{value}</Text>
    <TouchableOpacity style={styles.stepBtn} onPress={onPlus}><Ionicons name="add" size={22} color="#FFF" /></TouchableOpacity>
  </View>
);

const EFFECTS = {
  menstrual: tr('تمرين أخف 25% وراحة أطول'),
  follicular: tr('التمرين عادي، وده أحسن وقت للأرقام الكبيرة'),
  ovulation: tr('التمرين عادي، مع إحماء كويس'),
  luteal: tr('+100 سعر في اليوم'),
  pms: tr('تمرين أخف 25% و+100 سعر، والوزن الزيادة مية'),
};

const CycleSetupScreen = ({ navigation }) => {
  const [enabled, setEnabled] = useState(true);
  const [daysAgo, setDaysAgo] = useState(0);
  const [cycleLen, setCycleLen] = useState(28);
  const [periodLen, setPeriodLen] = useState(5);

  useEffect(() => {
    (async () => {
      const s = await getCycleSettings();
      if (s.lastStart) {
        setEnabled(!!s.enabled);
        setDaysAgo(Math.min(60, Math.max(0, diffDays(s.lastStart, dateKey()))));
      }
      setCycleLen(s.cycleLen || 28);
      setPeriodLen(s.periodLen || 5);
    })();
  }, []);

  const today = dateKey();
  const lastStart = addDays(today, -daysAgo);
  const info = cycleInfoFor({ enabled: true, lastStart, cycleLen, periodLen });
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const save = async () => {
    await saveCycleSettings({ enabled, lastStart, cycleLen, periodLen });
    await recalcTargets();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name={ICON.back} size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr('خطة على حسب دورتك')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          {tr('التمرين والسعرات بيتظبطوا على كل مرحلة في دورتك، وهنقولك إمتى الوزن الزيادة يبقى مية مش دهون.')}
        </Text>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Ionicons name="flower" size={22} color={CYCLE_COLOR} />
            <Text style={styles.switchText}>{tr('شغّلي خطة الدورة')}</Text>
            <Switch value={enabled} onChange={setEnabled} />
          </View>
        </View>

        {enabled && (
          <>
            <View style={styles.card}>
              <Stepper
                label={tr('آخر دورة بدأت')}
                value={daysAgo === 0 ? tr('النهارده') : tr('من {0}', daysLabel(daysAgo))}
                sub={formatDate(lastStart)}
                onMinus={() => setDaysAgo((d) => clamp(d - 1, 0, 60))}
                onPlus={() => setDaysAgo((d) => clamp(d + 1, 0, 60))}
              />
              <View style={styles.sep} />
              <Stepper
                label={tr('طول الدورة كلها')}
                sub={tr('من أول يوم لأول يوم في الدورة اللي بعدها (غالبًا 28)')}
                value={daysLabel(cycleLen)}
                onMinus={() => setCycleLen((v) => clamp(v - 1, 21, 40))}
                onPlus={() => setCycleLen((v) => clamp(v + 1, 21, 40))}
              />
              <View style={styles.sep} />
              <Stepper
                label={tr('أيام الدورة نفسها')}
                value={daysLabel(periodLen)}
                onMinus={() => setPeriodLen((v) => clamp(v - 1, 2, 8))}
                onPlus={() => setPeriodLen((v) => clamp(v + 1, 2, 8))}
              />
            </View>

            {!!info && (
              <View style={[styles.card, { borderColor: info.color + '66' }]}>
                <View style={styles.phaseHead}>
                  <Ionicons name={info.icon} size={22} color={info.color} />
                  <Text style={[styles.phaseTitle, { color: info.color }]}>{tr('النهارده: {0}', info.label)}</Text>
                </View>
                <Text style={styles.phaseSub}>{tr('اليوم {0} من {1} • الدورة الجاية بعد {2} تقريبًا', info.day, info.len, daysLabel(info.daysToNext))}</Text>
                <Text style={styles.phaseHint}>{info.hint}</Text>
              </View>
            )}

            <Text style={styles.section}>{tr('التطبيق بيعمل إيه في كل مرحلة')}</Text>
            <View style={styles.card}>
              {Object.values(PHASES).map((p, i) => (
                <View key={p.key} style={[styles.effectRow, i > 0 && styles.effectBorder]}>
                  <Ionicons name={p.icon} size={18} color={p.color} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.effectTitle}>{p.label}</Text>
                    <Text style={styles.effectText}>{EFFECTS[p.key]}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.privacy}>
          <Ionicons name="lock-closed" size={16} color="#888" />
          <Text style={styles.privacyText}>{tr('بياناتك بتفضل على موبايلك بس. ده مش وسيلة لمنع الحمل ولا تشخيص طبي.')}</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveText}>{tr('حفظ')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 30, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', textAlign: 'center', flex: 1 },
  backBtn: { width: 40, alignItems: 'flex-start' },
  content: { padding: 20, paddingBottom: 60 },
  intro: { color: '#BBB', fontSize: 14, lineHeight: 21, marginBottom: 16, textAlign: 'left' },
  card: { backgroundColor: '#161616', borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#262626' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'left' },
  track: { width: 50, height: 28, borderRadius: 14, justifyContent: 'center' },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  stepLabel: { color: '#FFF', fontSize: 15, fontWeight: 'bold', textAlign: 'left' },
  stepSub: { color: '#888', fontSize: 12, marginTop: 2, textAlign: 'left' },
  stepBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' },
  stepValue: { color: CYCLE_COLOR, fontSize: 15, fontWeight: 'bold', minWidth: 64, textAlign: 'center' },
  sep: { height: 1, backgroundColor: '#242424', marginVertical: 8 },
  phaseHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phaseTitle: { fontSize: 17, fontWeight: 'bold', textAlign: 'left' },
  phaseSub: { color: '#999', fontSize: 13, marginTop: 4, textAlign: 'left' },
  phaseHint: { color: '#DDD', fontSize: 14, marginTop: 8, lineHeight: 20, textAlign: 'left' },
  section: { color: '#FFF', fontSize: 17, fontWeight: 'bold', marginTop: 6, marginBottom: 10, textAlign: 'left' },
  effectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  effectBorder: { borderTopWidth: 1, borderTopColor: '#242424' },
  effectTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', textAlign: 'left' },
  effectText: { color: '#999', fontSize: 13, marginTop: 2, textAlign: 'left' },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 16 },
  privacyText: { color: '#888', fontSize: 12, flex: 1, textAlign: 'left' },
  saveBtn: { height: 56, borderRadius: 28, backgroundColor: MAIN_COLOR, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#000', fontWeight: 'bold', fontSize: 17 },
});

export default CycleSetupScreen;

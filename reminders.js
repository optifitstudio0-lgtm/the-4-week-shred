import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Animated, Alert, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { getReminders, saveReminders, requestPermission, sendTestNotification, refreshStreakSaver } from './notifications';
import { getStreak } from './progressstore';
import { formatTime, WEEKDAYS } from './dates';
import { ICON, dirX, isRTL } from './rtl';
import { tr } from './i18n';

const MAIN_COLOR = '#2ECC71';

// سويتش بنفس شكل الإعدادات (بيتحرك صح في RTL)
const Switch = ({ value, onChange }) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [dirX(2), dirX(22)] });
  const backgroundColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['#3A3A3C', MAIN_COLOR] });
  return (
    <TouchableOpacity activeOpacity={1} onPress={() => onChange(!value)} style={{ width: 50, height: 30, justifyContent: 'center' }}>
      <Animated.View style={[styles.track, { backgroundColor }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

// اختيار الوقت (ساعة/دقيقة) من غير مكتبات
const TimeModal = ({ visible, value, title, onClose, onSave }) => {
  const [h, setH] = useState(value?.hour ?? 8);
  const [m, setM] = useState(value?.minute ?? 0);
  useEffect(() => {
    if (visible) { setH(value?.hour ?? 8); setM(value?.minute ?? 0); }
  }, [visible]);
  const Stepper = ({ label, val, onUp, onDown }) => (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepBtn} onPress={onUp}><Ionicons name="chevron-up" size={26} color="#FFF" /></TouchableOpacity>
      <Text style={styles.stepVal}>{String(val).padStart(2, '0')}</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={onDown}><Ionicons name="chevron-down" size={26} color="#FFF" /></TouchableOpacity>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Text style={styles.sheetPreview}>{formatTime(h, m)}</Text>
          {/* الوقت بيتكتب دايمًا ساعة:دقيقة من الشمال لليمين، فبنعكس الترتيب في RTL */}
          <View style={styles.steppersRow}>
            {(isRTL ? ['m', ':', 'h'] : ['h', ':', 'm']).map((k) =>
              k === 'h' ? (
                <Stepper key="h" label={tr('ساعة')} val={h} onUp={() => setH((h + 1) % 24)} onDown={() => setH((h + 23) % 24)} />
              ) : k === 'm' ? (
                <Stepper key="m" label={tr('دقيقة')} val={m} onUp={() => setM((m + 5) % 60)} onDown={() => setM((m + 55) % 60)} />
              ) : (
                <Text key="c" style={styles.colon}>:</Text>
              )
            )}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={() => onSave({ hour: h, minute: m })}>
            <Text style={styles.saveText}>{tr('تمام')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 14, alignItems: 'center' }} onPress={onClose}>
            <Text style={{ color: '#888' }}>{tr('إلغاء')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const RemindersScreen = ({ navigation }) => {
  const [s, setS] = useState(null);
  const [editing, setEditing] = useState(null); // { path: ['meals','lunch'], title }

  useEffect(() => { getReminders().then(setS); }, []);

  const update = async (next) => {
    setS(next);
    await saveReminders(next);
    refreshStreakSaver(await getStreak().then((st) => ({ trainedToday: st.trainedToday, streak: st.current })));
  };

  const setPath = (path, value) => {
    const next = JSON.parse(JSON.stringify(s));
    let o = next;
    for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
    o[path[path.length - 1]] = value;
    update(next);
  };

  const getPath = (path) => path.reduce((o, k) => o[k], s);

  const toggleMaster = async (on) => {
    if (on) {
      const ok = await requestPermission();
      if (!ok) {
        Alert.alert(tr('الإشعارات مقفولة'), tr('افتح إعدادات الموبايل واسمح للتطبيق يبعت إشعارات.'), [
          { text: tr('بعدين'), style: 'cancel' },
          { text: tr('افتح الإعدادات'), onPress: () => Linking.openSettings() },
        ]);
        return;
      }
    }
    update({ ...s, enabled: on });
  };

  const test = async () => {
    const ok = await sendTestNotification();
    if (ok) Alert.alert(tr('اتبعت ✅'), tr('هيوصلك إشعار تجريبي كمان 3 ثواني. اقفل التطبيق لو عايز تشوفه فوق.'));
  };

  if (!s) return <View style={styles.container} />;

  const TimeRow = ({ icon, label, path, color = MAIN_COLOR }) => {
    const t = getPath(path);
    return (
      <TouchableOpacity style={styles.row} onPress={() => setEditing({ path, title: label })} disabled={!s.enabled}>
        <Ionicons name={icon} size={20} color={color} style={{ width: 28 }} />
        <Text style={styles.rowText}>{label}</Text>
        <Text style={styles.timeText}>{formatTime(t.hour, t.minute)}</Text>
        <Ionicons name={ICON.chevronNext} size={18} color="#555" />
      </TouchableOpacity>
    );
  };

  const Section = ({ icon, color, title, sub, path, children }) => {
    const on = getPath([...path, 'on']);
    return (
      <View style={[styles.card, !s.enabled && { opacity: 0.45 }]}>
        <View style={styles.cardHead}>
          <View style={[styles.cardIcon, { backgroundColor: color }]}><Ionicons name={icon} size={20} color="#000" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSub}>{sub}</Text>
          </View>
          <Switch value={on} onChange={(v) => s.enabled && setPath([...path, 'on'], v)} />
        </View>
        {on && children}
      </View>
    );
  };

  const Chips = ({ options, value, onPick }) => (
    <View style={styles.chips}>
      {options.map((o) => (
        <TouchableOpacity key={o.v} style={[styles.chip, value === o.v && styles.chipOn]} onPress={() => s.enabled && onPick(o.v)}>
          <Text style={[styles.chipText, value === o.v && styles.chipTextOn]}>{o.l}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name={ICON.back} size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr('التذكيرات')}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.master}>
          <Ionicons name="notifications" size={26} color={s.enabled ? MAIN_COLOR : '#666'} />
          <View style={{ flex: 1 }}>
            <Text style={styles.masterTitle}>{tr('كل التذكيرات')}</Text>
            <Text style={styles.masterSub}>{s.enabled ? tr('شغالة. هنفكّرك في المواعيد اللي تحت.') : tr('مقفولة. شغّلها عشان متنساش التحدي.')}</Text>
          </View>
          <Switch value={s.enabled} onChange={toggleMaster} />
        </View>

        <Section icon="barbell" color={MAIN_COLOR} title={tr('التمرين')} sub={tr('تذكير يومي بتمرين النهارده')} path={['workout']}>
          <TimeRow icon="time-outline" label={tr('ميعاد التمرين')} path={['workout']} />
        </Section>

        <Section icon="water" color="#3498DB" title={tr('المية')} sub={tr('كوباية كل كام ساعة طول اليوم')} path={['water']}>
          <Text style={styles.subLabel}>{tr('كل قد إيه؟')}</Text>
          <Chips
            options={[{ v: 1, l: tr('كل ساعة') }, { v: 2, l: tr('كل ساعتين') }, { v: 3, l: tr('كل 3 ساعات') }]}
            value={s.water.every}
            onPick={(v) => setPath(['water', 'every'], v)}
          />
          <Text style={styles.subLabel}>{tr('من الساعة')}</Text>
          <Chips
            options={[7, 8, 9, 10].map((h) => ({ v: h, l: formatTime(h, 0) }))}
            value={s.water.from}
            onPick={(v) => setPath(['water', 'from'], v)}
          />
          <Text style={styles.subLabel}>{tr('لحد الساعة')}</Text>
          <Chips
            options={[20, 21, 22, 23].map((h) => ({ v: h, l: formatTime(h, 0) }))}
            value={s.water.to}
            onPick={(v) => setPath(['water', 'to'], v)}
          />
        </Section>

        <Section icon="restaurant" color="#F39C12" title={tr('الوجبات')} sub={tr('تذكير بكل وجبة في خطة الأكل')} path={['meals']}>
          <TimeRow icon="sunny-outline" label={tr('الفطار')} path={['meals', 'breakfast']} color="#F39C12" />
          <TimeRow icon="restaurant-outline" label={tr('الغدا')} path={['meals', 'lunch']} color="#F39C12" />
          <TimeRow icon="cafe-outline" label={tr('السناك')} path={['meals', 'snack']} color="#F39C12" />
          <TimeRow icon="moon-outline" label={tr('العشا')} path={['meals', 'dinner']} color="#F39C12" />
        </Section>

        <Section icon="camera" color="#FF6B81" title={tr('صورة ووزن الأسبوع')} sub={tr('مرة في الأسبوع تصوّر وتتوزن')} path={['weekly']}>
          <Text style={styles.subLabel}>{tr('اليوم')}</Text>
          <Chips
            options={[1, 2, 3, 4, 5, 6, 7].map((d) => ({ v: d, l: WEEKDAYS[d - 1] }))}
            value={s.weekly.weekday}
            onPick={(v) => setPath(['weekly', 'weekday'], v)}
          />
          <TimeRow icon="time-outline" label={tr('الساعة')} path={['weekly']} color="#FF6B81" />
        </Section>

        <Section icon="flame" color="#FF7A00" title={tr('الستريك هيضيع')} sub={tr('لو لسه ما اتمرنتش لحد الميعاد ده')} path={['streak']}>
          <TimeRow icon="time-outline" label={tr('ميعاد التنبيه')} path={['streak']} color="#FF7A00" />
        </Section>

        <TouchableOpacity style={styles.testBtn} onPress={test}>
          <Ionicons name="paper-plane-outline" size={20} color={MAIN_COLOR} />
          <Text style={styles.testText}>{tr('ابعت إشعار تجريبي')}</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      <TimeModal
        visible={!!editing}
        title={editing?.title}
        value={editing ? getPath(editing.path) : null}
        onClose={() => setEditing(null)}
        onSave={({ hour, minute }) => {
          const next = JSON.parse(JSON.stringify(s));
          let o = next;
          editing.path.forEach((k) => { o = o[k]; });
          o.hour = hour;
          o.minute = minute;
          setEditing(null);
          update(next);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 30, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  iconBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },

  master: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#121F17', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#1F4A2C', marginBottom: 16 },
  masterTitle: { color: '#FFF', fontSize: 17, fontWeight: 'bold', textAlign: 'left' },
  masterSub: { color: '#9DB8A5', fontSize: 13, marginTop: 2, textAlign: 'left' },

  card: { backgroundColor: '#141414', borderRadius: 20, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#222' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textAlign: 'left' },
  cardSub: { color: '#888', fontSize: 12, marginTop: 2, textAlign: 'left' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginTop: 6, borderTopWidth: 1, borderTopColor: '#222', gap: 6 },
  rowText: { color: '#DDD', fontSize: 15, flex: 1, textAlign: 'left' },
  timeText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  subLabel: { color: '#888', fontSize: 13, marginTop: 14, marginBottom: 8, textAlign: 'left' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: '#1F1F1F', borderWidth: 1, borderColor: '#2E2E2E' },
  chipOn: { backgroundColor: MAIN_COLOR, borderColor: MAIN_COLOR },
  chipText: { color: '#BBB', fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: '#000' },

  testBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#1F4A2C' },
  testText: { color: MAIN_COLOR, fontWeight: 'bold', fontSize: 15 },

  track: { width: 50, height: 30, borderRadius: 15, justifyContent: 'center' },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFF' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: '#161616', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: '#2A2A2A' },
  sheetTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  sheetPreview: { color: MAIN_COLOR, fontSize: 30, fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
  steppersRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginVertical: 20 },
  stepper: { alignItems: 'center' },
  stepBtn: { width: 56, height: 40, borderRadius: 12, backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center' },
  stepVal: { color: '#FFF', fontSize: 40, fontWeight: 'bold', marginVertical: 6 },
  stepLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  colon: { color: '#FFF', fontSize: 40, fontWeight: 'bold', marginBottom: 20 },
  saveBtn: { backgroundColor: MAIN_COLOR, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#000', fontWeight: 'bold', fontSize: 17 },
});

export default RemindersScreen;

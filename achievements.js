import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { syncBadges, TOTAL_DAYS, devCompleteRound } from './progressstore';
import { BADGES } from './badges';
import { shareViewAsImage } from './share';
import { daysLabel } from './dates';
import { ICON } from './rtl';
import Certificate from './certificate';
import { tr } from './i18n';

const { width } = Dimensions.get('window');
const MAIN_COLOR = '#2ECC71';
const CERT_W = Math.min(width - 80, 300);

const AchievementsScreen = ({ navigation, route }) => {
  const [stats, setStats] = useState(null);
  const [earned, setEarned] = useState({});
  const [freshIds, setFreshIds] = useState([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [devPreview, setDevPreview] = useState(false);
  const certRef = useRef(null);
  const scrollRef = useRef(null);
  const certY = useRef(0);
  const flame = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const res = await syncBadges();
        setStats(res.stats);
        setEarned(res.earned);
        setFreshIds(res.fresh.map((b) => b.id));
        const n = (await AsyncStorage.getItem('userName')) || '';
        setName(n);
        if (route.params?.showCertificate) setTimeout(() => scrollRef.current?.scrollTo({ y: certY.current, animated: true }), 500);
      })();
      // اللهب بيتنفس
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(flame, { toValue: 1.12, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(flame, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, [])
  );

  const s = stats || { streak: 0, bestStreak: 0, completedCount: 0, challengeComplete: false };
  const earnedCount = Object.keys(earned).length;
  const unlocked = s.challengeComplete || (s.roundsCompleted || 0) > 0 || devPreview;
  // الشهادة بتاعة آخر جولة خلصت (الحالية لو خلصت، وإلا اللي قبلها)
  const certStats = stats ? { ...stats, ...(stats.cert || {}), round: stats.cert?.round || stats.round || 1 } : stats;
  const certRound = certStats?.round || 1;

  const shareCertificate = async () => {
    setBusy(true);
    await shareViewAsImage(certRef, { width: 1080, height: 1920, title: tr('شيّر شهادتك على الإنستا') });
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name={ICON.back} size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr('إنجازاتك')}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* الستريك */}
        <LinearGradient colors={['#3A1C05', '#140A02']} style={styles.streakHero}>
          <Animated.View style={{ transform: [{ scale: flame }] }}>
            <Ionicons name="flame" size={70} color={s.streak > 0 ? '#FF7A00' : '#5A4A3A'} />
          </Animated.View>
          <Text style={styles.streakNum}>{s.streak}</Text>
          <Text style={styles.streakLabel}>{s.streak > 0 ? tr('{0} ستريك', daysLabel(s.streak)) : tr('ابدأ ستريك النهارده')}</Text>
          <View style={styles.streakRow}>
            <View style={styles.streakMini}>
              <Text style={styles.streakMiniVal}>{s.bestStreak}</Text>
              <Text style={styles.streakMiniLabel}>{tr('أحسن ستريك')}</Text>
            </View>
            <View style={styles.streakMini}>
              <Text style={styles.streakMiniVal}>{s.completedCount}/{TOTAL_DAYS}</Text>
              <Text style={styles.streakMiniLabel}>{tr('أيام مكتملة')}</Text>
            </View>
            <View style={styles.streakMini}>
              <Text style={styles.streakMiniVal}>{s.roundsCompleted || 0}</Text>
              <Text style={styles.streakMiniLabel}>{tr('جولات خلصت')}</Text>
            </View>
            <View style={styles.streakMini}>
              <Text style={styles.streakMiniVal}>{earnedCount}/{BADGES.length}</Text>
              <Text style={styles.streakMiniLabel}>{tr('بادچات')}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* البادچات */}
        <Text style={styles.sectionTitle}>{tr('البادچات')}</Text>
        <View style={styles.grid}>
          {BADGES.map((b) => {
            const isEarned = !!earned[b.id];
            const pct = stats ? Math.round(b.progress(stats) * 100) : 0;
            const isFresh = freshIds.includes(b.id);
            return (
              <View key={b.id} style={[styles.badge, isEarned && { borderColor: b.color + '88' }]}>
                {isFresh && <Text style={styles.newTag}>{tr('جديد')}</Text>}
                <View style={[styles.badgeIcon, isEarned ? { backgroundColor: b.color } : styles.badgeIconLocked]}>
                  <Ionicons name={isEarned ? b.icon : 'lock-closed'} size={26} color={isEarned ? '#000' : '#555'} />
                </View>
                <Text style={[styles.badgeTitle, !isEarned && { color: '#888' }]} numberOfLines={2}>{b.title}</Text>
                <Text style={styles.badgeDesc} numberOfLines={2}>{b.desc}</Text>
                {!isEarned && (
                  <View style={styles.badgeTrack}>
                    <View style={[styles.badgeFill, { width: `${pct}%`, backgroundColor: b.color }]} />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* الشهادة */}
        <View onLayout={(e) => { certY.current = e.nativeEvent.layout.y - 10; }}>
          <Text style={styles.sectionTitle}>{certRound > 1 ? tr('شهادة الجولة {0}', certRound) : tr('شهادة الـ4 أسابيع')}</Text>
          <View style={styles.certBox}>
            <Certificate ref={certRef} width={CERT_W} name={name} stats={certStats} locked={!unlocked} />

            {unlocked ? (
              <TouchableOpacity style={styles.shareBtn} onPress={shareCertificate} disabled={busy}>
                {busy ? <ActivityIndicator color="#000" /> : <Ionicons name="logo-instagram" size={22} color="#000" />}
                <Text style={styles.shareBtnText}>{tr('شيّرها ستوري على الإنستا')}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.lockedInfo}>
                <Text style={styles.lockedText}>{tr('فاضلك ')}{TOTAL_DAYS - s.completedCount}{tr(' يوم وتفتح شهادتك')}</Text>
                <View style={styles.lockedTrack}>
                  <View style={[styles.lockedFill, { width: `${(s.completedCount / TOTAL_DAYS) * 100}%` }]} />
                </View>
              </View>
            )}

            {__DEV__ && !s.challengeComplete && (
              <TouchableOpacity onPress={() => setDevPreview((v) => !v)} style={styles.devBtn}>
                <Text style={styles.devText}>{devPreview ? tr('اقفل المعاينة') : tr('معاينة الشهادة (وضع التطوير بس)')}</Text>
              </TouchableOpacity>
            )}
            {__DEV__ && !s.challengeComplete && (
              <TouchableOpacity
                onPress={async () => { await devCompleteRound(); navigation.goBack(); }}
                style={styles.devBtn}
              >
                <Text style={styles.devText}>خلّص الجولة دي (تجربة، وضع التطوير بس)</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const BADGE_W = (width - 40 - 20) / 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 30, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  iconBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },

  streakHero: { borderRadius: 24, alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, borderWidth: 1, borderColor: '#4A2A0A' },
  streakNum: { color: '#FFF', fontSize: 56, fontWeight: '900', marginTop: -4 },
  streakLabel: { color: '#F5B041', fontSize: 16, fontWeight: 'bold' },
  streakRow: { flexDirection: 'row', gap: 10, marginTop: 20, alignSelf: 'stretch' },
  streakMini: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  streakMiniVal: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  streakMiniLabel: { color: '#C8A27A', fontSize: 12, marginTop: 2 },

  sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 28, marginBottom: 14, textAlign: 'left' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: BADGE_W, backgroundColor: '#121212', borderRadius: 18, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#222', minHeight: 150 },
  newTag: { position: 'absolute', top: 6, right: 6, backgroundColor: '#E74C3C', color: '#FFF', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
  badgeIcon: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  badgeIconLocked: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#2E2E2E' },
  badgeTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
  badgeDesc: { color: '#777', fontSize: 11, marginTop: 3, textAlign: 'center', lineHeight: 15 },
  badgeTrack: { alignSelf: 'stretch', height: 4, borderRadius: 2, backgroundColor: '#262626', marginTop: 8, overflow: 'hidden' },
  badgeFill: { height: '100%', borderRadius: 2 },

  certBox: { alignItems: 'center', backgroundColor: '#0D0D0D', borderRadius: 24, paddingVertical: 20, borderWidth: 1, borderColor: '#1E1E1E' },
  shareBtn: { marginTop: 18, height: 56, borderRadius: 28, backgroundColor: MAIN_COLOR, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 26 },
  shareBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  lockedInfo: { marginTop: 18, alignItems: 'center', width: CERT_W },
  lockedText: { color: '#BBB', fontSize: 15, fontWeight: '600' },
  lockedTrack: { alignSelf: 'stretch', height: 8, backgroundColor: '#222', borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  lockedFill: { height: '100%', backgroundColor: MAIN_COLOR, borderRadius: 4 },
  devBtn: { marginTop: 14, padding: 8 },
  devText: { color: '#555', fontSize: 12, textDecorationLine: 'underline' },
});

export default AchievementsScreen;

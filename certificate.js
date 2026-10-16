// =========================================================
// شهادة "خلّصت الـ4 أسابيع" بمقاس ستوري إنستجرام (9:16)
// بتتعرض صغيرة على الشاشة، وبتتصور 1080x1920 وقت الشير
// =========================================================
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDate } from './dates';
import { tr } from './i18n';

const GREEN = '#2ECC71';
const GOLD = '#FFD36B';

const Certificate = forwardRef(({ width, name, stats, locked = false }, ref) => {
  const W = width;
  const H = W * (16 / 9);
  const u = W / 360; // وحدة القياس عشان كل حاجة تتكبر مع العرض
  const kg = stats?.kgChange || 0;
  const round = stats?.round || 1;

  return (
    <View ref={ref} collapsable={false} style={{ width: W, height: H, borderRadius: 18 * u, overflow: 'hidden', backgroundColor: '#050805' }}>
      <LinearGradient colors={['#0F3D22', '#050805', '#050805']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent', 'rgba(46,204,113,0.18)']} style={[StyleSheet.absoluteFill, { top: H * 0.6 }]} />

      {/* إطار ذهبي */}
      <View style={{ position: 'absolute', top: 14 * u, left: 14 * u, right: 14 * u, bottom: 14 * u, borderWidth: 1.5 * u, borderColor: 'rgba(255,211,107,0.55)', borderRadius: 12 * u }} />
      <View style={{ position: 'absolute', top: 20 * u, left: 20 * u, right: 20 * u, bottom: 20 * u, borderWidth: 0.6 * u, borderColor: 'rgba(255,211,107,0.3)', borderRadius: 9 * u }} />

      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 34 * u, paddingTop: 46 * u }}>
        <Text style={{ color: '#FFF', fontSize: 15 * u, fontWeight: '900' }}>
          THE 4-WEEK <Text style={{ color: GREEN }}>SHRED</Text>
        </Text>

        <View style={{ width: 96 * u, height: 96 * u, borderRadius: 48 * u, borderWidth: 2 * u, borderColor: GOLD, justifyContent: 'center', alignItems: 'center', marginTop: 26 * u, backgroundColor: 'rgba(255,211,107,0.08)' }}>
          <Ionicons name="trophy" size={50 * u} color={GOLD} />
        </View>

        <Text style={{ color: GOLD, fontSize: 15 * u, fontWeight: 'bold', marginTop: 26 * u }}>{tr('شهادة إتمام')}</Text>
        <Text style={{ color: '#FFF', fontSize: 30 * u, fontWeight: '900', textAlign: 'center', marginTop: 6 * u, lineHeight: 42 * u }}>
          {round > 1 ? tr('خلّصت الجولة {0}', round) : tr('خلّصت تحدي')}{'\n'}{round > 1 ? tr('من تحدي الـ4 أسابيع') : tr('الـ4 أسابيع')}
        </Text>

        <View style={{ height: 1, width: 120 * u, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 18 * u }} />

        <Text style={{ color: '#9FB8A6', fontSize: 13 * u }}>{tr('الشهادة دي لـ')}</Text>
        <Text style={{ color: '#FFF', fontSize: 28 * u, fontWeight: 'bold', marginTop: 4 * u, textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit>
          {name || tr('البطل')}
        </Text>

        <View style={{ flexDirection: 'row', marginTop: 22 * u, gap: 8 * u, alignSelf: 'stretch' }}>
          {[
            { v: '28', l: tr('يوم') },
            { v: String(stats?.sessions || 28), l: tr('تمرين') },
            { v: `${kg > 0 ? '+' : ''}${kg}`, l: tr('كجم') },
            { v: String(stats?.bestStreak || 0), l: tr('أحسن ستريك') },
          ].map((x, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12 * u, paddingVertical: 12 * u, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ color: i === 2 ? GREEN : '#FFF', fontSize: 20 * u, fontWeight: '900' }}>{x.v}</Text>
              <Text style={{ color: '#8FA597', fontSize: 10 * u, marginTop: 2 * u }}>{x.l}</Text>
            </View>
          ))}
        </View>

        {!!stats?.startDate && (
          <Text style={{ color: '#8FA597', fontSize: 12 * u, marginTop: 22 * u }}>
            {tr('من ')}{formatDate(stats.startDate)}{tr(' لـ ')}{formatDate(stats.finishDate || stats.startDate)}
          </Text>
        )}

        <View style={{ flex: 1 }} />
        <Text style={{ color: GREEN, fontSize: 14 * u, fontWeight: 'bold', marginBottom: 46 * u }}>{tr('#تحدي_الـ4_أسابيع')}</Text>
      </View>

      {locked && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="lock-closed" size={40 * u} color="#FFF" />
          <Text style={{ color: '#FFF', fontSize: 16 * u, fontWeight: 'bold', marginTop: 10 * u }}>{tr('خلّص الـ28 يوم')}</Text>
        </View>
      )}
    </View>
  );
});

export default Certificate;

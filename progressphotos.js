import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { getPhotos, savePhotos, addPhoto, syncBadges } from './progressstore';
import { persistImage, deleteImage } from './files';
import { shareViewAsImage } from './share';
import { formatDate, diffDays } from './dates';
import { ICON } from './rtl';
import ActionSheet from './actionsheet';
import { getIsPro, openPaywall } from './pro';
import { tr } from './i18n';

const { width } = Dimensions.get('window');
const MAIN_COLOR = '#2ECC71';
const PINK = '#FF6B81';
const IMAGES = ImagePicker.MediaTypeOptions?.Images ?? ['images'];

const ProgressPhotosScreen = ({ navigation }) => {
  const [photos, setPhotos] = useState([]);
  const [beforeId, setBeforeId] = useState(null);
  const [afterId, setAfterId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(null); // { title, message, options }
  const cardRef = useRef(null);

  const load = async () => {
    const list = await getPhotos();
    setPhotos(list);
    setBeforeId((id) => (list.find((p) => p.id === id) ? id : list[0]?.id ?? null));
    setAfterId((id) => (list.find((p) => p.id === id) ? id : list.length > 1 ? list[list.length - 1].id : null));
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const before = photos.find((p) => p.id === beforeId);
  const after = photos.find((p) => p.id === afterId);
  const kgDiff = before?.kg != null && after?.kg != null ? Math.round((after.kg - before.kg) * 10) / 10 : null;
  const daysBetween = before && after ? diffDays(before.date, after.date) : null;

  const pick = async (fromCamera) => {
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(tr('محتاجين إذن'), fromCamera ? tr('اسمح للتطبيق يستخدم الكاميرا من الإعدادات.') : tr('اسمح للتطبيق يوصل للصور من الإعدادات.'));
        return;
      }
      const opts = { allowsEditing: true, aspect: [3, 4], quality: 0.8, mediaTypes: IMAGES };
      const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets?.length) return;
      setBusy(true);
      const uri = await persistImage(res.assets[0].uri, 'progress');
      const list = await addPhoto(uri);
      await syncBadges();
      setPhotos(list);
      if (list.length === 1) setBeforeId(list[0].id);
      else setAfterId(list[list.length - 1].id);
    } catch (e) {
      console.log(e);
      Alert.alert(tr('حصلت مشكلة'), tr('جرّب تاني.'));
    } finally {
      setBusy(false);
    }
  };

  const addFlow = () => {
    setSheet({
      title: tr('صورة تقدم جديدة'),
      message: tr('صوّر في نفس المكان ونفس الإضاءة كل مرة عشان المقارنة تبان.'),
      options: [
        { text: tr('صوّر دلوقتي'), icon: 'camera-outline', onPress: () => pick(true) },
        { text: tr('اختار من المعرض'), icon: 'images-outline', onPress: () => pick(false) },
      ],
    });
  };

  const onPhotoPress = (p) => {
    setSheet({
      title: formatDate(p.date),
      message: tr('اليوم {0}{1}', p.day, p.kg ? tr(' • {0} كجم', p.kg) : ''),
      options: [
        { text: tr('خليها صورة "قبل"'), icon: 'arrow-undo-outline', onPress: () => setBeforeId(p.id) },
        { text: tr('خليها صورة "بعد"'), icon: 'arrow-redo-outline', onPress: () => setAfterId(p.id) },
        {
          text: tr('امسح الصورة'),
          icon: 'trash-outline',
          destructive: true,
          onPress: async () => {
            const list = photos.filter((x) => x.id !== p.id);
            await savePhotos(list);
            await deleteImage(p.uri);
            load();
          },
        },
      ],
    });
  };

  const share = async () => {
    if (!before || !after) {
      Alert.alert(tr('محتاج صورتين'), tr('صوّر صورة "قبل" وصورة "بعد" عشان تشيّر المقارنة.'));
      return;
    }
    if (!(await getIsPro())) return openPaywall(navigation, 'share'); // الشير لبرو
    setBusy(true);
    await shareViewAsImage(cardRef, { width: 1080, height: 1350, title: tr('شيّر قبل وبعد') });
    setBusy(false);
  };

  const Slot = ({ photo, label, onEmpty }) => (
    <View style={styles.slot}>
      {photo ? (
        <Image source={{ uri: photo.uri }} style={styles.slotImg} />
      ) : (
        <TouchableOpacity style={styles.slotEmpty} onPress={onEmpty}>
          <Ionicons name="add-circle-outline" size={38} color="#666" />
          <Text style={styles.slotEmptyText}>{tr('صورة ')}{label}</Text>
        </TouchableOpacity>
      )}
      <View style={[styles.slotLabel, label === tr('بعد') && { backgroundColor: MAIN_COLOR }]}>
        <Text style={[styles.slotLabelText, label === tr('بعد') && { color: '#000' }]}>{label}</Text>
      </View>
      {photo && (
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.slotFooter}>
          <Text style={styles.slotDate}>{tr('اليوم ')}{photo.day}</Text>
          {photo.kg != null && <Text style={styles.slotKg}>{photo.kg}{tr(' كجم')}</Text>}
        </LinearGradient>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name={ICON.back} size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr('قبل وبعد')}</Text>
        <TouchableOpacity onPress={addFlow} style={styles.iconBtn}>
          <Ionicons name="camera-outline" size={26} color={MAIN_COLOR} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* الكارت اللي بيتشيّر (4:5 زي بوست إنستجرام) */}
        <View ref={cardRef} collapsable={false} style={styles.shareCard}>
          <View style={styles.shareTop}>
            <Text style={styles.brand}>THE 4-WEEK <Text style={{ color: MAIN_COLOR }}>SHRED</Text></Text>
            <Text style={styles.brandSub}>{tr('تحدي الـ4 أسابيع')}</Text>
          </View>
          <View style={styles.slotsRow}>
            <Slot photo={before} label={tr('قبل')} onEmpty={addFlow} />
            <Slot photo={after} label={tr('بعد')} onEmpty={addFlow} />
          </View>
          <View style={styles.shareBottom}>
            {kgDiff != null ? (
              <View style={styles.diffPill}>
                <Ionicons name={kgDiff <= 0 ? 'trending-down' : 'trending-up'} size={18} color="#000" />
                <Text style={styles.diffText}>{kgDiff > 0 ? '+' : ''}{kgDiff}{tr(' كجم')}</Text>
              </View>
            ) : null}
            {daysBetween != null && <Text style={styles.daysText}>{tr('في ')}{daysBetween}{tr(' يوم')}</Text>}
            <Text style={styles.hashtag}>{tr('#تحدي_الـ4_أسابيع')}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.shareBtn, (!before || !after) && { opacity: 0.5 }]} onPress={share} disabled={busy}>
          {busy ? <ActivityIndicator color="#000" /> : <Ionicons name="logo-instagram" size={22} color="#000" />}
          <Text style={styles.shareBtnText}>{tr('شيّر المقارنة')}</Text>
        </TouchableOpacity>

        <View style={styles.tips}>
          <Ionicons name="bulb-outline" size={18} color="#F1C40F" />
          <Text style={styles.tipsText}>{tr('نصيحة: صوّر الصبح، نفس الهدوم، نفس الزاوية. صورة كل أسبوع كفاية.')}</Text>
        </View>

        <View style={styles.galleryHeader}>
          <Text style={styles.sectionTitle}>{tr('كل الصور (')}{photos.length})</Text>
          <TouchableOpacity style={styles.addBtn} onPress={addFlow}>
            <Ionicons name="add" size={18} color="#000" />
            <Text style={styles.addBtnText}>{tr('صورة جديدة')}</Text>
          </TouchableOpacity>
        </View>

        {photos.length === 0 ? (
          <TouchableOpacity style={styles.emptyGallery} onPress={addFlow}>
            <Ionicons name="images-outline" size={44} color="#444" />
            <Text style={styles.emptyTitle}>{tr('لسه مفيش صور')}</Text>
            <Text style={styles.emptyText}>{tr('صورة النهارده هي صورة "قبل" بتاعتك')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.grid}>
            {[...photos].reverse().map((p) => {
              const tag = p.id === beforeId ? tr('قبل') : p.id === afterId ? tr('بعد') : null;
              return (
                <TouchableOpacity key={p.id} style={styles.thumb} onPress={() => onPhotoPress(p)} activeOpacity={0.85}>
                  <Image source={{ uri: p.uri }} style={styles.thumbImg} />
                  {tag && (
                    <View style={[styles.thumbTag, tag === tr('بعد') && { backgroundColor: MAIN_COLOR }]}>
                      <Text style={[styles.thumbTagText, tag === tr('بعد') && { color: '#000' }]}>{tag}</Text>
                    </View>
                  )}
                  <View style={styles.thumbFooter}>
                    <Text style={styles.thumbDay}>{tr('يوم ')}{p.day}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <ActionSheet visible={!!sheet} {...(sheet || {})} onClose={() => setSheet(null)} />
    </View>
  );
};

const CARD_W = width - 40;
const THUMB = (width - 40 - 20) / 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 30, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  iconBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },

  shareCard: { width: CARD_W, height: CARD_W * 1.25, backgroundColor: '#0A0A0A', borderRadius: 24, padding: 14, borderWidth: 1, borderColor: '#222', overflow: 'hidden' },
  shareTop: { alignItems: 'center', marginBottom: 10 },
  brand: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  brandSub: { color: '#888', fontSize: 13, marginTop: 2 },
  slotsRow: { flex: 1, flexDirection: 'row', gap: 10 },
  slot: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#161616' },
  slotImg: { width: '100%', height: '100%' },
  slotEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#333', borderRadius: 16 },
  slotEmptyText: { color: '#777', marginTop: 6, fontWeight: '600' },
  slotLabel: { position: 'absolute', top: 10, left: 10, backgroundColor: PINK, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  slotLabelText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  slotFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, paddingTop: 30 },
  slotDate: { color: '#DDD', fontSize: 12, fontWeight: '600', textAlign: 'left' },
  slotKg: { color: '#FFF', fontSize: 17, fontWeight: 'bold', textAlign: 'left' },
  shareBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  diffPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: MAIN_COLOR, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  diffText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
  daysText: { color: '#CCC', fontSize: 14, fontWeight: '600' },
  hashtag: { color: '#666', fontSize: 13 },

  shareBtn: { marginTop: 16, height: 56, borderRadius: 28, backgroundColor: MAIN_COLOR, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  shareBtnText: { color: '#000', fontWeight: 'bold', fontSize: 17 },
  tips: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(241,196,15,0.08)', borderRadius: 14, padding: 12, marginTop: 16 },
  tipsText: { color: '#CFC08A', fontSize: 13, flex: 1, textAlign: 'left', lineHeight: 19 },

  galleryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: MAIN_COLOR, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  emptyGallery: { alignItems: 'center', padding: 30, backgroundColor: '#111', borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  emptyTitle: { color: '#FFF', fontSize: 17, fontWeight: 'bold', marginTop: 10 },
  emptyText: { color: '#888', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumb: { width: THUMB, height: THUMB * 1.33, borderRadius: 14, overflow: 'hidden', backgroundColor: '#161616' },
  thumbImg: { width: '100%', height: '100%' },
  thumbTag: { position: 'absolute', top: 6, left: 6, backgroundColor: PINK, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  thumbTagText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  thumbFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 4 },
  thumbDay: { color: '#FFF', fontSize: 12, textAlign: 'center', fontWeight: '600' },
});

export default ProgressPhotosScreen;

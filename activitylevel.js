import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { tr } from './i18n';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 👈 استيراد

const MAIN_COLOR = '#2ECC71';

const activities = [
  { id: 'sedentary', title: tr('نشاط قليل أو مفيش'), subtitle: tr('قاعد أغلب الوقت (شغل مكتب مثلًا)'), icon: 'cafe-outline' },
  { id: 'light', title: tr('نشاط خفيف'), subtitle: tr('رياضة خفيفة 1-3 أيام في الأسبوع'), icon: 'walk-outline' },
  { id: 'moderate', title: tr('نشاط متوسط'), subtitle: tr('رياضة متوسطة 3-5 أيام في الأسبوع'), icon: 'bicycle-outline' },
  { id: 'very', title: tr('نشاط عالي'), subtitle: tr('رياضة تقيلة 6-7 أيام في الأسبوع'), icon: 'barbell-outline' },
];

const ActivityLevelScreen = ({ navigation }) => {
  const [selectedLevel, setSelectedLevel] = useState(null);

  const handleNext = async () => {
    if (selectedLevel) {
      // 👇 حفظ النشاط
      await AsyncStorage.setItem('userActivity', selectedLevel);
      navigation.navigate('Goal');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>{tr('مستوى نشاطك')}</Text>
        <Text style={styles.subtitle}>{tr('عشان نحسب حرقك اليومي، قولنا انت نشيط قد إيه.')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.listContainer}>
        {activities.map((item) => {
          const isSelected = selectedLevel === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, isSelected && styles.selectedCard]}
              onPress={() => setSelectedLevel(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={28} color={isSelected ? MAIN_COLOR : '#888'} />
              </View>
              <View style={styles.textWrapper}>
                <Text style={[styles.cardTitle, isSelected && styles.selectedText]}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
              {isSelected && <Ionicons name="checkmark-circle" size={24} color={MAIN_COLOR} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.nextButton, !selectedLevel && styles.disabledButton]} onPress={handleNext} disabled={!selectedLevel}>
          <Text style={styles.nextButtonText}>{tr('التالي')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 20, paddingVertical: 50 },
  header: { marginTop: 20, marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center' },
  listContainer: { paddingBottom: 20, gap: 15 },
  card: { backgroundColor: '#1A1A1A', borderRadius: 15, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  selectedCard: { borderColor: MAIN_COLOR, backgroundColor: 'rgba(46, 204, 113, 0.05)', shadowColor: MAIN_COLOR, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  iconContainer: { marginRight: 15 },
  textWrapper: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#DDD', marginBottom: 4, textAlign: 'left' },
  selectedText: { color: '#fff' },
  cardSubtitle: { fontSize: 14, color: '#666', textAlign: 'left' },
  footer: { paddingTop: 10, width: '100%', alignItems: 'center' },
  nextButton: { backgroundColor: MAIN_COLOR, width: '100%', height: 55, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: MAIN_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  disabledButton: { backgroundColor: '#333', shadowOpacity: 0 },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default ActivityLevelScreen;
import React, { useState } from 'react';
import { tc, statusStyle } from './theme';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { tr } from './i18n';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 👈 استيراد

const MAIN_COLOR = tc('#2ECC71', 'fg');

const goals = [
  { id: 'lose_weight', title: tr('خسارة وزن'), subtitle: tr('احرق دهون ونشّف'), icon: 'flame' },
  { id: 'build_muscle', title: tr('بناء عضل'), subtitle: tr('زوّد حجم وقوة'), icon: 'barbell' },
  { id: 'keep_fit', title: tr('لياقة وصحة'), subtitle: tr('خليك صحي ونشيط'), icon: 'heart' },
];

const GoalScreen = ({ navigation }) => {
  const [selectedGoal, setSelectedGoal] = useState(null);

  const handleNext = async () => {
    if (selectedGoal) {
      // 👇 حفظ الهدف
      await AsyncStorage.setItem('userGoal', selectedGoal);
      navigation.navigate('FitnessLevel'); // بعدها مستوى التمرين، وبعدين إنشاء الخطة
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={statusStyle()} />
      <View style={styles.header}>
        <Text style={styles.title}>{tr('إيه هدفك؟')}</Text>
        <Text style={styles.subtitle}>{tr('ده بيساعدنا نظبط سعراتك وشدة التمرين.')}</Text>
      </View>
      <View style={styles.goalsContainer}>
        {goals.map((item) => {
          const isSelected = selectedGoal === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, isSelected && styles.selectedCard]}
              onPress={() => setSelectedGoal(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, isSelected && { backgroundColor: MAIN_COLOR }]}>
                <Ionicons name={item.icon} size={32} color={isSelected ? tc('#FFF', 'fg') : MAIN_COLOR} />
              </View>
              <View style={styles.textWrapper}>
                <Text style={[styles.cardTitle, isSelected && styles.selectedText]}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={[styles.radioCircle, isSelected && styles.selectedRadio]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.nextButton, !selectedGoal && styles.disabledButton]} onPress={handleNext} disabled={!selectedGoal}>
          <Text style={styles.nextButtonText}>{tr('التالي')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tc('#000000', 'bg'), paddingHorizontal: 20, paddingVertical: 50, justifyContent: 'space-between' },
  header: { marginTop: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: tc('#fff', 'fg'), marginBottom: 10 },
  subtitle: { fontSize: 16, color: tc('#888', 'fg'), textAlign: 'center', paddingHorizontal: 10 },
  goalsContainer: { flex: 1, justifyContent: 'center', gap: 20 },
  card: { backgroundColor: tc('#1A1A1A', 'bg'), borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent', height: 100 },
  selectedCard: { borderColor: MAIN_COLOR, backgroundColor: tc('rgba(46, 204, 113, 0.05)', 'bg'), shadowColor: MAIN_COLOR, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 15, elevation: 10 },
  iconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: tc('rgba(46, 204, 113, 0.1)', 'bg'), justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textWrapper: { flex: 1 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: tc('#DDD', 'fg'), marginBottom: 4, textAlign: 'left' },
  selectedText: { color: tc('#fff', 'fg') },
  cardSubtitle: { fontSize: 14, color: tc('#666', 'fg'), textAlign: 'left' },
  radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: tc('#555', 'border'), justifyContent: 'center', alignItems: 'center' },
  selectedRadio: { borderColor: MAIN_COLOR },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: MAIN_COLOR },
  footer: { width: '100%', alignItems: 'center' },
  nextButton: { backgroundColor: MAIN_COLOR, width: '100%', height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: MAIN_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
  disabledButton: { backgroundColor: tc('#333', 'bg'), shadowOpacity: 0 },
  nextButtonText: { color: tc('#fff', 'fg'), fontSize: 18, fontWeight: 'bold' },
});

export default GoalScreen;
import React, { useState } from 'react';
import { tc, statusStyle } from './theme';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { tr } from './i18n';
import { saveWorkoutPrefs } from './progressstore';
import { FITNESS_LEVELS } from './rounds';

const MAIN_COLOR = tc('#2ECC71', 'fg');

// مستوى التمرين: بيظبط صعوبة الـ28 يوم (rounds.js) ويتغيّر بعدين من الإعدادات

const FitnessLevelScreen = ({ navigation }) => {
  const [selectedLevel, setSelectedLevel] = useState(null);

  const handleNext = async () => {
    if (selectedLevel) {
      await saveWorkoutPrefs({ level: selectedLevel });
      navigation.navigate('PlanGeneration');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={statusStyle()} />
      <View style={styles.header}>
        <Text style={styles.title}>{tr('مستواك في التمرين')}</Text>
        <Text style={styles.subtitle}>{tr('عشان نظبط صعوبة التمارين على قدك. تقدر تغيّره بعدين من الإعدادات.')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.listContainer}>
        {FITNESS_LEVELS.map((item) => {
          const isSelected = selectedLevel === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, isSelected && styles.selectedCard]}
              onPress={() => setSelectedLevel(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={28} color={isSelected ? MAIN_COLOR : tc('#888', 'fg')} />
              </View>
              <View style={styles.textWrapper}>
                <Text style={[styles.cardTitle, isSelected && styles.selectedText]}>{item.label}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                <Text style={styles.cardHint}>{item.hint}</Text>
              </View>
              {isSelected && <Ionicons name="checkmark-circle" size={24} color={MAIN_COLOR} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.nextButton, !selectedLevel && styles.disabledButton]} onPress={handleNext} disabled={!selectedLevel}>
          <Text style={styles.nextButtonText}>{tr('اعمل خطتي')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tc('#000000', 'bg'), paddingHorizontal: 20, paddingVertical: 50 },
  header: { marginTop: 20, marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: tc('#fff', 'fg'), marginBottom: 10 },
  subtitle: { fontSize: 16, color: tc('#888', 'fg'), textAlign: 'center' },
  listContainer: { paddingBottom: 20, gap: 15 },
  card: { backgroundColor: tc('#1A1A1A', 'bg'), borderRadius: 15, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  selectedCard: { borderColor: MAIN_COLOR, backgroundColor: tc('rgba(46, 204, 113, 0.05)', 'bg'), shadowColor: MAIN_COLOR, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  iconContainer: { marginRight: 15 },
  textWrapper: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: tc('#DDD', 'fg'), marginBottom: 4, textAlign: 'left' },
  selectedText: { color: tc('#fff', 'fg') },
  cardSubtitle: { fontSize: 14, color: tc('#666', 'fg'), textAlign: 'left' },
  cardHint: { fontSize: 12, color: MAIN_COLOR, marginTop: 4, textAlign: 'left' },
  footer: { paddingTop: 10, width: '100%', alignItems: 'center' },
  nextButton: { backgroundColor: MAIN_COLOR, width: '100%', height: 55, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: MAIN_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  disabledButton: { backgroundColor: tc('#333', 'bg'), shadowOpacity: 0 },
  nextButtonText: { color: tc('#fff', 'fg'), fontSize: 18, fontWeight: 'bold' },
});

export default FitnessLevelScreen;
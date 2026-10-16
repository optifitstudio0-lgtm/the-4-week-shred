import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { StatusBar } from 'expo-status-bar';
import { tr } from './i18n';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 👈 استيراد

const { width } = Dimensions.get('window');
const MAIN_COLOR = '#2ECC71';

const GenderScreen = ({ navigation }) => {
  const [selectedGender, setSelectedGender] = useState(null); 

  const handleNext = async () => {
    if (selectedGender) {
      // 👇 حفظ النوع
      await AsyncStorage.setItem('userGender', selectedGender);
      navigation.navigate('AgeWeight'); 
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>{tr('عرّفنا بنفسك!')}</Text>
        <Text style={styles.subtitle}>{tr('عشان نحسب سعراتك صح، محتاجين نعرف النوع.')}</Text>
      </View>
      <View style={styles.selectionContainer}>
        <TouchableOpacity 
          style={[styles.genderCard, selectedGender === 'male' && styles.selectedCard]}
          onPress={() => setSelectedGender('male')}
          activeOpacity={0.8}
        >
          <Ionicons name="male" size={50} color={selectedGender === 'male' ? MAIN_COLOR : '#555'} />
          <Text style={[styles.genderText, selectedGender === 'male' && styles.selectedText]}>{tr('ذكر')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.genderCard, selectedGender === 'female' && styles.selectedCard]}
          onPress={() => setSelectedGender('female')}
          activeOpacity={0.8}
        >
          <Ionicons name="female" size={50} color={selectedGender === 'female' ? MAIN_COLOR : '#555'} />
          <Text style={[styles.genderText, selectedGender === 'female' && styles.selectedText]}>{tr('أنثى')}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, !selectedGender && styles.disabledButton]} 
          onPress={handleNext}
          disabled={!selectedGender}
        >
          <Text style={styles.nextButtonText}>{tr('التالي')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 20, justifyContent: 'space-between', paddingVertical: 50 },
  header: { marginTop: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center', paddingHorizontal: 20 },
  selectionContainer: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 },
  genderCard: { width: width * 0.45, height: width * 0.45, borderRadius: 100, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  selectedCard: { borderColor: MAIN_COLOR, backgroundColor: 'rgba(46, 204, 113, 0.1)', shadowColor: MAIN_COLOR, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 },
  genderText: { marginTop: 10, fontSize: 18, color: '#555', fontWeight: '600' },
  selectedText: { color: '#fff' },
  footer: { width: '100%', alignItems: 'center' },
  nextButton: { backgroundColor: MAIN_COLOR, width: '100%', height: 55, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: MAIN_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  disabledButton: { backgroundColor: '#333', shadowOpacity: 0 },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default GenderScreen;
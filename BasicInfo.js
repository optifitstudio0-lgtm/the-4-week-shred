import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { tr } from './i18n';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 👈 استيراد

const MAIN_COLOR = '#2ECC71';

const AgeWeightScreen = ({ navigation }) => {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const isFormValid = age.length > 0 && weight.length > 0 && height.length > 0;

  // دالة مساعدة لضمان إدخال أرقام فقط
  const handleNumberInput = (text, setter) => {
    // استبدال أي شيء ليس رقماً (0-9) بنص فارغ
    const numericValue = text.replace(/[^0-9]/g, '');
    setter(numericValue);
  };

  const handleNext = async () => {
    if (isFormValid) {
      // 👇 حفظ البيانات
      await AsyncStorage.setItem('userAge', age);
      await AsyncStorage.setItem('userWeight', weight);
      await AsyncStorage.setItem('userHeight', height);
      navigation.navigate('ActivityLevel');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>{tr('بياناتك الأساسية')}</Text>
        <Text style={styles.subtitle}>{tr('عشان نصمّم خطتك، محتاجين مقاسات جسمك.')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          
          {/* Age Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>{tr('السن (سنة)')}</Text>
            <TextInput 
              style={styles.input} 
              placeholder={tr('مثلًا 25')} 
              placeholderTextColor="#555" 
              keyboardType="number-pad" // استخدام number-pad أفضل للأرقام فقط
              maxLength={2} 
              value={age} 
              onChangeText={(text) => handleNumberInput(text, setAge)} 
            />
          </View>

          {/* Weight Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>{tr('وزنك الحالي (كجم)')}</Text>
            <TextInput 
              style={styles.input} 
              placeholder={tr('مثلًا 75')} 
              placeholderTextColor="#555" 
              keyboardType="number-pad" 
              maxLength={3} 
              value={weight} 
              onChangeText={(text) => handleNumberInput(text, setWeight)} 
            />
          </View>

          {/* Height Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>{tr('الطول (سم)')}</Text>
            <TextInput 
              style={styles.input} 
              placeholder={tr('مثلًا 175')} 
              placeholderTextColor="#555" 
              keyboardType="number-pad" 
              maxLength={3} 
              value={height} 
              onChangeText={(text) => handleNumberInput(text, setHeight)} 
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, !isFormValid && styles.disabledButton]} 
          onPress={handleNext} 
          disabled={!isFormValid}
        >
          <Text style={styles.nextButtonText}>{tr('التالي')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 20, paddingVertical: 50 },
  header: { marginTop: 20, marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center' },
  formContainer: { gap: 20 },
  inputWrapper: { marginBottom: 15 },
  label: { color: MAIN_COLOR, fontSize: 16, fontWeight: '600', marginBottom: 10, marginLeft: 10, textAlign: 'left' },
  input: { backgroundColor: '#1A1A1A', height: 60, borderRadius: 15, paddingHorizontal: 20, color: '#fff', fontSize: 18, borderWidth: 1, borderColor: '#333' },
  footer: { marginTop: 20, width: '100%', alignItems: 'center' },
  nextButton: { backgroundColor: MAIN_COLOR, width: '100%', height: 55, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: MAIN_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  disabledButton: { backgroundColor: '#333', shadowOpacity: 0 },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default AgeWeightScreen;

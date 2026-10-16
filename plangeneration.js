import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native'; // 👈 مهم جداً عشان نعمل Reset
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureChallengeStart, logWeight, getWeightLog } from './progressstore';
import { calculatePlan } from './nutrition';
import { tr } from './i18n';

const { width } = Dimensions.get('window');
const MAIN_COLOR = '#2ECC71';

const loadingTexts = [
  tr('بنقرا مقاسات جسمك...'),
  tr('بنحسب معدل الحرق (BMR و TDEE)...'),
  tr('بنظبط الماكروز على هدفك...'),
  tr('بنرتّب أيام التمرين...'),
  tr('خطتك جاهزة!')
];

const PlanGenerationScreen = ({ navigation }) => {
  const [progress, setProgress] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const widthAnim = useRef(new Animated.Value(0)).current;

  const calculateAndSavePlan = async () => {
    try {
      // 1. حساب البيانات (زي ما هي في كودك)
      const gender = await AsyncStorage.getItem('userGender');
      const age = parseInt(await AsyncStorage.getItem('userAge'));
      const weight = parseFloat(await AsyncStorage.getItem('userWeight'));
      const height = parseFloat(await AsyncStorage.getItem('userHeight'));
      const activity = await AsyncStorage.getItem('userActivity');
      const goal = await AsyncStorage.getItem('userGoal');

      // المعادلة نفسها في nutrition.js عشان بتتعاد كل ما الوزن يتغير
      const plan = calculatePlan({ gender, age, weight, height, activity, goal });
      let workoutName = "General Fitness";
      let workoutType = "CARDIO";
      let workoutImage = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80";

      if (goal === 'lose_weight') {
        workoutName = "High Intensity Shred";
        workoutType = "HIIT & CARDIO";
        workoutImage = "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1267&q=80";
      } else if (goal === 'build_muscle') {
        workoutName = "Heavy Lifting & Size";
        workoutType = "STRENGTH";
        workoutImage = "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80";
      } else if (goal === 'keep_fit') {
        workoutName = "Total Body Tone";
        workoutType = "HYBRID";
        workoutImage = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80";
      }

      // حفظ البيانات المحسوبة
      if (plan) {
        await AsyncStorage.setItem('calculatedCalories', String(plan.calories));
        await AsyncStorage.setItem('calculatedProtein', String(plan.protein));
      }
      await AsyncStorage.setItem('planWorkoutName', workoutName);
      await AsyncStorage.setItem('planWorkoutType', workoutType);
      await AsyncStorage.setItem('planWorkoutImage', workoutImage);

      // بداية التحدي + أول وزن في متابعة الوزن + هدف المية (35 مل لكل كيلو)
      await ensureChallengeStart();
      if (weight && !(await getWeightLog()).length) await logWeight(weight);
      if (plan) await AsyncStorage.setItem('waterGoal', String(plan.water));

      // 👈 أهم سطر: بنحفظ إن الخطة اتعملت عشان App.js ميعرضش الأسئلة تاني
      await AsyncStorage.setItem('isPlanCreated', 'true');

    } catch (e) {
      console.log("Error:", e);
      // حتى لو حصل خطأ، نحفظ عشان المستخدم ميعلقش
      await AsyncStorage.setItem('isPlanCreated', 'true');
    }
  };

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: width * 0.8,
      duration: 5000,
      useNativeDriver: false,
    }).start();

    calculateAndSavePlan();

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 1;
        
        if (newProgress % 20 === 0 && newProgress < 100) {
          setTextIndex((prevIndex) => (prevIndex + 1) % loadingTexts.length);
        }

        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // 👇 التعديل هنا: غيرنا 'Home' لـ 'MainTabs' واستخدمنا reset
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }], // لازم الاسم ده يطابق الاسم في App.js
              })
            );
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.iconContainer}>
        <Ionicons name="settings-outline" size={80} color={MAIN_COLOR} style={{ opacity: 0.8 }} />
        <Ionicons name="flash" size={40} color="#FFF" style={styles.centerIcon} />
      </View>
      <Text style={styles.title}>{tr('بنصمّم خطتك')}</Text>
      <Text style={styles.subtitle}>{loadingTexts[textIndex]}</Text>
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBarFill, { width: widthAnim }]} />
      </View>
      <Text style={styles.percentage}>{progress}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  iconContainer: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 40, position: 'relative' },
  centerIcon: { position: 'absolute' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 15 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 50, textAlign: 'center', height: 25 },
  progressBarContainer: { width: width * 0.8, height: 10, backgroundColor: '#333', borderRadius: 10, overflow: 'hidden', marginBottom: 20 },
  progressBarFill: { height: '100%', backgroundColor: MAIN_COLOR, borderRadius: 10, shadowColor: MAIN_COLOR, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10 },
  percentage: { fontSize: 24, fontWeight: 'bold', color: MAIN_COLOR, textShadowColor: 'rgba(46, 204, 113, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
});

export default PlanGenerationScreen;
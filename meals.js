import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import MealImage from './mealimage';
import { loadTodayPlan, toggleEaten, swapMealInPlan, getTotals } from './mealstore';
import { formatToday } from './dates';
import { AdBanner, unlockSwap } from './ads';
import { tr } from './i18n';

const MAIN_COLOR = '#2ECC71'; // لون البراند (أخضر حيوي)
const PROTEIN_COLOR = '#3498DB';
const CARBS_COLOR = '#F1C40F';
const FAT_COLOR = '#E67E22';

// شريط ماكروز صغير (بروتين / كارب / دهون)
const MacroBar = ({ label, value, target, color }) => {
  const pct = Math.min((value / (target || 1)) * 100, 100);
  return (
    <View style={styles.macroBarBox}>
      <Text style={styles.macroBarLabel}>{label}</Text>
      <View style={styles.macroBarTrack}>
        <View style={[styles.macroBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroBarValue}>{Math.round(value)}<Text style={styles.macroBarTarget}> / {target}{tr(' جم')}</Text></Text>
    </View>
  );
};

// كارت الوجبة (الصورة الطائرة + الاسم + الماكروز + علامة صح)
const MealCard = ({ meal, isEaten, onOpen, onToggle, onSwap }) => {
  const spin = useRef(new Animated.Value(0)).current;
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handleSwap = () => {
    spin.setValue(0);
    Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    onSwap();
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onOpen} style={{ marginBottom: 40, zIndex: 1 }}>
      <View style={[styles.mealCard, isEaten && styles.mealCardEaten]}>

        {/* الصورة الطائرة */}
        <Animated.View style={[styles.floatingImageContainer, { transform: [{ rotate }] }]}>
          <MealImage meal={meal} style={styles.mealImage} dim={isEaten} />
        </Animated.View>

        {/* معلومات الوجبة */}
        <View style={styles.mealInfo}>
          <View style={styles.typeRow}>
            <Text style={[styles.mealType, isEaten && { color: '#555' }]}>{meal.label || meal.type}</Text>
            <Text style={styles.mealTime}>{meal.time}</Text>
          </View>

          {/* الاسم وزر التبديل */}
          <View style={styles.nameSwapContainer}>
            <Text style={[styles.mealName, isEaten && { textDecorationLine: 'line-through', color: '#888' }]} numberOfLines={2}>
              {meal.name}
            </Text>
            {!isEaten && (
              <TouchableOpacity onPress={handleSwap} style={styles.swapButton} hitSlop={10}>
                <Ionicons name="swap-horizontal-outline" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>

          {/* الماكروز (Macros) */}
          <View style={styles.macrosRow}>
            <View style={styles.macroTag}>
              <Ionicons name="flame" size={14} color={isEaten ? '#555' : '#E74C3C'} />
              <Text style={[styles.macroText, isEaten && { color: '#555' }]}>{meal.cal}{tr(' سعر')}</Text>
            </View>
            <View style={styles.macroTag}>
              <Ionicons name="nutrition" size={14} color={isEaten ? '#555' : PROTEIN_COLOR} />
              <Text style={[styles.macroText, isEaten && { color: '#555' }]}>{meal.pro}{tr(' جم بروتين')}</Text>
            </View>
          </View>
        </View>

        {/* زر علامة صح (Checkbox) */}
        <TouchableOpacity onPress={onToggle} style={styles.checkboxContainer} hitSlop={10}>
          {isEaten ? (
            <Ionicons name="checkmark-circle" size={32} color={MAIN_COLOR} />
          ) : (
            <Ionicons name="ellipse-outline" size={32} color="#444" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// =========================================================
// المكون الرئيسي (Main Component)
// =========================================================
const MealsScreen = ({ navigation }) => {
  const [targets, setTargets] = useState({ cal: 2000, pro: 150, carbs: 200, fat: 55 });
  const [meals, setMeals] = useState([]);
  const [eatenMeals, setEatenMeals] = useState([]);

  // كل ما الشاشة تفتح: نجيب خطة النهارده (أو نعمل واحدة جديدة لو يوم جديد)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const data = await loadTodayPlan();
          if (!active) return;
          setTargets(data.targets);
          setMeals(data.meals);
          setEatenMeals(data.eaten);
        } catch (e) { console.log(e); }
      })();
      return () => { active = false; };
    }, [])
  );

  const eaten = getTotals(eatenMeals);
  const left = Math.max(targets.cal - eaten.cal, 0);
  const percent = Math.min(Math.round((eaten.cal / (targets.cal || 1)) * 100), 100);
  const dateLabel = formatToday();

  const handleToggle = async (mealId) => {
    const next = await toggleEaten(mealId);
    setEatenMeals(next);
  };

  const handleSwap = async (type) => {
    if (!(await unlockSwap(navigation))) return; // برو، أو إعلان بمكافأة للمجاني
    const newMeal = await swapMealInPlan(type);
    if (!newMeal) return;
    setMeals((prev) => prev.map((m) => (m.type === type ? newMeal : m)));
    const data = await loadTodayPlan();
    setEatenMeals(data.eaten);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{tr('خطة أكل النهارده')}</Text>
        <Text style={styles.headerDate}>{dateLabel}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* ملخص اليوم (Calories + Macros) */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>{tr('هدف اليوم')}</Text>
              <Text style={styles.leftValue}>{left}<Text style={styles.leftUnit}>{tr(' سعر فاضل')}</Text></Text>
              <Text style={styles.summarySub}>{tr('كلت ')}{eaten.cal}{tr(' من ')}{targets.cal}{tr(' سعر')}</Text>
            </View>
            <View style={[styles.progressCircle, percent >= 100 && { backgroundColor: 'rgba(46,204,113,0.15)' }]}>
              <Text style={styles.progressText}>{percent}%</Text>
            </View>
          </View>

          {/* تدوير الكارب: نوع يوم التمرين بيحدد الكارب والدهون */}
          {!!targets.dayType && (
            <View style={styles.dayTypeRow}>
              <Ionicons name={targets.dayType.icon} size={16} color={CARBS_COLOR} />
              <Text style={styles.dayTypeText}>
                {targets.dayType.label}: <Text style={styles.dayTypeHint}>{targets.dayType.hint}</Text>
              </Text>
            </View>
          )}

          <View style={styles.macroBarsRow}>
            <MacroBar label={tr('بروتين')} value={eaten.pro} target={targets.pro} color={PROTEIN_COLOR} />
            <MacroBar label={tr('كارب')} value={eaten.carbs} target={targets.carbs} color={CARBS_COLOR} />
            <MacroBar label={tr('دهون')} value={eaten.fat} target={targets.fat} color={FAT_COLOR} />
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{tr('وجباتك')}</Text>
          <Text style={styles.sectionCount}>{tr('اتاكل ')}{meals.filter((m) => eatenMeals.includes(m.id)).length}{tr(' من ')}{meals.length}</Text>
        </View>

        {/* قائمة الوجبات */}
        <View style={{ paddingTop: 25 }}>
          {meals.map((meal) => (
            <MealCard
              key={meal.type}
              meal={meal}
              isEaten={eatenMeals.includes(meal.id)}
              onOpen={() => navigation.navigate('MealDetail', { meal })}
              onToggle={() => handleToggle(meal.id)}
              onSwap={() => handleSwap(meal.type)}
            />
          ))}
        </View>

        {/* بانر للمجاني بس */}
        <AdBanner />
      </ScrollView>
    </View>
  );
};

// =========================================================
// التنسيقات (Styles) - تصميم داكن حديث
// =========================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    width: '100%', // عشان ياخد العرض كامل
    paddingTop: 30, // تظبيط المسافة من فوق (زي الكود التاني)
    paddingBottom: 25, // مسافة تحت النص
    backgroundColor: '#111', // لون الخلفية الغامق المميز
    borderBottomWidth: 1, // الخط الفاصل تحت الهيدر
    borderBottomColor: '#222', // لون الخط الفاصل
    alignItems: 'center', // دي اللي بتخلي الكلام في النص أفقياً
    justifyContent: 'center', // دي بتسنتر المحتوى رأسياً
  },

  headerTitle: {
    fontSize: 22, // تكبير الخط شوية زي الكود التاني
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center', // تأكيد إن النص نفسه متوسط
  },
  headerDate: { fontSize: 13, color: '#888', marginTop: 4, textAlign: 'center' },
  summaryCard: { marginTop: 20,
    backgroundColor: '#1A1A1A', padding: 20, borderRadius: 20, marginBottom: 30,
    borderWidth: 1, borderColor: '#333'
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftValue: { fontSize: 30, fontWeight: 'bold', color: '#FFF', marginTop: 6 },
  leftUnit: { fontSize: 14, color: '#888', fontWeight: '600' },
  macroBarsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  dayTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: 'rgba(241,196,15,0.08)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  dayTypeText: { color: '#FFF', fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'left' },
  dayTypeHint: { color: '#AAA', fontWeight: '400' },
  macroBarBox: { flex: 1 },
  macroBarLabel: { color: '#AAA', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  macroBarTrack: { height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 3 },
  macroBarValue: { color: '#FFF', fontSize: 13, fontWeight: 'bold', marginTop: 6 },
  macroBarTarget: { color: '#666', fontWeight: 'normal' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionCount: { color: '#888', fontSize: 13, fontWeight: '600' },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  summarySub: { fontSize: 14, color: '#888', marginTop: 5 },
  progressCircle: {
    width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: MAIN_COLOR,
    justifyContent: 'center', alignItems: 'center'
  },
  progressText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  
  // تصميم الكارت الجديد
  mealCard: {
    flexDirection: 'row', 
    backgroundColor: '#1A1A1A', 
    borderRadius: 20, 
    padding: 15, 
    paddingLeft: 135, // مسافة كبيرة عشان الصورة الطائرة
    minHeight: 110,
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#1A1A1A',
    overflow: 'visible', // مهم جداً عشان الصورة تخرج برا الكارت
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  mealCardEaten: { borderColor: '#333', backgroundColor: '#111' },
  
  floatingImageContainer: {
    position: 'absolute',
    top: -30,  
    left: -20, 
    zIndex: 10,
  },
  mealImage: { 
    width: 140, 
    height: 140, 
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  mealInfo: { flex: 1, justifyContent: 'center' },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  mealType: { fontSize: 13, color: MAIN_COLOR, fontWeight: 'bold' },
  mealTime: { fontSize: 12, color: '#666' },
  nameSwapContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1, 
    marginRight: 5,
  },
  swapButton: {
    paddingLeft: 10,
  },
  macrosRow: { flexDirection: 'row', gap: 10 },
  macroTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  macroText: { fontSize: 12, color: '#BBB' },
  checkboxContainer: {
    paddingLeft: 10,
    justifyContent: 'center',
  },
});

export default MealsScreen;
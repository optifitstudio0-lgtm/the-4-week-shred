import React, { useState, useCallback, useRef } from 'react';
import { tc, statusStyle } from './theme';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing,
  Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import MealImage from './mealimage';
import { loadTodayPlan, toggleEaten, swapMealInPlan, getDayTotals, getExtrasToday, addExtraMeal, removeExtraMeal, QUICK_EXTRAS } from './mealstore';
import { formatToday } from './dates';
import { AdBanner, unlockSwap } from './ads';
import { tr } from './i18n';

const MAIN_COLOR = tc('#2ECC71', 'fg'); // لون البراند (أخضر حيوي)
const PROTEIN_COLOR = tc('#3498DB', 'fg');
const CARBS_COLOR = tc('#F1C40F', 'fg');
const FAT_COLOR = tc('#E67E22', 'fg');

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
            <Text style={[styles.mealType, isEaten && { color: tc('#555', 'fg') }]}>{meal.label || meal.type}</Text>
            <Text style={styles.mealTime}>{meal.time}</Text>
          </View>

          {/* الاسم وزر التبديل */}
          <View style={styles.nameSwapContainer}>
            <Text style={[styles.mealName, isEaten && { textDecorationLine: 'line-through', color: tc('#888', 'fg') }]} numberOfLines={2}>
              {meal.name}
            </Text>
            {!isEaten && (
              <TouchableOpacity onPress={handleSwap} style={styles.swapButton} hitSlop={10}>
                <Ionicons name="swap-horizontal-outline" size={20} color={tc("#888", 'fg')} />
              </TouchableOpacity>
            )}
          </View>

          {/* الماكروز (Macros) */}
          <View style={styles.macrosRow}>
            <View style={styles.macroTag}>
              <Ionicons name="flame" size={14} color={isEaten ? tc('#555', 'fg') : tc('#E74C3C', 'fg')} />
              <Text style={[styles.macroText, isEaten && { color: tc('#555', 'fg') }]}>{meal.cal}{tr(' سعر')}</Text>
            </View>
            <View style={styles.macroTag}>
              <Ionicons name="nutrition" size={14} color={isEaten ? tc('#555', 'fg') : PROTEIN_COLOR} />
              <Text style={[styles.macroText, isEaten && { color: tc('#555', 'fg') }]}>{meal.pro}{tr(' جم بروتين')}</Text>
            </View>
          </View>
        </View>

        {/* زر علامة صح (Checkbox) */}
        <TouchableOpacity onPress={onToggle} style={styles.checkboxContainer} hitSlop={10}>
          {isEaten ? (
            <Ionicons name="checkmark-circle" size={32} color={MAIN_COLOR} />
          ) : (
            <Ionicons name="ellipse-outline" size={32} color={tc("#444", 'fg')} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// كارت صغير للحاجة اللي اتاكلت من برا الخطة
const ExtraRow = ({ item, onRemove }) => (
  <View style={styles.extraRow}>
    <Ionicons name="checkmark-circle" size={22} color={MAIN_COLOR} />
    <View style={{ flex: 1 }}>
      <Text style={styles.extraName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.extraMeta}>{item.cal}{tr(' سعر')} · {item.pro}{tr(' جم بروتين')}</Text>
    </View>
    <TouchableOpacity onPress={onRemove} hitSlop={10}>
      <Ionicons name="close-circle-outline" size={22} color={tc('#666', 'fg')} />
    </TouchableOpacity>
  </View>
);

// شيت "أكلت حاجة تانية": اختيار سريع أو سعرات تقريبية
const ExtraSheet = ({ visible, onClose, onAdd }) => {
  const [cal, setCal] = useState('');
  const [pro, setPro] = useState('');
  const close = () => { setCal(''); setPro(''); onClose(); };
  const addCustom = () => {
    if (!parseInt(cal)) return;
    onAdd({ name: tr('أكلة من برا الخطة'), cal, pro });
    close();
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetBackdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{tr('أكلت إيه؟')}</Text>
          <Text style={styles.sheetSub}>{tr('مش لازم تكون دقيق، المهم تفضل متابع')}</Text>

          {QUICK_EXTRAS.map((q) => (
            <TouchableOpacity key={q.key} style={styles.quickRow} onPress={() => { onAdd(q); close(); }}>
              <Ionicons name={q.icon} size={20} color={MAIN_COLOR} />
              <Text style={styles.quickName}>{q.name}</Text>
              <Text style={styles.quickCal}>~{q.cal}{tr(' سعر')}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sheetLabel}>{tr('أو اكتب السعرات بنفسك')}</Text>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} value={cal} onChangeText={setCal} keyboardType="number-pad" placeholder={tr('السعرات')} placeholderTextColor={tc('#666', 'fg')} />
            <TextInput style={styles.input} value={pro} onChangeText={setPro} keyboardType="number-pad" placeholder={tr('بروتين (اختياري)')} placeholderTextColor={tc('#666', 'fg')} />
          </View>
          <TouchableOpacity style={[styles.addBtn, !parseInt(cal) && { opacity: 0.4 }]} onPress={addCustom} disabled={!parseInt(cal)}>
            <Text style={styles.addBtnText}>{tr('سجّل الأكلة')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// =========================================================
// المكون الرئيسي (Main Component)
// =========================================================
const MealsScreen = ({ navigation }) => {
  const [targets, setTargets] = useState({ cal: 2000, pro: 150, carbs: 200, fat: 55 });
  const [meals, setMeals] = useState([]);
  const [eatenMeals, setEatenMeals] = useState([]);
  const [extras, setExtras] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);

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
          setExtras(await getExtrasToday());
        } catch (e) { console.log(e); }
      })();
      return () => { active = false; };
    }, [])
  );

  const eaten = getDayTotals(eatenMeals, extras);
  const left = Math.max(targets.cal - eaten.cal, 0);
  const percent = Math.min(Math.round((eaten.cal / (targets.cal || 1)) * 100), 100);
  const dateLabel = formatToday();

  const handleToggle = async (mealId) => {
    const next = await toggleEaten(mealId);
    setEatenMeals(next);
  };

  const handleAddExtra = async (item) => {
    const next = await addExtraMeal(item);
    if (next) setExtras(next);
  };

  const handleRemoveExtra = async (id) => setExtras(await removeExtraMeal(id));

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
      <StatusBar style={statusStyle()} />

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
            <View style={[styles.progressCircle, percent >= 100 && { backgroundColor: tc('rgba(46,204,113,0.15)', 'bg') }]}>
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
          <Text style={styles.sectionTitle}>{tr('اقتراحات النهارده')}</Text>
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

        {/* أكلت حاجة برا الخطة */}
        <Text style={styles.extraHint}>{tr('دي اقتراحات بس، كُل اللي يناسبك وسجّله')}</Text>
        {extras.map((x) => (
          <ExtraRow key={x.id} item={x} onRemove={() => handleRemoveExtra(x.id)} />
        ))}
        <TouchableOpacity style={styles.extraBtn} onPress={() => setSheetOpen(true)}>
          <Ionicons name="add-circle-outline" size={22} color={MAIN_COLOR} />
          <Text style={styles.extraBtnText}>{tr('أكلت حاجة تانية')}</Text>
        </TouchableOpacity>

        {/* بانر للمجاني بس */}
        <AdBanner />
      </ScrollView>

      <ExtraSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onAdd={handleAddExtra} />
    </View>
  );
};

// =========================================================
// التنسيقات (Styles) - تصميم داكن حديث
// =========================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tc('#000', 'bg') },
  header: {
    width: '100%', // عشان ياخد العرض كامل
    paddingTop: 30, // تظبيط المسافة من فوق (زي الكود التاني)
    paddingBottom: 25, // مسافة تحت النص
    backgroundColor: tc('#111', 'bg'), // لون الخلفية الغامق المميز
    borderBottomWidth: 1, // الخط الفاصل تحت الهيدر
    borderBottomColor: tc('#222', 'border'), // لون الخط الفاصل
    alignItems: 'center', // دي اللي بتخلي الكلام في النص أفقياً
    justifyContent: 'center', // دي بتسنتر المحتوى رأسياً
  },

  headerTitle: {
    fontSize: 22, // تكبير الخط شوية زي الكود التاني
    fontWeight: 'bold',
    color: tc('#FFF', 'fg'),
    textAlign: 'center', // تأكيد إن النص نفسه متوسط
  },
  headerDate: { fontSize: 13, color: tc('#888', 'fg'), marginTop: 4, textAlign: 'center' },
  summaryCard: { marginTop: 20,
    backgroundColor: tc('#1A1A1A', 'bg'), padding: 20, borderRadius: 20, marginBottom: 30,
    borderWidth: 1, borderColor: tc('#333', 'border')
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leftValue: { fontSize: 30, fontWeight: 'bold', color: tc('#FFF', 'fg'), marginTop: 6 },
  leftUnit: { fontSize: 14, color: tc('#888', 'fg'), fontWeight: '600' },
  macroBarsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  dayTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: tc('rgba(241,196,15,0.08)', 'bg'), borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  dayTypeText: { color: tc('#FFF', 'fg'), fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'left' },
  dayTypeHint: { color: tc('#AAA', 'fg'), fontWeight: '400' },
  macroBarBox: { flex: 1 },
  macroBarLabel: { color: tc('#AAA', 'fg'), fontSize: 12, fontWeight: '600', marginBottom: 6 },
  macroBarTrack: { height: 6, backgroundColor: tc('#333', 'bg'), borderRadius: 3, overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 3 },
  macroBarValue: { color: tc('#FFF', 'fg'), fontSize: 13, fontWeight: 'bold', marginTop: 6 },
  macroBarTarget: { color: tc('#666', 'fg'), fontWeight: 'normal' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionCount: { color: tc('#888', 'fg'), fontSize: 13, fontWeight: '600' },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: tc('#FFF', 'fg') },
  summarySub: { fontSize: 14, color: tc('#888', 'fg'), marginTop: 5 },
  progressCircle: {
    width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: MAIN_COLOR,
    justifyContent: 'center', alignItems: 'center'
  },
  progressText: { color: tc('#FFF', 'fg'), fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: tc('#FFF', 'fg'), marginBottom: 15 },
  
  // تصميم الكارت الجديد
  mealCard: {
    flexDirection: 'row', 
    backgroundColor: tc('#1A1A1A', 'bg'), 
    borderRadius: 20, 
    padding: 15, 
    paddingLeft: 135, // مسافة كبيرة عشان الصورة الطائرة
    minHeight: 110,
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: tc('#1A1A1A', 'border'),
    overflow: 'visible', // مهم جداً عشان الصورة تخرج برا الكارت
    shadowColor: tc("#000", 'shadow'),
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  mealCardEaten: { borderColor: tc('#333', 'border'), backgroundColor: tc('#111', 'bg') },
  
  floatingImageContainer: {
    position: 'absolute',
    top: -30,  
    left: -20, 
    zIndex: 10,
  },
  mealImage: { 
    width: 140, 
    height: 140, 
    shadowColor: tc("#000", 'shadow'),
    shadowOffset: { width: 5, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  mealInfo: { flex: 1, justifyContent: 'center' },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  mealType: { fontSize: 13, color: MAIN_COLOR, fontWeight: 'bold' },
  mealTime: { fontSize: 12, color: tc('#666', 'fg') },
  nameSwapContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: tc('#FFF', 'fg'),
    flex: 1, 
    marginRight: 5,
  },
  swapButton: {
    paddingLeft: 10,
  },
  macrosRow: { flexDirection: 'row', gap: 10 },
  macroTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  macroText: { fontSize: 12, color: tc('#BBB', 'fg') },
  checkboxContainer: {
    paddingLeft: 10,
    justifyContent: 'center',
  },

  // أكلت حاجة تانية
  extraHint: { color: tc('#777', 'fg'), fontSize: 13, textAlign: 'center', marginTop: -10, marginBottom: 14 },
  extraRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: tc('#111', 'bg'), borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: tc('#333', 'border') },
  extraName: { color: tc('#FFF', 'fg'), fontSize: 15, fontWeight: 'bold', textAlign: 'left' },
  extraMeta: { color: tc('#888', 'fg'), fontSize: 12, marginTop: 2, textAlign: 'left' },
  extraBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 14, marginBottom: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: MAIN_COLOR },
  extraBtnText: { color: MAIN_COLOR, fontSize: 15, fontWeight: 'bold' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: tc('#151515', 'bg'), borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 },
  sheetTitle: { color: tc('#FFF', 'fg'), fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  sheetSub: { color: tc('#888', 'fg'), fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: tc('#1E1E1E', 'bg'), borderRadius: 14, padding: 14, marginBottom: 8 },
  quickName: { flex: 1, color: tc('#FFF', 'fg'), fontSize: 15, fontWeight: '600', textAlign: 'left' },
  quickCal: { color: tc('#AAA', 'fg'), fontSize: 13 },
  sheetLabel: { color: tc('#AAA', 'fg'), fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 8, textAlign: 'left' },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, height: 48, borderRadius: 12, backgroundColor: tc('#1E1E1E', 'bg'), color: tc('#FFF', 'fg'), paddingHorizontal: 14, fontSize: 15, borderWidth: 1, borderColor: tc('#333', 'border') },
  addBtn: { marginTop: 14, height: 50, borderRadius: 25, backgroundColor: MAIN_COLOR, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});

export default MealsScreen;
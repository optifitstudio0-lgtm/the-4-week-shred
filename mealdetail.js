import React, { useState, useEffect, useRef } from 'react'; // 1. ضيفنا useRef
import { 
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Animated, Easing // 2. ضيفنا Animated و Easing
} from 'react-native';
import { tc, statusStyle } from './theme';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import MealImage from './mealimage';
import { getEatenToday, toggleEaten, swapMealInPlan } from './mealstore';
import { ICON } from './rtl';
import { unlockSwap } from './ads';
import { tr } from './i18n';

const { width } = Dimensions.get('window');
const MAIN_COLOR = tc('#2ECC71', 'fg');

const MealDetailScreen = ({ route, navigation }) => {
  const [meal, setMeal] = useState(route.params.meal);
  const [isEaten, setIsEaten] = useState(false);

  // =================================================
  // 3. إعداد الأنيميشن (Animation Setup)
  // =================================================
  const spinValue = useRef(new Animated.Value(0)).current;

  const handleSwapMeal = async () => {
    if (isEaten) return; // الوجبة اللي اتاكلت مينفعش تتبدل
    if (!(await unlockSwap(navigation))) return; // برو، أو إعلان بمكافأة للمجاني
    // التبديل الذكي الحقيقي: وجبة تانية من نفس النوع وبسعرات قريبة، وبتتحفظ في خطة النهارده
    const newMeal = await swapMealInPlan(meal.type);
    if (newMeal) setTimeout(() => setMeal(newMeal), 350);
    // تشغيل الأنيميشن
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 1000, // مدة اللفة (1 ثانية)
      easing: Easing.out(Easing.cubic), // شكل الحركة (تبدأ سريع وتهدأ)
      useNativeDriver: true,
    }).start(() => {
        // هنا ممكن تحط كود تغيير الوجبة الحقيقي
        // console.log("Meal Swapped!");
    });
  };

  // تحويل القيمة من 0-1 إلى درجات 0deg-360deg
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  // =================================================

  useEffect(() => {
    checkIfEaten();
  }, [meal.id]);

  const checkIfEaten = async () => {
    try {
      const ids = await getEatenToday();
      setIsEaten(ids.includes(meal.id));
    } catch (e) { console.log(e); }
  };

  const handleEatButton = async () => {
    try {
      const ids = await toggleEaten(meal.id);
      setIsEaten(ids.includes(meal.id));
      setTimeout(() => {
        navigation.goBack();
      }, 300);
    } catch (e) { console.log(e); }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={statusStyle()} />
      
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name={ICON.back} size={28} color={tc("#FFF", 'fg')} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{tr('تفاصيل الوجبة')}</Text>

        {/* 4. استبدلنا الفراغ بزر التبديل (Swap Button) */}
        <TouchableOpacity onPress={handleSwapMeal} disabled={isEaten}>
            <Ionicons name="swap-horizontal" size={28} color={isEaten ? tc('#444', 'fg') : MAIN_COLOR} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.contentContainer} 
        contentContainerStyle={{ paddingBottom: 150 }} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* ================================================= */}
        {/* بوكس الصورة المربع بخلفية بيضاء */}
        {/* ================================================= */}
        <View style={styles.imageCard}>
          {/* 5. حولنا الصورة لـ Animated.Image وربطنا الدوران */}
          <Animated.View style={[styles.image, { transform: [{ rotate: spin }] }]}>
            <MealImage meal={meal} style={styles.image} />
          </Animated.View>
        </View>
        {/* ================================================= */}

        <View style={styles.textWrapper}>
          <Text style={styles.mealType}>{meal.label || meal.type}</Text>
          <Text style={styles.mealName}>{meal.name}</Text>
          
          <View style={styles.macrosContainer}>
            <View style={styles.macroBox}>
              <Ionicons name="flame" size={24} color={tc("#E74C3C", 'fg')} />
              <Text style={styles.macroValue}>{meal.cal}</Text>
              <Text style={styles.macroLabel}>{tr('سعر')}</Text>
            </View>
            <View style={styles.macroBox}>
              <Ionicons name="nutrition" size={24} color={tc("#3498DB", 'fg')} />
              <Text style={styles.macroValue}>{meal.pro}{tr(' جم')}</Text>
              <Text style={styles.macroLabel}>{tr('بروتين')}</Text>
            </View>
            <View style={styles.macroBox}>
              <Ionicons name="leaf" size={24} color={tc("#F1C40F", 'fg')} />
              <Text style={styles.macroValue}>{meal.carbs ?? 0}{tr(' جم')}</Text>
              <Text style={styles.macroLabel}>{tr('كارب')}</Text>
            </View>
            <View style={styles.macroBox}>
              <Ionicons name="water" size={24} color={tc("#9B59B6", 'fg')} />
              <Text style={styles.macroValue}>{meal.fat ?? 0}{tr(' جم')}</Text>
              <Text style={styles.macroLabel}>{tr('دهون')}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>{tr('المكونات')}</Text>
          <View style={styles.ingredientsList}>
            {(meal.ingredients || []).map((ing, i) => (
              <View key={i} style={styles.ingredientItem}>
                <View style={styles.bullet} />
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>{tr('طريقة التحضير')}</Text>
          {Array.isArray(meal.steps) && meal.steps.length ? (
            <View>
              {meal.steps.map((st, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{st}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.instructions}>
              {meal.steps || tr('اخلط المكونات كويس وبالهنا والشفا!')}
            </Text>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.floatingFooter}>
        <TouchableOpacity 
          style={[styles.eatButton, isEaten && { backgroundColor: tc('#333', 'bg') }]} 
          onPress={handleEatButton}
        >
          <Text style={styles.eatButtonText}>
            {isEaten ? tr('تراجع (ماكلتهاش)') : tr('كلتها ✓')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tc('#000', 'bg') },
  
  headerBar: {
    marginTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: { color: tc('#FFF', 'fg'), fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: 5 },
  contentContainer: { flex: 1 },
  
  // =================================================
  imageCard: {
    marginHorizontal: 20,
    marginTop: 10,
    height: 300,            
    backgroundColor: tc('#FFF', 'bg'), 
    borderRadius: 30,       
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,            
    shadowColor: tc("#FFF", 'shadow'),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  image: { 
    width: '100%', 
    height: '100%', 
  },
  // =================================================

  textWrapper: { padding: 20 },
  mealType: { color: MAIN_COLOR, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, alignSelf: 'center' },
  mealName: { color: tc('#FFF', 'fg'), fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 25 },
  
  macrosContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: tc('#111', 'bg'),
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: tc('#222', 'border')
  },
  macroBox: { alignItems: 'center', flex: 1 },
  macroValue: { color: tc('#FFF', 'fg'), fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  macroLabel: { color: tc('#666', 'fg'), fontSize: 12, marginTop: 2 },
  
  divider: { height: 1, backgroundColor: tc('#222', 'bg'), marginVertical: 30 },
  
  sectionTitle: { color: tc('#FFF', 'fg'), fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  ingredientsList: { marginBottom: 30 },
  ingredientItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: MAIN_COLOR, marginRight: 15, marginTop: 8 },
  ingredientText: { flex: 1, color: tc('#DDD', 'fg'), fontSize: 16, lineHeight: 24, textAlign: 'left' },
  instructions: { color: tc('#BBB', 'fg'), fontSize: 16, lineHeight: 26 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: MAIN_COLOR, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 1 },
  stepNumText: { color: tc('#000', 'fg'), fontWeight: 'bold', fontSize: 14 },
  stepText: { flex: 1, color: tc('#DDD', 'fg'), fontSize: 16, lineHeight: 25, textAlign: 'left' },
  
  floatingFooter: { 
    position: 'absolute', 
    bottom: 30, 
    left: 20, 
    right: 20,
  },
  eatButton: { 
    backgroundColor: MAIN_COLOR, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: MAIN_COLOR,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  eatButtonText: { color: tc('#FFF', 'fg'), fontSize: 18, fontWeight: 'bold' },
});

export default MealDetailScreen;

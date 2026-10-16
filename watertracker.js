import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // استيراد مهم جداً
import { dateKey, WEEKDAYS_SHORT } from './dates';
import { ICON } from './rtl';
import { tr } from './i18n';

const { width } = Dimensions.get('window');

const WaterTracker = ({ navigation }) => {
  const [currentIntake, setCurrentIntake] = useState(0); 
  const [dailyGoal, setDailyGoal] = useState(3000); 
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [selectedBarIndex, setSelectedBarIndex] = useState(null);
  
  const waveAnim = useRef(new Animated.Value(0)).current;

  const todayIndex = new Date().getDay();
  const percentage = Math.min((currentIntake / dailyGoal) * 100, 100);

  // استخدام useFocusEffect عشان الصفحة تتحدث لما ترجعلها من الهوم
  useFocusEffect(
    useCallback(() => {
      loadData();
      startWaveAnimation();
    }, [])
  );

  const startWaveAnimation = () => {
    waveAnim.setValue(0);
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 5000, 
        easing: Easing.linear,
        useNativeDriver: false, // <-- تعديل هام: لازم false عشان خاصية top تشتغل
      })
    ).start();
  };

  const loadData = async () => {
    const today = dateKey();
    const goal = parseInt(await AsyncStorage.getItem('waterGoal'));
    if (goal) setDailyGoal(goal);
    const historyJson = await AsyncStorage.getItem('waterHistory');
    let history = historyJson ? JSON.parse(historyJson) : {};

    setCurrentIntake(history[today] || 0);
    calculateWeeklyData(history);
  };

  const calculateWeeklyData = (history) => {
    const todayDate = new Date();
    const currentDayOfWeek = todayDate.getDay(); 
    
    const sundayDate = new Date(todayDate);
    sundayDate.setDate(todayDate.getDate() - currentDayOfWeek);

    const newWeekData = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sundayDate);
      d.setDate(sundayDate.getDate() + i);
      const dateStr = dateKey(d);
      newWeekData.push(history[dateStr] || 0);
    }
    setWeeklyData(newWeekData);
  };

  const saveWaterData = async (amount) => {
    const today = dateKey();
    const historyJson = await AsyncStorage.getItem('waterHistory');
    let history = historyJson ? JSON.parse(historyJson) : {};

    history[today] = amount;

    await AsyncStorage.setItem('waterHistory', JSON.stringify(history));
    await AsyncStorage.setItem('waterIntake', amount.toString());
    await AsyncStorage.setItem('waterDate', today);

    calculateWeeklyData(history);
  };

  const addWater = (amount) => {
    const newIntake = currentIntake + amount;
    setCurrentIntake(newIntake);
    saveWaterData(newIntake);
  };

  const resetWater = () => {
    setCurrentIntake(0);
    saveWaterData(0);
  };

  const handleBarPress = (index) => {
    if (selectedBarIndex === index) {
      setSelectedBarIndex(null);
    } else {
      setSelectedBarIndex(index);
    }
  };

  const waveRotate1 = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  const waveRotate2 = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'], 
  });

  const waveTopPosition = (100 - percentage) + '%';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name={ICON.back} size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr('متابعة المية')}</Text>
        <TouchableOpacity onPress={resetWater}>
          <Ionicons name="refresh-circle" size={28} color="#555" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 50 }}>
        
        {/* === كبسولة الماء === */}
        <View style={styles.mainTracker}>
          
          <Animated.View 
            style={[
              styles.wave, 
              { 
                top: waveTopPosition, 
                transform: [{ rotate: waveRotate1 }],
                opacity: 0.8 
              }
            ]} 
          />
          
          <Animated.View 
            style={[
              styles.wave, 
              { 
                top: waveTopPosition, 
                transform: [{ rotate: waveRotate2 }],
                opacity: 0.5,
                backgroundColor: '#5DADE2' 
              }
            ]} 
          />
          
          <View style={styles.textOverlay}>
            <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
            <Text style={styles.amountText}>{currentIntake} / {dailyGoal}{tr(' مل')}</Text>
          </View>
        </View>
        {/* ========================== */}

        <Text style={styles.motivationText}>
          {percentage >= 100 ? tr('🎉 عاش! وصلت لهدف المية') : tr('كمّل شرب، جسمك محتاج مية 💧')}
        </Text>

        <Text style={styles.sectionTitle}>{tr('إضافة سريعة')}</Text>
        <View style={styles.quickAddContainer}>
          <TouchableOpacity style={styles.addButton} onPress={() => addWater(100)}>
            <MaterialCommunityIcons name="cup" size={24} color="#3498DB" />
            <Text style={styles.addText}>{tr('100 مل')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => addWater(250)}>
            <MaterialCommunityIcons name="glass-cocktail" size={28} color="#3498DB" />
            <Text style={styles.addText}>{tr('250 مل')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => addWater(500)}>
            <MaterialCommunityIcons name="bottle-soda" size={32} color="#3498DB" />
            <Text style={styles.addText}>{tr('500 مل')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>{tr('الأسبوع ده')}</Text>
          <View style={styles.chartRow}>
            {WEEKDAYS_SHORT.map((dayLabel, index) => {
              
              const isToday = index === todayIndex; 
              const isSelected = selectedBarIndex === index;
              const amount = weeklyData[index];
              
              let barHeight = (amount / dailyGoal) * 100;
              if (barHeight > 100) barHeight = 100; 
              if (amount === 0) barHeight = 5; 

              return (
                <View key={index} style={styles.barWrapper}>
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => handleBarPress(index)}
                    style={styles.barContainer}
                  >
                    <View 
                      style={[
                        styles.barFill, 
                        { 
                          height: `${barHeight}%`, 
                          backgroundColor: amount > 0 ? '#3498DB' : '#333',
                          opacity: isToday ? 1 : (amount > 0 ? 0.7 : 1)
                        }
                      ]} 
                    >
                        {isSelected && (
                            <View style={styles.tooltip}>
                                <Text style={styles.tooltipText}>{amount}{tr(' مل')}</Text>
                                <View style={styles.tooltipArrow} />
                            </View>
                        )}
                    </View>
                    <Text style={[
                      styles.dayText, 
                      isToday && styles.todayText 
                    ]}>
                      {dayLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  
  mainTracker: { 
    width: 200, 
    height: 300, 
    borderWidth: 4, 
    borderColor: '#333', 
    borderRadius: 100, 
    overflow: 'hidden', 
    backgroundColor: '#111', 
    marginBottom: 20, 
    position: 'relative'
  },
  
  wave: {
    width: 500, 
    height: 500,
    backgroundColor: '#3498DB',
    position: 'absolute',
    left: -150, 
    borderRadius: 200, 
  },

  textOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  percentageText: { fontSize: 42, fontWeight: 'bold', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
  amountText: { fontSize: 16, color: '#DDD', marginTop: 5, fontWeight: '600' },
  motivationText: { color: '#AAA', fontSize: 16, marginBottom: 30 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15, alignSelf: 'flex-start', marginLeft: 20 },
  quickAddContainer: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  addButton: { backgroundColor: '#1A1A1A', width: 90, height: 100, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  addText: { color: '#FFF', marginTop: 10, fontWeight: 'bold' },
  
  historyCard: { width: width - 40, backgroundColor: '#1A1A1A', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#333' },
  historyTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 20 }, 
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150, paddingBottom: 10 }, 
  barWrapper: { alignItems: 'center', justifyContent: 'flex-end', height: '100%', width: 30 },
  barContainer: { alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' },
  barFill: { width: 8, borderRadius: 4, minHeight: 4, overflow: 'visible', position: 'relative' },
  dayText: { color: '#666', fontSize: 12 },
  todayText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }, 

  tooltip: {
    position: 'absolute',
    top: -35, 
    left: -20, 
    width: 50, 
    backgroundColor: '#000',
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  tooltipText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  tooltipArrow: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#000', 
  }
});

export default WaterTracker;

// صورة الوجبة: لو ليها صورة بتظهر، ولو لسه مالهاش بيظهر طبق شيك بأيقونة بدل ما الشكل يبوظ
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ICONS = { breakfast: 'sunny', lunch: 'restaurant', snack: 'cafe', dinner: 'moon' };

const MealImage = ({ meal, style, dim = false }) => {
  if (meal?.img) {
    return <Image source={meal.img} style={[style, dim && { opacity: 0.5 }]} resizeMode="contain" />;
  }
  return (
    <View style={[style, styles.center, dim && { opacity: 0.5 }]}>
      <View style={styles.plate}>
        <View style={styles.innerPlate}>
          <Ionicons name={ICONS[meal?.category] || 'restaurant'} size={34} color="#2ECC71" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  plate: {
    width: '78%', aspectRatio: 1, borderRadius: 999, backgroundColor: '#2A2A2A',
    borderWidth: 1, borderColor: '#3A3A3A', justifyContent: 'center', alignItems: 'center',
  },
  innerPlate: {
    width: '70%', aspectRatio: 1, borderRadius: 999, backgroundColor: '#1F1F1F',
    justifyContent: 'center', alignItems: 'center',
  },
});

export default MealImage;

// قايمة اختيارات من تحت (Alert في أندرويد مبيعرضش أكتر من 3 زراير)
import React from 'react';
import { tc } from './theme';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { tr } from './i18n';

// المسافة اللي تحت (شريط التنقل في أندرويد / الخط اللي تحت في آيفون) عشان الشيت يلزق في آخر الشاشة
const BOTTOM_INSET = initialWindowMetrics?.insets?.bottom || 0;

const ActionSheet = ({ visible, title, message, options = [], onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.backdrop} />
    </TouchableWithoutFeedback>
    <View style={styles.sheet}>
      <View style={styles.handle} />
      {!!title && <Text style={styles.title}>{title}</Text>}
      {!!message && <Text style={styles.message}>{message}</Text>}
      {options.map((o, i) => (
        <TouchableOpacity
          key={i}
          style={styles.option}
          onPress={() => {
            onClose();
            setTimeout(() => o.onPress && o.onPress(), 450);
          }}
        >
          {!!o.icon && <Ionicons name={o.icon} size={22} color={o.destructive ? tc('#E74C3C', 'fg') : tc('#FFF', 'fg')} />}
          <Text style={[styles.optionText, o.destructive && { color: tc('#E74C3C', 'fg') }]}>{o.text}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.cancel} onPress={onClose}>
        <Text style={styles.cancelText}>{tr('إلغاء')}</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: tc('rgba(0,0,0,0.6)', 'bg') },
  sheet: { backgroundColor: tc('#161616', 'bg'), borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 20 + Math.max(BOTTOM_INSET, 16), borderWidth: 1, borderColor: tc('#262626', 'border') },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: tc('#333', 'bg'), alignSelf: 'center', marginBottom: 14 },
  title: { color: tc('#FFF', 'fg'), fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  message: { color: tc('#888', 'fg'), fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: tc('#222', 'border') },
  optionText: { color: tc('#FFF', 'fg'), fontSize: 16, fontWeight: '600' },
  cancel: { marginTop: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: tc('#222', 'bg'), borderRadius: 16 },
  cancelText: { color: tc('#AAA', 'fg'), fontSize: 16, fontWeight: '600' },
});

export default ActionSheet;

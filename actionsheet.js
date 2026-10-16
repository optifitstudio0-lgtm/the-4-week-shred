// قايمة اختيارات من تحت (Alert في أندرويد مبيعرضش أكتر من 3 زراير)
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tr } from './i18n';

const ActionSheet = ({ visible, title, message, options = [], onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
          {!!o.icon && <Ionicons name={o.icon} size={22} color={o.destructive ? '#E74C3C' : '#FFF'} />}
          <Text style={[styles.optionText, o.destructive && { color: '#E74C3C' }]}>{o.text}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.cancel} onPress={onClose}>
        <Text style={styles.cancelText}>{tr('إلغاء')}</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: '#161616', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 36, borderWidth: 1, borderColor: '#262626' },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#333', alignSelf: 'center', marginBottom: 14 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  message: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  optionText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  cancel: { marginTop: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#222', borderRadius: 16 },
  cancelText: { color: '#AAA', fontSize: 16, fontWeight: '600' },
});

export default ActionSheet;

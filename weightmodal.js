// مودال تسجيل الوزن (شغال على أندرويد و iOS، بدل Alert.prompt اللي كان iOS بس)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tr } from './i18n';

const MAIN_COLOR = '#2ECC71';

const WeightModal = ({ visible, initial, onClose, onSave }) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) setValue(initial ? String(initial) : '');
  }, [visible]);

  const step = (d) => {
    const n = parseFloat(value.replace(',', '.')) || parseFloat(initial) || 70;
    setValue(String(Math.round((n + d) * 10) / 10));
  };

  const parsed = parseFloat(String(value).replace(',', '.'));
  const valid = parsed >= 25 && parsed <= 350;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{tr('سجّل وزنك النهارده')}</Text>
          <Text style={styles.sub}>{tr('اتوزن الصبح بعد الحمام وقبل الأكل عشان القراية تبقى ثابتة.')}</Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => step(-0.1)}>
              <Ionicons name="remove" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={(t) => setValue(t.replace(/[^0-9.,]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="75.0"
                placeholderTextColor="#555"
                maxLength={5}
                textAlign="center"
                autoFocus
              />
              <Text style={styles.unit}>{tr('كجم')}</Text>
            </View>
            <TouchableOpacity style={styles.stepBtn} onPress={() => step(0.1)}>
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.saveBtn, !valid && { opacity: 0.4 }]} disabled={!valid} onPress={() => onSave(parsed)}>
            <Text style={styles.saveText}>{tr('حفظ')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>{tr('إلغاء')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: '#161616', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: '#2A2A2A' },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  sub: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginVertical: 24 },
  stepBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center' },
  inputWrap: { alignItems: 'center' },
  input: { color: '#FFF', fontSize: 44, fontWeight: 'bold', minWidth: 130, paddingVertical: 4, borderBottomWidth: 2, borderBottomColor: MAIN_COLOR },
  unit: { color: '#888', marginTop: 6, fontSize: 14 },
  saveBtn: { backgroundColor: MAIN_COLOR, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#000', fontWeight: 'bold', fontSize: 17 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: '#888', fontSize: 15 },
});

export default WeightModal;

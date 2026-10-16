// شاشة "إيه اللي بيوجعك؟" (اختيار أكتر من مكان)
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PAIN_AREAS } from './pain';
import { tr } from './i18n';

const MAIN_COLOR = '#2ECC71';
const PAIN_COLOR = '#FF6B81';

const PainSheet = ({ visible, initial = [], onClose, onSave }) => {
  const [sel, setSel] = useState(initial);
  useEffect(() => { if (visible) setSel(initial); }, [visible]);

  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{tr('إيه اللي بيوجعك؟')}</Text>
        <Text style={styles.message}>{tr('هنبدّل أي تمرين بيضغط على المكان ده ببديل آمن، في التمرين ده وباقي الخطة.')}</Text>

        <View style={styles.grid}>
          {PAIN_AREAS.map((a) => {
            const on = sel.includes(a.id);
            return (
              <TouchableOpacity key={a.id} style={[styles.area, on && styles.areaOn]} onPress={() => toggle(a.id)} activeOpacity={0.8}>
                <Ionicons name={on ? 'checkmark-circle' : a.icon} size={24} color={on ? '#000' : PAIN_COLOR} />
                <Text style={[styles.areaText, on && { color: '#000' }]}>{a.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.warn}>
          <Ionicons name="medkit" size={18} color="#F39C12" />
          <Text style={styles.warnText}>{tr('لو الوجع حاد أو بيزيد أو فيه ورم، وقّف التمرين واستشير دكتور.')}</Text>
        </View>

        <TouchableOpacity style={styles.save} onPress={() => onSave(sel)}>
          <Text style={styles.saveText}>{sel.length ? tr('بدّل التمارين') : tr('مفيش وجع، رجّع التمارين')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancel} onPress={onClose}>
          <Text style={styles.cancelText}>{tr('إلغاء')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: '#161616', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 36, borderWidth: 1, borderColor: '#262626' },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#333', alignSelf: 'center', marginBottom: 14 },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  message: { color: '#999', fontSize: 14, textAlign: 'center', marginTop: 6, marginBottom: 16, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  area: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1F1F1F', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: '#2C2C2C' },
  areaOn: { backgroundColor: PAIN_COLOR, borderColor: PAIN_COLOR },
  areaText: { color: '#FFF', fontSize: 15, fontWeight: 'bold', flexShrink: 1, textAlign: 'left' },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(243,156,18,0.1)', borderRadius: 12, padding: 12, marginTop: 16 },
  warnText: { color: '#E5B567', fontSize: 13, flex: 1, textAlign: 'left' },
  save: { marginTop: 16, height: 54, borderRadius: 27, backgroundColor: MAIN_COLOR, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  cancel: { marginTop: 10, paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: '#AAA', fontSize: 15, fontWeight: '600' },
});

export default PainSheet;

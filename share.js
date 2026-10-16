// تصوير أي View كصورة PNG وفتح قايمة الشير (إنستجرام / واتساب / حفظ...)
import { Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { tr } from './i18n';

export const shareViewAsImage = async (ref, { width, height, title = tr('شير على إنستجرام') } = {}) => {
  try {
    const uri = await captureRef(ref, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
      ...(width && height ? { width, height } : {}),
    });
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert(tr('الشير مش متاح'), tr('الجهاز ده مش بيدعم الشير.'));
      return false;
    }
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title, UTI: 'public.png' });
    return true;
  } catch (e) {
    console.log('share error', e);
    Alert.alert(tr('حصلت مشكلة'), tr('معرفناش نجهّز الصورة. جرّب تاني.'));
    return false;
  }
};

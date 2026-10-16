// حفظ الصور جوه التطبيق نفسه (صور الكاميرا/المعرض بتبقى في الكاش وممكن تتمسح)
// بيشتغل مع expo-file-system الجديد (SDK 54+) والقديم (SDK 51-53)
// الصور بتتصغّر قبل الحفظ عشان النسخة الاحتياطية بتاعة أندرويد (Google Drive) حدها 25 ميجا للتطبيق كله،
// ولو البيانات عدّت الـ25 ميجا أندرويد مش بيعمل نسخة خالص
import { Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

let Manip = null;
try { Manip = require('expo-image-manipulator'); } catch (e) { Manip = null; }

const MAX_W = { photo: 1080, avatar: 512 };

const getSize = (uri) => new Promise((resolve) => {
  Image.getSize(uri, (w, h) => resolve({ w, h }), () => resolve(null));
});

// بتصغّر الصورة لعرض 1080 (أو 512 للصورة الشخصية) وJPEG 70% = حوالي 150-300 كيلو بدل 3-5 ميجا
const shrink = async (uri, prefix) => {
  if (!Manip) return uri;
  const maxW = MAX_W[prefix] || MAX_W.photo;
  try {
    const size = await getSize(uri);
    const resize = size && size.w > maxW ? [{ resize: { width: maxW } }] : [];
    const format = Manip.SaveFormat?.JPEG ?? 'jpeg';
    // API الجديدة (SDK 52+)
    if (Manip.ImageManipulator?.manipulate) {
      const ctx = Manip.ImageManipulator.manipulate(uri);
      if (resize.length) ctx.resize({ width: maxW });
      const img = await ctx.renderAsync();
      const out = await img.saveAsync({ compress: 0.7, format });
      return out?.uri || uri;
    }
    // API القديمة
    if (Manip.manipulateAsync) {
      const out = await Manip.manipulateAsync(uri, resize, { compress: 0.7, format });
      return out?.uri || uri;
    }
  } catch (e) {
    console.log('shrink failed, saving original', e);
  }
  return uri;
};

const docDir = () => {
  try {
    if (FileSystem.Paths?.document?.uri) return FileSystem.Paths.document.uri;
  } catch (e) {}
  return FileSystem.documentDirectory || '';
};
const withSlash = (d) => (d && !d.endsWith('/') ? d + '/' : d);

export const persistImage = async (uri, prefix = 'photo') => {
  if (!uri) return uri;
  const name = `${prefix}_${Date.now()}.jpg`;
  const small = await shrink(uri, prefix);
  try {
    if (FileSystem.Paths && FileSystem.File && FileSystem.Directory) {
      const dir = new FileSystem.Directory(FileSystem.Paths.document, 'progress');
      if (!dir.exists) dir.create();
      const src = new FileSystem.File(small);
      const dest = new FileSystem.File(dir, name);
      src.copy(dest);
      return dest.uri;
    }
    if (FileSystem.documentDirectory && FileSystem.copyAsync) {
      const dir = `${FileSystem.documentDirectory}progress/`;
      try { await FileSystem.makeDirectoryAsync(dir, { intermediates: true }); } catch (e) {}
      const dest = dir + name;
      await FileSystem.copyAsync({ from: small, to: dest });
      return dest;
    }
  } catch (e) {
    console.log('persistImage failed, using original uri', e);
  }
  return small;
};

export const deleteImage = async (uri) => {
  if (!uri) return;
  try {
    if (FileSystem.File && FileSystem.Paths) {
      const f = new FileSystem.File(uri);
      if (f.exists) f.delete();
      return;
    }
    if (FileSystem.deleteAsync) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (e) {
    console.log('deleteImage', e);
  }
};

// بيمسح فولدر الصور كله (لما حساب تاني يدخل على نفس الموبايل)
export const deleteAllImages = async () => {
  try {
    if (FileSystem.Directory && FileSystem.Paths) {
      const dir = new FileSystem.Directory(FileSystem.Paths.document, 'progress');
      if (dir.exists) dir.delete();
      return;
    }
    if (FileSystem.deleteAsync && FileSystem.documentDirectory) {
      await FileSystem.deleteAsync(`${FileSystem.documentDirectory}progress/`, { idempotent: true });
    }
  } catch (e) {
    console.log('deleteAllImages', e);
  }
};

// بعد ما أندرويد يرجّع النسخة الاحتياطية، مسار الفولدر ممكن يتغير (مثلًا يوزر تاني على الموبايل)
// فبنصلّح مسارات الصور المحفوظة عشان تشاور على مكانها الجديد
const fixUri = (uri, base) => {
  if (!uri || !base) return uri;
  const i = uri.indexOf('/progress/');
  if (i < 0) return uri;
  const fixed = base + uri.slice(i + 1);
  return fixed;
};

export const repairImagePaths = async () => {
  const base = withSlash(docDir());
  if (!base) return;
  try {
    const raw = await AsyncStorage.getItem('progressPhotos');
    if (raw) {
      const list = JSON.parse(raw);
      let changed = false;
      const next = list.map((p) => {
        const u = fixUri(p.uri, base);
        if (u !== p.uri) changed = true;
        return { ...p, uri: u };
      });
      if (changed) await AsyncStorage.setItem('progressPhotos', JSON.stringify(next));
    }
    const avatar = await AsyncStorage.getItem('userProfileImage');
    const fixedAvatar = fixUri(avatar, base);
    if (avatar && fixedAvatar !== avatar) await AsyncStorage.setItem('userProfileImage', fixedAvatar);
  } catch (e) {
    console.log('repairImagePaths', e);
  }
};

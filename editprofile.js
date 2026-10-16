import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'; // استيراد مكتبة الصور
import { persistImage } from './files';
import { logWeight } from './progressstore';
import { recalcTargets } from './nutrition';
import { ICON } from './rtl';
import ActionSheet from './actionsheet';
import { tr } from './i18n';

const IMAGES = ImagePicker.MediaTypeOptions?.Images ?? ['images'];

const MAIN_COLOR = '#2ECC71';

const EditProfileScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [profileImage, setProfileImage] = useState(null); // لتخزين مسار الصورة
  const [originalWeight, setOriginalWeight] = useState('');
  const [sheet, setSheet] = useState(false);

  // تحميل البيانات عند الفتح
  useEffect(() => {
    const loadData = async () => {
      try {
        const sFirstName = await AsyncStorage.getItem('userFirstName');
        const sLastName = await AsyncStorage.getItem('userLastName');
        // لو مفيش اسم مقسم، نحاول نجيب الاسم الكامل القديم ونقسمه
        const sFullName = await AsyncStorage.getItem('userName');
        
        const sWeight = await AsyncStorage.getItem('userWeight');
        const sTarget = await AsyncStorage.getItem('targetWeight');
        const sHeight = await AsyncStorage.getItem('userHeight');
        const sAge = await AsyncStorage.getItem('userAge');
        const sImage = await AsyncStorage.getItem('userProfileImage');

        if (sFirstName) setFirstName(sFirstName);
        if (sLastName) setLastName(sLastName);
        if (!sFirstName && sFullName) {
            const parts = sFullName.split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
        }

        if (sWeight) { setCurrentWeight(sWeight); setOriginalWeight(sWeight); }
        if (sTarget) setTargetWeight(sTarget);
        if (sHeight) setHeight(sHeight);
        if (sAge) setAge(sAge);
        if (sImage) setProfileImage(sImage);

      } catch (e) {
        console.log(e);
      }
    };
    loadData();
  }, []);

  // دالة طلب إذن واختيار الصورة
  const handleImagePick = () => setSheet(true);

  const openCamera = async () => {
    // طلب إذن الكاميرا
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(tr('محتاجين إذن'), tr('اسمح للتطبيق يستخدم الكاميرا من إعدادات الموبايل.'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(await persistImage(result.assets[0].uri, 'avatar'));
    }
  };

  const openGallery = async () => {
    // طلب إذن الجاليري
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(tr('محتاجين إذن'), tr('اسمح للتطبيق يوصل للصور من إعدادات الموبايل.'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: IMAGES,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(await persistImage(result.assets[0].uri, 'avatar'));
    }
  };

  const saveProfile = async () => {
    try {
      const before = parseInt(await AsyncStorage.getItem('calculatedCalories')) || null; // قبل أي تعديل
      // حفظ الاسم الأول والأخير
      if(firstName) await AsyncStorage.setItem('userFirstName', firstName);
      if(lastName) await AsyncStorage.setItem('userLastName', lastName);
      
      // حفظ الاسم الكامل عشان الصفحات التانية اللي بتستخدم userName ما تضربش
      const fullName = `${firstName} ${lastName}`.trim();
      if(fullName) await AsyncStorage.setItem('userName', fullName);

      if (currentWeight && currentWeight !== originalWeight) await logWeight(currentWeight); // بيتسجل في متابعة الوزن
      else if (currentWeight) await AsyncStorage.setItem('userWeight', currentWeight);
      if(targetWeight) await AsyncStorage.setItem('targetWeight', targetWeight);
      if(height) await AsyncStorage.setItem('userHeight', height);
      if(age) await AsyncStorage.setItem('userAge', age);
      
      // حفظ الصورة
      if(profileImage) await AsyncStorage.setItem('userProfileImage', profileImage);

      // الوزن أو الطول أو السن اتغيروا؟ نعيد حساب السعرات والبروتين والمية
      const res = await recalcTargets();
      if (res && before && res.after !== before) {
        Alert.alert(tr('خطتك اتحدثت ✅'), tr('سعراتك اليومية بقت {0} بدل {1}، والبروتين {2} جم.', res.after, before, res.plan.protein), [
          { text: tr('تمام'), onPress: () => navigation.goBack() },
        ]);
        return;
      }

      navigation.goBack();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name={ICON.back} size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr('تعديل البيانات')}</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* --- قسم الصورة والكاميرا --- */}
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Image 
              // لو فيه صورة مختارة اعرضها، لو مفيش اعرض الصورة الافتراضية من Assets
              source={profileImage ? { uri: profileImage } : require('./assets/profile.png')} 
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.cameraIconBg} onPress={handleImagePick}>
              <Ionicons name="camera" size={20} color="#000" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleImagePick}>
            <Text style={styles.changePhotoText}>{tr('غيّر الصورة')}</Text>
          </TouchableOpacity>
        </View>

        {/* --- حقول الإدخال --- */}
        <View style={styles.formContainer}>
          
          {/* First Name & Last Name Row */}
          <View style={styles.row}>
            <View style={[styles.section, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>{tr('الاسم الأول')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder={tr('الاسم')}
                  placeholderTextColor="#555"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
            </View>

            <View style={[styles.section, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>{tr('اسم العيلة')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder={tr('العيلة')}
                  placeholderTextColor="#555"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
          </View>

          {/* Weight Row */}
          <View style={styles.row}>
            <View style={[styles.section, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>{tr('الوزن الحالي (كجم)')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="scale-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#555"
                  keyboardType="numeric"
                  value={currentWeight}
                  onChangeText={setCurrentWeight}
                />
              </View>
            </View>

            <View style={[styles.section, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>{tr('الوزن المستهدف (كجم)')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="flag-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#555"
                  keyboardType="numeric"
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                />
              </View>
            </View>
          </View>

          {/* Height & Age Row */}
          <View style={styles.row}>
            <View style={[styles.section, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>{tr('الطول (سم)')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="resize-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#555"
                  keyboardType="numeric"
                  value={height}
                  onChangeText={setHeight}
                />
              </View>
            </View>

            <View style={[styles.section, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>{tr('السن')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#555"
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                />
              </View>
            </View>
          </View>
        </View>

        {/* --- زر الحفظ في الأسفل --- */}
        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <Text style={styles.saveButtonText}>{tr('حفظ التعديلات')}</Text>
        </TouchableOpacity>

      </ScrollView>

      <ActionSheet
        visible={sheet}
        title={tr('صورة البروفايل')}
        options={[
          { text: tr('صوّر دلوقتي'), icon: 'camera-outline', onPress: openCamera },
          { text: tr('اختار من المعرض'), icon: 'images-outline', onPress: openGallery },
        ]}
        onClose={() => setSheet(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    paddingTop: 30,           // مسافة من فوق للـ StatusBar
    paddingBottom: 20,        // مسافة من تحت
    paddingHorizontal: 20,    
    flexDirection: 'row',     // ترتيب العناصر جنب بعض
    alignItems: 'center',
    justifyContent: 'space-between', // توزيع العناصر (زر يسار، عنوان وسط، فراغ يمين)
    backgroundColor: '#111',  // الخلفية الغامقة
    borderBottomWidth: 1,     // الخط الفاصل
    borderBottomColor: '#222', // لون الخط الفاصل
  },

  headerTitle: {
    fontSize: 22,             // حجم الخط 22
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',      // محاذاة النص في المنتصف
    flex: 1,                  // عشان ياخد المساحة المتاحة ويزق نفسه للنص
  },

  backBtn: {
    width: 40,                // عرض ثابت لزر الرجوع
    alignItems: 'flex-start', // محاذاة الأيقونة لليسار
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  
  imageContainer: { alignItems: 'center', marginBottom: 30 },
  imageWrapper: { position: 'relative', width: 100, height: 100 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#333' },
  cameraIconBg: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: MAIN_COLOR,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  changePhotoText: { color: MAIN_COLOR, marginTop: 10, fontSize: 14, fontWeight: '600' },

  formContainer: { marginBottom: 20 },
  section: { marginBottom: 20 },
  label: { color: '#888', marginBottom: 10, fontSize: 14, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 15, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#333' },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#FFF', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },

  saveButton: { 
    backgroundColor: MAIN_COLOR, 
    height: 55, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 'auto', 
  },
  saveButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});

export default EditProfileScreen;
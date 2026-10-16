import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Alert 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getStats } from './progressstore';
import { ICON } from './rtl';
import { currentUser, logOut } from './auth';
import { tr } from './i18n';

const MAIN_COLOR = '#2ECC71';

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({
    name: tr('بطل'),
    currentWeight: '--',
    targetWeight: '--',
    workouts: '0',
    profileImage: null,
    isPro: false 
  });

  // قمنا بحذف isSyncing لأننا لم نعد بحاجة له

  useFocusEffect(
    useCallback(() => {
      const loadProfileData = async () => {
        try {
          const name = await AsyncStorage.getItem('userName');
          const weight = await AsyncStorage.getItem('userWeight');
          const goal = await AsyncStorage.getItem('userGoal');
          const image = await AsyncStorage.getItem('userProfileImage');
          const proStatus = await AsyncStorage.getItem('isProMember');
          
          const stats = await getStats();
          const completedWorkouts = stats.completedCount;
          const savedTarget = await AsyncStorage.getItem('targetWeight');

          let estimatedTarget = savedTarget ? parseFloat(savedTarget) : weight;
          if (!savedTarget && weight && goal) {
             const w = parseFloat(weight);
             if (goal === 'lose_weight') estimatedTarget = w - 5;
             else if (goal === 'build_muscle') estimatedTarget = w + 2;
          }

          setUserData({
            name: name || tr('بطل'),
            currentWeight: weight || '--',
            targetWeight: estimatedTarget ? estimatedTarget.toString() : '--',
            workouts: completedWorkouts.toString(),
            profileImage: image,
            isPro: proStatus === 'true'
          });
        } catch (e) {
          console.log(e);
        }
      };
      loadProfileData();
    }, [])
  );

  // ✅ دالة الانتقال لصفحة التسجيل المعدلة
  // لو مسجل دخول يروح للإعدادات (فيها الحساب)، لو لأ يعمل حساب
  const handleSync = () => {
    if (currentUser()) navigation.navigate('Setting');
    else navigation.navigate('SignUp');
  };

  const handleLogout = () => {
    Alert.alert(tr('تسجيل الخروج ومسح البيانات'), tr('هتخرج من حسابك وكل بياناتك (التقدم والصور والوزن) هتتمسح من الموبايل. متأكد؟'), [
      { text: tr('لا'), style: 'cancel' },
      { text: tr('اخرج وامسح'), style: 'destructive', onPress: doLogout },
    ]);
  };

  const doLogout = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      await logOut();
      const lang = await AsyncStorage.getItem('appLanguage');
      await AsyncStorage.clear();
      if (lang) await AsyncStorage.setItem('appLanguage', lang);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Onboarding' }], 
        })
      );
    } catch (e) {
      console.log("Error logging out:", e);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name={ICON.back} size={28} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{tr('حسابي')}</Text>
        
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Setting')}>
          <Ionicons name="settings-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* --- Profile Card --- */}
        <View style={styles.profileCard}>
          <View style={[styles.avatarContainer, userData.isPro && { borderColor: MAIN_COLOR }, !userData.isPro && { borderColor: '#555' }]}>
            <Image 
              source={userData.profileImage ? { uri: userData.profileImage } : require('./assets/profile.png')} 
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
          
          <Text style={styles.userName} numberOfLines={1} adjustsFontSizeToFit={true}>
            {userData.name}
          </Text>
          
          <Text style={[styles.userPlan, !userData.isPro && { color: '#888' }]}>
            {tr('تحدي الـ4 أسابيع • ')}{userData.isPro ? tr('عضو برو 👑') : tr('عضوية مجانية')}
          </Text>
        </View>

        {/* --- Stats Row --- */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userData.currentWeight}<Text style={styles.statUnit}>{tr(' كجم')}</Text></Text>
            <Text style={styles.statLabel}>{tr('دلوقتي')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userData.targetWeight}<Text style={styles.statUnit}>{tr(' كجم')}</Text></Text>
            <Text style={styles.statLabel}>{tr('الهدف')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userData.workouts}</Text> 
            <Text style={styles.statLabel}>{tr('تمرين')}</Text>
          </View>
        </View>

        {/* --- Menu: General --- */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>{tr('عام')}</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
            <View style={styles.menuIconBox}>
              <Ionicons name="person-outline" size={22} color={MAIN_COLOR} />
            </View>
            <Text style={styles.menuText}>{tr('تعديل البيانات')}</Text>
            <Ionicons name={ICON.chevronNext} size={20} color="#555" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ProgressPhotos')}>
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255,107,129,0.12)' }]}>
              <Ionicons name="camera-outline" size={22} color="#FF6B81" />
            </View>
            <Text style={styles.menuText}>{tr('صور قبل وبعد')}</Text>
            <Ionicons name={ICON.chevronNext} size={20} color="#555" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Achievements')}>
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255,215,0,0.12)' }]}>
              <Ionicons name="medal-outline" size={22} color="#FFD700" />
            </View>
            <Text style={styles.menuText}>{tr('البادچات والشهادة')}</Text>
            <Ionicons name={ICON.chevronNext} size={20} color="#555" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Reminders')}>
            <View style={styles.menuIconBox}>
              <Ionicons name="notifications-outline" size={22} color={MAIN_COLOR} />
            </View>
            <Text style={styles.menuText}>{tr('التذكيرات')}</Text>
            <Ionicons name={ICON.chevronNext} size={20} color="#555" />
          </TouchableOpacity>

          {/* زر مزامنة الحساب */}
          <TouchableOpacity style={styles.menuItem} onPress={handleSync}>
            <View style={styles.menuIconBox}>
              <Ionicons name="cloud-upload-outline" size={22} color={MAIN_COLOR} />
            </View>
            <Text style={styles.menuText}>{currentUser() ? tr('حسابك') : tr('اعمل حساب')}</Text>
            <Ionicons name={ICON.chevronNext} size={20} color="#555" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Subscription')}>
            <View style={styles.menuIconBox}>
              <Ionicons name="card-outline" size={22} color={MAIN_COLOR} />
            </View>
            <Text style={styles.menuText}>{tr('الاشتراك')}</Text>
            
            <View style={[styles.proBadge, !userData.isPro && { backgroundColor: '#555' }]}>
              <Text style={[styles.proText, !userData.isPro && { color: '#FFF' }]}>
                {userData.isPro ? tr('مفعّل') : tr('اشترك برو')}
              </Text>
            </View>
            <Ionicons name={ICON.chevronNext} size={20} color="#555" />
          </TouchableOpacity>
        </View>

        {/* --- Menu: Support --- */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>{tr('الدعم')}</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Help')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#333' }]}>
              <Ionicons name="help-circle-outline" size={22} color="#FFF" />
            </View>
            <Text style={styles.menuText}>{tr('المساعدة والأسئلة الشائعة')}</Text>
            <Ionicons name={ICON.chevronNext} size={20} color="#555" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('About')}>
            <View style={[styles.menuIconBox, { backgroundColor: '#333' }]}>
              <Ionicons name="information-circle-outline" size={22} color="#FFF" />
            </View>
            <Text style={styles.menuText}>{tr('عن التطبيق')}</Text>
            <Ionicons name={ICON.chevronNext} size={20} color="#555" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(231, 76, 60, 0.2)' }]}>
              <Ionicons name="log-out-outline" size={22} color="#E74C3C" />
            </View>
            <Text style={[styles.menuText, { color: '#E74C3C' }]}>{tr('تسجيل الخروج')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  iconBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  
  profileCard: { alignItems: 'center', marginBottom: 30, width: '100%' },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 2, overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%' },
  
  userName: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 5, textAlign: 'center', paddingHorizontal: 20, width: '100%' },
  userPlan: { fontSize: 14, color: MAIN_COLOR, fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 20, padding: 20, justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#333' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  statUnit: { fontSize: 12, color: '#888', fontWeight: 'normal' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  divider: { width: 1, height: 30, backgroundColor: '#333' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#888', marginBottom: 15, marginLeft: 5, textAlign: 'left' },
  menuContainer: { marginBottom: 25 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', marginBottom: 10, padding: 15, borderRadius: 15 },
  menuIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(46, 204, 113, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#FFF', fontWeight: '600', textAlign: 'left' },
  proBadge: { backgroundColor: MAIN_COLOR, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  proText: { fontSize: 12, fontWeight: 'bold', color: '#000' },
});

export default ProfileScreen;

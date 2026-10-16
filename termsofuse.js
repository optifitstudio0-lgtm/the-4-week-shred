import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  SafeAreaView // 1. استيراد SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LANG, tr } from './i18n';

// --- سياسة الخصوصية الكاملة ---
const PRIVACY_TEXT = `
سياسة الخصوصية
آخر تحديث: 2025

1. مقدمة
خصوصيتك مهمة جدًا بالنسبة لنا. سياسة الخصوصية دي بتوضح إزاي تطبيق "The 4-Week SHRED" (يُشار إليه بـ"التطبيق") بيجمع معلوماتك وبيستخدمها وبيحميها.

2. المعلومات اللي بنجمعها
عشان نقدملك خطة تمارين وأكل مخصوصة ليك، بنجمع البيانات دي:
• المعلومات الشخصية: الاسم والبريد الإلكتروني.
• بيانات الصحة واللياقة: السن، والنوع، والطول، والوزن الحالي، والوزن المستهدف، ومستوى النشاط.
• بيانات الدورة (لو شغّلتي خطة الدورة بس): تاريخ آخر دورة وطول الدورة. متحفظة على موبايلك بس، وعمرها ما بتتبعت لأي حد.
• المحتوى اللي بتضيفه: صور التقدم (قبل وبعد) والوزن والمقاسات.
• بيانات الاستخدام: معلومات عن طريقة استخدامك للتطبيق (زي التمارين اللي خلصتها والستريك والبادچات).

3. إزاي بنستخدم معلوماتك
• الحسابات والتخصيص: بنستخدم بياناتك الصحية بس عشان نحسب احتياجك اليومي من السعرات ونعمل خطة التمارين والأكل.
• متابعة التقدم: بنحفظ وزنك ومقاساتك وصور التقدم عشان تشوف التغيير اللي حصل في جسمك.
• التذكيرات: الإشعارات (التمرين، المية، الوجبات، الوزن الأسبوعي) بتتعمل محليًا على موبايلك، وتقدر تقفلها في أي وقت من الإعدادات.

4. صور التقدم والبيانات الحساسة
إحنا عارفين إن صور التقدم حاجة حساسة جدًا.
• التخزين: صورك بتتحفظ جوه التطبيق على موبايلك، ومش بتترفع على أي سيرفر بتاعنا. على أندرويد، الموبايل نفسه ممكن يعمل نسخة احتياطية من بيانات التطبيق (ومنها الصور) على Google Drive بتاعك لو النسخ الاحتياطي شغال عندك، وإحنا مش بنقدر نشوفها.
• الخصوصية: عمرنا ما هنشارك أو ننشر أو نبيع صور التقدم بتاعتك من غير موافقتك الصريحة والمكتوبة. الصور مش بتخرج من موبايلك إلا لو إنت اخترت تشيّرها بنفسك.

5. صلاحيات الموبايل
• الكاميرا والصور: عشان تاخد صور التقدم أو تختارها من المعرض.
• الإشعارات: عشان التذكيرات.
التطبيق مش بيستخدم أي صلاحية غير لما إنت توافق عليها، وتقدر تلغيها في أي وقت من إعدادات الموبايل.

6. الخدمات اللي بنستخدمها
• Firebase Authentication (من Google): لو عملت حساب، بيتحفظ عندهم إيميلك واسمك وطريقة الدخول (إيميل، جوجل، فيسبوك، أو Apple) عشان تقدر تدخل.
• RevenueCat و App Store و Google Play: لإدارة الاشتراكات. إحنا مش بنشوف ولا بنحفظ بيانات الدفع أو الكارت بتاعك.
• Google AdMob (للمستخدمين المجانيين بس): بيعرض إعلانات، وممكن يجمع معرّف الإعلانات بتاع الموبايل وبيانات عامة عن الجهاز والتفاعل مع الإعلانات عشان يعرض إعلانات مناسبة ويقيس أداءها. لو إنت في أوروبا أو بريطانيا هيطلب موافقتك الأول، وتقدر تغيّرها من الإعدادات > خصوصية الإعلانات. وعلى آيفون تقدر ترفض التتبع. مشتركين برو مش بيشوفوا إعلانات.
بيانات الصحة والوزن والصور مش بتتبعت لأي خدمة من دول.

7. تخزين البيانات وأمانها
بنطبق مجموعة من إجراءات الأمان المتعارف عليها في المجال عشان نحافظ على أمان معلوماتك الشخصية.

8. مسح البيانات
من حقك تمسح حسابك وكل البيانات المرتبطة بيه في أي وقت من الإعدادات > مسح الحساب نهائيًا، أو تبعتلنا على الإيميل اللي تحت. ولو مسحت التطبيق من موبايلك، البيانات المحفوظة عليه بتتمسح معاه، إلا النسخة الاحتياطية اللي أندرويد عاملها على Google Drive بتاعك (تقدر تمسحها من إعدادات Google Drive > النسخ الاحتياطية).

9. تواصل معانا
لو عندك أي سؤال، كلمنا على:
optifitstudio0@gmail.com
`;

// --- English versions ---
const PRIVACY_TEXT_EN = `
PRIVACY POLICY
Last Updated: 2025

1. Introduction
Your privacy is very important to us. This Privacy Policy explains how "The 4-Week SHRED" (the "App") collects, uses, and protects your information.

2. Information We Collect
To give you a personalized workout and meal plan, we collect:
• Personal Information: name and email address.
• Health & Fitness Data: age, gender, height, current weight, target weight, and activity level.
• Cycle Data (only if you turn on the cycle plan): your last period date and cycle length. It stays on your phone only and is never sent to anyone.
• Content You Add: progress photos (before & after), weight, and measurements.
• Usage Data: how you use the App (such as completed workouts, streak, and badges).

3. How We Use Your Information
• Calculations & Personalization: we use your health data only to calculate your daily calorie needs and build your workout and meal plan.
• Progress Tracking: we save your weight, measurements, and progress photos so you can see how your body changes.
• Reminders: notifications (workout, water, meals, weekly weigh-in) are created locally on your phone, and you can turn them off at any time in Settings.

4. Progress Photos & Sensitive Data
We know progress photos are very sensitive.
• Storage: your photos are saved inside the App on your phone and are never uploaded to our servers. On Android, your phone may back up the App's data (including photos) to your own Google Drive if backup is turned on. We can't access that backup.
• Privacy: we will never share, publish, or sell your progress photos without your explicit written consent. Photos never leave your phone unless you choose to share them yourself.

5. Phone Permissions
• Camera & Photos: to take or choose progress photos.
• Notifications: for reminders.
The App only uses a permission after you allow it, and you can revoke it at any time in your phone settings.

6. Services We Use
• Firebase Authentication (by Google): if you create an account, your email, name, and sign-in method (email, Google, Facebook, or Apple) are stored there so you can sign in.
• RevenueCat, the App Store, and Google Play: to manage subscriptions. We never see or store your payment or card details.
• Google AdMob (free users only): shows ads and may collect your device's advertising ID, general device info, and ad interactions to show relevant ads and measure their performance. If you are in the EEA or UK, you will be asked for consent first, and you can change it anytime in Settings > Ad privacy. On iPhone you can decline tracking. Pro subscribers see no ads.
Your health data, weight, and photos are not sent to any of these services.

7. Data Storage & Security
We use industry-standard security measures to keep your personal information safe.

8. Deleting Your Data
You can delete your account and all related data at any time from Settings > Delete account permanently, or by emailing us at the address below. If you delete the App from your phone, the data saved on it is deleted too, except for the backup Android keeps in your own Google Drive (you can delete it from Google Drive > Backups).

9. Contact Us
If you have any questions, contact us at:
optifitstudio0@gmail.com
`;

const TERMS_TEXT_EN = `
TERMS OF USE
Last Updated: 2025

1. Introduction
Welcome to "The 4-Week SHRED". By downloading, accessing, or using the App, you agree to these Terms of Use.

2. MEDICAL DISCLAIMER (IMPORTANT)
The App is for educational and informational purposes only and is not a substitute for medical advice.
• Consult a Physician: consult your doctor before starting this or any exercise program, especially if you have a health condition or injury, or are pregnant.
• Risk of Injury: by using the App, you take full responsibility for any injury that may happen.

3. Subscriptions & Billing
• Payment: the amount is charged to your App Store or Google Play account when you confirm the purchase.
• Auto-Renewal: subscriptions renew automatically unless auto-renewal is turned off at least 24 hours before the end of the current period.
• Cancellation: you can manage or cancel your subscription in your App Store or Google Play account settings.

4. User Accounts
You agree to enter accurate, current, and complete information so the App's calculations are correct.

5. Intellectual Property
All content in the App is the property of "The 4-Week SHRED" and is protected by copyright laws.

6. User Conduct
You agree not to break any law or harass or harm anyone else.

7. Changes to These Terms
We may change these Terms at any time.

8. Contact Us
If you have any questions, contact us at:
optifitstudio0@gmail.com
`;

// --- شروط الاستخدام الكاملة ---
const TERMS_TEXT = `
شروط الاستخدام
آخر تحديث: 2025

1. مقدمة
أهلًا بيك في "The 4-Week SHRED". لما بتنزّل التطبيق أو تدخل عليه أو تستخدمه، فإنت موافق إنك تلتزم بشروط الاستخدام دي.

2. إخلاء المسؤولية الطبية (مهم)
التطبيق معمول لأغراض تعليمية وتثقيفية بس، ومش بديل عن الاستشارة الطبية.
• استشر طبيبك: لازم تستشير دكتورك قبل ما تبدأ البرنامج ده أو أي برنامج رياضي تاني، خصوصًا لو عندك أي مشكلة صحية أو إصابة أو حامل.
• خطر الإصابة: باستخدامك للتطبيق، إنت بتتحمل المسؤولية الكاملة عن أي إصابة ممكن تحصل.

3. الاشتراكات والدفع
• الدفع: المبلغ بيتخصم من حسابك على App Store أو Google Play أول ما تأكد عملية الشراء.
• التجديد التلقائي: الاشتراك بيتجدد تلقائيًا، إلا لو قفلت التجديد التلقائي قبل نهاية الفترة الحالية بـ24 ساعة على الأقل.
• الإلغاء: تقدر تدير اشتراكك أو تلغيه من إعدادات حسابك على App Store أو Google Play.

4. حسابات المستخدمين
إنت موافق إنك تدخل معلومات صحيحة وحديثة وكاملة، عشان حسابات التطبيق تطلع مظبوطة.

5. الملكية الفكرية
كل المحتوى اللي جوه التطبيق ملك "The 4-Week SHRED" ومحمي بقوانين حقوق النشر.

6. سلوك المستخدم
إنت موافق إنك متخالفش أي قانون ومتضايقش أو تأذي أي حد تاني.

7. التعديل على الشروط
من حقنا نعدّل الشروط دي في أي وقت.

8. تواصل معانا
لو عندك أي سؤال، كلمنا على:
optifitstudio0@gmail.com
`;

const TermsOfUse = ({ navigation, route }) => {
  const { type } = route.params || { type: 'terms' };
  
  const title = type === 'privacy' ? tr('سياسة الخصوصية') : tr('شروط الاستخدام');
  const content = LANG === 'en' ? (type === 'privacy' ? PRIVACY_TEXT_EN : TERMS_TEXT_EN) : (type === 'privacy' ? PRIVACY_TEXT : TERMS_TEXT);

  return (
    // 2. استخدام SafeAreaView للحاوية الرئيسية لضمان تطابق الخلفية والحدود
    <SafeAreaView style={styles.rootContainer}>
      <StatusBar style="light" />
      
      {/* 3. الهيدر مطابق تماماً للكود الثاني (AboutScreen) */}
      <View style={styles.header}>
        {/* زر الرجوع */}
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name={require('./rtl').ICON.back} size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* العنوان */}
        <Text style={styles.headerTitle}>{title}</Text>
        
        {/* عنصر وهمي للحفاظ على التوازن */}
        <View style={{ width: 40 }} />
      </View>

      {/* المحتوى */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true}>
        <Text style={styles.text}>{content}</Text>
        <View style={{height: 50}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ستايل الحاوية الرئيسية (مثل rootContainer في الكود الثاني)
  rootContainer: { 
    flex: 1, 
    backgroundColor: '#000000' 
  },

  // ✅ ستايل الهيدر منسوخ من (AboutScreen customHeader)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    // هذه هي الحسبة الدقيقة التي تجعل الارتفاع مطابقاً للكود الثاني
    paddingTop: Platform.OS === 'android' ? 40 : 10, 
    paddingBottom: 10,
    backgroundColor: '#000000',
  },

  // ✅ ستايل زر الرجوع من الكود الثاني
  backButton: { 
    padding: 5, 
    width: 40, 
    alignItems: 'center' 
  },

  // ✅ ستايل العنوان من الكود الثاني (مع تعديل الحجم ليكون 20 ليطابق AboutScreen)
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
  },

  content: { 
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10
  },
  
  text: { 
    color: '#BBBBBB', // استخدمنا textSecondary من الكود الثاني لتوحيد اللون
    fontSize: 14, 
    lineHeight: 24, 
    textAlign: 'left', writingDirection: LANG === 'en' ? 'ltr' : 'rtl' // في RTL الـleft بيتقلب لليمين لوحده 
  }
});

export default TermsOfUse;

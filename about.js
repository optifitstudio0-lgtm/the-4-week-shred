import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, SafeAreaView, ScrollView,
  TouchableOpacity, Linking, StyleSheet, Image, Platform
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; 
import { StatusBar } from 'expo-status-bar'; // ✅ استخدام مكتبة اكسبو للبار العلوي
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANG } from './i18n';

// ✅ تعريف الثيم
const appTheme = {
    background: '#000000',      
    card: '#1A1A1A',            
    textPrimary: '#FFFFFF',     
    textSecondary: '#BBBBBB',   
    primary: '#2ECC71',         
    contactBg: '#252525',       
    contactText: '#2ECC71',     
};

// ✅ المحتوى (عربي وإنجليزي)
const translations = {
    ar: {
        headerTitle: 'عن التطبيق',
        appName: 'The 4-Week SHRED',
        slogan: 'نظام متكامل لنحت الجسم',
        aboutUsTitle: 'من نحن؟',
        aboutUsText: 'نحن لسنا مجرد تطبيق تمارين، نحن نظام تنشيف متكامل. نؤمن بأن النتائج الحقيقية تأتي من دمج التمارين الذكية مع التغذية الدقيقة.',
        featuresTitle: 'الركائز الأساسية',
        visionTitle: 'فلسفتنا',
        visionText: 'رؤيتنا هي تقديم خطة واضحة ومحددة زمنياً للرجال والنساء الذين جربوا تطبيقات أخرى ولم يجدوا نتائج حقيقية.',
        contactTitle: 'تواصل معنا',
        contactIntro: 'نحن معك في كل خطوة. إذا واجهت مشكلة أو لديك استفسار، فريق الدعم جاهز للمساعدة.',
        version: 'الإصدار 1.2.0',
        feature1Title: 'تمارين ذكية', feature1Desc: 'مزيج علمي من تمارين HIIT وتمارين القوة.',
        feature2Title: 'تغذية دقيقة', feature2Desc: 'خطة أكل مرنة مع نظام تدوير الكربوهيدرات.',
        feature3Title: 'وضع الحرق', feature3Desc: 'نظام تحفيزي لمتابعة التزامك اليومي.',
        feature4Title: 'تتبع التقدم', feature4Desc: 'متابعة الوزن، وصور قبل وبعد جنب بعض بالفرق.',
    },
    en: {
        headerTitle: 'About',
        appName: 'The 4-Week SHRED',
        slogan: 'Complete Body Sculpting System',
        aboutUsTitle: 'Who We Are',
        aboutUsText: 'We are not just a workout app; we are a complete shredding system combining Smart Workouts with Precise Nutrition.',
        featuresTitle: 'Key Pillars',
        visionTitle: 'Our Philosophy',
        visionText: 'Our vision is to provide a clear, time-bound plan for those who tried other apps and failed.',
        contactTitle: 'Contact Us',
        contactIntro: 'We are with you every step of the way. If you have questions, our support team is ready.',
        version: 'Version 1.2.0',
        feature1Title: 'Smart Workouts', feature1Desc: 'Scientific blend of HIIT and Strength training.',
        feature2Title: 'Precise Nutrition', feature2Desc: 'Flexible meal plans with Carb Cycling.',
        feature3Title: 'Shred Mode', feature3Desc: 'Gamified system to track daily consistency.',
        feature4Title: 'Progress Tracking', feature4Desc: 'Weight tracking and side-by-side before & after photos.',
    }
};

const AboutScreen = ({ route }) => { 
    const initialLang = LANG; 
    const [theme, setTheme] = useState(appTheme);
    const [language, setLanguage] = useState(initialLang); 
    const navigation = useNavigation();
    const t = (key) => translations[language]?.[key] || key;
    const isRTL = language === 'ar'; 

    // ✅ إنشاء الستايل بناءً على الثيم الحالي (يمنع خطأ theme is not defined)
    const styles = useMemo(() => createStyles(theme, false), [theme]);

    useFocusEffect(
        useCallback(() => {
            const loadSettings = async () => {
                try {
                    const savedLang = await AsyncStorage.getItem('appLanguage');
                    if (savedLang) {
                         // setLanguage(savedLang); 
                    }
                } catch (error) { console.error(error); }
            };
            loadSettings();
        }, [])
    );

    const features = useMemo(() => [
        { icon: 'fitness-outline', title: t('feature1Title'), description: t('feature1Desc') },
        { icon: 'restaurant-outline', title: t('feature2Title'), description: t('feature2Desc') },
        { icon: 'flame-outline', title: t('feature3Title'), description: t('feature3Desc') },
        { icon: 'trending-up-outline', title: t('feature4Title'), description: t('feature4Desc') },
    ], [language, t]);

    const contactEmail = 'optifitstudio0@gmail.com';
    const handleEmailPress = () => { Linking.openURL(`mailto:${contactEmail}`); };

    return (
        <SafeAreaView style={styles.rootContainer}>
            <StatusBar style="light" />
            
            {/* Header */}
            <View style={styles.customHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={28} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('headerTitle')}</Text>
                <View style={{ width: 40 }} /> 
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                {/* Logo & Slogan */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="flash" size={50} color={theme.primary} />
                    </View>
                    <Text style={styles.appName}>{t('appName')}</Text>
                    <Text style={styles.slogan}>{t('slogan')}</Text>
                </View>

                {/* About Us */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('aboutUsTitle')}</Text>
                    <Text style={styles.sectionText}>{t('aboutUsText')}</Text>
                </View>

                {/* Features */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('featuresTitle')}</Text>
                    {features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <Ionicons name={feature.icon} size={30} color={theme.primary} style={styles.featureIcon} />
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Philosophy */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('visionTitle')}</Text>
                    <Text style={styles.sectionText}>{t('visionText')}</Text>
                </View>

                {/* Contact */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('contactTitle')}</Text>
                    <Text style={styles.sectionText}>{t('contactIntro')}</Text>
                    <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
                        <Ionicons name="mail-outline" size={24} color={theme.primary} />
                        <Text style={styles.contactText}>{contactEmail}</Text>
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.footerText}>{t('version')}</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

// ✅ دالة إنشاء الستايل (Style Factory)
const createStyles = (theme, isRTL) => StyleSheet.create({
    rootContainer: { flex: 1, backgroundColor: theme.background },
    container: { paddingHorizontal: 20, paddingBottom: 40 },
    
    customHeader: {
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 10,
        backgroundColor: theme.background,
    },
    backButton: { padding: 5, width: 40, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.textPrimary },
    
    header: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    logoContainer: { 
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#1A1A1A', 
        justifyContent: 'center', alignItems: 'center', marginBottom: 10,
        borderWidth: 2, borderColor: theme.primary
    },
    appName: { fontSize: 28, fontWeight: 'bold', color: theme.textPrimary, textAlign: 'center' },
    slogan: { fontSize: 14, color: theme.primary, marginTop: 4, fontWeight: '600' },
    
    card: { backgroundColor: theme.card, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
    
    sectionTitle: { 
        fontSize: 18, fontWeight: 'bold', color: theme.primary, marginBottom: 15, 
        textAlign: isRTL ? 'right' : 'left' 
    },
    sectionText: { 
        fontSize: 14, lineHeight: 22, color: theme.textSecondary, 
        textAlign: isRTL ? 'right' : 'left' 
    },
    
    featureItem: { 
        flexDirection: isRTL ? 'row-reverse' : 'row', 
        alignItems: 'flex-start', marginBottom: 20 
    },
    featureIcon: { 
        marginLeft: isRTL ? 15 : 0,
        marginRight: isRTL ? 0 : 15,
        marginTop: 2
    },
    featureTextContainer: { 
        flex: 1, 
        alignItems: isRTL ? 'flex-end' : 'flex-start' 
    },
    featureTitle: { 
        fontSize: 16, fontWeight: 'bold', color: theme.textPrimary, 
        textAlign: isRTL ? 'right' : 'left' 
    },
    featureDescription: { 
        fontSize: 13, color: theme.textSecondary, marginTop: 4, lineHeight: 18, 
        textAlign: isRTL ? 'right' : 'left' 
    },
    
    contactItem: { 
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center', marginTop: 20, backgroundColor: theme.contactBg, 
        paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, 
        alignSelf: isRTL ? 'flex-end' : 'flex-start'
    },
    contactText: { fontSize: 15, color: theme.textPrimary, fontWeight: '600', marginHorizontal: 10 },
    footerText: { textAlign: 'center', color: '#555', marginTop: 10, fontSize: 12 },
});

export default AboutScreen;
import React, { useState, useEffect, useMemo } from 'react';
import { tc, statusStyle } from './theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getPackages, buyPackage, restorePurchases, isPurchasesConfigured, devTogglePro } from './purchases';
import { getIsPro } from './pro';
import { tr } from './i18n';

const { width, height } = Dimensions.get('window');
const MAIN_COLOR = tc('#2ECC71', 'fg');

// ترتيب الباقات وأسماؤها (الأسعار نفسها جاية من المتجر)
const PLAN_META = {
  MONTHLY: { title: tr('شهري'), period: tr('/شهر'), months: 1 },
  THREE_MONTH: { title: tr('3 شهور'), period: tr('/3 شهور'), months: 3 },
  SIX_MONTH: { title: tr('6 شهور'), period: tr('/6 شهور'), months: 6 },
  ANNUAL: { title: tr('سنوي'), period: tr('/سنة'), months: 12 },
};
const ORDER = ['MONTHLY', 'THREE_MONTH', 'SIX_MONTH', 'ANNUAL'];

const REASONS = {
  weeks: { icon: 'lock-closed', text: tr('خلّصت الأسبوع المجاني؟ كمّل الأسابيع 2 و3 و4 مع برو.') },
  swap: { icon: 'swap-horizontal', text: tr('تبديل الوجبات من غير حد ومن غير إعلانات متاح لمشتركين برو.') },
  share: { icon: 'share-social', text: tr('شير كارت قبل وبعد متاح لمشتركين برو.') },
  rounds: { icon: 'repeat', text: tr('خلّصت الـ28 يوم؟ الجولات الجاية (كل جولة أصعب من اللي قبلها) متاحة لمشتركين برو.') },
};

// فترة التجربة المجانية من بيانات المنتج في المتجر (لو موجودة)
const trialDays = (pkg) => {
  const intro = pkg?.product?.introPrice;
  if (!intro || intro.price !== 0) return 0;
  const n = intro.periodNumberOfUnits || 1;
  const unit = intro.periodUnit;
  if (unit === 'DAY') return n;
  if (unit === 'WEEK') return n * 7;
  if (unit === 'MONTH') return n * 30;
  return 0;
};

const SubscriptionScreen = ({ navigation, route }) => {
  const reason = REASONS[route?.params?.reason];
  const [packages, setPackages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    (async () => {
      setIsPro(await getIsPro());
      try {
        const list = (await getPackages()).filter((p) => PLAN_META[p.packageType]);
        list.sort((a, b) => ORDER.indexOf(a.packageType) - ORDER.indexOf(b.packageType));
        setPackages(list);
        const def = list.find((p) => p.packageType === 'ANNUAL') || list[0];
        setSelected(def ? def.identifier : null);
      } catch (e) {
        console.log('offerings error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // نسبة التوفير مقارنةً بالشهري
  const monthly = packages.find((p) => p.packageType === 'MONTHLY');
  const saveLabel = (pkg) => {
    const meta = PLAN_META[pkg.packageType];
    if (!monthly || pkg === monthly || !meta) return null;
    const full = monthly.product.price * meta.months;
    const pct = Math.round((1 - pkg.product.price / full) * 100);
    if (pkg.packageType === 'ANNUAL' && pct > 0) return tr('وفّر {0}%', pct);
    return pct >= 5 ? tr('وفّر {0}%', pct) : null;
  };

  const current = useMemo(() => packages.find((p) => p.identifier === selected), [packages, selected]);
  const trial = trialDays(current);

  const features = [
    tr('الأسابيع 2 و3 و4 كاملين بالفيديو (21 يوم زيادة)'),
    tr('من غير إعلانات خالص طول ما اشتراكك شغال'),
    tr('جولات جديدة بعد الـ28 يوم من غير آخر، وكل جولة أصعب'),
    tr('تبديل أي وجبة بوجبة تانية بنفس السعرات'),
    tr('شير كارت قبل وبعد بالوزن والفرق'),
    tr('شهادة إتمام التحدي ستوري للإنستا'),
  ];

  const handleSubscribe = async () => {
    if (!current || busy) return;
    setBusy(true);
    try {
      const res = await buyPackage(current);
      if (res === 'pro') {
        Alert.alert(tr('مبروك! 🎉'), tr('بقيت عضو برو. كل الأسابيع اتفتحت.'), [{ text: tr('يلا!'), onPress: () => navigation.goBack() }]);
      } else if (res === 'not_pro') {
        Alert.alert('', tr('الدفع اتم بس الاشتراك لسه متفعّلش. جرّب "استرجاع الشراء" بعد دقيقة.'));
      }
    } catch (e) {
      console.log('purchase error', e);
      Alert.alert('', tr('الدفع متمّش. جرّب تاني.'));
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!isPurchasesConfigured) return Alert.alert('', tr('الاشتراكات لسه مش متظبطة في التطبيق.'));
    setBusy(true);
    try {
      const pro = await restorePurchases();
      Alert.alert('', pro ? tr('رجّعنالك اشتراك برو ✅') : tr('ملقيناش اشتراك على الحساب ده.'));
      if (pro) setIsPro(true);
    } catch (e) {
      Alert.alert('', tr('معرفناش نرجّع الشراء. جرّب تاني.'));
    } finally {
      setBusy(false);
    }
  };

  const openManage = () => {
    Linking.openURL(Platform.OS === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions');
  };

  const openLegalPage = (type) => navigation.navigate('TermsOfUse', { type });

  const buttonText = trial ? tr('ابدأ {0} أيام مجانًا', trial) : tr('اشترك');
  const subText = current
    ? trial
      ? tr('بعدها {0}{1}، والغي في أي وقت', current.product.priceString, PLAN_META[current.packageType].period)
      : tr('{0}{1}، والغي في أي وقت', current.product.priceString, PLAN_META[current.packageType].period)
    : '';

  return (
    <View style={styles.mainContainer}>
      <StatusBar style={statusStyle()} />

      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80' }}
        style={styles.fixedBackground}
      >
        <LinearGradient colors={[tc('rgba(0,0,0,0.1)', 'bg'), tc('#000000', 'bg')]} style={styles.gradient} />
      </ImageBackground>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.closeButtonContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={"#FFF"} />
          </TouchableOpacity>
        </View>

        <View style={{ height: height * 0.2 }} />

        <View style={styles.headerTitleContainer}>
          <Text style={styles.proBadge}>SHRED PRO</Text>
          <Text style={styles.title}>{tr('افتح أحسن شكل ليك')}</Text>
          <Text style={styles.subtitle}>{tr('الأسبوع الأول ببلاش. كمّل التحدي كله مع برو.')}</Text>
        </View>

        {!!reason && !isPro && (
          <View style={styles.reasonBox}>
            <Ionicons name={reason.icon} size={18} color={MAIN_COLOR} />
            <Text style={styles.reasonText}>{reason.text}</Text>
          </View>
        )}

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={14} color={tc("#000", 'fg')} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {isPro ? (
          <View style={styles.proActive}>
            <Ionicons name="trophy" size={34} color={MAIN_COLOR} />
            <Text style={styles.proActiveTitle}>{tr('إنت مشترك برو ✅')}</Text>
            <Text style={styles.proActiveText}>{tr('كل حاجة مفتوحة. تقدر تدير أو تلغي اشتراكك من المتجر.')}</Text>
            <TouchableOpacity onPress={openManage} style={{ marginTop: 12 }}>
              <Text style={[styles.footerLink, { color: MAIN_COLOR, fontSize: 13 }]}>{tr('إدارة الاشتراك')}</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingBox}><ActivityIndicator color={MAIN_COLOR} /></View>
        ) : packages.length === 0 ? (
          <View style={styles.proActive}>
            <Ionicons name="cloud-offline-outline" size={30} color={tc("#888", 'fg')} />
            <Text style={styles.proActiveText}>
              {isPurchasesConfigured ? tr('معرفناش نجيب الأسعار من المتجر. اتأكد من النت وجرّب تاني.') : tr('الاشتراكات لسه مش متظبطة في التطبيق.')}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.plansContainer}>
              {packages.map((pkg) => {
                const meta = PLAN_META[pkg.packageType];
                const isSelected = selected === pkg.identifier;
                const save = saveLabel(pkg);
                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    activeOpacity={0.9}
                    style={[styles.planCard, isSelected && styles.selectedCard]}
                    onPress={() => setSelected(pkg.identifier)}
                  >
                    {!!save && (
                      <View style={[styles.saveBadge, isSelected ? { backgroundColor: MAIN_COLOR } : { backgroundColor: tc('#555', 'bg') }]}>
                        <Text style={[styles.saveText, isSelected ? { color: tc('#000', 'fg') } : { color: tc('#FFF', 'fg') }]}>{save}</Text>
                      </View>
                    )}
                    <View style={styles.planInfo}>
                      <Text style={[styles.planTitle, isSelected && { color: MAIN_COLOR }]}>{meta.title}</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
                        <Text style={styles.planPeriod}>{meta.period}</Text>
                      </View>
                    </View>
                    <View style={[styles.radioCircle, isSelected && { borderColor: MAIN_COLOR }]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!!trial && <Text style={styles.trialNote}>{tr('أول {0} أيام ببلاش، ومش هيتخصم منك حاجة لو لغيت قبلها.', trial)}</Text>}

            <TouchableOpacity style={[styles.subscribeBtn, busy && { opacity: 0.7 }]} onPress={handleSubscribe} disabled={busy}>
              <LinearGradient colors={[MAIN_COLOR, tc('#27AE60', 'bg')]} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {busy ? <ActivityIndicator color={tc("#FFF", 'fg')} /> : (
                  <>
                    <Text style={styles.subscribeText}>{buttonText}</Text>
                    <Text style={styles.cancelAnytime}>{subText}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* المتاجر بتطلب توضيح التجديد التلقائي في صفحة الاشتراك */}
            <Text style={styles.legalNote}>
              {Platform.OS === 'ios'
                ? tr('الاشتراك بيتجدد تلقائيًا وبيتخصم من حساب Apple بتاعك، إلا لو لغيت التجديد قبل نهاية الفترة بـ24 ساعة على الأقل. تقدر تديره أو تلغيه من إعدادات حسابك على App Store.')
                : tr('الاشتراك بيتجدد تلقائيًا وبيتخصم من حساب Google Play بتاعك، إلا لو لغيت التجديد قبل نهاية الفترة بـ24 ساعة على الأقل. تقدر تديره أو تلغيه من Google Play > الاشتراكات.')}
            </Text>
          </>
        )}

        {__DEV__ && !isPurchasesConfigured && (
          <TouchableOpacity
            style={styles.devBtn}
            onPress={async () => { await devTogglePro(!isPro); setIsPro(!isPro); }}
          >
            <Text style={styles.devBtnText}>{isPro ? tr('وضع التطوير: الغي برو') : tr('وضع التطوير: جرّب برو من غير دفع')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleRestore} disabled={busy}><Text style={styles.footerLink}>{tr('استرجاع الشراء')}</Text></TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity onPress={() => openLegalPage('terms')}><Text style={styles.footerLink}>{tr('شروط الاستخدام')}</Text></TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity onPress={() => openLegalPage('privacy')}><Text style={styles.footerLink}>{tr('سياسة الخصوصية')}</Text></TouchableOpacity>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: tc('#000', 'bg') },
  fixedBackground: { position: 'absolute', top: 0, left: 0, width: width, height: height * 0.6, zIndex: 0 },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  closeButtonContainer: { alignItems: 'flex-end', marginTop: Platform.OS === 'android' ? 45 : 55, marginBottom: 10 },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  headerTitleContainer: { alignItems: 'center', marginBottom: 25 },
  proBadge: { backgroundColor: MAIN_COLOR, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, fontSize: 14, fontWeight: '900', color: tc('#000', 'fg'), marginBottom: 10, overflow: 'hidden' },
  title: { fontSize: 26, fontWeight: 'bold', color: tc('#FFF', 'fg'), textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: tc('#AAA', 'fg'), textAlign: 'center', paddingHorizontal: 10, lineHeight: 20 },
  featuresContainer: { marginBottom: 25, backgroundColor: tc('#111', 'bg'), borderRadius: 20, padding: 20, borderWidth: 1, borderColor: tc('#222', 'border') },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: MAIN_COLOR, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  featureText: { fontSize: 14, color: tc('#DDD', 'fg'), fontWeight: '500', flex: 1, textAlign: 'left' },
  plansContainer: { marginBottom: 20 },
  planCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: tc('#1A1A1A', 'bg'), borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 2, borderColor: tc('#333', 'border'), position: 'relative' },
  selectedCard: { borderColor: MAIN_COLOR, backgroundColor: tc('rgba(46, 204, 113, 0.05)', 'bg') },
  saveBadge: { position: 'absolute', top: -10, right: 20, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  saveText: { fontSize: 10, fontWeight: 'bold' },
  planInfo: {},
  planTitle: { fontSize: 14, color: tc('#AAA', 'fg'), fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: { fontSize: 22, fontWeight: 'bold', color: tc('#FFF', 'fg') },
  planPeriod: { fontSize: 14, color: tc('#888', 'fg'), marginLeft: 2 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: tc('#555', 'border'), justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: MAIN_COLOR },
  subscribeBtn: { width: '100%', borderRadius: 30, overflow: 'hidden', marginBottom: 20, shadowColor: MAIN_COLOR, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  subscribeText: { fontSize: 16, fontWeight: 'bold', color: tc('#FFF', 'fg'), textTransform: 'uppercase' },
  cancelAnytime: { fontSize: 11, color: tc('rgba(255,255,255,0.8)', 'fg'), marginTop: 4 },
  trialToggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  trialToggleText: { marginLeft: 10, fontSize: 14, color: tc('#888', 'fg'), fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  reasonBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: tc('rgba(46,204,113,0.12)', 'bg'), borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: tc('rgba(46,204,113,0.3)', 'border') },
  reasonText: { color: tc('#FFF', 'fg'), fontSize: 13, flex: 1, lineHeight: 20, textAlign: 'left' },
  trialNote: { color: MAIN_COLOR, fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  legalNote: { color: tc('#666', 'fg'), fontSize: 11, textAlign: 'center', lineHeight: 17, marginBottom: 15, paddingHorizontal: 5 },
  proActive: { alignItems: 'center', backgroundColor: tc('#111', 'bg'), borderRadius: 20, padding: 22, borderWidth: 1, borderColor: MAIN_COLOR, marginBottom: 20 },
  proActiveTitle: { color: tc('#FFF', 'fg'), fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  proActiveText: { color: tc('#AAA', 'fg'), fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  loadingBox: { paddingVertical: 30, alignItems: 'center' },
  devBtn: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: tc('#444', 'border'), marginBottom: 15 },
  devBtnText: { color: tc('#888', 'fg'), fontSize: 12 },
  footerLink: { color: tc('#666', 'fg'), fontSize: 11, textDecorationLine: 'underline' },
  footerDivider: { color: tc('#666', 'fg'), fontSize: 11, marginHorizontal: 8 },
});

export default SubscriptionScreen;
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  PanResponder,
  I18nManager,
  ImageBackground, 
  Dimensions, 
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { tr } from './i18n';

const { width, height } = Dimensions.get('window');
const MAIN_COLOR = '#2ECC71'; 

// 👇 الصور والبيانات زي ما طلبت بالظبط
const slides = [
  {
    id: '1',
    titleBase: tr('مش مجرد تخسيس، ده'),
    titleHighlight: tr('سيستم كامل'),
    description: tr('انسى التمارين العشوائية. ده أساس متكامل بيجمع بين تمرين ذكي وأكل محسوب عشان تطلّع أحسن نسخة منك.'),
    image: require('./assets/1.png') 
  },
  {
    id: '2',
    titleBase: tr('اتمرن صح، كُل صح، وشوف'),
    titleHighlight: tr('النتيجة'),
    description: tr('مزيج علمي من HIIT لحرق الدهون وتمارين قوة للعضلات، مع خطة أكل بتدوير الكارب، وتذكيرات عشان متنساش.'),
    image: require('./assets/2.png')
  },
  {
    id: '3',
    titleBase: tr('ادخل تحدي'),
    titleHighlight: tr('الـ4 أسابيع'),
    description: tr('جاهز تتغير؟ صوّر صورة "قبل"، ابدأ الستريك، وفي الآخر شيّر شهادتك على الإنستا.'),
    image: require('./assets/3.png')
  },
];

const OnboardingItem = ({ item }) => {
  return (
    <View style={styles.itemContainer}>
      <ImageBackground source={item.image} style={styles.image} resizeMode="cover">
        
        {/* الإضاءة العلوية اليمنى */}
        <LinearGradient
          colors={['rgba(46, 204, 113, 0.7)', 'rgba(46, 204, 113, 0.2)', 'transparent']} 
          start={{ x: 3.0, y: 0 }}   
          end={{ x: 0.1, y: 0.6 }} 
          style={styles.topRightCurve}
        />

        {/* التدرج الأسود السفلي */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', '#000000', '#000000']}
          locations={[0, 0.3, 0.8, 1]} 
          style={styles.gradient}
        >
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {item.titleBase}{'\n'}
              <Text style={styles.highlightText}>{item.titleHighlight}</Text>
            </Text>
            <Text style={styles.description}>
              {item.description}
            </Text>
          </View>
        </LinearGradient>

      </ImageBackground>
    </View>
  );
};

// 👇 Paginator بتأثير النيون (بيتحرك مع رقم السلايد، فبيشتغل صح في RTL)
const Dot = ({ active, onPress }) => {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: active ? 1 : 0, duration: 300, useNativeDriver: false }).start();
  }, [active]);
  const dotWidth = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 40] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} hitSlop={8}>
      <Animated.View style={[styles.dot, { width: dotWidth, opacity }]} />
    </TouchableOpacity>
  );
};

const Paginator = ({ data, currentIndex, scrollTo }) => (
  <View style={styles.paginatorContainer}>
    {data.map((_, i) => (
      <Dot key={i} active={i === currentIndex} onPress={() => scrollTo(i)} />
    ))}
  </View>
);

// السلايدر: سلايد واحدة بتظهر بفيد، والسحب يمين/شمال بيقلّب (من غير FlatList أفقي
// لأن الـ FlatList الأفقي في RTL على أندرويد بيعمل مشاكل في الـ offset)
const IndexScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const indexRef = useRef(0);

  const scrollToSlide = (index) => {
    if (index < 0 || index >= slides.length || index === indexRef.current) return;
    Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      indexRef.current = index;
      setCurrentIndex(index);
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < 50) return;
        // في RTL السحب لليمين = السلايد الجاية
        const forward = I18nManager.isRTL ? g.dx > 0 : g.dx < 0;
        scrollToSlide(indexRef.current + (forward ? 1 : -1));
      },
    })
  ).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollToSlide(currentIndex + 1);
    } else {
      // لما يخلص يروح لصفحة Gender (replace عشان ميرجعش لورا)
      navigation.replace('Gender');
    }
  };

  return (
    <View style={styles.container} {...pan.panHandlers}>
      <StatusBar style="light" translucent />
      <Animated.View style={{ flex: 1, opacity: fade }}>
        <OnboardingItem item={slides[currentIndex]} />
      </Animated.View>

      <View style={styles.footer}>
        <Paginator data={slides} currentIndex={currentIndex} scrollTo={scrollToSlide} />
        <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? tr('يلا نبدأ') : tr('التالي')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  itemContainer: { width: width, flex: 1 },
  image: { flex: 1, width: width, height: height, justifyContent: 'flex-end' },
  topRightCurve: {
    position: 'absolute',
    top: 0,
    right: 0, 
    width: width,      
    height: height * 0.75, 
  },
  gradient: {
    height: height * 1.0, 
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 140, 
  },
  textContainer: { 
    alignItems: 'flex-start',
    width: '100%', 
  },
  title: {
    fontSize: 36, 
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 44,
    textAlign: 'left',
  },
  highlightText: { color: MAIN_COLOR },
  description: {
    fontSize: 15, 
    color: '#DDDDDD',
    lineHeight: 24,
    textAlign: 'left',
    marginTop: 5,
    maxWidth: '95%',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  button: {
    backgroundColor: MAIN_COLOR,
    width: '55%',    
    height: 60,      
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: MAIN_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 18,     
    fontWeight: 'bold' 
  },
  paginatorContainer: {
    flexDirection: 'row',
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 👇 ستايل النيون
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: MAIN_COLOR,
    marginHorizontal: 4,
    shadowColor: MAIN_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default IndexScreen;
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  SafeAreaView, // ✅ Added SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LANG, tr } from './i18n';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MAIN_COLOR = '#2ECC71'; // Green
const BG_COLOR = '#000000';   // Black
const CARD_COLOR = '#1A1A1A'; // Dark Grey

// ✅ 52 سؤال وإجابة بالعربي، ومطابقين للي التطبيق بيعمله فعلًا
const FAQ_DATA = [
  {
    category: '🏋️ التمارين',
    data: [
      {
        id: 1,
        question: 'التمارين صعبة عليّا، أعمل إيه؟',
        answer: 'ولا يهمك! قلّل عدد العدّات أو المدة على قد ما تقدر، وزوّد وقت الراحة بين التمارين من الإعدادات. ولو محتاج، وقّف التمرين مؤقتًا وكمّل لما تاخد نفسك. قوتك هتزيد مع الوقت.',
      },
      {
        id: 2,
        question: 'محتاج أدوات (دمبلز)؟',
        answer: 'لأ، مش محتاج أي أدوات. كل التمارين بوزن جسمك، وكام تمرين بس (زي الديبس والستيب أب والسكوات البلغاري) محتاجين كرسي أو كنبة ثابتة في البيت.',
      },
      {
        id: 3,
        question: 'فوّت تمرين امبارح، أعمل اتنين النهارده؟',
        answer: 'لأ، متعملش اتنين في يوم! الراحة مهمة عشان جسمك يتعافى. كمّل من المكان اللي وقفت فيه. الاستمرارية على المدى الطويل أحسن من إنك تضغط على نفسك زيادة.',
      },
      {
        id: 4,
        question: 'التمرين بياخد وقت قد إيه؟',
        answer: 'أغلب التمارين معمولة عشان تخلص في 30 لـ45 دقيقة، ده شامل الإحماء والتهدئة.',
      },
      {
        id: 5,
        question: 'لو حسيت بألم وأنا بتمرن؟',
        answer: 'وقّف فورًا! فيه فرق بين حرقان العضلة (ده كويس) والألم الحاد (ده وحش). راجع طريقة أدائك في الفيديو، ولو الألم لسه موجود، دوس على زرار "بيوجعني" واختار المكان، والتطبيق هيبدّل أي تمرين بيضغط عليه ببديل آمن في التمرين ده وباقي الخطة. ولو الألم استمر، اتكلم مع دكتور.',
      },
      {
        id: 6,
        question: 'ينفع أزوّد كارديو على الخطة؟',
        answer: 'الخطة فيها HIIT (تمارين متقطعة عالية الشدة) أصلًا. بس لو عايز تزوّد كارديو خفيف زي المشي في أيام الراحة، مفيش أي مشكلة.',
      },
      {
        id: 7,
        question: 'إيه أحسن وقت في اليوم للتمرين؟',
        answer: 'أحسن وقت هو الوقت اللي تقدر تلتزم بيه كل يوم. التمرين الصبح على معدة فاضية ممكن يساعد في حرق الدهون، وتمرين بالليل ممكن يخليك تدّي أداء أعلى.',
      },
      {
        id: 8,
        question: 'أتمرن وأنا عيان؟',
        answer: 'اسمع كلام جسمك. لو الأعراض خفيفة و"فوق الرقبة" (زي رشح بسيط)، تمرين خفيف مفيهوش مشكلة. لو عندك سخونية أو جسمك مكسّر، استريح خالص لحد ما تخف.',
      },
      {
        id: 9,
        question: 'ليه الإحماء مهم؟',
        answer: 'الإحماء بيزوّد الدم الواصل للعضلات، وبيرفع حرارة الجسم، وبيقلل فرصة الإصابة. متتخطاش الإحماء اللي في أول التمرين أبدًا.',
      },
      {
        id: 10,
        question: 'جسمي مكسّر من تمرين امبارح، أتمرن؟',
        answer: 'وجع العضلات بعد التمرين (DOMS) طبيعي. الحركة الخفيفة غالبًا بتساعد أكتر من القعدة. بس لو الوجع جامد ومش قادر تتحرك، خد يوم راحة زيادة.',
      },
      {
        id: 11,
        question: 'ينفع أعمل التمارين دي في الجيم؟',
        answer: 'أكيد! التمارين دي تتعمل في أي مكان. ولو في الجيم، تقدر تستخدم أوزان بدل وزن الجسم عشان تزوّد المقاومة.',
      },
      {
        id: 12,
        question: 'يعني إيه HIIT وليه بنستخدمه؟',
        answer: 'HIIT يعني تمارين متقطعة عالية الشدة: مجهود قوي لفترة قصيرة وبعده راحة. ده أكفأ طريقة لحرق الدهون مع الحفاظ على العضل.',
      },
      {
        id: 13,
        question: 'أتنفس إزاي وأنا بتمرن؟',
        answer: 'عمومًا، طلّع النفس في الجزء الصعب من الحركة (وإنت بترفع أو بتزق)، وخد نفس في الجزء الأسهل (وإنت بتنزل أو بترجع). ومتكتمش نفسك أبدًا.',
      },
      {
        id: 14,
        question: 'ينفع أركز على البطن بس؟',
        answer: 'حرق الدهون من مكان معين خرافة. عشان عضلات بطنك تبان، لازم تنزّل نسبة الدهون في جسمك كله بتمارين للجسم كله وأكل مظبوط، وده اللي الخطة دي بتعمله.',
      },
    ],
  },
  {
    category: '🥗 الأكل والتغذية',
    data: [
      {
        id: 15,
        question: 'مش بحب وجبة أو مكوّن معين، أغيّره إزاي؟',
        answer: 'افتح الوجبة واضغط زرار التبديل (برو)، هيجيبلك وجبة تانية من نفس النوع (فطار، غدا، عشا، سناك). كرر لحد ما تلاقي اللي يعجبك.',
      },
      {
        id: 16,
        question: 'ينفع أشرب قهوة أو شاي؟',
        answer: 'أكيد! القهوة السادة والشاي كويسين للحرق. بس حاول متحطش سكر. الستيڤيا أو المحليات اللي من غير سعرات مفيش فيها مشكلة.',
      },
      {
        id: 17,
        question: 'محتاج مكملات (بروتين/كرياتين)؟',
        answer: 'المكملات اختيارية. خطة الأكل معمولة عشان توصلك لهدف البروتين من أكل حقيقي. بس الواي بروتين حل سهل لو إنت مستعجل أو برّه البيت.',
      },
      {
        id: 18,
        question: 'وإيه نظام الـCheat Meal؟',
        answer: 'بننصحك تلتزم بالخطة في الـ4 أسابيع عشان تاخد أحسن نتيجة. ولو لازم، وجبة حرة واحدة معتدلة في الأسبوع مقبولة، بس حاول متعدّيش سعراتك.',
      },
      {
        id: 19,
        question: 'أنا نباتي، البرنامج ينفعني؟',
        answer: 'لسه مفيش خطة نباتي كاملة. بس تقدر تبدّل أي وجبة فيها لحمة أو فراخ بزرار التبديل لحد ما توصل لوجبة تناسبك، وتعوّض البروتين من البيض والألبان والبقوليات.',
      },
      {
        id: 20,
        question: 'لسه جعان، آكل إيه؟',
        answer: 'اشرب كوباية مية كبيرة الأول. لو لسه جعان، كُل خضار سعراته قليلة زي الخيار أو الخس أو الكرفس. سعراتهم تقريبًا صفر.',
      },
      {
        id: 21,
        question: 'ينفع أشرب حاجة ساقعة أو عصير؟',
        answer: 'المياه الغازية العادية والعصاير المعلبة مليانة سكر و"سعرات فاضية" بتوقف الحرق. لو نفسك في حاجة ساقعة، خليها دايت (زيرو سعرات)، وكُل الفاكهة نفسها بدل العصير.',
      },
      {
        id: 22,
        question: 'ينفع أعمل صيام متقطع؟',
        answer: 'أيوه، تقدر تجمع خطة الأكل مع الصيام المتقطع (زي 16:8). المهم تاكل كل السعرات والماكروز بتوعك في وقت الأكل، وتشرب مية كتير.',
      },
      {
        id: 23,
        question: 'آكل إيه قبل التمرين؟',
        answer: 'الأحسن وجبة خفيفة فيها كارب وبروتين قبل التمرين بساعة لساعتين. موزة أو عيش توست بزبدة الفول السوداني اختيارات ممتازة.',
      },
      {
        id: 24,
        question: 'آكل إيه بعد التمرين؟',
        answer: 'جسمك محتاج بروتين عشان يصلّح العضل. حاول تاكل وجبة غنية بالبروتين أو تشرب شيك في خلال ساعة من آخر التمرين.',
      },
      {
        id: 25,
        question: 'أشرب مية قد إيه؟',
        answer: 'خلي هدفك 3 لـ4 لتر في اليوم على الأقل. المية أساسية لحرق الدهون وإنك تفضل نشيط طول فترة التحدي. تقدر تتابعها من متابعة المية.',
      },
      {
        id: 26,
        question: 'الملح وحش؟',
        answer: 'الصوديوم ضروري، خصوصًا مع العرق في تمارين HIIT. بس قلل الأكل المصنّع اللي ملحه كتير، لأنه بيحبس المية في الجسم ويعمل انتفاخ.',
      },
      {
        id: 27,
        question: 'أتعامل إزاي مع نفسي في الحلو؟',
        answer: 'الرغبة في الحلو غالبًا بتعدّي في 20 دقيقة. اشرب مية، أو كُل حتة فاكهة، أو اشرب مشروب دايت. وإنك تاكل بروتين كفاية بيقلل الرغبة دي كمان.',
      },
      {
        id: 28,
        question: 'ينفع آكل برّه في مطاعم؟',
        answer: 'أيوه، بس خلي بالك. اختار بروتين مشوي (فراخ/سمك) مع خضار جنبه. وابعد عن الصوصات الكريمي والأكل المقلي.',
      },
      {
        id: 29,
        question: 'عادي آكل متأخر بالليل؟',
        answer: 'مواعيد الأكل أقل أهمية من إجمالي السعرات في اليوم. بس وجبة تقيلة قبل النوم على طول ممكن تبوّظ نومك.',
      },
    ],
  },
  {
    category: '🔥 نظام البرنامج',
    data: [
      {
        id: 30,
        question: 'إيه اللي بيحصل بعد الـ4 أسابيع؟',
        answer: 'هتاخد شهادة إتمام وتقدر تشيّرها، وبعدها تدوس "ابدأ الجولة 2" من الرئيسية. كل جولة 28 يوم بنفس الخطة بس أصعب: الجولة 2 أصعب 20%، والتالتة 35%، ومن الرابعة وطالع 50% (ده أعلى مستوى عشان محدش يتعوّر)، والراحة بين التمارين بتقل. الإحماء والإطالة زي ما هما. عداد الجولات بيزيد طول العمر، وكل جولة ليها شهادة، وفيه بادچات للجولة 2 و3 و5 و10. الستريك والبادچات والصور والوزن كلهم بيفضلوا محفوظين. الجولات الجاية لمشتركين برو.',
      },
      {
        id: 31,
        question: 'يعني إيه الستريك 🔥؟',
        answer: 'الستريك هو عدد الأيام ورا بعض اللي خلّصت فيها تمرينك. كل يوم تتمرن فيه بيزود، ولو فوّت يوم بيرجع من الأول. فعّل تذكير "الستريك هيضيع" عشان ننبهك لو لسه متمرنتش.',
      },
      {
        id: 32,
        question: 'يعني إيه تدوير الكارب؟',
        answer: 'التطبيق بيغيّر الكارب على حسب تمرين اليوم: كارب أعلى في الأيام التقيلة (HIIT، الرجل، الجسم كله) عشان الطاقة، وأقل في أيام الراحة مع دهون أعلى شوية. ومتوسط سعرات الأسبوع بيفضل زي ما هو، فالخسارة مش بتتأثر. هتلاقي نوع يومك وأرقامه في شاشة الأكل.',
      },
      {
        id: 33,
        question: 'البرنامج آمن للمبتدئين؟',
        answer: 'أيوه. الأسبوع الأول بيبدأ بتمارين سهلة، والصعوبة بتزيد أسبوع ورا أسبوع (Progressive Overload) عشان قوتك تزيد بأمان. مستوى نشاطك اللي بتختاره في الأول بيتحسب بيه السعرات بس، والتمارين نفسها واحدة للكل. لو حاجة تقيلة عليك، زوّد مدة الراحة من الإعدادات، أو جرّب نسخة الـ7 دقايق، أو دوس "بيوجعني" عشان التمرين يتبدّل ببديل أسهل.',
      },
      {
        id: 34,
        question: 'أنا عندي فوق الـ50، ينفع أعمل البرنامج؟',
        answer: 'اللياقة ملهاش سن. بس بننصحك تستشير دكتورك قبل ما تبدأ أي برنامج عالي الشدة، وقلّل الشدة والعدّات على قد ما تقدر.',
      },
    ],
  },
  {
    category: '📈 التقدم والنتايج',
    data: [
      {
        id: 35,
        question: 'الميزان مش بينزل، ليه؟',
        answer: 'الوزن مقياس واحد بس. ممكن تكون بتخسر دهون وبتبني عضل في نفس الوقت. بص على صور قبل وبعد، وعلى هدومك بقت عاملة إزاي عليك، بدل الميزان. ولو الميزان وقف أسبوع، "محقق الثبات" في شاشة تقدمك هيقولك السبب من بياناتك، ولو وقف أسبوعين هيقترح يقلل 100 سعر بس.',
      },
      {
        id: 36,
        question: 'وزني زاد في أول أسبوع!',
        answer: 'متقلقش. ده غالبًا مية محبوسة في الجسم عشان عضلاتك بتتصلح من التمرين الجديد. هتنزل لوحدها بعد كام يوم.',
      },
      {
        id: 37,
        question: 'أوزن نفسي كل قد إيه؟',
        answer: 'بننصحك توزن مرة في الأسبوع، في نفس اليوم ونفس الوقت (الصبح)، من غير هدوم، عشان المتابعة تبقى دقيقة. سجّل وزنك من شاشة الإحصائيات.',
      },
      {
        id: 38,
        question: 'آخد صور تقدم حلوة إزاي؟',
        answer: 'ادخل البروفايل > صور قبل وبعد. قف في نور طبيعي، والبس أقل هدوم ممكنة، وصوّر من قدام ومن الجنب ومن ورا، وفي نفس المكان كل مرة. الصور بتتحفظ جوه التطبيق على موبايلك بس.',
      },
      {
        id: 39,
        question: 'إمتى هشوف السكس باك؟',
        answer: 'ظهور عضلات البطن بيعتمد على نسبة الدهون في جسمك. أغلب الناس بتبدأ تشوف تحديد في خلال 4 لـ8 أسابيع لو التزموا بخطة الأكل.',
      },
    ],
  },
  {
    category: '💳 الحساب والإعدادات',
    data: [
      {
        id: 40,
        question: 'ألغي اشتراك Pro إزاي؟',
        answer: 'الاشتراك بيتدار من المتجر: على آيفون من الإعدادات > اسمك > الاشتراكات، وعلى أندرويد من Google Play > البروفايل > المدفوعات والاشتراكات. لازم تلغي التجديد التلقائي قبل نهاية الفترة الحالية بـ24 ساعة على الأقل.',
      },
      {
        id: 53,
        question: 'إيه اللي ببلاش وإيه اللي في برو؟',
        answer: 'ببلاش: الأسبوع الأول كامل، وخطة الأكل بتدوير الكارب، والمية، والوزن، والتذكيرات، والستريك، وصور قبل وبعد. برو بيفتح الأسابيع 2 و3 و4، وتبديل الوجبات، وشير كارت قبل وبعد، ومن غير إعلانات.',
      },
      {
        id: 54,
        question: 'ليه فيه إعلانات؟ وأشيلها إزاي؟',
        answer: 'الإعلانات بتخلّي النسخة المجانية ببلاش، وعمرها ما بتظهر في نص التمرين. برو بيشيلها كلها طول ما اشتراكك شغال، ولو الاشتراك خلص بترجع تاني. ولو مش مشترك، تقدر تتفرج على إعلان قصير وتبدّل وجبة (3 مرات في اليوم).',
      },
      {
        id: 41,
        question: 'أحدّث وزني الحالي إزاي؟',
        answer: 'سجّله من شاشة الإحصائيات (أو غيّره من البروفايل > تعديل البروفايل). أول ما وزنك يتغير، التطبيق بيعيد حساب سعراتك والبروتين وهدف المية لوحده.',
      },
      {
        id: 42,
        question: 'أبدأ التحدي من الأول إزاي؟',
        answer: 'ادخل الإعدادات > ابدأ التحدي من الأول. ده هيمسح التقدم والستريك والبادچات وترجع لليوم 1، بس صورك ووزنك مش هيتمسحوا. خلي بالك: مفيش رجوع في الخطوة دي.',
      },
      {
        id: 43,
        question: 'ينفع أغيّر هدفي؟',
        answer: 'من البروفايل > تعديل البروفايل تقدر تغيّر وزنك المستهدف. وأي تغيير في وزنك أو طولك أو سنك بيعيد حساب السعرات والبروتين على طول.',
      },
      {
        id: 44,
        question: 'أغيّر وحدات القياس إزاي (كجم/رطل)؟',
        answer: 'من الإعدادات > نظام القياس (كجم/سم). شغّله للمتري (كجم/سم) أو اقفله للإمبريال (رطل/بوصة).',
      },
      {
        id: 45,
        question: 'التطبيق بيشتغل من غير نت؟',
        answer: 'أيوه! فيديوهات التمارين والوصفات والصور كلها جوه التطبيق، فتقدر تتمرن وتتابع أكلك ومَيتك من غير نت خالص.',
      },
      {
        id: 46,
        question: 'ينفع أستخدم التطبيق على أكتر من موبايل؟',
        answer: 'لو عملت حساب، اشتراك برو بيفضل معاك على أي موبايل (ادخل بنفس الحساب واضغط استرجاع الشراء لو محتاج). وعلى أندرويد، التقدم والوزن والصور بيتعملهم نسخة احتياطية لوحدهم على Google Drive بتاعك، فلو مسحت التطبيق ونزّلته تاني أو جبت موبايل جديد بنفس حساب جوجل، كل حاجة بترجع. اتأكد إن النسخ الاحتياطي شغال من إعدادات الموبايل > Google > النسخ الاحتياطي.',
      },
      {
        id: 47,
        question: 'أمسح حسابي إزاي؟',
        answer: 'زعلانين إنك ماشي! من الإعدادات > مسح الحساب نهائيًا. ده بيمسح حسابك وكل بياناتك من الموبايل، ومفيش رجوع. لو مشترك برو، الغي الاشتراك من المتجر الأول عشان المسح مش بيلغيه.',
      },
    ],
  },
  {
    category: '🔧 الدعم الفني',
    data: [
      {
        id: 48,
        question: 'الفيديوهات مش بتشتغل.',
        answer: 'اقفل التطبيق خالص وافتحه تاني. لو المشكلة لسه موجودة، اتأكد إن عندك مساحة فاضية على الموبايل ونزّل آخر تحديث من المتجر.',
      },
      {
        id: 49,
        question: 'مش بيوصلي إشعارات.',
        answer: 'اتأكد إن التذكيرات شغالة من الإعدادات > تذكيرات التمرين والمية والأكل. وبعدها ادخل إعدادات الموبايل > التطبيقات > The 4-Week SHRED > الإشعارات واسمح بيها. وعلى أندرويد، اقفل توفير البطارية للتطبيق.',
      },
      {
        id: 50,
        question: 'التطبيق بيقفل لما أفتح الكاميرا.',
        answer: 'دي غالبًا مشكلة صلاحيات. ادخل إعدادات الموبايل واتأكد إن التطبيق عنده صلاحية الكاميرا والصور.',
      },
      {
        id: 51,
        question: 'أكلم الدعم الفني إزاي؟',
        answer: 'لو ملقتش إجابتك هنا، ابعتلنا إيميل على optifitstudio0@gmail.com. غالبًا بنرد في خلال 24 ساعة.',
      },
      {
        id: 52,
        question: 'ينفع أربط التطبيق بـApple Health أو Google Fit؟',
        answer: 'لسه مش متاح، بس على خطتنا. هنبلّغك أول ما يبقى جاهز.',
      },
    ],
  },
];

// النسخة الإنجليزية (نفس الأسئلة والإجابات)
const FAQ_EN = [
  {
    category: '🏋️ Workouts',
    data: [
      { id: 1, question: 'The exercises are too hard for me, what should I do?', answer: 'No worries! Do fewer reps or a shorter time, and increase the rest between exercises from Settings. If you need to, pause the workout and continue when you catch your breath. Your strength will grow over time.' },
      { id: 2, question: 'Do I need equipment (dumbbells)?', answer: 'No, you don\'t need any equipment. Every exercise is bodyweight, and only a few (like dips, step-ups and Bulgarian split squats) need a sturdy chair or couch at home.' },
      { id: 3, question: 'I missed a workout yesterday, should I do two today?', answer: "Please don't double up! Rest is crucial for recovery. Just continue from where you left off. Consistency over time beats overtraining." },
      { id: 4, question: 'How long does each workout take?', answer: 'Most workouts take 30 to 45 minutes, including warm-up and cool-down.' },
      { id: 5, question: 'What if I feel pain during an exercise?', answer: "Stop immediately! There's a difference between muscle burn (good) and sharp pain (bad). Check your form in the video, and if the pain is still there, tap the \"It hurts\" button and pick the area. The app will swap any exercise that stresses it for a safe alternative, in this workout and the rest of your plan. If it continues, see a doctor." },
      { id: 6, question: 'Can I add cardio to this plan?', answer: 'The plan already includes HIIT (High-Intensity Interval Training). Adding light cardio like walking on rest days is perfectly fine.' },
      { id: 7, question: 'What is the best time of day to work out?', answer: 'The best time is the one you can stick to every day. Morning workouts on an empty stomach may help with fat burning, while evening workouts may let you perform better.' },
      { id: 8, question: 'Should I work out if I am sick?', answer: 'Listen to your body. With mild symptoms "above the neck" (like a runny nose), light exercise is okay. With a fever or body aches, rest completely until you recover.' },
      { id: 9, question: 'Why is warming up important?', answer: 'Warming up increases blood flow to your muscles, raises your body temperature, and lowers the risk of injury. Never skip the warm-up at the start of the workout.' },
      { id: 10, question: 'I am very sore from yesterday, should I train?', answer: 'Muscle soreness (DOMS) is normal. Light movement usually helps more than sitting still. If the soreness is severe and you can barely move, take an extra rest day.' },
      { id: 11, question: 'Can I do these workouts at a gym?', answer: 'Absolutely! You can do these exercises anywhere. At the gym, you can use weights instead of bodyweight for extra resistance.' },
      { id: 12, question: 'What is HIIT and why do we use it?', answer: 'HIIT means High-Intensity Interval Training: short bursts of hard effort followed by rest. It is the most efficient way to burn fat while keeping your muscle.' },
      { id: 13, question: 'How do I breathe during exercises?', answer: 'Generally, breathe out during the hard part of the movement (lifting or pushing) and breathe in during the easier part (lowering or returning). Never hold your breath.' },
      { id: 14, question: 'Can I focus only on abs?', answer: 'Spot reduction is a myth. To see your abs, you need to lower your overall body fat with full-body workouts and good nutrition, which is exactly what this plan does.' },
    ],
  },
  {
    category: '🥗 Food & Nutrition',
    data: [
      { id: 15, question: "I don't like a meal or an ingredient, how do I change it?", answer: 'Open the meal and tap the swap button (Pro). You will get another meal of the same type (breakfast, lunch, dinner, snack) with similar calories. Repeat until you find one you like.' },
      { id: 16, question: 'Can I drink coffee or tea?', answer: 'Absolutely! Black coffee and tea are great for your metabolism. Just try to skip the sugar. Stevia or zero-calorie sweeteners are fine.' },
      { id: 17, question: 'Do I need supplements (protein/creatine)?', answer: 'Supplements are optional. The meal plan is designed to hit your protein target with real food. Whey protein is just a convenient option when you are busy or on the go.' },
      { id: 18, question: 'What about cheat meals?', answer: 'We recommend sticking to the plan for the 4 weeks for the best results. If you must, one moderate cheat meal per week is acceptable, but try to stay within your calories.' },
      { id: 19, question: 'I am vegetarian, is this for me?', answer: "There is no full vegetarian plan yet. But you can swap any meal with meat or chicken until you get one that suits you, and get your protein from eggs, dairy, and legumes." },
      { id: 20, question: 'I am still hungry, what can I eat?', answer: 'Drink a big glass of water first. If you are still hungry, eat low-calorie vegetables like cucumber, lettuce, or celery. They are practically zero calories.' },
      { id: 21, question: 'Can I drink soda or juice?', answer: 'Regular soda and packaged juices are full of sugar and "empty calories" that stall fat loss. If you want something cold, go for a diet (zero-calorie) drink, and eat the whole fruit instead of the juice.' },
      { id: 22, question: 'Can I do intermittent fasting?', answer: 'Yes, you can combine the meal plan with intermittent fasting (like 16:8). Just eat all your calories and macros within your eating window and drink plenty of water.' },
      { id: 23, question: 'What should I eat before a workout?', answer: 'Ideally, a light meal with carbs and protein 1 to 2 hours before training. A banana or a slice of toast with peanut butter are great options.' },
      { id: 24, question: 'What should I eat after a workout?', answer: 'Your body needs protein to repair muscle. Try to eat a protein-rich meal or drink a shake within an hour after your workout.' },
      { id: 25, question: 'How much water should I drink?', answer: 'Aim for at least 3 to 4 liters per day. Water is essential for burning fat and keeping your energy up during the challenge. You can track it in the water tracker.' },
      { id: 26, question: 'Is salt bad for me?', answer: 'Sodium is necessary, especially when you sweat during HIIT. But cut down on salty processed food, because it makes your body hold water and causes bloating.' },
      { id: 27, question: 'How do I handle sugar cravings?', answer: 'Cravings usually pass in 20 minutes. Drink water, eat a piece of fruit, or have a diet drink. Eating enough protein also reduces cravings.' },
      { id: 28, question: 'Can I eat at restaurants?', answer: 'Yes, but be careful. Choose grilled protein (chicken or fish) with vegetables on the side, and avoid creamy sauces and fried food.' },
      { id: 29, question: 'Is it okay to eat late at night?', answer: 'Meal timing matters less than your total daily calories. But a heavy meal right before bed might hurt your sleep.' },
    ],
  },
  {
    category: '🔥 How the Program Works',
    data: [
      { id: 30, question: 'What happens after the 4 weeks?', answer: 'You get a completion certificate you can share, then tap "Start round 2" on the Home screen. Each round is 28 days of the same plan, only harder: round 2 is 20% harder, round 3 is 35%, and from round 4 on it is 50% (the top level, so nobody gets hurt), with shorter rest between exercises. Warm-ups and stretches stay the same. Your round counter keeps going for life, every round gets its own certificate, and there are badges for rounds 2, 3, 5, and 10. Your streak, badges, photos, and weight are all kept. New rounds are for Pro members.' },
      { id: 31, question: 'What is the streak 🔥?', answer: 'Your streak is the number of days in a row you finished your workout. Every workout day adds one, and missing a day resets it. Turn on the "Your streak is about to end" reminder so we can nudge you if you have not trained yet.' },
      { id: 32, question: 'What is carb cycling?', answer: "The app changes your carbs based on the day's workout: more carbs on heavy days (HIIT, legs, full body) for energy, and fewer on rest days with slightly more fat. Your weekly average calories stay the same, so your fat loss isn't affected. You'll see your day type and numbers on the Food screen." },
      { id: 33, question: 'Is this program safe for beginners?', answer: 'Yes. Week 1 starts with easy workouts and the difficulty goes up week by week (progressive overload) so your strength grows safely. The activity level you pick at the start is only used to calculate your calories; the workouts are the same for everyone. If something feels too hard, increase the rest time in Settings, try the 7-minute version, or tap "It hurts" to swap the exercise for an easier alternative.' },
      { id: 34, question: 'I am over 50, can I do this?', answer: 'Fitness has no age limit. But we recommend checking with your doctor before starting any high-intensity program, and lowering the intensity and reps to what you can handle.' },
    ],
  },
  {
    category: '📈 Progress & Results',
    data: [
      { id: 35, question: 'The scale is not moving, why?', answer: 'Weight is just one measure. You might be losing fat and building muscle at the same time. Look at your before & after photos and at how your clothes fit instead of the scale. If the scale stalls for a week, the "Plateau detective" on your Progress screen explains why from your own data, and after two weeks it suggests cutting just 100 calories.' },
      { id: 36, question: 'I gained weight in the first week!', answer: "Don't panic. This is usually water your body holds while your muscles repair from the new training. It goes away on its own after a few days." },
      { id: 37, question: 'How often should I weigh myself?', answer: 'We recommend once a week, on the same day and at the same time (in the morning), without clothes, for accurate tracking. Log your weight from the Progress screen.' },
      { id: 38, question: 'How do I take good progress photos?', answer: 'Go to Profile > Before & After. Stand in natural light, wear as little clothing as possible, take photos from the front, side, and back, and use the same spot every time. Photos are saved inside the app on your phone only.' },
      { id: 39, question: 'How long until I see six-pack abs?', answer: 'Visible abs depend on your body fat percentage. Most people start seeing definition within 4 to 8 weeks if they stick to the meal plan.' },
    ],
  },
  {
    category: '💳 Account & Settings',
    data: [
      { id: 40, question: 'How do I cancel my Pro subscription?', answer: 'Subscriptions are managed by the store: on iPhone go to Settings > your name > Subscriptions, and on Android go to Google Play > Profile > Payments & subscriptions. Cancel auto-renewal at least 24 hours before the current period ends.' },
      { id: 53, question: "What's free and what's in Pro?", answer: 'Free: the whole first week, the meal plan with carb cycling, water, weight, reminders, streak, and before & after photos. Pro unlocks weeks 2, 3, and 4, meal swaps, sharing the before & after card, and removes all ads.' },
      { id: 54, question: 'Why are there ads, and how do I remove them?', answer: 'Ads keep the free version free, and they never show up in the middle of a workout. Pro removes all ads for as long as your subscription is active; if it ends, ads come back. Without Pro, you can watch a short ad to swap a meal (3 times a day).' },
      { id: 41, question: 'How do I update my current weight?', answer: 'Log it from the Progress screen (or change it in Profile > Edit profile). As soon as your weight changes, the app recalculates your calories, protein, and water goal automatically.' },
      { id: 42, question: 'How do I restart the challenge?', answer: "Go to Settings > Restart the challenge. This clears your progress, streak, and badges and takes you back to Day 1, but your photos and weight are kept. Careful: this can't be undone." },
      { id: 43, question: 'Can I change my goal?', answer: 'In Profile > Edit profile you can change your target weight. Any change to your weight, height, or age recalculates your calories and protein right away.' },
      { id: 44, question: 'How do I change units (kg/lbs)?', answer: 'Go to Settings > Unit system (kg/cm). Turn it on for metric (kg/cm) or off for imperial (lbs/in).' },
      { id: 45, question: 'Does the app work offline?', answer: 'Yes! The workout videos, recipes, and photos are all inside the app, so you can train and track your food and water with no internet at all.' },
      { id: 46, question: 'Can I use the app on more than one phone?', answer: 'If you create an account, your Pro subscription follows you to any phone (sign in with the same account and tap Restore Purchase if needed). On Android, your progress, weight, and photos are backed up automatically to your Google Drive, so if you reinstall the app or get a new phone with the same Google account, everything comes back. Make sure backup is on in your phone Settings > Google > Backup.' },
      { id: 47, question: 'How do I delete my account?', answer: "We're sad to see you go! Go to Settings > Delete account permanently. This deletes your account and all your data on the phone, and it can't be undone. If you have Pro, cancel it in the store first, because deleting your account doesn't cancel it." },
    ],
  },
  {
    category: '🔧 Technical Support',
    data: [
      { id: 48, question: 'Videos are not playing.', answer: 'Close the app completely and open it again. If the problem continues, make sure you have free storage on your phone and update to the latest version from the store.' },
      { id: 49, question: 'I am not getting notifications.', answer: 'Make sure reminders are on in Settings > Workout, water & meal reminders. Then go to your phone Settings > Apps > The 4-Week SHRED > Notifications and allow them. On Android, also turn off battery optimization for the app.' },
      { id: 50, question: 'The app closes when I open the camera.', answer: 'This is usually a permission issue. Go to your phone settings and make sure the app has permission to use the Camera and Photos.' },
      { id: 51, question: 'How do I contact support?', answer: "If you can't find your answer here, email us at optifitstudio0@gmail.com. We usually reply within 24 hours." },
      { id: 52, question: 'Can I connect the app to Apple Health or Google Fit?', answer: "Not yet, but it's on our roadmap. We'll let you know as soon as it's ready." },
    ],
  },
];

const FAQ = LANG === 'en' ? FAQ_EN : FAQ_DATA;

// البحث: بنوحّد الحروف (أ/إ/آ = ا، ة = ه، ى = ي) ونشيل التشكيل عشان "اكل" تلاقي "أكل"
const normalize = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();

const HelpScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const getFilteredData = () => {
    if (!normalize(searchQuery)) return FAQ;
    return FAQ.map(section => {
      const q = normalize(searchQuery);
      const filteredItems = section.data.filter(item =>
        normalize(item.question).includes(q) ||
        normalize(item.answer).includes(q)
      );
      return { ...section, data: filteredItems };
    }).filter(section => section.data.length > 0);
  };

  return (
    // ✅ Changed View to SafeAreaView to fix overlap issues on Notch phones
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* --- Header --- */}
      <View style={styles.header}>
        {/* Back Button (Left) */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name={require('./rtl').ICON.back} size={28} color="#FFF" />
        </TouchableOpacity>
        
        {/* Title (Center) */}
        <Text style={styles.headerTitle}>{tr('المساعدة والأسئلة الشائعة')}</Text>
        
        {/* Dummy View for Balance (Right) */}
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Subtitle */}
        <Text style={styles.subHeader}>{tr('إحنا معاك لحد ما توصل لهدفك.')}</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={tr('دوّر على مشكلتك...')}
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={LANG === 'en' ? 'left' : 'right'}
          />
        </View>

        {/* FAQ List */}
        {getFilteredData().map((section, index) => (
          <View key={index} style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{section.category}</Text>
            
            {section.data.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <View key={item.id} style={styles.cardWrapper}>
                  <TouchableOpacity
                    style={[styles.itemContainer, isExpanded && styles.itemContainerActive]}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.questionRow}>
                      <Text style={styles.questionText}>{item.question}</Text>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#666" 
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.answerContainer}>
                      <Text style={styles.answerText}>{item.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        {/* Empty State */}
        {getFilteredData().length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={50} color="#333" />
            <Text style={styles.noResultText}>{tr('مفيش نتايج.')}</Text>
          </View>
        )}

        <View style={{ height: 40 }} /> 
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
    // SafeAreaView handles the top padding automatically now
  },
  header: { 
    // ✅ Adjusted padding for cleaner look with SafeAreaView
    paddingTop: Platform.OS === 'android' ? 40 : 10, 
    paddingHorizontal: 20, 
    paddingBottom: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: BG_COLOR,
    zIndex: 10, // ✅ Ensure header stays on top
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#FFF',
    textAlign: 'center',
  },
  iconBtn: { 
    width: 40, 
    alignItems: 'flex-start', 
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10, // ✅ Added top padding to prevent subtitle overlapping with header
  },
  subHeader: {
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
    marginBottom: 20,
    // ✅ Removed negative marginTop which was causing the issue
    marginTop: 0, 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_COLOR,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#333',
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    color: MAIN_COLOR,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left', // في RTL الـleft بيتقلب لوحده لليمين (شوف rtl.js)
    marginLeft: 5,
  },
  cardWrapper: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: CARD_COLOR,
  },
  itemContainer: {
    padding: 15,
    backgroundColor: CARD_COLOR,
  },
  itemContainerActive: {
    backgroundColor: '#252525', 
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', 
  },
  questionText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '600',
    flex: 1,
    textAlign: 'left', // في RTL الـleft بيتقلب لوحده لليمين (شوف rtl.js)
    marginRight: 10,
  },
  answerContainer: {
    backgroundColor: '#222',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  answerText: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 22,
    textAlign: 'left', // في RTL الـleft بيتقلب لوحده لليمين (شوف rtl.js)
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  noResultText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
});

export default HelpScreen;
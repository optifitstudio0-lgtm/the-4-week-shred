import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, Image, Alert, Animated, Easing, BackHandler, Modal, Pressable, PanResponder, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from '@react-navigation/native';

import { WORKOUT_PLAN, EXERCISE_LIBRARY } from './exercisesdata';
import { getWorkoutPrefs, markDayComplete, markMiniWorkout, getCompletedDays, getStreak, getRound } from './progressstore';
import { scaleForRound, restForRound, roundLabel } from './rounds';
import { adaptForPain, getPainAreas, savePainAreas, painLabel, buildMini, estimateMinutes } from './pain';
import { getCycleInfo, isLightOverridden, overrideLightToday, softenForCycle } from './cycle';
import PainSheet from './painsheet';
import { refreshStreakSaver } from './notifications';
import { tick, say, prepareVoice, setVoiceEnabled, stopVoice } from './voice';
import { ICON, isRTL } from './rtl';
import { daysLabel } from './dates';
import { getIsPro, isDayPro } from './pro';
import { prepareInterstitial, showInterstitial } from './ads';
import { tr } from './i18n';

const MAIN_COLOR = '#2ECC71';
const REST_COLOR = '#3498DB';

// ================= فيديو التمرين (لوب، من غير صوت) =================
// - الفيديو بيتعرض كامل (contain) من غير قص، عشان التمرين يبان كله والجودة متبوظش من التكبير
// - الأزرار فوق الفيديو مش عليه
// - دوسة على الفيديو = شاشة كاملة بالعرض + تكبير بصباعين (دوستين = يرجع زي ما كان)
const VIDEO_BG = '#FDFDFD'; // نفس خلفية الفيديوهات عشان الحواف متبانش

const usePlayer = (source, paused) => {
  const player = useVideoPlayer(source || null, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  useEffect(() => {
    if (!source) return;
    paused ? player.pause() : player.play();
  }, [paused]);
  return player;
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const dist = (t) => {
  const [a, b] = t;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
};

const FullscreenVideo = ({ exercise, onClose }) => {
  const { width: W, height: H } = useWindowDimensions();
  const [landscape, setLandscape] = useState(true);
  const player = usePlayer(exercise.video, false);

  const scale = useRef(new Animated.Value(1)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const g = useRef({ scale: 1, x: 0, y: 0, startDist: 0, startScale: 1, lastTap: 0 }).current;

  const reset = () => {
    g.scale = 1; g.x = 0; g.y = 0;
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(tx, { toValue: 0, useNativeDriver: true }),
      Animated.spring(ty, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const now = Date.now();
          if (now - g.lastTap < 280) reset();
          g.lastTap = now;
          g.startDist = 0;
        },
        onPanResponderMove: (e, gs) => {
          const t = e.nativeEvent.touches;
          if (t.length >= 2) {
            const d = dist(t);
            if (!g.startDist) { g.startDist = d; g.startScale = g.scale; return; }
            const next = clamp((g.startScale * d) / g.startDist, 1, 4);
            scale.setValue(next);
            g.liveScale = next;
          } else if (g.scale > 1 && !g.startDist) {
            // سحب بصباع واحد لما يكون متكبّر (اتجاه السحب بيتظبط لو الشاشة بالعرض)
            const dx = landscape ? gs.dy : gs.dx;
            const dy = landscape ? -gs.dx : gs.dy;
            tx.setValue(g.x + dx / g.scale);
            ty.setValue(g.y + dy / g.scale);
          }
        },
        onPanResponderRelease: (e, gs) => {
          if (g.startDist) {
            g.scale = g.liveScale || g.scale;
            if (g.scale <= 1.02) reset();
          } else if (g.scale > 1) {
            const dx = landscape ? gs.dy : gs.dx;
            const dy = landscape ? -gs.dx : gs.dy;
            g.x += dx / g.scale;
            g.y += dy / g.scale;
          }
          g.startDist = 0;
        },
      }),
    [landscape]
  );

  const boxW = landscape ? H : W;
  const boxH = landscape ? W : H;
  const frame = {
    position: 'absolute',
    width: boxW,
    height: boxH,
    left: (W - boxW) / 2,
    top: (H - boxH) / 2,
    transform: landscape ? [{ rotate: '90deg' }] : [],
  };

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent supportedOrientations={['portrait', 'landscape']}>
      <StatusBar hidden />
      <View style={{ flex: 1, backgroundColor: VIDEO_BG }}>
        <View style={[frame, { overflow: 'hidden' }]} {...responder.panHandlers}>
          <Animated.View style={{ flex: 1, transform: [{ scale }, { translateX: tx }, { translateY: ty }] }} pointerEvents="none">
            <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
          </Animated.View>
        </View>
        <View style={styles.fsBar} pointerEvents="box-none">
          <TouchableOpacity style={styles.roundIcon} onPress={onClose} accessibilityLabel={tr('قفل')}>
            <Ionicons name="close" size={26} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundIcon} onPress={() => { reset(); setLandscape((v) => !v); }}>
            <Ionicons name="phone-landscape-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundIcon} onPress={reset}>
            <Ionicons name="contract-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.fsHint} pointerEvents="none">{tr('كبّر بصباعين، ودوستين عشان يرجع')}</Text>
      </View>
    </Modal>
  );
};

const ExerciseMedia = ({ exercise, paused, style, children }) => {
  const [failed, setFailed] = useState(false);
  const [full, setFull] = useState(false);
  const player = usePlayer(exercise.video, paused || full);

  useEffect(() => {
    if (!exercise.video) return;
    const sub = player.addListener('statusChange', (payload) => {
      const status = typeof payload === 'string' ? payload : payload?.status;
      if (status === 'error') setFailed(true);
    });
    return () => sub.remove();
  }, [player]);

  if (!exercise.video || failed) {
    return (
      <ImageBackground source={exercise.image} style={style} imageStyle={{ opacity: 0.8 }}>
        {children}
      </ImageBackground>
    );
  }
  return (
    <View style={[style, { backgroundColor: VIDEO_BG }]}>
      {children}
      <Pressable style={styles.videoArea} onPress={() => setFull(true)}>
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
        <View style={styles.expandBtn} pointerEvents="none">
          <Ionicons name="expand" size={20} color="#FFF" />
        </View>
      </Pressable>
      {full && <FullscreenVideo exercise={exercise} onClose={() => setFull(false)} />}
    </View>
  );
};

const formatClock = (seconds) => {
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// رقم العد التنازلي الكبير بنبضة مع كل ثانية
const PulseNumber = ({ value, color, size = 96 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    scale.setValue(1.25);
    Animated.timing(scale, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [value]);
  return (
    <Animated.Text style={[styles.pulseNumber, { color, fontSize: size, transform: [{ scale }] }]}>
      {value}
    </Animated.Text>
  );
};

const WorkoutScreen = ({ route, navigation }) => {
  const { dayId } = route.params || { dayId: 1 };
  const currentPlan = WORKOUT_PLAN[dayId] || WORKOUT_PLAN[1];
  // الجولة 2 وبعدها: نفس الخطة بس أصعب (rounds.js)
  const [round, setRound] = useState(1);

  const baseList = useMemo(
    () =>
      scaleForRound(
        currentPlan.exercises
          .map((item) => {
            const libData = EXERCISE_LIBRARY[item.id];
            if (!libData) return null;
            return { ...libData, ...item };
          })
          .filter(Boolean),
        round
      ),
    [dayId, round]
  );

  // phase: overview | ready | exercise | rest | done
  const [phase, setPhase] = useState('overview');
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [phaseTotal, setPhaseTotal] = useState(1);
  const [paused, setPaused] = useState(false);
  const [prefs, setPrefs] = useState({ voice: true, restSec: 20, getReadySec: 5 });
  const [voiceOn, setVoiceOn] = useState(true);
  const [result, setResult] = useState(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [painAreas, setPainAreas] = useState([]);
  const [painSheet, setPainSheet] = useState(false);
  const [mode, setMode] = useState('full'); // full | mini (يوم "أقل حاجة")
  const [cycle, setCycle] = useState(null);
  const [cycleNormal, setCycleNormal] = useState(false);
  const [trainedToday, setTrainedToday] = useState(false);

  // الدورة: أيام الدورة وقبلها التمرين أخف 25% والراحة +10 ث (إلا لو قالت "أنا كويسة")
  const cycleLight = !!cycle?.light && !cycleNormal && !currentPlan.isRest;
  const roundRest = restForRound(prefs.restSec, round);
  const restSec = roundRest > 0 && cycleLight ? roundRest + 10 : roundRest;
  const buildList = (areas, m) => {
    let l = adaptForPain(baseList, areas);
    if (cycleLight) l = softenForCycle(l);
    if (m === 'mini') l = buildMini(l, restSec);
    return l;
  };
  const exercisesList = useMemo(() => buildList(painAreas, mode), [baseList, painAreas, mode, cycleLight, restSec]);
  const canMini = !currentPlan.isRest && baseList.length >= 4 && !alreadyDone && !trainedToday;

  const current = exercisesList[index];
  const nextEx = exercisesList[index + 1];
  const isLast = index === exercisesList.length - 1;
  const isCounting = phase === 'ready' || phase === 'rest' || (phase === 'exercise' && current?.type === 'time');

  useEffect(() => {
    (async () => {
      // الأسابيع 2-4 (والجولة 2 وبعدها كلها) لبرو بس
      const r = await getRound();
      setRound(r);
      if (isDayPro(dayId, r) && !(await getIsPro())) {
        navigation.replace('Subscription', { reason: 'weeks' });
        return;
      }
      const p = await getWorkoutPrefs();
      setPrefs(p);
      setVoiceOn(p.voice);
      setVoiceEnabled(p.voice);
      prepareVoice();
      const done = await getCompletedDays();
      setAlreadyDone(!!done[dayId]);
      setPainAreas(await getPainAreas());
      setCycle(await getCycleInfo());
      setCycleNormal(await isLightOverridden());
      setTrainedToday((await getStreak()).trainedToday);
    })();
    return () => stopVoice();
  }, []);

  // زرار الرجوع في أندرويد أثناء التمرين = تأكيد الخروج
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (phase === 'ready' || phase === 'exercise' || phase === 'rest') {
          confirmQuit();
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [phase])
  );

  const startPhase = (name, seconds) => {
    setPhase(name);
    setRemaining(seconds);
    setPhaseTotal(Math.max(seconds, 1));
    setPaused(false);
  };

  // ================= ساعة التمرين (تيك كل ثانية) =================
  useEffect(() => {
    if (!isCounting || paused) return;
    if (remaining <= 0) {
      onPhaseEnd();
      return;
    }
    const t = setTimeout(() => {
      const next = remaining - 1;
      if (next >= 1 && next <= 3) tick(next); // 3، 2، 1 بالصوت
      setRemaining(next);
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, remaining, paused, index]);

  const beginExercise = (i) => {
    const ex = exercisesList[i];
    setIndex(i);
    tick('go');
    startPhase('exercise', ex.type === 'time' ? ex.durationSec || 0 : 0);
  };

  const onPhaseEnd = () => {
    if (phase === 'ready') beginExercise(index);
    else if (phase === 'exercise') goNext();
    else if (phase === 'rest') beginExercise(index + 1);
  };

  // بعد كل تمرين: راحة (لو مش آخر تمرين)
  const goNext = () => {
    if (isLast) {
      finishWorkout();
      return;
    }
    if (restSec > 0 && current.id !== 'rest') {
      say('rest');
      startPhase('rest', restSec);
    } else {
      beginExercise(index + 1);
    }
  };

  const handleStartWorkout = () => {
    setIndex(0);
    say('ready');
    startPhase('ready', prefs.getReadySec || 5);
  };

  // الإعلان الكامل بيتجهّز من بدري، وبيظهر بس لما المستخدم يسيب شاشة النهاية (مش في نص التمرين أبدًا)
  useEffect(() => {
    prepareInterstitial();
  }, []);
  const leavingRef = useRef(false);
  const leaveDone = async (go) => {
    if (leavingRef.current) return; // ضغطتين ورا بعض
    leavingRef.current = true;
    if (!result?.justFinishedChallenge) await showInterstitial(); // لحظة الشهادة من غير إعلان
    go();
  };

  const finishWorkout = async () => {
    setPhase('done');
    say('done');
    try {
      const res = mode === 'mini' ? await markMiniWorkout() : await markDayComplete(dayId);
      setResult(res);
      refreshStreakSaver({ trainedToday: true, streak: res.stats.streak });
    } catch (e) {
      console.log('finish error', e);
      setResult({ newBadges: [], stats: { streak: 0 } });
    }
  };

  const confirmQuit = () => {
    setPaused(true);
    Alert.alert(tr('توقف التمرين؟'), tr('التقدم في التمرين ده مش هيتحفظ.'), [
      { text: tr('كمّل'), style: 'cancel', onPress: () => setPaused(false) },
      { text: tr('اخرج'), style: 'destructive', onPress: () => { stopVoice(); setPhase('overview'); setIndex(0); } },
    ]);
  };

  // ================= زرار "بيوجعني" =================
  const openPain = () => {
    if (phase === 'exercise' || phase === 'rest') setPaused(true);
    setPainSheet(true);
  };
  const closePain = () => {
    setPainSheet(false);
    setPaused(false);
  };
  const onPainSave = async (areas) => {
    setPainSheet(false);
    await savePainAreas(areas);
    setPainAreas(areas);
    // لو في نص تمرين: التمرين الحالي بيتبدّل على طول ويبدأ من الأول
    if (phase === 'exercise') {
      const ex = buildList(areas, mode)[index];
      if (ex) startPhase('exercise', ex.type === 'time' ? ex.durationSec || 0 : 0);
    } else {
      setPaused(false);
    }
  };
  const clearPain = async () => {
    await savePainAreas([]);
    setPainAreas([]);
  };
  const keepNormalToday = async () => {
    await overrideLightToday();
    setCycleNormal(true);
  };

  const toggleVoice = () => {
    const v = !voiceOn;
    setVoiceOn(v);
    setVoiceEnabled(v);
  };

  const exLabel = (ex) => (ex.type === 'time' ? tr('{0} ث', ex.durationSec) : ex.duration);

  // ================= شاشة النهاية =================
  if (phase === 'done') {
    const stats = result?.stats || {};
    const badges = result?.newBadges || [];
    const finishedAll = result?.justFinishedChallenge;
    const isMini = !!result?.mini;
    return (
      <View style={styles.doneContainer}>
        <StatusBar style="light" />
        <LinearGradient colors={['rgba(46,204,113,0.35)', 'transparent']} style={styles.doneGlow} pointerEvents="none" />
        <ScrollView contentContainerStyle={styles.doneContent} showsVerticalScrollIndicator={false}>
          <View style={styles.trophyCircle}>
            <Ionicons name={finishedAll ? 'ribbon' : 'trophy'} size={64} color="#FFD700" />
          </View>
          <Text style={styles.doneTitle}>{finishedAll ? (result?.round > 1 ? tr('خلّصت الجولة {0}! 🏆', result.round) : tr('خلّصت الـ4 أسابيع! 🏆')) : isMini ? tr('الستريك اتحفظ 🔥') : tr('برافو يا بطل! 💪')}</Text>
          <Text style={styles.doneSub}>
            {finishedAll
              ? tr('شهادتك جاهزة وتستاهل تتشيّر. والجولة الجاية مستنياك من الرئيسية، أصعب شوية 🔥')
              : isMini
              ? tr('اليوم {0} لسه مفتوح في خطتك. كمّله كامل لما تقدر.', dayId)
              : tr('خلّصت تمرين اليوم {0}: {1}', dayId, currentPlan.title)}
          </Text>

          <View style={styles.doneStatsRow}>
            <View style={styles.doneStat}>
              <Ionicons name="flame" size={26} color="#E74C3C" />
              <Text style={styles.doneStatValue}>{stats.streak || 1}</Text>
              <Text style={styles.doneStatLabel}>{tr('أيام ستريك')}</Text>
            </View>
            <View style={styles.doneStat}>
              <Ionicons name="checkmark-done" size={26} color={MAIN_COLOR} />
              <Text style={styles.doneStatValue}>{stats.completedCount || 1}/28</Text>
              <Text style={styles.doneStatLabel}>{tr('يوم مكتمل')}</Text>
            </View>
            <View style={styles.doneStat}>
              <Ionicons name="barbell" size={26} color={REST_COLOR} />
              <Text style={styles.doneStatValue}>{exercisesList.length}</Text>
              <Text style={styles.doneStatLabel}>{tr('تمرين')}</Text>
            </View>
          </View>

          {stats.streak > 1 && <Text style={styles.streakLine}>{tr('🔥 ستريك ')}{daysLabel(stats.streak)}{tr(' ورا بعض. متكسروش بكرة!')}</Text>}

          {badges.length > 0 && (
            <View style={styles.newBadgesBox}>
              <Text style={styles.newBadgesTitle}>{tr('بادچ جديدة اتفتحت 🎉')}</Text>
              {badges.map((b) => (
                <View key={b.id} style={styles.newBadgeRow}>
                  <View style={[styles.newBadgeIcon, { backgroundColor: b.color }]}>
                    <Ionicons name={b.icon} size={20} color="#000" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.newBadgeName}>{b.title}</Text>
                    <Text style={styles.newBadgeDesc}>{b.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => leaveDone(() => navigation.replace('Achievements', finishedAll ? { showCertificate: true } : {}))}
          >
            <Ionicons name={finishedAll ? 'ribbon' : 'medal'} size={22} color="#000" />
            <Text style={styles.primaryBtnText}>{finishedAll ? tr('شوف شهادتك وشيّرها') : tr('شوف إنجازاتك')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => leaveDone(() => navigation.goBack())}>
            <Text style={styles.ghostBtnText}>{tr('رجوع للرئيسية')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ================= استعد (5 ثواني قبل أول تمرين) =================
  if (phase === 'ready') {
    return (
      <View style={styles.readyContainer}>
        <StatusBar style="light" />
        <ImageBackground source={current.image} style={StyleSheet.absoluteFill} imageStyle={{ opacity: 0.25 }} />
        <TouchableOpacity style={styles.topClose} onPress={confirmQuit}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.readyLabel}>{tr('استعد')}</Text>
        <PulseNumber value={remaining} color={MAIN_COLOR} size={140} />
        <Text style={styles.readyFirst}>{tr('أول تمرين: ')}{current.name}</Text>
        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 40, paddingHorizontal: 40 }]} onPress={() => beginExercise(0)}>
          <Text style={styles.primaryBtnText}>{tr('يلا دلوقتي')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ================= الراحة بين التمارين =================
  if (phase === 'rest' && nextEx) {
    const pct = (remaining / phaseTotal) * 100;
    return (
      <View style={styles.restContainer}>
        <StatusBar style="light" />
        <View style={styles.restTopBar}>
          <TouchableOpacity onPress={toggleVoice} style={styles.roundIcon}>
            <Ionicons name={voiceOn ? 'volume-high' : 'volume-mute'} size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.restProgress}>{index + 1} / {exercisesList.length}</Text>
          <TouchableOpacity onPress={confirmQuit} style={styles.roundIcon}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.restCenter}>
          <Text style={styles.restLabel}>{tr('راحة')}</Text>
          <PulseNumber value={remaining} color={remaining <= 3 ? '#F1C40F' : REST_COLOR} size={120} />
          <View style={styles.restTrack}>
            <View style={[styles.restFill, { width: `${pct}%` }]} />
          </View>

          <View style={styles.restButtons}>
            <TouchableOpacity style={styles.restBtn} onPress={() => { setRemaining((r) => r + 10); setPhaseTotal((t) => t + 10); }}>
              <Text style={styles.restBtnText}>{tr('+10 ث')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.restBtn} onPress={() => setPaused((p) => !p)}>
              <Ionicons name={paused ? 'play' : 'pause'} size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.restBtn, styles.restSkip]} onPress={() => beginExercise(index + 1)}>
              <Text style={[styles.restBtnText, { color: '#000' }]}>{tr('تخطّي')}</Text>
              <Ionicons name="play-skip-forward" size={18} color="#000" style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.nextCard}>
          <Image source={nextEx.image} style={styles.nextImage} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nextLabel}>{tr('التمرين الجاي')}</Text>
            <Text style={styles.nextName} numberOfLines={1}>{nextEx.name}</Text>
            <Text style={styles.nextMeta}>{exLabel(nextEx)}</Text>
          </View>
        </View>
      </View>
    );
  }

  // ================= التمرين شغال =================
  if (phase === 'exercise' && current) {
    const progressPercent = ((index + 1) / exercisesList.length) * 100;
    const isTime = current.type === 'time';
    return (
      <View style={styles.activeContainer}>
        <StatusBar style="light" />
        <ExerciseMedia key={`${current.id}-${index}`} exercise={current} paused={paused} style={styles.activeImage}>
          <View style={styles.mediaTopRow}>
            <TouchableOpacity style={styles.roundIcon} onPress={toggleVoice}>
              <Ionicons name={voiceOn ? 'volume-high' : 'volume-mute'} size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.painPill} onPress={openPain}>
              <Ionicons name="bandage" size={18} color="#FFF" />
              <Text style={styles.painPillText}>{tr('بيوجعني')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roundIcon} onPress={confirmQuit}>
              <Ionicons name="close" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>
        </ExerciseMedia>

        <View style={styles.activeControls}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.activeTitle}>{current.name}</Text>
            {!!current.swappedFrom && <Text style={styles.swapNote}>{tr('بديل آمن لـ {0}', current.swappedFrom)}</Text>}
          </View>
          {isTime ? (
            <Text style={[styles.activeTimer, remaining <= 3 && { color: '#F1C40F' }]}>{formatClock(remaining)}</Text>
          ) : (
            <Text style={styles.activeTimer}>{current.duration}</Text>
          )}
          <Text style={styles.timerLabel}>{isTime ? tr('الوقت الفاضل') : tr('العدّات')}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>{index + 1} / {exercisesList.length}</Text>
          </View>

          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={[styles.controlBtnSmall, { opacity: isTime ? 1 : 0.4 }]}
              onPress={() => setPaused((p) => !p)}
              disabled={!isTime}
            >
              <Ionicons name={paused ? 'play' : 'pause'} size={28} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
              <Text style={styles.nextBtnText}>{isLast ? tr('إنهاء') : isTime ? tr('التالي') : tr('خلّصت')}</Text>
              <Ionicons name={isLast ? 'checkmark' : ICON.next} size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
        <PainSheet visible={painSheet} initial={painAreas} onClose={closePain} onSave={onPainSave} />
      </View>
    );
  }

  // ================= صفحة تفاصيل اليوم =================
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name={ICON.back} size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr('تفاصيل التمرين')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.coverContainer}>
          <Image source={exercisesList[Math.min(2, exercisesList.length - 1)]?.image} style={styles.coverImage} />
          <View style={styles.coverOverlay}>
            <TouchableOpacity style={styles.playButtonMain} onPress={handleStartWorkout}>
              <Ionicons name="play" size={32} color="#000" />
            </TouchableOpacity>
            <Text style={styles.startText}>{mode === 'mini' ? tr('ابدأ نسخة الـ7 دقايق') : alreadyDone ? tr('عيد التمرين') : tr('ابدأ التمرين')}</Text>
          </View>
        </View>

        <View style={styles.contentPadding}>
          <View style={styles.headerInfo}>
            <View style={styles.badgeRow}>
              <Text style={styles.dayBadge}>{tr('اليوم ')}{dayId}</Text>
              {alreadyDone && (
                <View style={styles.doneChip}>
                  <Ionicons name="checkmark-circle" size={14} color="#000" />
                  <Text style={styles.doneChipText}>{tr('مكتمل')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.mainTitle}>{currentPlan.title}</Text>
            <Text style={styles.subTitle}>
              {round > 1 ? `${roundLabel(round)} • ` : ''}{currentPlan.level} • {exercisesList.length}{tr(' تمارين • ')}{mode === 'mini' ? tr('{0} دقيقة', estimateMinutes(exercisesList, restSec)) : currentPlan.duration}
            </Text>
          </View>

          <View style={styles.restInfo}>
            <Ionicons name="timer-outline" size={18} color={REST_COLOR} />
            <Text style={styles.restInfoText}>
              {tr('راحة ')}{restSec}{tr(' ث بين التمارين • العد بالصوت ')}{prefs.voice ? tr('شغال') : tr('مقفول')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Setting')}>
              <Text style={styles.restInfoLink}>{tr('تغيير')}</Text>
            </TouchableOpacity>
          </View>

          {!!cycle && !currentPlan.isRest && (
            <View style={[styles.infoCard, { borderColor: cycle.color + '55' }]}>
              <View style={styles.infoHead}>
                <Ionicons name={cycle.icon} size={18} color={cycle.color} />
                <Text style={[styles.infoTitle, { color: cycle.color }]}>{tr('{0} • اليوم {1} من دورتك', cycle.label, cycle.day)}</Text>
              </View>
              <Text style={styles.infoText}>{cycleLight ? tr('التمرين النهارده أخف 25% وراحته أطول 10 ثواني.') : cycle.hint}</Text>
              {cycleLight && (
                <TouchableOpacity onPress={keepNormalToday}>
                  <Text style={styles.infoLink}>{tr('أنا كويسة، عايزاه عادي')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {painAreas.length > 0 && !currentPlan.isRest && (
            <View style={[styles.infoCard, { borderColor: 'rgba(255,107,129,0.35)' }]}>
              <View style={styles.infoHead}>
                <Ionicons name="bandage" size={18} color="#FF6B81" />
                <Text style={[styles.infoTitle, { color: '#FF6B81' }]}>{tr('التمارين متظبطة عشان: {0}', painLabel(painAreas))}</Text>
              </View>
              <Text style={styles.infoText}>{tr('أي تمرين بيضغط على المكان ده اتبدّل ببديل آمن.')}</Text>
              <View style={styles.infoActions}>
                <TouchableOpacity onPress={clearPain}><Text style={styles.infoLink}>{tr('خف خلاص')}</Text></TouchableOpacity>
                <TouchableOpacity onPress={openPain}><Text style={styles.infoLink}>{tr('تعديل')}</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {!currentPlan.isRest && (
            <View style={styles.toolsRow}>
              {painAreas.length === 0 && (
                <TouchableOpacity style={styles.toolBtn} onPress={openPain}>
                  <Ionicons name="bandage" size={18} color="#FF6B81" />
                  <Text style={styles.toolText}>{tr('حاجة بتوجعك؟')}</Text>
                </TouchableOpacity>
              )}
              {canMini && (
                <TouchableOpacity style={[styles.toolBtn, mode === 'mini' && styles.toolBtnOn]} onPress={() => setMode(mode === 'mini' ? 'full' : 'mini')}>
                  <Ionicons name={mode === 'mini' ? 'arrow-undo' : 'flash'} size={18} color={mode === 'mini' ? '#000' : '#F1C40F'} />
                  <Text style={[styles.toolText, mode === 'mini' && { color: '#000' }]}>{mode === 'mini' ? tr('رجّع التمرين الكامل') : tr('تعبان؟ نسخة 7 دقايق')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {mode === 'mini' && (
            <Text style={styles.miniNote}>{tr('النسخة دي بتحسب في الستريك، واليوم بيفضل مفتوح في خطتك تكمّله كامل لما تقدر.')}</Text>
          )}

          <View style={styles.divider} />
          <Text style={styles.sectionHeader}>{tr('دايرة التمرين')}</Text>

          {exercisesList.map((exercise, i) => (
            <View key={i} style={styles.exerciseCard}>
              <Image source={exercise.image} style={styles.exerciseThumb} resizeMode="cover" />
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseReps}>{exercise.type === 'time' ? formatClock(exercise.durationSec) : exercise.duration}</Text>
                {!!exercise.swappedFrom && <Text style={styles.swapSmall}>{tr('بدل {0}', exercise.swappedFrom)}</Text>}
              </View>
              <View style={styles.playIconSmall}>
                <Ionicons name={exercise.type === 'time' ? 'time-outline' : 'barbell-outline'} size={18} color={MAIN_COLOR} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <PainSheet visible={painSheet} initial={painAreas} onClose={closePain} onSave={onPainSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 30, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', textAlign: 'center', flex: 1 },
  backBtn: { width: 40, alignItems: 'flex-start' },

  coverContainer: { width: '100%', height: 250 },
  coverImage: { width: '100%', height: '100%', opacity: 0.7 },
  coverOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  playButtonMain: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 10 },
  startText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 },

  contentPadding: { padding: 20 },
  headerInfo: { marginBottom: 16 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  dayBadge: { color: MAIN_COLOR, fontSize: 14, fontWeight: 'bold' },
  doneChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: MAIN_COLOR, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 10, gap: 4 },
  doneChipText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 5, textAlign: 'left' },
  subTitle: { fontSize: 14, color: '#AAA', textAlign: 'left' },
  restInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(52,152,219,0.1)', borderRadius: 12, padding: 12, marginBottom: 20, gap: 8 },
  restInfoText: { color: '#BBB', fontSize: 13, flex: 1, textAlign: 'left' },
  restInfoLink: { color: REST_COLOR, fontWeight: 'bold', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#222', marginBottom: 20 },
  sectionHeader: { fontSize: 18, color: '#FFF', fontWeight: 'bold', marginBottom: 15, textAlign: 'left' },
  exerciseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#151515', padding: 10, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  exerciseThumb: { width: 70, height: 70, borderRadius: 15, marginRight: 15, backgroundColor: '#333' },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 6, textAlign: 'left' },
  exerciseReps: { fontSize: 13, color: '#888', fontWeight: '600', textAlign: 'left' },
  playIconSmall: { width: 35, height: 35, borderRadius: 18, backgroundColor: 'rgba(46, 204, 113, 0.1)', justifyContent: 'center', alignItems: 'center' },

  // --- التمرين شغال ---
  activeContainer: { flex: 1, backgroundColor: '#000' },
  activeImage: { width: '100%', height: '55%', justifyContent: 'flex-start' },
  imageGradient: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
  mediaTopRow: { marginTop: 48, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  videoArea: { flex: 1, marginTop: 8, marginBottom: 44 },
  expandBtn: { position: 'absolute', bottom: 8, right: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  fsBar: { position: 'absolute', top: 44, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  fsHint: { position: 'absolute', bottom: 28, alignSelf: 'center', color: '#666', fontSize: 13, backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
  roundIcon: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  activeControls: { flex: 1, backgroundColor: '#111', borderTopLeftRadius: 35, borderTopRightRadius: 35, marginTop: -40, paddingHorizontal: 30, paddingVertical: 36, alignItems: 'center', justifyContent: 'space-between' },
  activeTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  activeTimer: { fontSize: 70, fontWeight: 'bold', color: MAIN_COLOR, marginVertical: 6 },
  timerLabel: { fontSize: 14, color: '#666' },
  progressContainer: { width: '100%', alignItems: 'center', marginVertical: 16 },
  progressBar: { width: '100%', height: 8, backgroundColor: '#333', borderRadius: 4, marginBottom: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: MAIN_COLOR, borderRadius: 4 },
  progressText: { color: '#888', fontSize: 14, fontWeight: '600' },
  controlButtons: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between', marginBottom: 10 },
  controlBtnSmall: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  nextBtn: { flex: 1, backgroundColor: MAIN_COLOR, height: 60, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginLeft: 20, gap: 10 },
  nextBtnText: { color: '#000', fontWeight: 'bold', fontSize: 18 },

  pulseNumber: { fontWeight: '900', textAlign: 'center' },

  // --- بيوجعني / أقل حاجة / الدورة ---
  painPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,107,129,0.85)', borderRadius: 22, height: 44, paddingHorizontal: 16 },
  painPillText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  swapNote: { color: '#FF8FA0', fontSize: 13, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  swapSmall: { color: '#FF8FA0', fontSize: 12, marginTop: 3, textAlign: 'left' },
  infoCard: { backgroundColor: '#121212', borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1 },
  infoHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTitle: { fontSize: 14, fontWeight: 'bold', flex: 1, textAlign: 'left' },
  infoText: { color: '#BBB', fontSize: 13, marginTop: 6, lineHeight: 19, textAlign: 'left' },
  infoActions: { flexDirection: 'row', gap: 18 },
  infoLink: { color: '#2ECC71', fontWeight: 'bold', fontSize: 13, marginTop: 8, textAlign: 'left' },
  toolsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  toolBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#161616', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  toolBtnOn: { backgroundColor: '#F1C40F', borderColor: '#F1C40F' },
  toolText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, flexShrink: 1 },
  miniNote: { color: '#C9B458', fontSize: 12, marginBottom: 12, textAlign: 'left' },

  // --- استعد ---
  readyContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 30 },
  topClose: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 22, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  readyLabel: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  readyFirst: { color: '#BBB', fontSize: 16, marginTop: 10, textAlign: 'center' },

  // --- الراحة ---
  restContainer: { flex: 1, backgroundColor: '#05121C', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 30 },
  restTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restProgress: { color: '#7FB3D5', fontWeight: 'bold', fontSize: 15 },
  restCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  restLabel: { color: '#FFF', fontSize: 30, fontWeight: 'bold', marginBottom: -6 },
  restTrack: { width: '80%', height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginTop: 10 },
  restFill: { height: '100%', backgroundColor: REST_COLOR, borderRadius: 4 },
  restButtons: { flexDirection: 'row', gap: 12, marginTop: 30 },
  restBtn: { height: 50, minWidth: 70, paddingHorizontal: 18, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  restSkip: { backgroundColor: MAIN_COLOR },
  restBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  nextCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 12, gap: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  nextImage: { width: 76, height: 76, borderRadius: 14, backgroundColor: '#222' },
  nextLabel: { color: '#7FB3D5', fontSize: 13, fontWeight: 'bold', textAlign: 'left' },
  nextName: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 2, textAlign: 'left' },
  nextMeta: { color: '#AAA', fontSize: 14, marginTop: 2, textAlign: 'left' },

  // --- النهاية ---
  doneContainer: { flex: 1, backgroundColor: '#000' },
  doneGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },
  doneContent: { paddingTop: 80, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },
  trophyCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,215,0,0.12)', borderWidth: 2, borderColor: 'rgba(255,215,0,0.4)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  doneTitle: { color: '#FFF', fontSize: 30, fontWeight: '900', textAlign: 'center' },
  doneSub: { color: '#AAA', fontSize: 16, marginTop: 8, textAlign: 'center' },
  doneStatsRow: { flexDirection: 'row', gap: 10, marginTop: 28, width: '100%' },
  doneStat: { flex: 1, backgroundColor: '#141414', borderRadius: 18, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  doneStatValue: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginTop: 6 },
  doneStatLabel: { color: '#888', fontSize: 12, marginTop: 2 },
  streakLine: { color: '#F5B041', fontSize: 15, fontWeight: '600', marginTop: 18, textAlign: 'center' },
  newBadgesBox: { width: '100%', backgroundColor: '#111', borderRadius: 20, padding: 16, marginTop: 22, borderWidth: 1, borderColor: '#2A2A2A' },
  newBadgesTitle: { color: '#FFF', fontSize: 17, fontWeight: 'bold', marginBottom: 12, textAlign: 'left' },
  newBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  newBadgeIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  newBadgeName: { color: '#FFF', fontWeight: 'bold', fontSize: 15, textAlign: 'left' },
  newBadgeDesc: { color: '#888', fontSize: 13, textAlign: 'left' },
  primaryBtn: { backgroundColor: MAIN_COLOR, height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, alignSelf: 'stretch', marginTop: 28 },
  primaryBtnText: { color: '#000', fontWeight: 'bold', fontSize: 17 },
  ghostBtn: { paddingVertical: 16, alignSelf: 'stretch', alignItems: 'center' },
  ghostBtnText: { color: '#AAA', fontWeight: '600', fontSize: 15 },
});

export default WorkoutScreen;

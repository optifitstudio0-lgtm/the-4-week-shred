// =========================================================
// حاجات مشتركة بين شاشات الدخول والتسجيل ونسيت كلمة السر
// =========================================================
import React, { useEffect, useState } from 'react';
import { tc } from './theme';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { signInWithGoogle, signInWithFacebook, signInWithApple, isAppleAvailable, authErrorMessage } from './auth';

const { height } = Dimensions.get('window');
export const MAIN_COLOR = tc('#2ECC71', 'fg');
const BG_COLOR = tc('#000000', 'bg');
const INPUT_BG = tc('#1A1A1A', 'bg');
const TEXT_COLOR = tc('#FFFFFF', 'fg');
const PLACEHOLDER_COLOR = tc('#666666', 'fg');

// لوجو جوجل الرسمي بألوانه، وفيسبوك زرار أزرق والـf أبيض. Apple بتفضل أيقونة لون واحد
const SOCIAL_LOGOS = {
  google: require('./assets/social/google.png'),
};
const FB_BLUE = '#1877F2';

export const AuthInput = ({ placeholder, icon, value, onChangeText, secure, focused, onFocus, onBlur, keyboardType, autoCapitalize = 'none', textContentType, onSubmitEditing, returnKeyType }) => {
  const [show, setShow] = useState(false);
  return (
    <View style={[styles.inputContainer, focused && styles.inputFocused]}>
      <Ionicons name={icon} size={20} color={focused ? MAIN_COLOR : tc('#888', 'fg')} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER_COLOR}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure && !show}
        onFocus={onFocus}
        onBlur={onBlur}
        selectionColor={MAIN_COLOR}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        textContentType={textContentType}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
      />
      {secure && (
        <TouchableOpacity onPress={() => setShow(!show)} hitSlop={10}>
          <Ionicons name={show ? 'eye-off' : 'eye'} size={20} color={MAIN_COLOR} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export const PrimaryButton = ({ title, icon, onPress, loading }) => (
  <TouchableOpacity style={[styles.primaryButton, loading && { opacity: 0.7 }]} activeOpacity={0.8} onPress={onPress} disabled={loading}>
    {loading ? (
      <ActivityIndicator color={tc("#FFF", 'fg')} />
    ) : (
      <>
        <Text style={styles.primaryButtonText}>{title}</Text>
        {!!icon && <Ionicons name={icon} size={20} color={tc("#FFF", 'fg')} style={{ marginLeft: 6 }} />}
      </>
    )}
  </TouchableOpacity>
);

// بعد الدخول: لو عنده خطة يروح للرئيسية، لو لأ يبدأ الأسئلة
export const goAfterAuth = async (navigation) => {
  const hasPlan = (await AsyncStorage.getItem('isPlanCreated')) === 'true';
  navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: hasPlan ? 'MainTabs' : 'Gender' }] }));
};

export const showAuthError = (e) => {
  console.log('auth error', e?.code, e?.message);
  Alert.alert('', authErrorMessage(e));
};

// زراير جوجل / فيسبوك / Apple
export const SocialRow = ({ navigation, busy, setBusy }) => {
  const [apple, setApple] = useState(false);
  useEffect(() => { isAppleAvailable().then(setApple); }, []);

  const run = async (key, fn) => {
    if (busy) return;
    setBusy(key);
    try {
      const user = await fn();
      if (user) await goAfterAuth(navigation);
    } catch (e) {
      showAuthError(e);
    } finally {
      setBusy(null);
    }
  };

  const Btn = ({ k, icon, fn }) => (
    <TouchableOpacity
      style={[styles.socialIcon, k === 'facebook' && { backgroundColor: FB_BLUE, borderColor: FB_BLUE }]}
      onPress={() => run(k, fn)}
      disabled={!!busy}
    >
      {busy === k ? (
        <ActivityIndicator color={k === 'facebook' ? '#FFF' : tc("#FFF", 'fg')} />
      ) : SOCIAL_LOGOS[k] ? (
        <Image source={SOCIAL_LOGOS[k]} style={{ width: 24, height: 24 }} resizeMode="contain" />
      ) : (
        <FontAwesome5 name={icon} size={k === 'facebook' ? 25 : 22} color={k === 'facebook' ? '#FFF' : tc("#FFF", 'fg')} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.socialContainer}>
      <Btn k="google" icon="google" fn={signInWithGoogle} />
      <Btn k="facebook" icon="facebook-f" fn={signInWithFacebook} />
      {apple && Platform.OS === 'ios' && <Btn k="apple" icon="apple" fn={signInWithApple} />}
    </View>
  );
};

export const isValidEmail = (e) => /^\S+@\S+\.\S+$/.test((e || '').trim());

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  backgroundGradient: { position: 'absolute', left: 0, right: 0, top: 0, height },
  scrollContent: { flexGrow: 1, paddingHorizontal: 25, justifyContent: 'center', paddingVertical: 30 },
  backButton: {
    width: 40, height: 40, backgroundColor: tc('#1A1A1A', 'bg'), borderRadius: 12, justifyContent: 'center',
    alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: tc('#333', 'border'),
  },
  headerSection: { alignItems: 'center', marginBottom: 35 },
  logoContainer: {
    marginBottom: 15, padding: 15, backgroundColor: tc('#111', 'bg'), borderRadius: 50, borderWidth: 1, borderColor: tc('#222', 'border'),
    shadowColor: MAIN_COLOR, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: TEXT_COLOR, marginBottom: 5, textAlign: 'center' },
  subTitle: { fontSize: 14, color: tc('#AAA', 'fg'), textAlign: 'center', lineHeight: 22 },
  formSection: { width: '100%', marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: INPUT_BG, borderRadius: 15, paddingHorizontal: 15,
    height: 60, marginBottom: 15, borderWidth: 1, borderColor: tc('#333', 'border'),
  },
  inputFocused: { borderColor: MAIN_COLOR, backgroundColor: tc('#111', 'bg') },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: TEXT_COLOR, fontSize: 15, textAlign: 'left' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -5 },
  forgotPasswordText: { color: tc('#888', 'fg'), fontSize: 13 },
  primaryButton: {
    backgroundColor: MAIN_COLOR, borderRadius: 30, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: MAIN_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  primaryButtonText: { color: tc('#FFF', 'fg'), fontSize: 18, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  dividerLine: { flex: 1, height: 1, backgroundColor: tc('#222', 'bg') },
  dividerText: { color: tc('#666', 'fg'), paddingHorizontal: 10, fontSize: 12 },
  socialContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 40 },
  socialIcon: {
    width: 55, height: 55, borderRadius: 28, backgroundColor: tc('#1A1A1A', 'bg'), justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: tc('#333', 'border'),
  },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: tc('#888', 'fg'), fontSize: 14 },
  footerLink: { color: MAIN_COLOR, fontSize: 14, fontWeight: 'bold' },
  successBox: { alignItems: 'center', backgroundColor: tc('#111', 'bg'), borderRadius: 20, padding: 20, borderWidth: 1, borderColor: tc('#222', 'border'), marginBottom: 20 },
  successText: { color: tc('#DDD', 'fg'), fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: 10 },
});

import React, { useState } from 'react';
import { tc, statusStyle } from './theme';
import { View, Text, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ICON } from './rtl';
import { signInWithEmail } from './auth';
import { AuthInput, PrimaryButton, SocialRow, goAfterAuth, showAuthError, isValidEmail, styles, MAIN_COLOR } from './authui';
import { tr } from './i18n';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState(null);
  const [busy, setBusy] = useState(null);

  const submit = async () => {
    if (!isValidEmail(email)) return Alert.alert('', tr('اكتب إيميل صحيح.'));
    if (!password) return Alert.alert('', tr('اكتب كلمة السر.'));
    setBusy('email');
    try {
      await signInWithEmail(email, password);
      await goAfterAuth(navigation);
    } catch (e) {
      showAuthError(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={statusStyle()} />
      <LinearGradient
        colors={[tc('rgba(46, 204, 113, 0.4)', 'bg'), tc('rgba(46, 204, 113, 0.1)', 'bg'), tc('rgba(0, 0, 0, 0)', 'bg')]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.8 }}
        locations={[0, 0.4, 1]}
        style={styles.backgroundGradient}
        pointerEvents="none"
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {navigation.canGoBack() && (
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name={ICON.back} size={24} color={tc("#FFF", 'fg')} />
              </TouchableOpacity>
            )}

            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons name="dumbbell" size={50} color={MAIN_COLOR} />
              </View>
              <Text style={styles.title}>{tr('أهلًا بيك تاني')}</Text>
              <Text style={styles.subTitle}>{tr('ادخل وكمّل رحلتك')}</Text>
            </View>

            <View style={styles.formSection}>
              <AuthInput
                placeholder={tr('الإيميل')} icon="mail" value={email} onChangeText={setEmail}
                keyboardType="email-address" textContentType="emailAddress"
                focused={focused === 'email'} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
              />
              <AuthInput
                placeholder={tr('كلمة السر')} icon="lock-closed" value={password} onChangeText={setPassword} secure
                textContentType="password" returnKeyType="go" onSubmitEditing={submit}
                focused={focused === 'password'} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
              />

              <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword', { email })}>
                <Text style={styles.forgotPasswordText}>{tr('نسيت كلمة السر؟')}</Text>
              </TouchableOpacity>

              <PrimaryButton title={tr('دخول')} icon={ICON.next} onPress={submit} loading={busy === 'email'} />
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{tr('أو كمّل بـ')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <SocialRow navigation={navigation} busy={busy} setBusy={setBusy} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{tr('معندكش حساب؟ ')}</Text>
              <TouchableOpacity onPress={() => navigation.replace('SignUp')}>
                <Text style={styles.footerLink}>{tr('سجّل')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default LoginScreen;

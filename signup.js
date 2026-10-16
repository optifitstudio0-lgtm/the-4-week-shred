import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ICON } from './rtl';
import { signUpWithEmail } from './auth';
import { AuthInput, PrimaryButton, SocialRow, goAfterAuth, showAuthError, isValidEmail, styles, MAIN_COLOR } from './authui';
import { tr } from './i18n';

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [focused, setFocused] = useState(null);
  const [busy, setBusy] = useState(null);

  const submit = async () => {
    if (!name.trim()) return Alert.alert('', tr('اكتب اسمك.'));
    if (!isValidEmail(email)) return Alert.alert('', tr('اكتب إيميل صحيح.'));
    if (password.length < 6) return Alert.alert('', tr('كلمة السر لازم تبقى 6 حروف أو أرقام على الأقل.'));
    if (password !== confirm) return Alert.alert('', tr('كلمتين السر مش زي بعض.'));
    setBusy('email');
    try {
      await signUpWithEmail(name, email, password);
      await goAfterAuth(navigation);
    } catch (e) {
      showAuthError(e);
    } finally {
      setBusy(null);
    }
  };

  const f = (k) => ({ focused: focused === k, onFocus: () => setFocused(k), onBlur: () => setFocused(null) });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['rgba(46, 204, 113, 0.4)', 'rgba(46, 204, 113, 0.1)', 'rgba(0, 0, 0, 0)']}
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
                <Ionicons name={ICON.back} size={24} color="#FFF" />
              </TouchableOpacity>
            )}

            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons name="dumbbell" size={50} color={MAIN_COLOR} />
              </View>
              <Text style={styles.title}>{tr('إنشاء حساب')}</Text>
              <Text style={styles.subTitle}>{tr('انضم لنادي الأبطال، واشتراكك يفضل معاك لو غيّرت موبايلك')}</Text>
            </View>

            <View style={styles.formSection}>
              <AuthInput placeholder={tr('الاسم بالكامل')} icon="person" value={name} onChangeText={setName} autoCapitalize="words" textContentType="name" {...f('name')} />
              <AuthInput placeholder={tr('الإيميل')} icon="mail" value={email} onChangeText={setEmail} keyboardType="email-address" textContentType="emailAddress" {...f('email')} />
              <AuthInput placeholder={tr('كلمة السر')} icon="lock-closed" value={password} onChangeText={setPassword} secure textContentType="newPassword" {...f('password')} />
              <AuthInput placeholder={tr('أكّد كلمة السر')} icon="lock-closed" value={confirm} onChangeText={setConfirm} secure textContentType="newPassword" returnKeyType="go" onSubmitEditing={submit} {...f('confirm')} />
              <PrimaryButton title={tr('سجّل')} icon={ICON.next} onPress={submit} loading={busy === 'email'} />
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{tr('أو كمّل بـ')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <SocialRow navigation={navigation} busy={busy} setBusy={setBusy} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{tr('عندك حساب؟ ')}</Text>
              <TouchableOpacity onPress={() => navigation.replace('Login')}>
                <Text style={styles.footerLink}>{tr('ادخل')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default SignUpScreen;

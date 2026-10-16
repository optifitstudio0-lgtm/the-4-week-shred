import React, { useState } from 'react';
import { tc, statusStyle } from './theme';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { resetPassword, authErrorMessage } from './auth';
import { tr } from './i18n';

const { width, height } = Dimensions.get('window');

const MAIN_COLOR = tc('#2ECC71', 'fg'); 
const BG_COLOR = tc('#000000', 'bg');     
const INPUT_BG = tc('#1A1A1A', 'bg');     
const TEXT_COLOR = tc('#FFFFFF', 'fg');
const PLACEHOLDER_COLOR = tc('#666666', 'fg');

const ForgotPassword = ({ navigation, route }) => {
  const [email, setEmail] = useState(route?.params?.email || '');
  const [isFocused, setIsFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  // Firebase بيبعت إيميل فيه لينك لتغيير كلمة السر
  const handleSendCode = async () => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email || !emailRegex.test(email.trim())) {
      Alert.alert(tr('إيميل غلط'), tr('اكتب إيميل صحيح.'));
      return;
    }
    setSending(true);
    try {
      await resetPassword(email);
      setSentTo(email.trim());
    } catch (e) {
      Alert.alert('', authErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style={statusStyle()} />

      {/* ================================================= */}
      {/* تأثير الإضاءة الخضراء الناعمة */}
      {/* ================================================= */}
      <LinearGradient
        colors={[
          tc('rgba(46, 204, 113, 0.4)', 'bg'), 
          tc('rgba(46, 204, 113, 0.1)', 'bg'), 
          tc('rgba(0, 0, 0, 0)', 'bg')         
        ]} 
        start={{ x: 1, y: 0 }}      
        end={{ x: 0, y: 0.8 }}      
        locations={[0, 0.4, 1]}     
        style={styles.backgroundGradient}
        pointerEvents="none"        
      />
      {/* ================================================= */}

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Header: Back Button */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
              >
                <Ionicons name={require('./rtl').ICON.back} size={24} color={tc("#FFF", 'fg')} />
              </TouchableOpacity>
            </View>

            {/* Icon & Title Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                  {/* أيقونة القفل */}
                  <MaterialCommunityIcons name="lock-reset" size={50} color={MAIN_COLOR} />
              </View>
              <Text style={styles.title}>{tr('نسيت كلمة السر؟')}</Text>
              <Text style={styles.subTitle}>
                {tr('ولا يهمك! اكتب الإيميل المتسجل بيه وهنبعتلك لينك تغيّر بيه كلمة السر.')}
              </Text>
            </View>

            {sentTo ? (
              <View style={styles.formSection}>
                <View style={{ alignItems: 'center', backgroundColor: tc('#111', 'bg'), borderRadius: 20, padding: 20, borderWidth: 1, borderColor: tc('#222', 'border'), marginBottom: 20 }}>
                  <Ionicons name="mail-open-outline" size={40} color={MAIN_COLOR} />
                  <Text style={{ color: tc('#DDD', 'fg'), fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: 10 }}>
                    {tr('بعتنا لينك على {0}. افتح الإيميل (وبص في الـSpam كمان) واضغط على اللينك عشان تكتب كلمة سر جديدة.', sentTo)}
                  </Text>
                </View>
                <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.primaryButtonText}>{tr('رجوع للدخول')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
            <View style={styles.formSection}>
              <View style={[
                styles.inputContainer, 
                isFocused && styles.inputFocused
              ]}>
                <Ionicons 
                  name="mail" 
                  size={20} 
                  color={isFocused ? MAIN_COLOR : tc("#888", 'fg')} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder={tr('اكتب إيميلك')}
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  selectionColor={MAIN_COLOR}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Send Button */}
              <TouchableOpacity 
                style={styles.primaryButton} 
                activeOpacity={0.8}
                onPress={handleSendCode}
                disabled={sending}
              >
                {sending ? <ActivityIndicator color={tc("#FFF", 'fg')} /> : (
                  <>
                    <Text style={styles.primaryButtonText}>{tr('ابعت اللينك')}</Text>
                    <Ionicons name="paper-plane-outline" size={20} color={tc("#FFF", 'fg')} style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{tr('افتكرتها؟ ')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>{tr('دخول')}</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height, 
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: tc('#1A1A1A', 'bg'),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tc('#333', 'border'),
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: tc('#111', 'bg'),
    borderRadius: 60,
    borderWidth: 1,
    borderColor: tc('#222', 'border'),
    shadowColor: MAIN_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: TEXT_COLOR,
    marginBottom: 10,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 14,
    color: tc('#888', 'fg'),
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  formSection: {
    width: '100%',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 60,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: tc('#333', 'border'),
  },
  inputFocused: {
    borderColor: MAIN_COLOR, 
    backgroundColor: tc('#111', 'bg'),
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: TEXT_COLOR,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: MAIN_COLOR,
    borderRadius: 30,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MAIN_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: tc('#FFF', 'fg'),
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 30,
  },
  footerText: {
    color: tc('#666', 'fg'),
    fontSize: 14,
  },
  footerLink: {
    color: MAIN_COLOR,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ForgotPassword;

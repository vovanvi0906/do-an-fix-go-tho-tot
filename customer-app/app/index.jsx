import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useAuth, RoleSelectionSheet } from '../src/features/auth';
import { useGoogleAuth } from '../src/hooks';

const COLORS = {
  primary: '#0084FF',
  primaryDark: '#0066CC',
  darkBlue: '#1A365D',
  white: '#FFFFFF',
  bgGray: '#EAECF0',
  borderGray: '#E5E7EB',
  textDark: '#0F172A',
  textSecondary: '#64748B',
  placeholder: '#94A3B8',
  red: '#EF4444',
  gray: '#94A3B8',
  facebookBlue: '#1877F2',
  googleRed: '#EA4335',
};

export default function FixGoLoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, user, isCheckingSession } = useAuth();
  const { signInWithGoogle, isGoogleLoading } = useGoogleAuth('CUSTOMER');

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [identifierError, setIdentifierError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    if (!isCheckingSession && isAuthenticated && user) {
      const role = (user.role || 'CUSTOMER').toUpperCase();
      if (role === 'WORKER') {
        router.replace('/(worker)/(tabs)');
      } else {
        router.replace('/(user)/(tabs)');
      }
    }
  }, [isCheckingSession, isAuthenticated, user]);

  const handleLogin = async () => {
    setErrorMessage('');
    let hasErr = false;
    if (!identifier.trim()) {
      setIdentifierError(true);
      hasErr = true;
    } else {
      setIdentifierError(false);
    }

    if (!password) {
      setPasswordError(true);
      hasErr = true;
    } else {
      setPasswordError(false);
    }

    if (hasErr) {
      setErrorMessage('Vui lòng điền đầy đủ tài khoản và mật khẩu!');
      return;
    }

    try {
      setIsLoading(true);
      const res = await login({ identifier: identifier.trim(), password });
      const userRole = (res?.user?.role || 'CUSTOMER').toUpperCase();
      if (userRole === 'WORKER') {
        router.replace('/(worker)/(tabs)');
      } else {
        router.replace('/(user)/(tabs)');
      }
    } catch (error) {
      const msg = error.message || 'Đăng nhập không thành công.';
      setErrorMessage(msg);
      setPasswordError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession || !fontsLoaded) {
    return (
      <View style={styles.launchScreen}>
        <StatusBar style="light" />
        <Text style={styles.launchLogo}>FixGo</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.logo}>FixGo</Text>

            <View style={styles.formContainer}>
              <View style={[styles.inputWrapper, identifierError && styles.inputWrapperError]}>
                <Ionicons name="person-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Số điện thoại hoặc email"
                  placeholderTextColor={COLORS.placeholder}
                  value={identifier}
                  onChangeText={(text) => {
                    setIdentifier(text);
                    if (identifierError) setIdentifierError(false);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={[styles.inputWrapper, passwordError && styles.inputWrapperError]}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Mật khẩu"
                  placeholderTextColor={COLORS.placeholder}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError(false);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.red} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.forgotPasswordBox}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginBtn, isLoading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.loginBtnText}>Đăng nhập</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>hoặc đăng nhập bằng</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                  <FontAwesome name="facebook" size={24} color={COLORS.facebookBlue} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialBtn}
                  activeOpacity={0.8}
                  onPress={signInWithGoogle}
                  disabled={isLoading || isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <ActivityIndicator size="small" color={COLORS.googleRed} />
                  ) : (
                    <FontAwesome name="google" size={24} color={COLORS.googleRed} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setShowRegisterModal(true)}>
                  <Text style={styles.footerLink}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <RoleSelectionSheet
        visible={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSelectRole={(role) => {
          setShowRegisterModal(false);
          if (role === 'WORKER') {
            router.push('/(auth)/register-worker');
          } else {
            router.push('/(auth)/register-customer');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0084FF' },
  safeArea: { flex: 1 },
  flex1: { flex: 1 },
  launchScreen: { flex: 1, backgroundColor: '#0084FF', justifyContent: 'center', alignItems: 'center' },
  launchLogo: { fontSize: 48, fontWeight: 'bold', color: '#FFF' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { fontSize: 42, fontWeight: 'bold', color: '#FFF', marginBottom: 30 },
  formContainer: { width: '100%', maxWidth: 360, backgroundColor: '#FFF', borderRadius: 20, padding: 24, elevation: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, height: 50, marginBottom: 12 },
  inputWrapperError: { borderColor: '#EF4444', borderWidth: 1 },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, fontSize: 15, color: '#0F172A' },
  eyeIcon: { padding: 4 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  errorText: { color: '#EF4444', fontSize: 13, marginLeft: 6 },
  forgotPasswordBox: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotPasswordText: { color: '#0084FF', fontSize: 13 },
  loginBtn: { backgroundColor: '#0084FF', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 10, color: '#64748B', fontSize: 12 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 20 },
  socialBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#64748B', fontSize: 14 },
  footerLink: { color: '#0084FF', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 280, backgroundColor: '#FFF', borderRadius: 16, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  modalBtn: { width: '100%', height: 44, backgroundColor: '#0084FF', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontWeight: 'bold' },
});

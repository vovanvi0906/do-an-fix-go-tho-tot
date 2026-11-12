import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useAuth } from '../src/features/auth';
import { useGoogleAuth } from '../src/hooks';
import { styles, COLORS } from './index.styles';

export default function FixGoLoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, user, isCheckingSession } = useAuth();
  const { signInWithGoogle, isGoogleLoading } = useGoogleAuth();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [identifierError, setIdentifierError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    if (!isCheckingSession && isAuthenticated && user?.role === 'CUSTOMER') {
      router.replace('/(user)/(tabs)');
    }
  }, [isCheckingSession, isAuthenticated, user, router]);

  const handleLogin = async () => {
    if (isLoading) return;
    setErrorMessage('');
    const idVal = identifier.trim();
    setIdentifierError(!idVal);
    setPasswordError(!password);
    if (!idVal || !password) {
      setErrorMessage('Vui lòng điền đầy đủ tài khoản và mật khẩu!');
      return;
    }
    try {
      setIsLoading(true);
      const res = await login(idVal, password);
      if ((res?.user?.role || res?.data?.user?.role || '').toUpperCase() === 'CUSTOMER') {
        router.replace('/(user)/(tabs)');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Đăng nhập không thành công.');
      setPasswordError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession || !fontsLoaded) {
    return (
      <View style={styles.launchScreen}>
        <StatusBar style="light" /><Text style={styles.launchLogo}>FixGo</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.logo}>FixGo</Text>
            <View style={styles.formContainer}>
              <View style={[styles.inputWrapper, identifierError && styles.inputWrapperError]}>
                <Ionicons name="person-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput} placeholder="Số điện thoại hoặc email" placeholderTextColor={COLORS.placeholder}
                  value={identifier} onChangeText={(t) => { setIdentifier(t); setIdentifierError(false); setErrorMessage(''); }}
                  autoCapitalize="none" keyboardType="email-address"
                />
              </View>
              <View style={[styles.inputWrapper, passwordError && styles.inputWrapperError]}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput} placeholder="Mật khẩu" placeholderTextColor={COLORS.placeholder}
                  value={password} onChangeText={(t) => { setPassword(t); setPasswordError(false); setErrorMessage(''); }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </View>
              {errorMessage ? (
                <View style={styles.errorContainer}><Ionicons name="alert-circle" size={16} color={COLORS.red} /><Text style={styles.errorText}>{errorMessage}</Text></View>
              ) : null}
              <TouchableOpacity style={styles.forgotPasswordBox} onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.loginBtn, isLoading && styles.btnDisabled]} onPress={handleLogin} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.loginBtnText}>Đăng nhập</Text>}
              </TouchableOpacity>
              <View style={styles.dividerRow}><View style={styles.dividerLine} /><Text style={styles.dividerText}>hoặc đăng nhập bằng</Text><View style={styles.dividerLine} /></View>
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}><FontAwesome name="facebook" size={24} color={COLORS.facebookBlue} /></TouchableOpacity>
                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8} onPress={signInWithGoogle} disabled={isLoading || isGoogleLoading}>
                  {isGoogleLoading ? <ActivityIndicator size="small" color={COLORS.googleRed} /> : <FontAwesome name="google" size={24} color={COLORS.googleRed} />}
                </TouchableOpacity>
              </View>
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(auth)/register-customer')}>
                  <Text style={styles.footerLink}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

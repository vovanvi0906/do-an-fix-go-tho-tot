import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BiometricOvalFrame, VerificationResultModal, useFaceVerification } from '../../../src/features/face-verification';

export default function FaceVerificationScreen() {
  const router = useRouter();
  const { orderId, mode: requestedMode } = useLocalSearchParams();
  const mode = ['enrollment', 'reset'].includes(requestedMode) ? requestedMode : 'daily';
  const [consent, setConsent] = useState(false);
  const flow = useFaceVerification(orderId, undefined, mode);
  const registration = mode !== 'daily';
  const title = mode === 'reset' ? 'Cấp lại đăng ký khuôn mặt' : mode === 'enrollment' ? 'Đăng ký khuôn mặt' : orderId ? 'Xác thực trước công việc' : 'Check-in đầu ca';
  const leave = () => { flow.cancel(); router.back(); };
  const navigate = next => { flow.cancel(); setConsent(false); router.replace({ pathname: '/(worker)/verification/face', params: { mode: next } }); };
  return (
    <ScrollView nativeID="face-screen-container" contentContainerStyle={styles.container}>
      <TouchableOpacity nativeID="face-back-button" accessibilityRole="button" accessibilityLabel="Quay lại và hủy xác thực" onPress={leave}>
        <Text>← Quay lại</Text>
      </TouchableOpacity>
      <Text nativeID="face-title" accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text nativeID="face-guidance" style={styles.message}>
        {registration ? 'Chỉ đăng ký sau khi danh tính đã được kiểm tra và bạn đồng ý sử dụng khuôn mặt để xác thực.' : 'Nhìn thẳng, giữ một khuôn mặt trong khung và chọn nơi đủ sáng. Check-in đầu ca và xác thực cho từng công việc là hai lần kiểm tra riêng.'}
      </Text>
      <View nativeID="face-status-panel" accessibilityLiveRegion="polite" style={styles.panel}>
        {flow.loadingStatus ? <ActivityIndicator accessibilityLabel="Đang tải trạng thái" /> : null}
        <Text nativeID="face-status-text" style={styles.message}>
          {flow.statusError || (flow.loadingStatus ? 'Đang kiểm tra trạng thái…' : flow.status ?
            flow.status.enrollmentStatus === 'LEGACY_UNTRUSTED' ? 'Ảnh đăng ký cũ cần được kiểm tra lại. Ảnh đại diện không được dùng để xác thực.' :
              'Đăng ký khuôn mặt đang chờ hoàn thiện quy trình kiểm tra. Chưa thể check-in hoặc xác thực công việc.' : 'Chưa tải được trạng thái.')}
        </Text>
        <Text nativeID="face-review-state" style={styles.message}>Chưa có yêu cầu duyệt mới được gửi. Không chụp hoặc tải ảnh lên trong thời gian chờ.</Text>
        <TouchableOpacity nativeID="face-refresh-button" accessibilityRole="button" onPress={flow.refresh} disabled={flow.loadingStatus || flow.isAnalyzing} style={styles.secondary}>
          <Text>Kiểm tra lại trạng thái</Text>
        </TouchableOpacity>
      </View>
      {!registration ? <View nativeID="face-camera-frame"><BiometricOvalFrame imageUri={flow.imageUri} isAnalyzing={flow.isAnalyzing} /></View> : null}
      {registration ? <TouchableOpacity nativeID="face-consent-checkbox" accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent(value => !value)} style={styles.secondary}>
        <Text>{consent ? '☑' : '☐'} Tôi đồng ý kiểm tra điều kiện đăng ký. Bước này chưa thu nhận hoặc lưu khuôn mặt.</Text>
      </TouchableOpacity> : null}
      {registration ? <TouchableOpacity nativeID="face-preflight-button" accessibilityRole="button" disabled={!consent || flow.isAnalyzing || !flow.status} onPress={() => flow.preflight(consent)} style={styles.secondary}>
        <Text>Kiểm tra điều kiện {mode === 'reset' ? 'cấp lại' : 'đăng ký'}</Text>
      </TouchableOpacity> : <TouchableOpacity nativeID="face-capture-button" accessibilityRole="button" accessibilityState={{ disabled: true }} disabled style={styles.secondary}>
        <Text>Chụp ảnh — chưa sẵn sàng</Text>
      </TouchableOpacity>}
      <TouchableOpacity nativeID="face-enrollment-button" accessibilityRole="button" onPress={() => navigate('enrollment')} style={styles.secondary}><Text>Đăng ký lần đầu</Text></TouchableOpacity>
      <TouchableOpacity nativeID="face-reset-button" accessibilityRole="button" onPress={() => navigate('reset')} style={styles.secondary}><Text>Cần cấp lại đăng ký?</Text></TouchableOpacity>
      <VerificationResultModal visible={flow.showModal} result={flow.result} onClose={flow.reset} onRetry={flow.reset} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F8FAFC', padding: 24, paddingTop: 48, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  message: { fontSize: 14, color: '#475569', lineHeight: 21 },
  panel: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, gap: 12 },
  secondary: { borderColor: '#BFDBFE', borderWidth: 1, padding: 14, borderRadius: 12 },
});

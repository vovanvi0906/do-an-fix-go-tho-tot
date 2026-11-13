import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BiometricOvalFrame, VerificationResultModal, useFaceVerification } from '../../../src/features/face-verification';

export default function FaceVerificationScreen() {
  const router = useRouter();
  const { orderId, mode: requestedMode } = useLocalSearchParams();
  const mode = ['enrollment', 'reset'].includes(requestedMode) ? requestedMode : 'daily';
  const [consent, setConsent] = useState(false);
  const flow = useFaceVerification(orderId, undefined, mode);
  const registration = mode !== 'daily';
  const canCapture = mode === 'enrollment' ? flow.status?.canEnroll : mode === 'reset' ? false : orderId ? flow.status?.canVerifyOrder : flow.status?.canVerifyDaily;
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
            flow.status.enrollmentStatus === 'ENROLLED' ? 'Khuôn mặt đã đăng ký. Bằng chứng đầu ca và từng công việc được kiểm tra riêng.' :
            flow.status.enrollmentStatus === 'WITHDRAWN' ? 'Đồng ý đã được thu hồi và mẫu đã xóa. Đăng ký lại cần Admin kiểm tra danh tính mới.' :
            flow.status.enrollmentStatus === 'LEGACY_UNTRUSTED' ? 'Ảnh đăng ký cũ cần được kiểm tra lại. Ảnh đại diện không được dùng để xác thực.' :
              'Đăng ký khuôn mặt đang chờ hoàn thiện quy trình kiểm tra. Chưa thể check-in hoặc xác thực công việc.' : 'Chưa tải được trạng thái.')}
        </Text>
        <Text nativeID="face-review-state" style={styles.message}>{flow.status?.identityReviewApproved ? 'Admin đã ghi nhận kiểm tra danh tính. Chỉ chụp ảnh khi các điều kiện xác thực đã sẵn sàng.' : 'Chưa có yêu cầu duyệt mới được gửi. Không chụp hoặc tải ảnh lên trong thời gian chờ.'}</Text>
        <TouchableOpacity nativeID="face-refresh-button" accessibilityRole="button" onPress={flow.refresh} disabled={flow.loadingStatus || flow.isAnalyzing} style={styles.secondary}>
          <Text>Kiểm tra lại trạng thái</Text>
        </TouchableOpacity>
      </View>
      {mode !== 'reset' ? <View nativeID="face-camera-frame"><BiometricOvalFrame imageUri={flow.imageUri} isAnalyzing={flow.isAnalyzing} /></View> : null}
      {registration ? <TouchableOpacity nativeID="face-consent-checkbox" accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent(value => !value)} style={styles.secondary}>
        <Text>{consent ? '☑' : '☐'} {flow.status?.requiredConsentVersion ? `Tôi đồng ý dùng khuôn mặt để xác thực theo bản ${flow.status.requiredConsentVersion}; có thể thu hồi và xóa mẫu trong ứng dụng.` : 'Tôi đồng ý kiểm tra điều kiện đăng ký. Bước này chưa thu nhận hoặc lưu khuôn mặt.'}</Text>
      </TouchableOpacity> : null}
      {registration && !flow.status?.requiredConsentVersion ? <TouchableOpacity nativeID="face-preflight-button" accessibilityRole="button" disabled={!consent || flow.isAnalyzing || !flow.status} onPress={() => flow.preflight(consent)} style={styles.secondary}>
        <Text>Kiểm tra điều kiện {mode === 'reset' ? 'cấp lại' : 'đăng ký'}</Text>
      </TouchableOpacity> : null}
      {mode === 'enrollment' && flow.status?.consentRequired ? <TouchableOpacity nativeID="face-save-consent-button" accessibilityRole="button" disabled={!consent || flow.isAnalyzing} onPress={() => flow.recordConsent(consent)} style={styles.secondary}><Text>Lưu đồng ý sử dụng khuôn mặt</Text></TouchableOpacity> : null}
      {mode !== 'reset' ? <TouchableOpacity nativeID="face-capture-button" accessibilityRole="button" accessibilityState={{ disabled: !canCapture || flow.isAnalyzing }} disabled={!canCapture || flow.isAnalyzing} onPress={flow.takeSelfie} style={styles.secondary}>
        <Text>{canCapture ? 'Chụp ảnh bằng camera' : 'Chụp ảnh — chưa sẵn sàng'}</Text>
      </TouchableOpacity> : <Text nativeID="face-reset-guidance" style={styles.message}>Cấp lại cần Admin kiểm tra danh tính và duyệt mới. Yêu cầu duyệt không tự thay đổi mẫu hiện tại.</Text>}
      {flow.imageUri ? <TouchableOpacity nativeID="face-submit-button" accessibilityRole="button" disabled={flow.isAnalyzing} onPress={flow.verify} style={styles.secondary}><Text>{flow.isAnalyzing ? 'Đang xác thực…' : 'Gửi mẫu cho phiên xác thực'}</Text></TouchableOpacity> : null}
      {flow.status?.templateVersion ? <TouchableOpacity nativeID="face-withdraw-button" accessibilityRole="button" disabled={flow.isAnalyzing} style={styles.secondary} onPress={() => Alert.alert('Thu hồi và xóa khuôn mặt?', 'Mẫu mã hóa sẽ bị xóa, phiên và bằng chứng bị vô hiệu hóa. Đăng ký lại cần kiểm tra danh tính mới.', [{ text: 'Hủy', style: 'cancel' }, { text: 'Thu hồi và xóa', style: 'destructive', onPress: flow.withdraw }])}><Text>Thu hồi đồng ý và xóa mẫu</Text></TouchableOpacity> : null}
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

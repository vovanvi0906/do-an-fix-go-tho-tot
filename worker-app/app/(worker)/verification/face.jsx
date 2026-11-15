import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { LiveFaceCamera } from '../../../src/features/face-verification/components/LiveFaceCamera';
import { isCurrentFaceProof } from '../../../src/features/face-verification/services/proof';
import { FACE_BLOCKERS } from '../../../src/features/face-verification/utils/faceStatus';
import { BiometricOvalFrame, VerificationResultModal, useFaceVerification } from '../../../src/features/face-verification';

export default function FaceVerificationScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const orderId = typeof params.orderId === 'string' && params.orderId ? params.orderId : undefined;
  const requestedMode = typeof params.mode === 'string' ? params.mode : undefined;
  const mode = ['enrollment', 'reset', 'daily'].includes(requestedMode) ? requestedMode : orderId ? 'order' : 'enrollment';
  const [consent, setConsent] = useState(true);
  const flow = useFaceVerification(orderId, undefined, mode, { embeddedCamera: true });
  const registration = mode === 'enrollment' || mode === 'reset';
  const hasOrderProof = mode === 'order' && flow.status?.canUseOrderProof === true &&
    isCurrentFaceProof(flow.status.orderProof, 'ORDER', orderId);
  const canSaveConsentAndCapture = mode === 'enrollment' && consent && flow.status?.consentRequired &&
    !!flow.status.requiredConsentVersion && flow.status.enrollmentStatus !== 'ENROLLED' &&
    flow.status.blockers?.includes('CONSENT_REQUIRED') && flow.status.blockers.every(code => code === 'CONSENT_REQUIRED');
  const canCapture = (mode !== 'enrollment' || consent) && !hasOrderProof && ( mode === 'enrollment' ? flow.status?.canEnroll || canSaveConsentAndCapture : mode === 'reset' ? false : orderId ? flow.status?.canVerifyOrder : flow.status?.canVerifyDaily);
  const title = mode === 'reset' ? 'Cấp lại đăng ký khuôn mặt' : mode === 'enrollment' ? 'Đăng ký khuôn mặt' : orderId ? 'Xác thực trước công việc' : 'Check-in đầu ca';
  const leave = () => { flow.cancel(); router.back(); };
  const navigate = next => { flow.cancel(); setConsent(true); router.replace({ pathname: '/(worker)/verification/face', params: { mode: next, ...(orderId ? { orderId } : {}) } }); };
  const finishFlow = () => {
    flow.cancel();
    if (orderId) {
      const state = navigation.getState();
      const previous = state.routes[state.index - 1];
      // Return to the mounted job when possible: it owns the pending BEFORE scene draft.
      if (previous?.name === 'job/[id]' && previous.params?.id === orderId) router.back();
      else router.replace({ pathname: '/(worker)/job/[id]', params: { id: orderId } });
    } else router.replace('/(worker)/(tabs)');
  };
  return (
    <ScrollView nativeID="face-screen-container" contentContainerStyle={styles.container}>
      <TouchableOpacity nativeID="face-back-button" accessibilityRole="button" accessibilityLabel="Quay lại và hủy xác thực" onPress={leave}>
        <Text>← Quay lại</Text>
      </TouchableOpacity>
      <Text nativeID="face-title" accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text nativeID="face-guidance" style={styles.message}>
        {registration ? 'Lần quét đầu tạo mẫu khuôn mặt cho tài khoản. Các lần sau sẽ đối chiếu với mẫu này. Bạn cần đồng ý sử dụng khuôn mặt để xác thực.' : 'Nhìn thẳng, giữ một khuôn mặt trong khung và chọn nơi đủ sáng. Xác thực chỉ cho công việc hiện tại; còn hiệu lực thì không cần quét lại trước BEFORE và Start.'}
      </Text>
      <View nativeID="face-status-panel" accessibilityLiveRegion="polite" style={styles.panel}>
        {flow.loadingStatus ? <ActivityIndicator accessibilityLabel="Đang tải trạng thái" /> : null}
        <Text nativeID="face-status-text" style={styles.message}>
          {flow.statusError || (flow.loadingStatus ? 'Đang kiểm tra trạng thái…' : flow.status ?
            flow.status.enrollmentStatus === 'ENROLLED' ? 'Khuôn mặt đã đăng ký. Xác thực riêng cho từng công việc khi đã đến nơi.' :
            flow.status.enrollmentStatus === 'WITHDRAWN' ? 'Đồng ý đã được thu hồi và mẫu đã xóa. Bạn có thể đồng ý lại và đăng ký mẫu mới.' :
            flow.status.enrollmentStatus === 'LEGACY_UNTRUSTED' ? 'Ảnh đăng ký cũ cần được kiểm tra lại. Ảnh đại diện không được dùng để xác thực.' :
              'Chưa có mẫu khuôn mặt. Đồng ý sử dụng khuôn mặt và kiểm tra các điều kiện bên dưới để đăng ký.' : 'Chưa tải được trạng thái.')}
        </Text>

        <TouchableOpacity nativeID="face-refresh-button" accessibilityRole="button" onPress={flow.refresh} disabled={flow.loadingStatus || flow.isAnalyzing} style={styles.secondary}>
          <Text>Kiểm tra lại trạng thái</Text>
        </TouchableOpacity>
      </View>
      {flow.status?.padNotice ? <Text nativeID="face-pad-notice" style={styles.blocker}>{flow.status.padNotice}</Text> : null}
      {hasOrderProof ? <TouchableOpacity accessibilityRole="button" onPress={finishFlow} style={styles.secondary}><Text>Bằng chứng theo đơn còn hiệu lực — tiếp tục công việc</Text></TouchableOpacity> : null}
      {(hasOrderProof ? [] : (flow.status?.blockers || []).filter(code => !(canSaveConsentAndCapture && code === 'CONSENT_REQUIRED'))).map(code => <Text key={code} nativeID={`face-blocker-${code.toLowerCase()}`} style={styles.blocker}>{FACE_BLOCKERS[code] || 'Điều kiện xác thực chưa sẵn sàng.'}</Text>)}
      {mode !== 'reset' ? <View nativeID="face-camera-frame"><BiometricOvalFrame imageUri={flow.imageUri} isAnalyzing={flow.isAnalyzing} /></View> : null}
      {registration ? <TouchableOpacity nativeID="face-consent-checkbox" accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent(value => !value)} style={styles.secondary}>
        <Text>{consent ? '☑' : '☐'} {flow.status?.requiredConsentVersion ? `Tôi đồng ý dùng khuôn mặt để xác thực theo bản ${flow.status.requiredConsentVersion}. Đồng ý được lưu khi bấm chụp; có thể thu hồi và xóa mẫu trong ứng dụng.` : 'Tôi đồng ý kiểm tra điều kiện đăng ký. Bước này chưa thu nhận hoặc lưu khuôn mặt.'}</Text>
      </TouchableOpacity> : null}
      {registration && !flow.status?.requiredConsentVersion ? <TouchableOpacity nativeID="face-preflight-button" accessibilityRole="button" disabled={!consent || flow.isAnalyzing || !flow.status} onPress={() => flow.preflight(consent)} style={styles.secondary}>
        <Text>Kiểm tra điều kiện {mode === 'reset' ? 'cấp lại' : 'đăng ký'}</Text>
      </TouchableOpacity> : null}


      {hasOrderProof ? null : mode !== 'reset' ? <TouchableOpacity nativeID="face-capture-button" accessibilityRole="button" accessibilityState={{ disabled: !canCapture || flow.isAnalyzing }} disabled={!canCapture || flow.isAnalyzing} onPress={() => flow.takeSelfie(consent)} style={styles.secondary}>
        <Text>{canCapture ? 'Chụp ảnh bằng camera' : 'Chụp ảnh — chưa sẵn sàng'}</Text>
      </TouchableOpacity> : <Text nativeID="face-reset-guidance" style={styles.message}>Không ghi đè mẫu đang có. Để đăng ký lại, hãy thu hồi và xóa mẫu cũ, sau đó vào Đăng ký lần đầu để lưu đồng ý và quét mẫu mới.</Text>}
      {flow.imageUri ? <TouchableOpacity nativeID="face-submit-button" accessibilityRole="button" disabled={flow.isAnalyzing} onPress={flow.verify} style={styles.secondary}><Text>{flow.isAnalyzing ? 'Đang xác thực…' : 'Gửi mẫu cho phiên xác thực'}</Text></TouchableOpacity> : null}
      {flow.status?.templateVersion ? <TouchableOpacity nativeID="face-withdraw-button" accessibilityRole="button" disabled={flow.isAnalyzing} style={styles.secondary} onPress={() => Alert.alert('Thu hồi và xóa khuôn mặt?', 'Mẫu mã hóa sẽ bị xóa, phiên và bằng chứng bị vô hiệu hóa. Đăng ký lại cần đồng ý và quét mẫu mới.', [{ text: 'Hủy', style: 'cancel' }, { text: 'Thu hồi và xóa', style: 'destructive', onPress: flow.withdraw }])}><Text>Thu hồi đồng ý và xóa mẫu</Text></TouchableOpacity> : null}
      <TouchableOpacity nativeID="face-enrollment-button" accessibilityRole="button" onPress={() => navigate('enrollment')} style={styles.secondary}><Text>Đăng ký lần đầu</Text></TouchableOpacity>
      <TouchableOpacity nativeID="face-reset-button" accessibilityRole="button" onPress={() => navigate('reset')} style={styles.secondary}><Text>Cần cấp lại đăng ký?</Text></TouchableOpacity>
      <LiveFaceCamera visible={flow.cameraVisible} onCapture={flow.acceptCapture} onClose={flow.closeCamera} />
      <VerificationResultModal visible={flow.showModal} result={flow.result} onClose={flow.result?.enrolled || flow.result?.verified ? finishFlow : flow.reset} onRetry={flow.reset} successLabel={flow.result?.enrolled ? 'Tiếp tục' : 'Về công việc'} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F8FAFC', padding: 24, paddingTop: 48, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  message: { fontSize: 14, color: '#475569', lineHeight: 21 },
  panel: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, gap: 12 },
  blocker: { fontSize: 12, color: '#8B5E19', lineHeight: 19 },
  secondary: { borderColor: '#BFDBFE', borderWidth: 1, padding: 14, borderRadius: 12 },
});

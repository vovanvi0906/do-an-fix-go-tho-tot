import { socketService } from '../../../src/services/socket/socketService';
import { orderService } from '../../../src/services/api/orderService';
import { apiClient } from '../../../src/services/api/apiClient';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/features/auth';
import { useWorkerLocationTracker } from '../../../src/hooks/useWorkerLocationTracker';

export default function WorkerJobDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [jobStatus, setJobStatus] = useState(null);
  const [order, setOrder] = useState(null);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isFaceChecked, setIsFaceChecked] = useState(false);
  const { isTracking, startTracking, stopTracking } = useWorkerLocationTracker(id, user?.id);

  const reload = useCallback(async () => {
    try {
      const [snapshot, profile] = await Promise.all([orderService.getOrderById(id), apiClient.get('/workers/me')]);
      setOrder(snapshot);
      setJobStatus(snapshot.status);
      setIsFaceChecked(!!profile.faceVerifiedAt && Date.now() - new Date(profile.faceVerifiedAt).getTime() < 86400000);
      setLoadError('');
    } catch (error) { setLoadError(error.message); setJobStatus(null); }
  }, [id]);
  useFocusEffect(useCallback(() => {
    reload();
    socketService.joinOrderRoom(id);
    const onStatus = (event) => { if (event.orderId === id) reload(); };
    socketService.on('order:status_changed', onStatus);
    return () => {
      socketService.off('order:status_changed', onStatus);
      socketService.leaveOrderRoom(id);
    };
  }, [id, reload]));

  const changeStage = async (status) => {
    if (pending) return false;
    setPending(true);
    try {
      const response = await apiClient.patch(`/orders/${id}/status`, { status });
      setOrder(response.order);
      setJobStatus(response.order.status);
      return true;
    } catch (error) { Alert.alert('Chưa cập nhật trạng thái', error.message); await reload(); return false; }
    finally { setPending(false); }
  };
  const imageUrl = order?.images?.find(image => image.type === 'ISSUE')?.url;
  const confidence = order?.aiConfidence;
  const handleStartMoving = async () => {
    if (await changeStage('WORKER_EN_ROUTE')) await startTracking();
  };
  const handleArrived = async () => {
    if (await changeStage('ARRIVED')) stopTracking();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loadError ? <TouchableOpacity onPress={reload}><Text>{loadError} — Thử lại</Text></TouchableOpacity> : null}
      {pending ? <Text>Đang cập nhật…</Text> : null}
      <View style={styles.headerBox}>
        <Text style={styles.orderBadge}>MÃ ĐƠN #{String(id || '').slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.title}>{order?.service?.name || order?.category?.name || 'Đang tải đơn hàng…'}</Text>
        <Text style={styles.price}>{order ? `${Number(order.finalPrice ?? order.estimatedPrice).toLocaleString('vi-VN')} đ` : '—'}</Text>
      </View>

      {imageUrl ? (
        <View style={styles.aiCard}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color="#0284C7" />
            <Text style={styles.aiBadgeText}>
              🤖 AI Đề xuất dịch vụ (Điểm nhận diện nhóm: {confidence ? `${Math.round(Number(confidence) * 100)}%` : 'Chưa xác định'})
            </Text>
          </View>
          <Image source={{ uri: imageUrl }} style={styles.incidentImg} />
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="location" size={18} color="#0284C7" />
          <Text style={styles.label}>Địa chỉ:</Text>
          <Text style={styles.val}>{order?.addressText || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="person" size={18} color="#0284C7" />
          <Text style={styles.label}>Khách hàng:</Text>
          <Text style={styles.val}>{order?.customer?.name || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="scan-circle" size={18} color={isFaceChecked ? '#16A34A' : '#F59E0B'} />
          <Text style={styles.label}>Face ID:</Text>
          <Text style={[styles.val, { color: isFaceChecked ? '#16A34A' : '#D97706' }]}>
            {isFaceChecked ? 'Đã xác thực AI đạt chuẩn' : 'Chưa check-in khuôn mặt'}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="radio" size={18} color={isTracking ? '#16A34A' : '#94A3B8'} />
          <Text style={styles.label}>Định vị GPS:</Text>
          <Text style={[styles.val, { color: isTracking ? '#16A34A' : '#64748B' }]}>
            {isTracking ? 'Đang phát sóng tọa độ (3 giây/lần)' : 'Đang tạm dừng'}
          </Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {!isFaceChecked && (
          <TouchableOpacity
            style={styles.btnFace}
            onPress={() => router.push({ pathname: '/(worker)/verification/face', params: { orderId: id } })}
            activeOpacity={0.8}
          >
            <Ionicons name="finger-print" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>CHECK-IN KHUÔN MẶT THỢ (AI FACE)</Text>
          </TouchableOpacity>
        )}

        {['ASSIGNED', 'MATCHED'].includes(jobStatus) && (
          <TouchableOpacity style={styles.btnPrimary} disabled={pending} onPress={handleStartMoving} activeOpacity={0.8}>
            <Ionicons name="navigate" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>BẮT ĐẦU DI CHUYỂN ĐẾN KHÁCH</Text>
          </TouchableOpacity>
        )}

        {['WORKER_ARRIVING', 'WORKER_EN_ROUTE'].includes(jobStatus) && (
          <TouchableOpacity style={styles.btnSuccess} disabled={pending} onPress={handleArrived} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>ĐÃ ĐẾN NƠI</Text>
          </TouchableOpacity>
        )}

        {jobStatus === 'ARRIVED' && (
          <TouchableOpacity style={styles.btnPrimary} disabled={pending} onPress={() => changeStage('IN_PROGRESS')}>
            <Text style={styles.btnText}>BẮT ĐẦU CÔNG VIỆC</Text>
          </TouchableOpacity>
        )}
        {jobStatus === 'IN_PROGRESS' && (
          <Text>Đang thực hiện công việc.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  headerBox: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  orderBadge: { fontSize: 12, fontWeight: '700', color: '#0284C7', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  price: { fontSize: 17, fontWeight: '800', color: '#16A34A' },
  aiCard: { backgroundColor: '#F0F9FF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#BAE6FD' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiBadgeText: { fontSize: 12.5, fontWeight: '700', color: '#0284C7' },
  incidentImg: { width: '100%', height: 160, borderRadius: 10, backgroundColor: '#E2E8F0' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 13, color: '#64748B', width: 90 },
  val: { flex: 1, fontSize: 13.5, fontWeight: '600', color: '#1E293B' },
  actionContainer: { gap: 10 },
  btnFace: { height: 50, borderRadius: 14, backgroundColor: '#4F46E5', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnPrimary: { height: 50, borderRadius: 14, backgroundColor: '#0284C7', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnSuccess: { height: 50, borderRadius: 14, backgroundColor: '#16A34A', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnCamera: { height: 50, borderRadius: 14, backgroundColor: '#7C3AED', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});

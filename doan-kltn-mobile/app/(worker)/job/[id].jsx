import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/features/auth';
import { useWorkerLocationTracker } from '../../../src/hooks/useWorkerLocationTracker';
import { socketService } from '../../../src/services/socket/socketService';

export default function WorkerJobDetailScreen() {
  const { id, title, customerName, addressText, price } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [jobStatus, setJobStatus] = useState('ASSIGNED'); // ASSIGNED | WORKER_ARRIVING | IN_PROGRESS | COMPLETED
  const { isTracking, startTracking, stopTracking } = useWorkerLocationTracker(id, user?.id);

  const handleStartMoving = async () => {
    const ok = await startTracking();
    if (ok) {
      setJobStatus('WORKER_ARRIVING');
      socketService.emit('worker:status_update', { orderId: id, status: 'WORKER_ARRIVING' });
      Alert.alert('Thanh cong', 'Da bat dinh vi GPS truyen truc tiep lo trinh cho khach hang!');
    }
  };

  const handleArrived = () => {
    stopTracking();
    setJobStatus('IN_PROGRESS');
    socketService.emit('worker:status_update', { orderId: id, status: 'IN_PROGRESS' });
    Alert.alert('Den noi', 'Da den nha khach. GPS da tu dong ngat de tiet kiem pin!');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.orderBadge}>MA DON #{String(id || '').slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.title}>{title || 'Sua chua thiet bi theo yeu cau'}</Text>
        <Text style={styles.price}>{price ? `${Number(price).toLocaleString('vi-VN')} d` : '150.000 d'}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="location" size={18} color="#0284C7" />
          <Text style={styles.label}>Dia chi:</Text>
          <Text style={styles.val}>{addressText || '606/20 Hiep Binh, TP. Thu Duc'}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="person" size={18} color="#0284C7" />
          <Text style={styles.label}>Khach hang:</Text>
          <Text style={styles.val}>{customerName || 'Nguyen Van A (0988.123.456)'}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="radio" size={18} color={isTracking ? '#16A34A' : '#94A3B8'} />
          <Text style={styles.label}>Dinh vi GPS:</Text>
          <Text style={[styles.val, { color: isTracking ? '#16A34A' : '#64748B' }]}>
            {isTracking ? 'Dang phat song toa do (3 giay/lan)' : 'Dang tam dung'}
          </Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {jobStatus === 'ASSIGNED' && (
          <TouchableOpacity style={styles.btnPrimary} onPress={handleStartMoving} activeOpacity={0.8}>
            <Ionicons name="navigate" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>BAT DAU DI CHUYEN DEN KHACH</Text>
          </TouchableOpacity>
        )}

        {jobStatus === 'WORKER_ARRIVING' && (
          <TouchableOpacity style={styles.btnSuccess} onPress={handleArrived} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>DA DEN NOI - BAT DAU SUA</Text>
          </TouchableOpacity>
        )}

        {jobStatus === 'IN_PROGRESS' && (
          <TouchableOpacity
            style={styles.btnCamera}
            onPress={() => router.push({ pathname: '/(worker)/verification/face', params: { orderId: id } })}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>CHUP ANH NGHIEM THU (AFTER)</Text>
          </TouchableOpacity>
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
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 13, color: '#64748B', width: 90 },
  val: { flex: 1, fontSize: 13.5, fontWeight: '600', color: '#1E293B' },
  actionContainer: { gap: 10 },
  btnPrimary: { height: 50, borderRadius: 14, backgroundColor: '#0284C7', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnSuccess: { height: 50, borderRadius: 14, backgroundColor: '#16A34A', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnCamera: { height: 50, borderRadius: 14, backgroundColor: '#7C3AED', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});

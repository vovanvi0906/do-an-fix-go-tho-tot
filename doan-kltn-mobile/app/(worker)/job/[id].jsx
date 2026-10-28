import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/features/auth';

export default function WorkerJobDetailScreen() {
  const { id, title, customerName, addressText, price, imageUrl, confidence } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [jobStatus, setJobStatus] = useState('ASSIGNED');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.orderBadge}>MÃ VIỆC #{String(id || '').slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.title}>{title || 'Sửa chữa thiết bị theo yêu cầu'}</Text>
        <Text style={styles.price}>{price ? `${Number(price).toLocaleString('vi-VN')} đ` : '150.000 đ'}</Text>
      </View>

      {imageUrl ? (
        <View style={styles.aiCard}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color="#0284C7" />
            <Text style={styles.aiBadgeText}>
              🤖 AI Đề xuất dịch vụ (Độ khớp: {confidence ? Math.round(Number(confidence) * 100) : 92}%)
            </Text>
          </View>
          <Image source={{ uri: imageUrl }} style={styles.incidentImg} />
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="location" size={18} color="#0284C7" />
          <Text style={styles.label}>Địa chỉ:</Text>
          <Text style={styles.val}>{addressText || '606/20 Hiệp Bình, TP. Thủ Đức'}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="person" size={18} color="#0284C7" />
          <Text style={styles.label}>Khách hàng:</Text>
          <Text style={styles.val}>{customerName || 'Nguyễn Văn A (0988.123.456)'}</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {jobStatus === 'ASSIGNED' && (
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => {
              setJobStatus('IN_PROGRESS');
              Alert.alert('Thành công', 'Đã bắt đầu nhận ca làm việc');
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>BẮT ĐẦU THỰC HIỆN CA LÀM</Text>
          </TouchableOpacity>
        )}

        {jobStatus === 'IN_PROGRESS' && (
          <TouchableOpacity
            style={styles.btnCamera}
            onPress={() => router.push({ pathname: '/(worker)/verification/face', params: { orderId: id } })}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnText}>CHỤP ẢNH NGHIỆM THU (AFTER)</Text>
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
  aiCard: { backgroundColor: '#F0F9FF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#BAE6FD' },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiBadgeText: { fontSize: 12.5, fontWeight: '700', color: '#0284C7' },
  incidentImg: { width: '100%', height: 160, borderRadius: 10, backgroundColor: '#E2E8F0' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 13, color: '#64748B', width: 90 },
  val: { flex: 1, fontSize: 13.5, fontWeight: '600', color: '#1E293B' },
  actionContainer: { gap: 10 },
  btnPrimary: { height: 50, borderRadius: 14, backgroundColor: '#0284C7', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnCamera: { height: 50, borderRadius: 14, backgroundColor: '#7C3AED', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});

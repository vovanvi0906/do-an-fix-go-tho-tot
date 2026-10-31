import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const RoleSelectionSheet = ({ visible, onClose, onSelectRole }) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.indicator} />
          <Text style={styles.title}>BẠN MUỐN THAM GIA FIXGO VỚI VAI TRÒ NÀO?</Text>
          <Text style={styles.subtitle}>Hãy chọn mục đích sử dụng phù hợp với bạn</Text>

          <TouchableOpacity
            style={styles.roleCard}
            activeOpacity={0.85}
            onPress={() => onSelectRole('CUSTOMER')}
          >
            <View style={[styles.iconBox, styles.customerIconBox]}>
              <Ionicons name="home" size={26} color="#0084FF" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.roleTitle}>TÔI MUỐN TÌM THỢ SỬA CHỮA</Text>
              <Text style={styles.roleDesc}>
                Đặt lịch nhanh chóng, an toàn, giá cả minh bạch và bảo hành chu đáo.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            activeOpacity={0.85}
            onPress={() => onSelectRole('WORKER')}
          >
            <View style={[styles.iconBox, styles.workerIconBox]}>
              <Ionicons name="construct" size={26} color="#16A34A" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.roleTitle}>TÔI LÀ THỢ TÌM VIỆC LÀM</Text>
              <Text style={styles.roleDesc}>
                Gia tăng thu nhập, tự do nhận đơn, kết nối hàng nghìn khách hàng.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  indicator: {
    width: 44,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  customerIconBox: { backgroundColor: '#E0F2FE' },
  workerIconBox: { backgroundColor: '#DCFCE7' },
  cardContent: { flex: 1, paddingRight: 6 },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
});

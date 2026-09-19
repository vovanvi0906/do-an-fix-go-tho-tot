import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function RegisterSelectionScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Đăng Ký Tài Khoản</Text>
        <Text style={styles.subtitle}>
          Vui lòng lựa chọn loại tài khoản bạn muốn tạo trong hệ thống
        </Text>

        <View style={styles.options}>
          {/* Lựa chọn 1: Khách hàng */}
          <Link href="/(auth)/register-customer" asChild>
            <TouchableOpacity style={styles.optionCardCustomer} activeOpacity={0.8}>
              <View style={styles.iconCircleCustomer}>
                <Text style={styles.iconText}>👤</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitleCustomer}>Tài khoản Khách hàng</Text>
                <Text style={styles.optionDesc}>
                  Dành cho người dùng cá nhân muốn tìm kiếm, đặt lịch thợ sửa chữa, dịch vụ gia đình.
                </Text>
              </View>
              <Text style={styles.arrow}>➔</Text>
            </TouchableOpacity>
          </Link>

          {/* Lựa chọn 2: Thợ */}
          <Link href="/(auth)/register-worker" asChild>
            <TouchableOpacity style={styles.optionCardWorker} activeOpacity={0.8}>
              <View style={styles.iconCircleWorker}>
                <Text style={styles.iconText}>🛠️</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitleWorker}>Tài khoản Thợ / Đối tác</Text>
                <Text style={styles.optionDesc}>
                  Dành cho thợ lành nghề, đối tác cung cấp dịch vụ muốn nhận việc và nâng cao thu nhập.
                </Text>
              </View>
              <Text style={styles.arrow}>➔</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingVertical: 32,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  options: {
    gap: 16,
    marginBottom: 24,
  },
  optionCardCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 16,
  },
  optionCardWorker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
  },
  iconCircleCustomer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconCircleWorker: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 22,
  },
  optionContent: {
    flex: 1,
  },
  optionTitleCustomer: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  optionTitleWorker: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  arrow: {
    fontSize: 18,
    color: '#94A3B8',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
});

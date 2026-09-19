/**
 * @file HomeHeader.tsx
 * @description Header Gradient xanh công nghệ cho Trang Chủ FixGo Mobile.
 * Tuân thủ quy tắc 60-30-10, tích hợp nút Cứu hộ khẩn cấp tinh tế trên Header,
 * Pill FixCoins gọn gàng (loại bỏ +Nhận), không dùng banner đỏ gào thét.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { UserProfile } from '../types/home.types';

interface HomeHeaderProps {
  user: UserProfile;
  searchQuery: string;
  selectedDistrict: string;
  unreadNotificationsCount?: number;
  onSearchChange: (q: string) => void;
  onDistrictChange: (district: string) => void;
  onOpenNotifications?: () => void;
}

const DISTRICT_LIST = [
  'Q. Bình Thạnh, TP.HCM',
  'Quận 1, TP.HCM',
  'Quận 3, TP.HCM',
  'Quận Phú Nhuận, TP.HCM',
  'Quận 7, TP.HCM',
  'TP. Thủ Đức, TP.HCM',
  'Quận Tân Bình, TP.HCM',
  'Quận 10, TP.HCM',
  'Quận Gò Vấp, TP.HCM',
];

const HOTLINE_NUMBER = '19006868';
const HOTLINE_DISPLAY = '1900.6868';

/**
 * Component `HomeHeader`
 */
export default function HomeHeader({
  user,
  searchQuery,
  selectedDistrict,
  unreadNotificationsCount = 1,
  onSearchChange,
  onDistrictChange,
  onOpenNotifications,
}: HomeHeaderProps) {
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);

  const handleCallHotline = () => {
    Alert.alert(
      'Hotline Cứu hộ khẩn cấp 24/7',
      `Bạn có muốn kết nối trực tiếp đến tổng đài ${HOTLINE_DISPLAY} để điều phối thợ xử lý sự cố gấp (sau 15 phút)?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gọi ngay',
          onPress: () => {
            Linking.openURL(`tel:${HOTLINE_NUMBER}`).catch(() => {
              Alert.alert('Thông báo', `Vui lòng bấm gọi số: ${HOTLINE_DISPLAY}`);
            });
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#0284C7', '#0EA5E9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* ── 1. Top Row: Greeting, District Selector & Action Icons ── */}
      <View style={styles.topRow}>
        {/* Left: Greeting & District Dropdown */}
        <View style={styles.topLeftGroup}>
          <Text style={styles.greetingText}>
            Xin chào, <Text style={styles.greetingName}>{user?.fullName || 'Nguyễn Văn An'}</Text> 👋
          </Text>

          <Pressable
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Khu vực hiện tại: ${selectedDistrict}. Chạm để đổi khu vực.`}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [
              styles.districtSelector,
              pressed && styles.pressedEffect,
            ]}
            onPress={() => setIsDistrictModalOpen(true)}
          >
            <Ionicons name="location-sharp" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.districtText} numberOfLines={1}>
              {selectedDistrict}
            </Text>
            <Ionicons name="chevron-down" size={13} color="#E0F2FE" style={{ marginLeft: 3 }} />
          </Pressable>
        </View>

        {/* Right Actions: [0 FixCoins] [📞 Hotline] [🔔] */}
        <View style={styles.topRightGroup}>
          {/* Pill Điểm thưởng FixCoins (Nền đen mờ Sky-950, icon vàng hổ phách, chữ trắng) */}
          <Pressable
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Số dư: ${user?.rewardPoints ?? 0} FixCoins. Chạm để xem thể lệ và đổi voucher.`}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.rewardsPill,
              pressed && styles.pressedEffect,
            ]}
            onPress={() => setIsRewardsModalOpen(true)}
          >
            <Ionicons name="sparkles" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
            <Text style={styles.rewardsText}>{user?.rewardPoints ?? 0} FixCoins</Text>
          </Pressable>

          {/* Nút Cứu hộ khẩn cấp tinh tế (Phone Icon đỏ san hô) */}
          <Pressable
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Gọi cứu hộ khẩn cấp ${HOTLINE_DISPLAY}`}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [
              styles.hotlineBtn,
              pressed && styles.pressedEffect,
            ]}
            onPress={handleCallHotline}
          >
            <Ionicons name="call" size={17} color="#EF4444" />
          </Pressable>

          {/* Chuông thông báo */}
          <Pressable
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              unreadNotificationsCount > 0
                ? `Thông báo: Có ${unreadNotificationsCount} tin mới.`
                : 'Thông báo'
            }
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [
              styles.bellBtn,
              pressed && styles.pressedEffect,
            ]}
            onPress={onOpenNotifications}
          >
            <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
            {unreadNotificationsCount > 0 && <View style={styles.redDot} />}
          </Pressable>
        </View>
      </View>

      {/* ── 2. Search Bar: Input nền trắng phẳng tinh tế (Touch Target 46px) ─ */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#0284C7" style={styles.searchIcon} />
        <TextInput
          accessible={true}
          accessibilityLabel="Ô tìm kiếm dịch vụ sửa chữa"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Tìm kiếm dịch vụ (sửa điện, máy lạnh, cống...)"
          placeholderTextColor="#64748B"
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Xóa nội dung tìm kiếm"
            onPress={() => onSearchChange('')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [styles.clearSearchBtn, pressed && styles.pressedEffect]}
          >
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </Pressable>
        )}
      </View>

      {/* ── Modal chọn khu vực (District Picker) ─────────────────── */}
      <Modal
        visible={isDistrictModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDistrictModalOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsDistrictModalOpen(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn khu vực phục vụ</Text>
              <Pressable
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Đóng cửa sổ chọn khu vực"
                onPress={() => setIsDistrictModalOpen(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={({ pressed }) => [pressed && styles.pressedEffect]}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            <FlatList
              data={DISTRICT_LIST}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item === selectedDistrict;
                return (
                  <Pressable
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Khu vực ${item}${isSelected ? ', Đang được chọn' : ''}`}
                    style={({ pressed }) => [
                      styles.districtItem,
                      isSelected && styles.districtItemSelected,
                      pressed && styles.pressedEffect,
                    ]}
                    onPress={() => {
                      onDistrictChange(item);
                      setIsDistrictModalOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.districtItemText,
                        isSelected && styles.districtItemTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#0284C7" />}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* ── Modal Thể Lệ & Đổi Thưởng FixCoins ────────────────────── */}
      <Modal
        visible={isRewardsModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRewardsModalOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsRewardsModalOpen(false)}>
          <View style={styles.rewardsModalCard}>
            <View style={styles.rewardsModalHeader}>
              <View style={styles.rewardsIconWrap}>
                <Ionicons name="sparkles" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.rewardsModalTitle}>Ví FixCoins & Ưu Đãi Thành Viên</Text>
              <Pressable
                onPress={() => setIsRewardsModalOpen(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </Pressable>
            </View>

            {/* Số dư hiện tại */}
            <View style={styles.rewardsBalanceBox}>
              <Text style={styles.balanceLabel}>Số dư FixCoins của bạn</Text>
              <Text style={styles.balanceNumber}>
                {user?.rewardPoints ?? 0} <Text style={styles.balanceUnit}>xu</Text>
              </Text>
            </View>

            {/* Cách tích điểm */}
            <Text style={styles.rulesSectionTitle}>🎁 Cách tích lũy thêm FixCoins:</Text>
            <View style={styles.rulesList}>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>•</Text>
                <Text style={styles.ruleText}>Hoàn thành 1 đơn sửa chữa: <Text style={styles.ruleHighlight}>+20 FixCoins</Text></Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>•</Text>
                <Text style={styles.ruleText}>Đánh giá thợ 5 sao sau đơn: <Text style={styles.ruleHighlight}>+10 FixCoins</Text></Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>•</Text>
                <Text style={styles.ruleText}>Giới thiệu bạn bè đăng ký: <Text style={styles.ruleHighlight}>+50 FixCoins</Text></Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.rewardsActionBtn, pressed && styles.pressedEffect]}
              onPress={() => {
                setIsRewardsModalOpen(false);
                Alert.alert('Ví Voucher', 'Tích đủ 50 FixCoins để đổi mã giảm giá 30.000đ khi đặt lịch!');
              }}
            >
              <Text style={styles.rewardsActionBtnText}>Khám phá mã giảm giá</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topLeftGroup: {
    flex: 1,
    paddingRight: 8,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E0F2FE',
    marginBottom: 2,
  },
  greetingName: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  districtSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    alignSelf: 'flex-start',
    minHeight: 26,
  },
  districtText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    maxWidth: 150,
  },
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 47, 73, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    minHeight: 36,
  },
  rewardsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hotlineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(8, 47, 73, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  redDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Search Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
    paddingVertical: 0,
    height: 46,
  },
  clearSearchBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedEffect: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  // Modal khu vực
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  districtItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 48,
  },
  districtItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  districtItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  districtItemTextSelected: {
    fontWeight: '700',
    color: '#0284C7',
  },

  // Rewards Modal
  rewardsModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  rewardsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rewardsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginLeft: 10,
  },
  rewardsBalanceBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  balanceNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#B45309',
  },
  balanceUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
  },
  rulesSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  rulesList: {
    gap: 8,
    marginBottom: 20,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleBullet: {
    fontSize: 14,
    color: '#0284C7',
    marginRight: 6,
    fontWeight: '900',
  },
  ruleText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  ruleHighlight: {
    fontWeight: '700',
    color: '#D97706',
  },
  rewardsActionBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  rewardsActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

/**
 * @file HomeHeader.tsx
 * @description Header Gradient xanh dương và thanh tìm kiếm cho Trang Chủ FixGo Mobile.
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
  onOpenRewards?: () => void;
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
];

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
  onOpenRewards,
}: HomeHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <LinearGradient
      colors={['#0EA5E9', '#0284C7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* ── 1. Top Row: Greeting, District Selector & Actions ──────── */}
      <View style={styles.topRow}>
        {/* Left: Greeting & Dropdown */}
        <View style={styles.topLeftGroup}>
          <Text style={styles.greetingText}>
            Xin chào, {user.fullName || 'Nguyễn Văn An'} 👋
          </Text>

          <Pressable
            style={({ pressed }) => [styles.districtSelector, pressed && styles.pressed]}
            onPress={() => setIsModalOpen(true)}
          >
            <Ionicons name="location-sharp" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.districtText} numberOfLines={1}>
              {selectedDistrict}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#E0F2FE" style={{ marginLeft: 2 }} />
          </Pressable>
        </View>

        {/* Right: Black Pill Points & Notification Bell */}
        <View style={styles.topRightGroup}>
          {/* Black Pill Điểm thưởng */}
          <Pressable
            style={({ pressed }) => [styles.rewardsPill, pressed && styles.pressed]}
            onPress={onOpenRewards}
          >
            <Ionicons name="sparkles" size={13} color="#FBBF24" style={{ marginRight: 4 }} />
            <Text style={styles.rewardsText}>{user.rewardPoints} điểm</Text>
          </Pressable>

          {/* Bell with red notification dot */}
          <Pressable
            style={({ pressed }) => [styles.bellBtn, pressed && styles.pressed]}
            onPress={onOpenNotifications}
          >
            <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
            {unreadNotificationsCount > 0 && <View style={styles.redDot} />}
          </Pressable>
        </View>
      </View>

      {/* ── 2. Search Bar: Khối input bo cong tròn nền trắng ────────── */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#0284C7" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Gần 100 dịch vụ Quý khách đang cần"
          placeholderTextColor="#94A3B8"
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => onSearchChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </Pressable>
        )}
      </View>

      {/* ── Modal chọn khu vực (District Picker) ─────────────────── */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsModalOpen(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn khu vực phục vụ</Text>
              <Pressable onPress={() => setIsModalOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color="#64748B" />
              </Pressable>
            </View>

            <FlatList
              data={DISTRICT_LIST}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = item === selectedDistrict;
                return (
                  <Pressable
                    style={[styles.districtItem, isSelected && styles.districtItemSelected]}
                    onPress={() => {
                      onDistrictChange(item);
                      setIsModalOpen(false);
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
                    {isSelected && <Ionicons name="checkmark" size={18} color="#0284C7" />}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 14,
    paddingBottom: 22,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
  districtSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  districtText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    maxWidth: 160,
  },
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  rewardsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
  },
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  redDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
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
    color: '#1E293B',
    paddingVertical: 0,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: 380,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  districtItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  districtItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  districtItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  districtItemTextSelected: {
    fontWeight: '700',
    color: '#0284C7',
  },
});

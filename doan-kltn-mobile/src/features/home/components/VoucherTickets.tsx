/**
 * @file VoucherTickets.tsx
 * @description Thẻ voucher ưu đãi phong cách vé răng cưa / khoét khuyết tròn hai bên mép cho React Native FixGo.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { VoucherItem } from '../types/home.types';

interface VoucherTicketsProps {
  vouchers: VoucherItem[];
  onClaimVoucher: (voucherId: string) => void;
  onOpenWallet?: () => void;
}

/**
 * Component `VoucherTickets`
 */
export default function VoucherTickets({
  vouchers,
  onClaimVoucher,
  onOpenWallet,
}: VoucherTicketsProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="pricetag" size={16} color="#EA580C" style={{ marginRight: 6 }} />
          <Text style={styles.title}>Ưu đãi cho bạn</Text>
        </View>

        {onOpenWallet && (
          <Pressable
            style={({ pressed }) => [styles.walletBtn, pressed && styles.pressed]}
            onPress={onOpenWallet}
          >
            <Text style={styles.walletText}>Ví voucher</Text>
            <Ionicons name="arrow-forward" size={12} color="#0284C7" />
          </Pressable>
        )}
      </View>

      {/* Horizontal Voucher List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {vouchers.map((voucher) => {
          const isOrange = voucher.theme === 'orange';
          const gradientColors = isOrange
            ? (['#EA580C', '#F59E0B'] as [string, string])
            : (['#2563EB', '#0284C7'] as [string, string]);

          return (
            <View key={voucher.id} style={styles.ticketOuterWrapper}>
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ticketCard}
              >
                {/* Left semi-circle cutout notch */}
                <View style={styles.leftNotch} />
                {/* Right semi-circle cutout notch */}
                <View style={styles.rightNotch} />

                {/* Left Info Group */}
                <View style={styles.ticketLeftInfo}>
                  <View style={styles.codeTag}>
                    <Ionicons name="sparkles" size={10} color="#FDE68A" style={{ marginRight: 3 }} />
                    <Text style={styles.codeText}>{voucher.code}</Text>
                  </View>

                  <Text style={styles.ticketTitle} numberOfLines={1}>
                    {voucher.title}
                  </Text>
                  <Text style={styles.ticketSubtitle} numberOfLines={1}>
                    {voucher.subtitle}
                  </Text>
                  <Text style={styles.ticketExpiry}>{voucher.expiryDate}</Text>
                </View>

                {/* Dashed Separator */}
                <View style={styles.dashedLine} />

                {/* Right Action Button */}
                <View style={styles.ticketRightAction}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.claimBtn,
                      voucher.isClaimed && styles.claimBtnClaimed,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => onClaimVoucher(voucher.id)}
                    disabled={voucher.isClaimed}
                  >
                    <Text
                      style={[
                        styles.claimText,
                        voucher.isClaimed
                          ? styles.claimTextClaimed
                          : isOrange
                          ? styles.claimTextOrange
                          : styles.claimTextBlue,
                      ]}
                    >
                      {voucher.isClaimed ? 'Đã lưu' : 'Dùng ngay'}
                    </Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  walletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  walletText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  scrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  ticketOuterWrapper: {
    width: 275,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  leftNotch: {
    position: 'absolute',
    left: -10,
    top: '50%',
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  rightNotch: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  ticketLeftInfo: {
    flex: 1,
    paddingRight: 10,
  },
  codeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  codeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FEF08A',
    letterSpacing: 0.5,
  },
  ticketTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  ticketSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  ticketExpiry: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
    fontStyle: 'italic',
  },
  dashedLine: {
    width: 1,
    height: '80%',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed',
    marginRight: 12,
  },
  ticketRightAction: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  claimBtnClaimed: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  claimText: {
    fontSize: 11,
    fontWeight: '800',
  },
  claimTextOrange: {
    color: '#EA580C',
  },
  claimTextBlue: {
    color: '#2563EB',
  },
  claimTextClaimed: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});

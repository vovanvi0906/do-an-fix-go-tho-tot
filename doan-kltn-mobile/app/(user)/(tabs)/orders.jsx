/**
 * @file orders.jsx
 * @description Màn hình Lịch sử công việc (Đơn hàng của khách hàng)
 * Thiết kế chuẩn hóa theo phong cách giao diện giao dịch VietinBank iPay:
 * - Nhóm đơn hàng theo ngày rõ ràng (24/09/2026, 23/09/2026...)
 * - Khung Card bo góc 16px thanh lịch, các mục cùng ngày được phân cách bởi nét đứt mỏng
 * - Phân bố 2 cột khoa học không bao giờ bị tràn viền hay đè chữ:
 *   + Cột trái: Mã đơn (#...), Tên dịch vụ cụ thể, Thời gian hẹn, Địa chỉ
 *   + Cột phải: Dự toán giá, Badge trạng thái bo tròn (Chờ duyệt, Đã xác nhận, Hoàn thành...)
 *   + Mũi tên chevron-forward (>) sang trọng
 * - Bấm vào bất kỳ đâu trên thẻ -> Mở ngay màn hình Chi tiết đơn hàng không bị lag
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderStorage } from '../../../src/services/storage/orderStorage';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ordered'); // 'ordered' (Đã đặt) | 'done' (Đã làm)
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const list = await orderStorage.getAllOrders();
      setOrders(list);
    } catch (err) {
      console.error('❌ [OrderHistory] Lỗi tải đơn hàng:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    // Tự động kiểm tra cập nhật trạng thái đếm ngược 20 phút mỗi 10 giây
    const interval = setInterval(() => {
      loadOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadOrders();
  };

  // Xác định badge trạng thái chuẩn màu sắc & thông tin
  const getStatusBadge = (item) => {
    const st = String(item?.status || '').toUpperCase();

    if (st === 'AWAITING_CONFIRM' || st === 'PENDING_ADMIN') {
      const createdTime = new Date(item.createdAt || item.submittedAt || Date.now()).getTime();
      const elapsedMins = Math.floor((Date.now() - createdTime) / 60000);
      const remainingMins = Math.max(0, 20 - elapsedMins);

      if (remainingMins === 0) {
        return {
          text: 'Quá hạn 20p',
          type: 'expired',
          isExpired: true,
        };
      }

      return {
        text: `Chờ duyệt (${remainingMins}p)`,
        type: 'pending',
        isPending: true,
        remainingMins,
      };
    }

    if (st === 'EXPIRED') {
      return { text: 'Quá 20p', type: 'expired', isExpired: true };
    }

    if (st === 'REJECTED') {
      return { text: 'Từ chối', type: 'expired', isExpired: true };
    }

    if (st === 'MATCHED' || st === 'WORKER_EN_ROUTE' || st === 'ARRIVED') {
      return { text: 'Đã xác nhận', type: 'success' };
    }

    if (st === 'IN_PROGRESS') {
      return { text: 'Đang làm', type: 'progress' };
    }

    if (st === 'COMPLETED' || st === 'PAID') {
      return { text: 'Hoàn thành', type: 'done' };
    }

    if (st === 'CANCELLED') {
      return { text: 'Đã hủy', type: 'cancelled' };
    }

    return { text: 'Đang tìm thợ', type: 'searching' };
  };

  // Lọc theo 2 Tab: Đã đặt vs Đã làm
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const badge = getStatusBadge(order);
      const st = String(order.status || '').toUpperCase();
      const isFinished =
        st === 'COMPLETED' ||
        st === 'PAID' ||
        st === 'CANCELLED' ||
        st === 'EXPIRED' ||
        st === 'REJECTED' ||
        badge.isExpired;

      return activeTab === 'ordered' ? !isFinished : isFinished;
    });
  }, [orders, activeTab]);

  // Nhóm đơn hàng theo ngày kiểu VietinBank iPay (24/09/2026, 23/09/2026...)
  const groupedOrders = useMemo(() => {
    const groups = {};
    filteredOrders.forEach((order) => {
      let dateKey = '';
      if (order.createdAt) {
        const d = new Date(order.createdAt);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        dateKey = `${day}/${month}/${year}`;
      } else if (order.scheduledAt && order.scheduledAt.includes('-')) {
        // Lấy từ scheduledAt dạng 25-09-2026
        const parts = order.scheduledAt.split('(')[0]?.trim().replace(/-/g, '/');
        dateKey = parts || 'Gần đây';
      } else {
        dateKey = 'Hôm nay';
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(order);
    });
    return groups;
  }, [filteredOrders]);

  // Điều hướng xem chi tiết đơn hàng (luôn truyền đầy đủ params)
  const handleOpenOrderDetail = (item) => {
    console.log('⚡ [OrderHistory] Mở chi tiết đơn hàng:', item.id, item.orderCode);
    router.push({
      pathname: '/(user)/order/[id]',
      params: {
        id: item.id,
        orderCode: item.orderCode,
        title: item.title || item.serviceName,
        serviceName: item.serviceName || item.title,
        addressText: item.addressText,
        scheduledAt: item.scheduledAt,
        price: String(item.price || 150000),
        status: item.status,
        isCustomService: item.isCustomService ? 'true' : 'false',
        createdAt: item.createdAt,
        note: item.note || '',
      },
    });
  };

  const dateKeys = Object.keys(groupedOrders);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header VietinBank Style: Lịch sử công việc ─────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử công việc</Text>
      </View>

      {/* ── 2 Tabs Đã đặt vs Đã làm ────────────────────────────────── */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ordered' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ordered')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'ordered' && styles.tabTextActive]}>
            Đã đặt
          </Text>
          {activeTab === 'ordered' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'done' && styles.tabBtnActive]}
          onPress={() => setActiveTab('done')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'done' && styles.tabTextActive]}>
            Đã làm
          </Text>
          {activeTab === 'done' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* ── Danh sách đơn hàng theo phong cách VietinBank ───────────── */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Đang tải lịch sử đơn hàng...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#0284C7']}
              tintColor="#0284C7"
            />
          }
        >
          {dateKeys.length > 0 ? (
            dateKeys.map((dateKey) => (
              <View key={dateKey} style={styles.dateGroupSection}>
                {/* Tiêu đề Ngày tháng phong cách VietinBank (24/09/2026) */}
                <Text style={styles.dateGroupHeader}>{dateKey}</Text>

                {/* Khung Card bọc danh sách giao dịch cùng ngày */}
                <View style={styles.groupCardContainer}>
                  {groupedOrders[dateKey].map((item, index) => {
                    const badge = getStatusBadge(item);
                    const isLast = index === groupedOrders[dateKey].length - 1;

                    return (
                      <React.Fragment key={item.id}>
                        <TouchableOpacity
                          style={styles.orderRowTouch}
                          activeOpacity={0.65}
                          onPress={() => handleOpenOrderDetail(item)}
                        >
                          {/* Cột trái: Thông tin dịch vụ & Thời gian */}
                          <View style={styles.leftColumn}>
                            <Text style={styles.orderCodeText}>
                              {item.orderCode || `#${String(item.id).slice(0, 10)}`}
                            </Text>

                            <Text style={styles.serviceTitle} numberOfLines={2}>
                              {item.title || item.serviceName || 'Dịch vụ sửa chữa'}
                            </Text>

                            <View style={styles.metaRow}>
                              <Ionicons name="time-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
                              <Text style={styles.metaText} numberOfLines={1}>
                                {item.scheduledAt || 'Cần thợ gấp'}
                              </Text>
                            </View>

                            <View style={styles.metaRow}>
                              <Ionicons name="location-outline" size={13} color="#94A3B8" style={{ marginRight: 4 }} />
                              <Text style={styles.addressText} numberOfLines={1}>
                                {item.addressText || '606/20, Hiệp Bình, Hồ Chí Minh'}
                              </Text>
                            </View>
                          </View>

                          {/* Cột phải: Giá tiền & Status Pill */}
                          <View style={styles.rightColumn}>
                            <Text style={styles.priceAmount}>
                              {item.price ? `${Number(item.price).toLocaleString('vi-VN')} đ` : 'Báo giá sau'}
                            </Text>

                            <View
                              style={[
                                styles.statusBadgePill,
                                badge.type === 'pending' && styles.badgeAmber,
                                badge.type === 'success' && styles.badgeGreen,
                                badge.type === 'progress' && styles.badgeBlue,
                                badge.type === 'done' && styles.badgeGreen,
                                badge.type === 'cancelled' && styles.badgeRed,
                                badge.type === 'expired' && styles.badgeRed,
                                badge.type === 'searching' && styles.badgeBlue,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  badge.type === 'pending' && styles.badgeTextAmber,
                                  badge.type === 'success' && styles.badgeTextGreen,
                                  badge.type === 'progress' && styles.badgeTextBlue,
                                  badge.type === 'done' && styles.badgeTextGreen,
                                  badge.type === 'cancelled' && styles.badgeTextRed,
                                  badge.type === 'expired' && styles.badgeTextRed,
                                  badge.type === 'searching' && styles.badgeTextBlue,
                                ]}
                                numberOfLines={1}
                              >
                                {badge.text}
                              </Text>
                            </View>
                          </View>

                          {/* Mũi tên Chevron VietinBank */}
                          <View style={styles.chevronBox}>
                            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                          </View>
                        </TouchableOpacity>

                        {/* Đường kẻ phân cách giữa các item cùng ngày */}
                        {!isLast && <View style={styles.itemDivider} />}
                      </React.Fragment>
                    );
                  })}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="receipt-outline" size={44} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'ordered' ? 'Chưa có đơn hàng nào' : 'Chưa có đơn hoàn thành'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'ordered'
                  ? 'Mọi yêu cầu đặt thợ của bạn sẽ được lưu trữ và theo dõi tại đây'
                  : 'Lịch sử các công việc đã thực hiện thành công sẽ lưu tại đây'}
              </Text>
              {activeTab === 'ordered' && (
                <TouchableOpacity
                  style={styles.createOrderBtn}
                  onPress={() => router.push('/(user)/booking/create-booking')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.createOrderBtnText}>Đặt dịch vụ ngay</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    position: 'relative',
  },
  tabBtnActive: {},
  tabText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0284C7', // Xanh dương FixGo
    fontWeight: '700',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 24,
    right: 24,
    height: 3,
    backgroundColor: '#0284C7',
    borderRadius: 2,
  },
  scrollList: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },

  // ─── VietinBank Group Section ───────────────────────────────
  dateGroupSection: {
    gap: 6,
  },
  dateGroupHeader: {
    fontSize: 13.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#64748B',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  groupCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  orderRowTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },

  // ─── Cột trái ───────────────────────────────────────────────
  leftColumn: {
    flex: 1,
    paddingRight: 12,
  },
  orderCodeText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 4,
  },
  serviceTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
    flex: 1,
  },
  addressText: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
    flex: 1,
  },

  // ─── Cột phải (Giá tiền & Badge trạng thái) ─────────────────
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 6,
    minWidth: 95,
  },
  priceAmount: {
    fontSize: 14.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'right',
  },
  statusBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },

  // Màu sắc Badge trạng thái
  badgeAmber: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  badgeTextAmber: {
    color: '#D97706',
  },
  badgeGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgeTextGreen: {
    color: '#059669',
  },
  badgeBlue: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  badgeTextBlue: {
    color: '#0284C7',
  },
  badgeRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  badgeTextRed: {
    color: '#DC2626',
  },

  chevronBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Trạng thái rỗng / Tải ─────────────────────────────────
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 8,
  },
  createOrderBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 4,
  },
  createOrderBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

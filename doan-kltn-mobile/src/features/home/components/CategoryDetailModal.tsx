/**
 * @file CategoryDetailModal.tsx
 * @description Modal Bottom Sheet danh sách chi tiết các dịch vụ con thuộc danh mục.
 * Tông màu XANH DƯƠNG chủ đạo của ứng dụng FixGo (#0284C7 / #0084FF).
 * - Bỏ 2 tab Dân dụng / Công nghiệp (danh sách phẳng, tinh gọn)
 * - Bỏ tag "Giảm giá 50k"
 * - Icon cờ lê xanh dương trong squircle xanh pastel
 * - Tìm kiếm dịch vụ thời gian thực
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CategoryItem } from '../types/home.types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface SubServiceItem {
  id: string;
  name: string;
  basePrice?: number;
  unit?: string;
  categorySlug: string;
  categoryName: string;
}

interface CategoryDetailModalProps {
  visible: boolean;
  category: CategoryItem | null;
  onClose: () => void;
  onSelectSubService: (subService: SubServiceItem) => void;
}

// ─── Danh mục dịch vụ con đầy đủ theo tông xanh dương ────────────────────
const SUB_SERVICES_CATALOG: Record<string, SubServiceItem[]> = {
  // 1. Điện nước
  'sua-dien': [
    { id: 'sd-01', name: 'Sửa điện tại nhà', categorySlug: 'sua-dien', categoryName: 'Điện nước', basePrice: 150000, unit: 'lần' },
    { id: 'sd-02', name: 'Xử lý mất điện khẩn cấp', categorySlug: 'sua-dien', categoryName: 'Điện nước', basePrice: 180000, unit: 'lần' },
    { id: 'sd-03', name: 'Xử lý chập điện, nhảy aptomat (CB)', categorySlug: 'sua-dien', categoryName: 'Điện nước', basePrice: 150000, unit: 'lần' },
    { id: 'sd-04', name: 'Kiểm tra, xử lý rò rỉ điện', categorySlug: 'sua-dien', categoryName: 'Điện nước', basePrice: 160000, unit: 'lần' },
    { id: 'sd-05', name: 'Lắp đặt, thay thế bóng đèn, ổ cắm, quạt trần', categorySlug: 'sua-dien', categoryName: 'Điện nước', basePrice: 120000, unit: 'lần' },
    { id: 'sd-06', name: 'Sửa chữa đường ống nước rò rỉ, bục vỡ', categorySlug: 'sua-dien', categoryName: 'Điện nước', basePrice: 180000, unit: 'lần' },
    { id: 'sd-07', name: 'Thông tắc lavabo, bồn cầu, chậu rửa bát', categorySlug: 'sua-dien', categoryName: 'Điện nước', basePrice: 200000, unit: 'lần' },
    { id: 'sd-08', name: 'Lắp đặt, thay mới vòi sen, vòi nước, van khóa', categorySlug: 'sua-dien', categoryName: 'Điện nước', basePrice: 130000, unit: 'lần' },
    { id: 'sd-09', name: 'Sửa chữa, lắp đặt máy bơm nước gia đình', categorySlug: 'sua-dien', categoryName: 'Điện nước', basePrice: 220000, unit: 'lần' },
    { id: 'sd-10', name: 'Thi công hệ thống điện mạng âm tường', categorySlug: 'sua-dien', categoryName: 'Điện nước', basePrice: 400000, unit: 'gói' },
  ],
  'sua-nuoc': [
    { id: 'sn-01', name: 'Sửa đường ống nước rò rỉ âm tường', categorySlug: 'sua-nuoc', categoryName: 'Sửa nước', basePrice: 250000, unit: 'lần' },
    { id: 'sn-02', name: 'Thông nghẹt đường ống thoát nước, cống sàn', categorySlug: 'sua-nuoc', categoryName: 'Sửa nước', basePrice: 200000, unit: 'lần' },
    { id: 'sn-03', name: 'Thay thế phao cơ, phao điện bồn nước', categorySlug: 'sua-nuoc', categoryName: 'Sửa nước', basePrice: 150000, unit: 'lần' },
    { id: 'sn-04', name: 'Vệ sinh, súc rửa bồn nước, bể nước ngầm', categorySlug: 'sua-nuoc', categoryName: 'Sửa nước', basePrice: 350000, unit: 'bồn' },
    { id: 'sn-05', name: 'Lắp đặt vòi sen tắm, vòi chậu rửa chén', categorySlug: 'sua-nuoc', categoryName: 'Sửa nước', basePrice: 150000, unit: 'lần' },
  ],
  // 2. Điện lạnh
  'dien-lanh': [
    { id: 'dl-01', name: 'Vệ sinh máy lạnh treo tường (1.0 - 2.5 HP)', categorySlug: 'dien-lanh', categoryName: 'Điện lạnh', basePrice: 150000, unit: 'bộ' },
    { id: 'dl-02', name: 'Nạp gas bổ sung máy lạnh R32 / R410A', categorySlug: 'dien-lanh', categoryName: 'Điện lạnh', basePrice: 250000, unit: 'lần' },
    { id: 'dl-03', name: 'Sửa máy lạnh chảy nước, không mát, kêu to', categorySlug: 'dien-lanh', categoryName: 'Điện lạnh', basePrice: 180000, unit: 'lần' },
    { id: 'dl-04', name: 'Tháo lắp, di dời máy lạnh sang vị trí mới', categorySlug: 'dien-lanh', categoryName: 'Điện lạnh', basePrice: 300000, unit: 'bộ' },
    { id: 'dl-05', name: 'Vệ sinh & bảo dưỡng máy giặt lồng đứng / lồng ngang', categorySlug: 'dien-lanh', categoryName: 'Điện lạnh', basePrice: 220000, unit: 'máy' },
    { id: 'dl-06', name: 'Sửa chữa tủ lạnh không đông đá, hỏng lốc', categorySlug: 'dien-lanh', categoryName: 'Điện lạnh', basePrice: 250000, unit: 'lần' },
  ],
  // 3. Thiết bị
  'thiet-bi': [
    { id: 'tb-01', name: 'Sửa bình nóng lạnh trực tiếp / gián tiếp', categorySlug: 'thiet-bi', categoryName: 'Thiết bị', basePrice: 180000, unit: 'máy' },
    { id: 'tb-02', name: 'Sửa máy nước nóng năng lượng mặt trời', categorySlug: 'thiet-bi', categoryName: 'Thiết bị', basePrice: 250000, unit: 'lần' },
    { id: 'tb-03', name: 'Sửa bếp từ, bếp hồng ngoại đơn / đôi', categorySlug: 'thiet-bi', categoryName: 'Thiết bị', basePrice: 150000, unit: 'bếp' },
    { id: 'tb-04', name: 'Sửa máy lọc nước RO, thay lõi lọc tại nhà', categorySlug: 'thiet-bi', categoryName: 'Thiết bị', basePrice: 120000, unit: 'lần' },
    { id: 'tb-05', name: 'Lắp đặt quạt trần, quạt thông gió', categorySlug: 'thiet-bi', categoryName: 'Thiết bị', basePrice: 140000, unit: 'cái' },
    { id: 'tb-06', name: 'Sửa lò vi sóng, lò nướng, nồi chiên không dầu', categorySlug: 'thiet-bi', categoryName: 'Thiết bị', basePrice: 140000, unit: 'máy' },
  ],
  // 4. Làm vườn
  'lam-vuon': [
    { id: 'lv-01', name: 'Cắt tỉa cây cảnh, tạo dáng bonsai sân vườn', categorySlug: 'lam-vuon', categoryName: 'Làm vườn', basePrice: 180000, unit: 'giờ' },
    { id: 'lv-02', name: 'Thiết kế, lắp đặt hệ thống tưới nhỏ giọt tự động', categorySlug: 'lam-vuon', categoryName: 'Làm vườn', basePrice: 350000, unit: 'gói' },
    { id: 'lv-03', name: 'Trồng cỏ, cải tạo đất, dọn dẹp khuôn viên vườn', categorySlug: 'lam-vuon', categoryName: 'Làm vườn', basePrice: 160000, unit: 'giờ' },
    { id: 'lv-04', name: 'Phun thuốc phòng trừ sâu bệnh cây xanh', categorySlug: 'lam-vuon', categoryName: 'Làm vườn', basePrice: 200000, unit: 'lần' },
  ],
  // 5. Giúp việc
  'giup-viec': [
    { id: 'gv-01', name: 'Dọn dẹp nhà cửa theo giờ', categorySlug: 'giup-viec', categoryName: 'Giúp việc', basePrice: 80000, unit: 'giờ' },
    { id: 'gv-02', name: 'Tổng vệ sinh nhà ở mới xây / sau sửa chữa', categorySlug: 'giup-viec', categoryName: 'Giúp việc', basePrice: 350000, unit: 'buổi' },
    { id: 'gv-03', name: 'Vệ sinh sofa, đệm, rèm cửa bằng máy hơi nước', categorySlug: 'giup-viec', categoryName: 'Giúp việc', basePrice: 250000, unit: 'bộ' },
    { id: 'gv-04', name: 'Nấu ăn gia đình theo yêu cầu', categorySlug: 'giup-viec', categoryName: 'Giúp việc', basePrice: 150000, unit: 'buổi' },
  ],
  // 6. Bảng giá & Dịch vụ khác
  'bang-gia': [
    { id: 'bg-01', name: 'Tư vấn & Khảo sát báo giá trọn gói miễn phí', categorySlug: 'bang-gia', categoryName: 'Bảng giá', basePrice: 0, unit: 'lần' },
    { id: 'bg-02', name: 'Sửa khóa cửa, thay ổ khóa vân tay điện tử', categorySlug: 'bang-gia', categoryName: 'Bảng giá', basePrice: 180000, unit: 'lần' },
    { id: 'bg-03', name: 'Chống thấm dột mái tôn, sàn mái sân thượng', categorySlug: 'bang-gia', categoryName: 'Bảng giá', basePrice: 300000, unit: 'm2' },
  ],
  'dich-vu-khac': [
    { id: 'dvk-01', name: 'Sửa khóa cửa, mở khóa khẩn cấp 24/7', categorySlug: 'dich-vu-khac', categoryName: 'Dịch vụ khác', basePrice: 180000, unit: 'lần' },
    { id: 'dvk-02', name: 'Chống thấm dột mái tôn, seno, ban công', categorySlug: 'dich-vu-khac', categoryName: 'Dịch vụ khác', basePrice: 300000, unit: 'm2' },
    { id: 'dvk-03', name: 'Hàn xì sắt thép, sửa cửa sắt, lan can, hàng rào', categorySlug: 'dich-vu-khac', categoryName: 'Dịch vụ khác', basePrice: 200000, unit: 'lần' },
    { id: 'dvk-04', name: 'Sơn sửa nhà, dặm vá tường bong tróc', categorySlug: 'dich-vu-khac', categoryName: 'Dịch vụ khác', basePrice: 250000, unit: 'lần' },
  ],
};

export default function CategoryDetailModal({
  visible,
  category,
  onClose,
  onSelectSubService,
}: CategoryDetailModalProps) {
  const [searchText, setSearchText] = useState('');

  const currentCategorySlug = category?.slug || 'sua-dien';
  const categoryDisplayName = category?.name || 'Điện nước';

  const subServices = useMemo(() => {
    const list = SUB_SERVICES_CATALOG[currentCategorySlug] || SUB_SERVICES_CATALOG['sua-dien'];
    return list.filter((item) => {
      return (
        searchText.trim() === '' ||
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
    });
  }, [currentCategorySlug, searchText]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Thanh gạt trên cùng (Handle Bar) */}
          <View style={styles.handleBarContainer}>
            <View style={styles.handleBar} />
          </View>

          {/* Header Danh mục - Tông Xanh Dương FixGo */}
          <View style={styles.headerRow}>
            {/* Mascot Avatar Thợ FixGo (Nền xanh pastel) */}
            <View style={styles.mascotBox}>
              <Ionicons name="construct" size={24} color="#0284C7" />
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.categoryTitle}>{categoryDisplayName}</Text>
              <Text style={styles.categorySubtitle}>Dịch vụ chuyên nghiệp • Thợ uy tín xác thực</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Ô tìm kiếm dịch vụ */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#0284C7" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm dịch vụ cần làm..."
              placeholderTextColor="#94A3B8"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Gợi ý tìm kiếm */}
          <Text style={styles.searchHintText}>
            Gợi ý: máy lạnh, máy giặt, tủ lạnh, đèn, điện, ống nước, lavabo, bồn cầu, máy bơm...
          </Text>

          {/* Danh sách các dịch vụ con (Tông xanh dương sạch đẹp) */}
          <ScrollView
            style={styles.servicesList}
            contentContainerStyle={styles.servicesListContent}
            showsVerticalScrollIndicator={false}
          >
            {subServices.length > 0 ? (
              <>
                {subServices.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.serviceCard}
                    activeOpacity={0.7}
                    onPress={() => onSelectSubService(item)}
                  >
                    <View style={styles.cardLeft}>
                      {/* Icon cờ lê xanh trong nền xanh nhạt pastel */}
                      <View style={styles.iconWrenchBox}>
                        <Ionicons name="build" size={18} color="#0284C7" />
                      </View>
                      <Text style={styles.serviceNameText}>{item.name}</Text>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color="#0284C7" />
                  </TouchableOpacity>
                ))}

                {/* Thẻ gợi ý đặt dịch vụ theo yêu cầu riêng nếu không thấy trong danh sách */}
                <TouchableOpacity
                  style={styles.otherServiceFooterCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    onSelectSubService({
                      id: 'custom-sub',
                      name: '',
                      categorySlug: 'dich-vu-khac',
                      categoryName: 'Dịch vụ khác',
                    })
                  }
                >
                  <View style={styles.otherServiceLeft}>
                    <View style={styles.otherServiceIconBox}>
                      <Ionicons name="sparkles" size={16} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.otherServiceTitle}>Không có dịch vụ bạn cần?</Text>
                      <Text style={styles.otherServiceSub}>Bấm vào đây để tự nhập dịch vụ theo yêu cầu</Text>
                    </View>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#0284C7" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={36} color="#CBD5E1" />
                <Text style={styles.emptyText}>Không tìm thấy dịch vụ phù hợp</Text>
                <TouchableOpacity
                  style={styles.requestCustomBtn}
                  onPress={() =>
                    onSelectSubService({
                      id: 'custom-sub',
                      name: searchText.trim(),
                      categorySlug: 'dich-vu-khac',
                      categoryName: 'Dịch vụ khác',
                    })
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.requestCustomBtnText}>
                    {searchText.trim()
                      ? `Đặt dịch vụ "${searchText.trim()}" theo yêu cầu`
                      : 'Đặt dịch vụ khác theo yêu cầu riêng'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.65,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 20,
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  mascotBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E0F2FE', // Xanh pastel FixGo
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  headerInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 12.5,
    fontFamily: 'Inter_500Medium',
    color: '#0284C7', // Xanh thương hiệu
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#BAE6FD', // Viền xanh pastel
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'Inter_400Regular',
    color: '#0F172A',
  },
  searchHintText: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 14,
  },
  servicesList: {
    flex: 1,
  },
  servicesListContent: {
    paddingBottom: 20,
    gap: 10,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconWrenchBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E0F2FE', // Nền xanh pastel
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceNameText: {
    fontSize: 14.5,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13.5,
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
  },
  requestCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  requestCustomBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  otherServiceFooterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 6,
  },
  otherServiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 10,
  },
  otherServiceIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otherServiceTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0369A1',
  },
  otherServiceSub: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    color: '#0284C7',
    marginTop: 1,
  },
});

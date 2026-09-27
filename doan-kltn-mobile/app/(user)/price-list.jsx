/**
 * @file price-list.jsx
 * @description Màn hình Bảng giá dịch vụ minh bạch chuẩn FixGo.
 * Hỗ trợ duyệt 3 cấp độ mượt mà cho TẤT CẢ các dịch vụ app FixGo đang có:
 * - Cấp 1: Danh sách tất cả 8 nhóm dịch vụ chính (Điện nước, Sửa điện, Điện lạnh, Thiết bị, Giúp việc, Làm vườn, Cơ khí, Khóa cửa)
 * - Cấp 2: Danh sách các thư mục hạng mục con (Bồn nước, Bồn cầu, Thông nghẹt, Máy bơm, Máy lạnh, Bếp từ, Cắt tỉa...)
 * - Cấp 3: Chi tiết đơn giá cụ thể (Tên công việc, Đơn vị tính, Khoảng giá thị trường minh bạch)
 *
 * Tông màu XANH DƯƠNG thương hiệu FixGo (#0284C7 / #0084FF)
 * Bấm vào bất kỳ dịch vụ nào -> Chuyển thẳng sang Đặt lịch với dịch vụ đó
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Dữ liệu bảng giá chuẩn hóa TOÀN BỘ 8 NHÓM DỊCH VỤ CỦA FIXGO ───────────
const PRICING_CATALOG = [
  // 1. SỬA ĐIỆN
  {
    id: 'grp-sua-dien',
    name: 'Sửa điện',
    subtitle: 'Khắc phục chập cháy, thiết bị chiếu sáng, đi dây',
    iconName: 'flash-outline',
    categories: [
      {
        id: 'sd-cat-01',
        name: 'Sự cố & Chập điện khẩn cấp',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'sd-i-01', name: 'Xử lý chập điện ngầm, nhảy aptomat (CB)', unit: 'lần', price: '150.000 - 300.000', basePrice: 150000 },
          { id: 'sd-i-02', name: 'Khắc phục mất điện toàn nhà đột ngột', unit: 'lần', price: '180.000 - 350.000', basePrice: 180000 },
          { id: 'sd-i-03', name: 'Kiểm tra rò rỉ điện ra tường / vỏ máy', unit: 'lần', price: '160.000 - 280.000', basePrice: 160000 },
          { id: 'sd-i-04', name: 'Thay thế Aptomat (CB) tép, chống giật', unit: 'cái', price: '120.000 - 200.000', basePrice: 120000 },
        ],
      },
      {
        id: 'sd-cat-02',
        name: 'Lắp đặt đèn & Thiết bị điện',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'sd-i-05', name: 'Lắp đặt bóng đèn tuýp LED, đèn ốp trần', unit: 'bộ', price: '80.000 - 150.000', basePrice: 80000 },
          { id: 'sd-i-06', name: 'Lắp đèn chùm, đèn thả trang trí phòng khách', unit: 'bộ', price: '250.000 - 500.000', basePrice: 250000 },
          { id: 'sd-i-07', name: 'Thay thế ổ cắm, công tắc âm tường', unit: 'cái', price: '60.000 - 120.000', basePrice: 60000 },
          { id: 'sd-i-08', name: 'Lắp đặt đồng hồ điện phụ (công tơ điện)', unit: 'bộ', price: '180.000 - 300.000', basePrice: 180000 },
        ],
      },
      {
        id: 'sd-cat-03',
        name: 'Đi dây điện & Cáp mạng LAN',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'sd-i-09', name: 'Đi ống nẹp dây điện nổi an toàn', unit: 'mét tới', price: '25.000 - 45.000', basePrice: 150000 },
          { id: 'sd-i-10', name: 'Kéo dây điện nguồn tải máy lạnh, bếp từ', unit: 'mét', price: '30.000 - 55.000', basePrice: 150000 },
          { id: 'sd-i-11', name: 'Kéo cáp mạng LAN, bấm đầu hạt mạng RJ45', unit: 'điểm', price: '100.000 - 180.000', basePrice: 100000 },
        ],
      },
    ],
  },

  // 2. ĐIỆN NƯỚC (BỒN NƯỚC, BỒN CẦU, MÁY BƠM, THÔNG NGHẸT, DÒ TÌM...)
  {
    id: 'grp-dien-nuoc',
    name: 'Điện nước',
    subtitle: 'Bồn nước, bồn cầu, máy bơm, thông nghẹt, dò rò rỉ',
    iconName: 'water-outline',
    categories: [
      {
        id: 'dn-01',
        name: 'Bồn nước & Vệ sinh bể',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'bn-01', name: 'Vệ sinh bồn nước dưới 500 lít', unit: 'cái', price: '270.000 - 380.000', basePrice: 270000 },
          { id: 'bn-02', name: 'Vệ sinh bồn nước 500 lít - 1000 lít', unit: 'cái', price: '380.000 - 485.000', basePrice: 380000 },
          { id: 'bn-03', name: 'Vệ sinh bồn nước 1500 lít - 2000 lít', unit: 'cái', price: '485.000 - 595.000', basePrice: 485000 },
          { id: 'bn-04', name: 'Vệ sinh bồn nước 2000 lít - 5000 lít', unit: 'cái', price: '540.000 - 700.000', basePrice: 540000 },
          { id: 'bn-05', name: 'Vệ sinh bồn nước trên 5000 lít', unit: 'cái', price: 'Khảo sát, báo giá miễn phí', basePrice: 600000 },
          { id: 'bn-06', name: 'Lắp đặt bồn nước mới trên mái nhà', unit: 'bồn', price: '350.000 - 600.000', basePrice: 350000 },
        ],
      },
      {
        id: 'dn-02',
        name: 'Bồn cầu & Thiết bị vệ sinh',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'bc-01', name: 'Thay bộ xả bồn cầu tay gạt / nút nhấn', unit: 'bộ', price: '150.000 - 250.000', basePrice: 150000 },
          { id: 'bc-02', name: 'Sửa bồn cầu rỉ nước chân cầu, chảy tràn', unit: 'lần', price: '120.000 - 200.000', basePrice: 120000 },
          { id: 'bc-03', name: 'Tháo dỡ, lắp đặt bồn cầu mới', unit: 'cái', price: '300.000 - 450.000', basePrice: 300000 },
          { id: 'bc-04', name: 'Thay nắp bồn cầu, vòi xịt vệ sinh', unit: 'bộ', price: '90.000 - 150.000', basePrice: 90000 },
          { id: 'bc-05', name: 'Lắp đặt bộ sen cây tắm nóng lạnh', unit: 'bộ', price: '200.000 - 350.000', basePrice: 200000 },
        ],
      },
      {
        id: 'dn-03',
        name: 'Pin năng lượng mặt trời',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'nlmt-01', name: 'Vệ sinh bề mặt tấm pin mặt trời', unit: 'tấm', price: '40.000 - 70.000', basePrice: 150000 },
          { id: 'nlmt-02', name: 'Bảo trì máy nước nóng NLMT gia đình', unit: 'máy', price: '350.000 - 550.000', basePrice: 350000 },
          { id: 'nlmt-03', name: 'Thay ron, ống thủy tinh chân không vỡ', unit: 'ống', price: '180.000 - 280.000', basePrice: 180000 },
        ],
      },
      {
        id: 'dn-04',
        name: 'Phao bồn nước',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'pbn-01', name: 'Thay phao cơ chống tràn bồn nước', unit: 'cái', price: '150.000 - 250.000', basePrice: 150000 },
          { id: 'pbn-02', name: 'Thay phao điện chống cháy máy bơm', unit: 'cái', price: '180.000 - 280.000', basePrice: 180000 },
          { id: 'pbn-03', name: 'Kéo dây điện nguồn cho phao tự động', unit: 'mét', price: '20.000 - 35.000', basePrice: 150000 },
        ],
      },
      {
        id: 'dn-05',
        name: 'Thông nghẹt đường ống',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'tn-01', name: 'Thông nghẹt lavabo, chậu rửa bát', unit: 'lần', price: '200.000 - 350.000', basePrice: 200000 },
          { id: 'tn-02', name: 'Thông nghẹt bồn cầu không đục phá', unit: 'lần', price: '350.000 - 550.000', basePrice: 350000 },
          { id: 'tn-03', name: 'Thông cống nghẹt bằng máy lò xo chuyên dụng', unit: 'mét tới', price: '100.000 - 180.000', basePrice: 300000 },
          { id: 'tn-04', name: 'Nạo vét hố ga, xử lý mùi hôi cống', unit: 'gói', price: '400.000 - 750.000', basePrice: 400000 },
        ],
      },
      {
        id: 'dn-06',
        name: 'Máy bơm nước',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'mb-01', name: 'Sửa máy bơm chạy không lên nước', unit: 'máy', price: '200.000 - 350.000', basePrice: 200000 },
          { id: 'mb-02', name: 'Lắp đặt máy bơm tăng áp gia đình', unit: 'cái', price: '250.000 - 400.000', basePrice: 250000 },
          { id: 'mb-03', name: 'Thay rơ le tự ngắt máy bơm tăng áp', unit: 'bộ', price: '180.000 - 300.000', basePrice: 180000 },
          { id: 'mb-04', name: 'Thay phốt cơ khí, thay vòng bi bạc đạn', unit: 'lần', price: '220.000 - 380.000', basePrice: 220000 },
        ],
      },
      {
        id: 'dn-07',
        name: 'Dò tìm rò rỉ nước',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'dt-01', name: 'Dò tìm rò rỉ nước ngầm bằng máy sóng âm', unit: 'nhà', price: '800.000 - 1.500.000', basePrice: 800000 },
          { id: 'dt-02', name: 'Sửa chữa đoạn ống bục vỡ sau khi dò', unit: 'điểm', price: '250.000 - 450.000', basePrice: 250000 },
          { id: 'dt-03', name: 'Kiểm tra tiền nước tăng đột biến', unit: 'lần', price: '200.000 - 350.000', basePrice: 200000 },
        ],
      },
      {
        id: 'dn-08',
        name: 'Máy lọc nước RO & Lõi lọc',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'll-01', name: 'Thay bộ 3 lõi lọc thô 1, 2, 3 máy RO', unit: 'bộ', price: '180.000 - 280.000', basePrice: 180000 },
          { id: 'll-02', name: 'Thay màng lọc RO Filmtec chính hãng', unit: 'lõi', price: '450.000 - 650.000', basePrice: 450000 },
          { id: 'll-03', name: 'Bảo dưỡng, đo chỉ số TDS nguồn nước', unit: 'lần', price: '80.000 - 120.000', basePrice: 80000 },
          { id: 'll-04', name: 'Sửa máy lọc nước không ngắt bơm, rỉ nước', unit: 'máy', price: '180.000 - 300.000', basePrice: 180000 },
        ],
      },
    ],
  },

  // 3. ĐIỆN LẠNH
  {
    id: 'grp-dien-lanh',
    name: 'Điện lạnh',
    subtitle: 'Máy lạnh, máy giặt, tủ lạnh, nạp gas bảo trì',
    iconName: 'snow-outline',
    categories: [
      {
        id: 'dl-01',
        name: 'Máy lạnh treo tường & Âm trần',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'ml-01', name: 'Vệ sinh máy lạnh treo tường (1.0 - 2.5 HP)', unit: 'bộ', price: '150.000 - 200.000', basePrice: 150000 },
          { id: 'ml-02', name: 'Nạp gas bổ sung R32 / R410A máy lạnh', unit: 'lần', price: '250.000 - 380.000', basePrice: 250000 },
          { id: 'ml-03', name: 'Tháo lắp, di dời máy lạnh sang vị trí mới', unit: 'bộ', price: '300.000 - 450.000', basePrice: 300000 },
          { id: 'ml-04', name: 'Xử lý máy lạnh chảy nước máng sau phòng ngủ', unit: 'lần', price: '150.000 - 220.000', basePrice: 150000 },
          { id: 'ml-05', name: 'Vệ sinh máy lạnh âm trần Cassette công nghiệp', unit: 'bộ', price: '350.000 - 550.000', basePrice: 350000 },
          { id: 'ml-06', name: 'Sửa bo mạch máy lạnh Inverter không chạy', unit: 'máy', price: '450.000 - 850.000', basePrice: 450000 },
        ],
      },
      {
        id: 'dl-02',
        name: 'Máy giặt & Tủ lạnh',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'mg-01', name: 'Vệ sinh máy giặt lồng đứng (tháo lồng khử khuẩn)', unit: 'máy', price: '250.000 - 350.000', basePrice: 250000 },
          { id: 'mg-02', name: 'Vệ sinh máy giặt lồng ngang cửa trước', unit: 'máy', price: '380.000 - 550.000', basePrice: 380000 },
          { id: 'mg-03', name: 'Sửa máy giặt vắt kêu to, không xả nước', unit: 'máy', price: '220.000 - 420.000', basePrice: 220000 },
          { id: 'tl-01', name: 'Sửa tủ lạnh không đông đá, rò rỉ nước', unit: 'máy', price: '250.000 - 450.000', basePrice: 250000 },
          { id: 'tl-02', name: 'Nạp gas tủ lạnh, thay sò lạnh, sensor nhiệt', unit: 'lần', price: '350.000 - 600.000', basePrice: 350000 },
        ],
      },
    ],
  },

  // 4. THIẾT BỊ GIA DỤNG
  {
    id: 'grp-thiet-bi',
    name: 'Thiết bị gia dụng',
    subtitle: 'Bình nóng lạnh, bếp từ, quạt trần, lò vi sóng',
    iconName: 'tv-outline',
    categories: [
      {
        id: 'tb-01',
        name: 'Bình nóng lạnh',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'bnl-01', name: 'Sửa bình nóng lạnh trực tiếp / gián tiếp', unit: 'máy', price: '180.000 - 320.000', basePrice: 180000 },
          { id: 'bnl-02', name: 'Vệ sinh súc rửa cặn canxi, thay thanh Magie', unit: 'bình', price: '200.000 - 300.000', basePrice: 200000 },
          { id: 'bnl-03', name: 'Lắp đặt bình nóng lạnh mới kèm chống giật ELCB', unit: 'bộ', price: '250.000 - 400.000', basePrice: 250000 },
        ],
      },
      {
        id: 'tb-02',
        name: 'Bếp từ & Bếp hồng ngoại',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'bt-01', name: 'Sửa bếp từ đơn / đôi báo lỗi E1, E2, E9', unit: 'bếp', price: '150.000 - 350.000', basePrice: 150000 },
          { id: 'bt-02', name: 'Sửa bếp từ không nhận nồi, không nóng', unit: 'bếp', price: '180.000 - 320.000', basePrice: 180000 },
          { id: 'bt-03', name: 'Thay quạt tản nhiệt, mặt kính bếp từ', unit: 'lần', price: '200.000 - 450.000', basePrice: 200000 },
        ],
      },
      {
        id: 'tb-03',
        name: 'Quạt trần & Quạt thông gió',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'qt-01', name: 'Lắp đặt quạt trần bê tông / thạch cao gia cố', unit: 'cái', price: '200.000 - 350.000', basePrice: 200000 },
          { id: 'qt-02', name: 'Lắp quạt hút thông gió nhà vệ sinh, phòng bếp', unit: 'cái', price: '120.000 - 200.000', basePrice: 120000 },
          { id: 'qt-03', name: 'Sửa quạt trần quay chậm, kêu to, hỏng tụ', unit: 'cái', price: '130.000 - 220.000', basePrice: 130000 },
        ],
      },
      {
        id: 'tb-04',
        name: 'Lò vi sóng & Lò nướng',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'lvs-01', name: 'Sửa lò vi sóng không nóng, đĩa không quay', unit: 'máy', price: '160.000 - 280.000', basePrice: 160000 },
          { id: 'lvs-02', name: 'Thay bóng phát sóng (Magnetron), tấm chắn', unit: 'bộ', price: '250.000 - 450.000', basePrice: 250000 },
        ],
      },
    ],
  },

  // 5. GIÚP VIỆC & VỆ SINH
  {
    id: 'grp-giup-viec',
    name: 'Giúp việc & Vệ sinh',
    subtitle: 'Dọn nhà theo giờ, tổng vệ sinh, giặt sofa/nệm',
    iconName: 'sparkles-outline',
    categories: [
      {
        id: 'gv-01',
        name: 'Dọn dẹp nhà cửa theo giờ',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'gv-i-01', name: 'Dọn dẹp nhà cửa gói 2 giờ', unit: 'gói 2h', price: '160.000 - 200.000', basePrice: 160000 },
          { id: 'gv-i-02', name: 'Dọn dẹp nhà cửa gói 3 giờ', unit: 'gói 3h', price: '230.000 - 270.000', basePrice: 230000 },
          { id: 'gv-i-03', name: 'Dọn dẹp nhà cửa gói 4 giờ', unit: 'gói 4h', price: '300.000 - 360.000', basePrice: 300000 },
          { id: 'gv-i-04', name: 'Nấu ăn gia đình theo yêu cầu (kèm dọn dẹp)', unit: 'buổi', price: '180.000 - 260.000', basePrice: 180000 },
        ],
      },
      {
        id: 'gv-02',
        name: 'Tổng vệ sinh nhà ở',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'gv-i-05', name: 'Tổng vệ sinh căn hộ chung cư 1-2 PN', unit: 'căn hộ', price: '600.000 - 1.200.000', basePrice: 600000 },
          { id: 'gv-i-06', name: 'Tổng vệ sinh nhà phố sau xây dựng / sửa chữa', unit: 'nhà', price: '1.200.000 - 2.800.000', basePrice: 1200000 },
          { id: 'gv-i-07', name: 'Lau kính mặt ngoài / kính ban công trên cao', unit: 'lần', price: '350.000 - 650.000', basePrice: 350000 },
        ],
      },
      {
        id: 'gv-03',
        name: 'Giặt Sofa, Nệm & Rèm cửa',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'gv-i-08', name: 'Giặt ghế Sofa nỉ / da bằng hơi nước nóng', unit: 'bộ', price: '250.000 - 450.000', basePrice: 250000 },
          { id: 'gv-i-09', name: 'Giặt nệm Kymdan, cao su khử khuẩn UV', unit: 'tấm', price: '250.000 - 380.000', basePrice: 250000 },
          { id: 'gv-i-10', name: 'Giặt rèm cửa, tháo lắp tận nơi', unit: 'kg', price: '35.000 - 55.000', basePrice: 200000 },
        ],
      },
    ],
  },

  // 6. LÀM VƯỜN & CẢNH QUAN
  {
    id: 'grp-lam-vuon',
    name: 'Làm vườn & Cảnh quan',
    subtitle: 'Cắt tỉa bonsai, tưới tự động, cải tạo sân vườn',
    iconName: 'leaf-outline',
    categories: [
      {
        id: 'lv-01',
        name: 'Chăm sóc & Cắt tỉa cây cảnh',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'lv-i-01', name: 'Cắt tỉa tạo dáng cây cảnh bonsai', unit: 'giờ', price: '180.000 - 280.000', basePrice: 180000 },
          { id: 'lv-i-02', name: 'Bón phân, thay đất chậu hoa cây cảnh', unit: 'chậu', price: '60.000 - 150.000', basePrice: 150000 },
          { id: 'lv-i-03', name: 'Phun thuốc sinh học trừ sâu rầy cây cảnh', unit: 'lần', price: '200.000 - 350.000', basePrice: 200000 },
        ],
      },
      {
        id: 'lv-02',
        name: 'Hệ thống tưới tự động & Sân vườn',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'lv-i-04', name: 'Thiết kế, lắp đặt tưới nhỏ giọt ban công', unit: 'gói', price: '350.000 - 750.000', basePrice: 350000 },
          { id: 'lv-i-05', name: 'Lắp timer hẹn giờ tự động tưới cây', unit: 'bộ', price: '250.000 - 450.000', basePrice: 250000 },
          { id: 'lv-i-06', name: 'Cắt cỏ, dọn dẹp khuôn viên sân vườn', unit: 'buổi', price: '250.000 - 500.000', basePrice: 250000 },
        ],
      },
    ],
  },

  // 7. CƠ KHÍ & NHÔM KÍNH
  {
    id: 'grp-co-khi',
    name: 'Cơ khí & Nhôm kính',
    subtitle: 'Sửa cửa sắt, hàn xì, mái tôn, nhôm kính Xingfa',
    iconName: 'construct-outline',
    categories: [
      {
        id: 'ck-01',
        name: 'Sửa cửa sắt & Hàn xì',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'ck-i-01', name: 'Hàn bản lề cửa sắt, cửa cổng rào', unit: 'bản lề', price: '150.000 - 250.000', basePrice: 150000 },
          { id: 'ck-i-02', name: 'Sửa bánh xe cổng lùa, cửa kéo đài loan', unit: 'bộ', price: '200.000 - 350.000', basePrice: 200000 },
          { id: 'ck-i-03', name: 'Gia cố khung sắt, bát khóa chống trộm', unit: 'vị trí', price: '180.000 - 300.000', basePrice: 180000 },
          { id: 'ck-i-04', name: 'Hàn xì sửa chữa gia cố theo yêu cầu', unit: 'lần', price: 'Khảo sát, báo giá miễn phí', basePrice: 200000 },
        ],
      },
      {
        id: 'ck-02',
        name: 'Nhôm kính Xingfa & Vách ngăn',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'ck-i-05', name: 'Thay khóa tay gạt cửa nhôm Xingfa', unit: 'bộ', price: '250.000 - 450.000', basePrice: 250000 },
          { id: 'ck-i-06', name: 'Thay bánh xe cửa sổ trượt nhôm', unit: 'cặp', price: '150.000 - 250.000', basePrice: 150000 },
          { id: 'ck-i-07', name: 'Thay kính cường lực nứt vỡ cửa nhôm', unit: 'm2', price: '350.000 - 650.000', basePrice: 350000 },
          { id: 'ck-i-08', name: 'Bắn silicon chống dột khung cửa sổ', unit: 'mét tới', price: '30.000 - 50.000', basePrice: 150000 },
        ],
      },
      {
        id: 'ck-03',
        name: 'Mái tôn & Chống thấm dột',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'ck-i-09', name: 'Thay thế đinh vít mái tôn hoen gỉ rò nước', unit: 'điểm', price: '20.000 - 35.000', basePrice: 150000 },
          { id: 'ck-i-10', name: 'Dán màng chống dột khò nóng mái tôn', unit: 'm2', price: '120.000 - 220.000', basePrice: 200000 },
          { id: 'ck-i-11', name: 'Thi công chống dột máng xối seno mái nhà', unit: 'gói', price: 'Khảo sát, báo giá miễn phí', basePrice: 300000 },
        ],
      },
    ],
  },

  // 8. KHÓA CỬA & AN NINH
  {
    id: 'grp-khoa-cua',
    name: 'Khóa cửa & An ninh',
    subtitle: 'Mở khóa 24/7, thay ổ khóa, khóa vân tay điện tử',
    iconName: 'key-outline',
    categories: [
      {
        id: 'kc-01',
        name: 'Mở khóa khẩn cấp 24/7',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'kc-i-01', name: 'Mở khóa cửa phòng nắm tròn bấm nhầm', unit: 'lần', price: '120.000 - 200.000', basePrice: 120000 },
          { id: 'kc-i-02', name: 'Mở khóa tay gạt cửa chính, cửa chống cháy', unit: 'lần', price: '180.000 - 300.000', basePrice: 180000 },
          { id: 'kc-i-03', name: 'Mở khóa xe máy quên chìa trong cốp', unit: 'lần', price: '100.000 - 180.000', basePrice: 100000 },
          { id: 'kc-i-04', name: 'Mở khóa két sắt cơ / két sắt điện tử', unit: 'lần', price: '300.000 - 650.000', basePrice: 300000 },
        ],
      },
      {
        id: 'kc-02',
        name: 'Thay mới & Khóa vân tay',
        subtitle: 'Nhấn để xem chi tiết bảng giá',
        iconName: 'folder-outline',
        items: [
          { id: 'kc-i-05', name: 'Thay ổ khóa nắm tròn, khóa tay gạt mới', unit: 'bộ', price: '150.000 - 250.000', basePrice: 150000 },
          { id: 'kc-i-06', name: 'Lắp đặt khóa cửa thông minh vân tay, thẻ từ', unit: 'bộ', price: '350.000 - 600.000', basePrice: 350000 },
          { id: 'kc-i-07', name: 'Cài đặt kết nối app và sửa khóa vân tay lỗi', unit: 'lần', price: '150.000 - 280.000', basePrice: 150000 },
        ],
      },
    ],
  },
];

export default function PriceListScreen() {
  const router = useRouter();

  // Quản lý điều hướng 3 cấp:
  // level = 0: Danh sách tất cả các nhóm lớn (8 nhóm)
  // level = 1: Danh sách hạng mục con thuộc nhóm đã chọn
  // level = 2: Danh sách chi tiết các đơn giá cụ thể
  const [level, setLevel] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Xử lý nút quay lại
  const handleBack = () => {
    if (searchQuery.trim().length > 0) {
      setSearchQuery('');
      return;
    }
    if (level === 2) {
      setLevel(1);
      setSelectedCategory(null);
    } else if (level === 1) {
      setLevel(0);
      setSelectedGroup(null);
    } else {
      router.back();
    }
  };

  // Chọn nhóm lớn (Level 0 -> Level 1)
  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setLevel(1);
  };

  // Chọn hạng mục con (Level 1 -> Level 2)
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setLevel(2);
  };

  // Chọn một dịch vụ cụ thể -> Đi thẳng tới màn hình Đặt lịch
  const handleBookItem = (item, groupName = null) => {
    router.push({
      pathname: '/(user)/booking/create-booking',
      params: {
        serviceName: item.name,
        categoryName: groupName || selectedGroup?.name || 'Dịch vụ FixGo',
        basePrice: String(item.basePrice || 150000),
      },
    });
  };

  // Tìm kiếm toàn bộ dịch vụ khi người dùng gõ từ khóa
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results = [];
    PRICING_CATALOG.forEach((grp) => {
      grp.categories.forEach((cat) => {
        cat.items.forEach((item) => {
          if (
            item.name.toLowerCase().includes(q) ||
            cat.name.toLowerCase().includes(q) ||
            grp.name.toLowerCase().includes(q)
          ) {
            results.push({
              ...item,
              groupName: grp.name,
              catName: cat.name,
            });
          }
        });
      });
    });
    return results;
  }, [searchQuery]);

  // Tiêu đề Header linh hoạt theo cấp
  const headerTitle = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return `Kết quả tìm kiếm (${searchResults.length})`;
    }
    if (level === 2 && selectedCategory) {
      return selectedCategory.name;
    }
    if (level === 1 && selectedGroup) {
      return `Bảng giá - ${selectedGroup.name}`;
    }
    return 'Bảng giá dịch vụ FixGo';
  }, [level, selectedGroup, selectedCategory, searchQuery, searchResults.length]);

  return (
    <SafeAreaView style={styles.rootContainer} edges={['top']}>
      {/* ── Header Gradient Xanh Dương FixGo ─────────────────────── */}
      <LinearGradient
        colors={['#E0F2FE', '#F0F9FF', '#FFFFFF']}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#0284C7" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {headerTitle}
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Thanh tìm kiếm nhanh giá mọi dịch vụ */}
        <View style={styles.searchBarBox}>
          <Ionicons name="search" size={18} color="#0284C7" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm giá dịch vụ (máy lạnh, bồn nước, bếp từ...)"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ── TRƯỜNG HỢP: HIỂN THỊ KẾT QUẢ TÌM KIẾM NHANH ───────────── */}
      {searchQuery.trim().length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {searchResults.length > 0 ? (
            searchResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.priceItemCard}
                activeOpacity={0.75}
                onPress={() => handleBookItem(item, item.groupName)}
              >
                <View style={styles.coinIconBox}>
                  <Ionicons name="cash-outline" size={22} color="#0284C7" />
                </View>

                <View style={styles.priceItemInfo}>
                  <Text style={styles.searchItemTag}>{item.groupName} • {item.catName}</Text>
                  <Text style={styles.priceItemTitle}>{item.name}</Text>
                  <Text style={styles.priceItemUnit}>Đơn vị: {item.unit}</Text>
                  <Text style={styles.priceItemPrice}>
                    Giá: <Text style={styles.priceHighlight}>{item.price}</Text>
                  </Text>
                </View>

                <View style={styles.arrowIconBox}>
                  <Ionicons name="arrow-forward" size={16} color="#0284C7" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptySearchBox}>
              <Ionicons name="search-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptySearchText}>Không tìm thấy đơn giá phù hợp với "{searchQuery}"</Text>
              <Text style={styles.emptySearchSub}>Bạn có thể duyệt theo từng danh mục bên dưới</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <>
          {/* ── CẤP 1: DANH SÁCH TẤT CẢ 8 NHÓM DỊCH VỤ CHÍNH ───────── */}
          {level === 0 && (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.summaryBar}>
                <Ionicons name="shield-checkmark" size={16} color="#0284C7" style={{ marginRight: 6 }} />
                <Text style={styles.summaryBarText}>
                  Cam kết báo giá minh bạch • Khảo sát tận nơi miễn phí • Không phát sinh
                </Text>
              </View>

              {PRICING_CATALOG.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.mainGroupCard}
                  activeOpacity={0.75}
                  onPress={() => handleSelectGroup(group)}
                >
                  {/* Icon Squircle Nền Xanh Pastel FixGo */}
                  <View style={styles.groupIconBox}>
                    <Ionicons name={group.iconName} size={24} color="#0284C7" />
                  </View>

                  <View style={styles.groupInfo}>
                    <Text style={styles.groupTitle}>{group.name}</Text>
                    <Text style={styles.groupSub} numberOfLines={1}>{group.subtitle}</Text>
                  </View>

                  <View style={styles.arrowIconBox}>
                    <Ionicons name="arrow-forward" size={16} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* ── CẤP 2: DANH SÁCH HẠNG MỤC CON THEO NHÓM ĐÃ CHỌN ──────── */}
          {level === 1 && selectedGroup && (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.groupBreadcrumb}>
                <Text style={styles.groupBreadcrumbText}>
                  Danh mục thuộc <Text style={{ fontWeight: '700', color: '#0284C7' }}>{selectedGroup.name}</Text>
                </Text>
              </View>

              {selectedGroup.categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.subCatCard}
                  activeOpacity={0.75}
                  onPress={() => handleSelectCategory(cat)}
                >
                  <View style={styles.folderIconBox}>
                    <Ionicons name="folder" size={24} color="#0284C7" />
                  </View>

                  <View style={styles.subCatInfo}>
                    <Text style={styles.subCatTitle}>{cat.name}</Text>
                    <Text style={styles.subCatSub}>{cat.subtitle}</Text>
                  </View>

                  <View style={styles.arrowIconBox}>
                    <Ionicons name="arrow-forward" size={16} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* ── CẤP 3: CHI TIẾT ĐƠN GIÁ CỤ THỂ ───────────────────────── */}
          {level === 2 && selectedCategory && (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedCategory.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.priceItemCard}
                  activeOpacity={0.75}
                  onPress={() => handleBookItem(item)}
                >
                  <View style={styles.coinIconBox}>
                    <Ionicons name="cash-outline" size={22} color="#0284C7" />
                  </View>

                  <View style={styles.priceItemInfo}>
                    <Text style={styles.priceItemTitle}>{item.name}</Text>
                    <Text style={styles.priceItemUnit}>Đơn vị: {item.unit}</Text>
                    <Text style={styles.priceItemPrice}>
                      Giá: <Text style={styles.priceHighlight}>{item.price}</Text>
                    </Text>
                  </View>

                  <View style={styles.bookActionBox}>
                    <Text style={styles.bookActionText}>Đặt ngay</Text>
                    <Ionicons name="arrow-forward" size={14} color="#0284C7" />
                  </View>
                </TouchableOpacity>
              ))}

              {/* Ghi chú chân trang minh bạch */}
              <View style={styles.priceNoteBox}>
                <Ionicons name="information-circle-outline" size={18} color="#0284C7" style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={styles.priceNoteText}>
                  Bảng giá mang tính chất tham khảo chuẩn hóa theo giá niêm yết FixGo. Thợ sẽ kiểm tra khảo sát thực tế và báo giá chi tiết trước khi làm. Khách hàng không đồng ý không mất bất kỳ chi phí nào.
                </Text>
              </View>
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0F2FE',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 17.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'Inter_400Regular',
    color: '#0F172A',
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 2,
  },
  summaryBarText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: 'Inter_500Medium',
    color: '#0369A1',
    lineHeight: 16,
  },
  groupBreadcrumb: {
    marginBottom: 2,
  },
  groupBreadcrumbText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    gap: 12,
  },

  // ─── Cấp 1: Thẻ nhóm lớn ───────────────────────────────────
  mainGroupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  groupIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  groupSub: {
    fontSize: 12.5,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
  },
  arrowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Cấp 2: Thẻ hạng mục con ───────────────────────────────
  subCatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  folderIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  subCatInfo: {
    flex: 1,
  },
  subCatTitle: {
    fontSize: 15.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subCatSub: {
    fontSize: 12.5,
    fontFamily: 'Inter_400Regular',
    color: '#94A3B8',
  },

  // ─── Cấp 3: Thẻ đơn giá cụ thể ─────────────────────────────
  priceItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  coinIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  priceItemInfo: {
    flex: 1,
    paddingRight: 6,
  },
  searchItemTag: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
    marginBottom: 3,
  },
  priceItemTitle: {
    fontSize: 14.5,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 19,
  },
  priceItemUnit: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginBottom: 2,
  },
  priceItemPrice: {
    fontSize: 12.5,
    fontFamily: 'Inter_500Medium',
    color: '#475569',
  },
  priceHighlight: {
    color: '#059669',
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  bookActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  bookActionText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: '#0284C7',
  },
  priceNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    marginTop: 8,
  },
  priceNoteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#0369A1',
    lineHeight: 18,
  },
  emptySearchBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  emptySearchText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#475569',
    textAlign: 'center',
  },
  emptySearchSub: {
    fontSize: 13,
    color: '#94A3B8',
  },
});

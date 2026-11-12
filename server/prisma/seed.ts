import { PrismaClient, UserRole, UserStatus, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

/**
 * ============================================================================
 * FIXGO PRO - REAL-WORLD COMMERCIAL & MULTI-TIER WORKER SEEDING SCRIPT
 * ============================================================================
 * File: prisma/seed.ts
 * Ngôn ngữ: TypeScript
 */

const prisma = new PrismaClient();

// Tọa độ mốc Khách hàng (Anchor Location)
const ANCHOR_CUSTOMER = {
  lat: 10.8385,
  lng: 106.6785,
  address: 'Số 123 Lê Đức Thọ, Phường 16, Quận Gò Vấp, TP.HCM',
};

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface ServiceSeedItem {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  maxPrice: number;
  unit: string;
  estimatedDurationMin: number;
  isPopular?: boolean;
  isActive?: boolean;
}

export interface CategorySeedItem {
  name: string;
  slug: string;
  description: string;
  icon: string;
  iconUrl: string;
  basePrice: number;
  unit: string;
  estimatedMinutes: number;
  warrantyDays: number;
  isActive?: boolean;
  services: ServiceSeedItem[];
}

export const REAL_COMMERCIAL_CATEGORIES: CategorySeedItem[] = [
  // 1. SỬA ĐIỆN (sua-dien)
  {
    name: 'Sửa điện',
    slug: 'sua-dien',
    description: 'Khắc phục sự cố điện dân dụng, chập cháy, thay thế công tắc ổ cắm an toàn 100%.',
    icon: 'flash',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3100/3100553.png',
    basePrice: 80000,
    unit: 'lần',
    estimatedMinutes: 60,
    warrantyDays: 30,
    isActive: true,
    services: [
      {
        name: 'Sửa / Thay ổ cắm, công tắc, Aptomat',
        slug: 'sua-thay-o-cam-cong-tac-aptomat',
        description: 'Kiểm tra nguồn, thay mới mặt ổ cắm/công tắc âm hoặc nổi, thay aptomat quá tải.',
        basePrice: 80000,
        maxPrice: 180000,
        unit: 'cái',
        estimatedDurationMin: 30,
        isPopular: true,
        isActive: true,
      },
      {
        name: 'Xử lý sự cố chập điện / Nhảy CB âm tường',
        slug: 'xu-ly-su-co-chap-dien-nhay-cb',
        description: 'Dò tìm điểm chập cháy bằng đồng hồ chuyên dụng, cô lập đường dây hỏng, đấu nối an toàn.',
        basePrice: 350000,
        maxPrice: 850000,
        unit: 'lần',
        estimatedDurationMin: 90,
        isPopular: true,
        isActive: true,
      },
      {
        name: 'Lắp đặt / Sửa hệ thống đèn chiếu sáng',
        slug: 'lap-dat-sua-den-chieu-sang',
        description: 'Lắp bóng LED búp, tuýp LED, đèn ốp trần, đèn ray rọi trang trí.',
        basePrice: 70000,
        maxPrice: 150000,
        unit: 'bộ',
        estimatedDurationMin: 45,
        isPopular: false,
        isActive: true,
      },
      {
        name: 'Đấu nối, kéo đường dây điện nổi / luồn ghen',
        slug: 'dau-noi-keo-day-dien-noi-luon-ghen',
        description: 'Đi nẹp bảo vệ hoặc luồn ống ruột gà cho đường cấp nguồn mới.',
        basePrice: 120000,
        maxPrice: 250000,
        unit: 'lần',
        estimatedDurationMin: 60,
        isPopular: false,
        isActive: true,
      },
      {
        name: 'Lắp đặt công tắc / Ổ cắm thông minh SmartHome',
        slug: 'lap-dat-cong-tac-o-cam-smarthome',
        description: 'Lắp đặt công tắc cảm ứng WiFi/Zigbee, đấu nối dây nguội N và cài đặt app.',
        basePrice: 150000,
        maxPrice: 300000,
        unit: 'cái',
        estimatedDurationMin: 45,
        isPopular: false,
        isActive: true,
      },
    ],
  },

  // 2. SỬA NƯỚC (sua-nuoc)
  {
    name: 'Sửa nước',
    slug: 'sua-nuoc',
    description: 'Xử lý rò rỉ nước, thông tắc cống nghẹt, thay mới vòi sen, lavabo, bồn cầu cấp tốc.',
    icon: 'water',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3100/3100554.png',
    basePrice: 100000,
    unit: 'lần',
    estimatedMinutes: 60,
    warrantyDays: 30,
    isActive: true,
    services: [
      {
        name: 'Sửa vòi nước rò rỉ / Thay vòi sen tắm',
        slug: 'sua-voi-nuoc-ro-ri-thay-voi-sen',
        description: 'Thay củ sen nóng lạnh, vòi lavabo, vòi xịt vệ sinh, quấn băng tan chống rỉ.',
        basePrice: 100000,
        maxPrice: 220000,
        unit: 'cái',
        estimatedDurationMin: 30,
        isPopular: true,
        isActive: true,
      },
      {
        name: 'Thông tắc lavabo, cống sàn, chậu rửa bát',
        slug: 'thong-tac-lavabo-cong-san-chau-rua-bat',
        description: 'Dùng máy lò xo chuyên dụng đánh sạch cặn mỡ, tóc rác ứ đọng đường ống thoát.',
        basePrice: 250000,
        maxPrice: 450000,
        unit: 'lần',
        estimatedDurationMin: 45,
        isPopular: true,
        isActive: true,
      },
      {
        name: 'Khắc phục bục vỡ đường ống nước PVC/PPR',
        slug: 'khac-phuc-buc-vo-ong-nuoc-pvc-ppr',
        description: 'Cắt bỏ đoạn ống nứt vỡ, hàn nhiệt ống PPR hoặc dán nối cút co chống rò rỉ.',
        basePrice: 250000,
        maxPrice: 600000,
        unit: 'điểm',
        estimatedDurationMin: 60,
        isPopular: false,
        isActive: true,
      },
      {
        name: 'Sửa chữa / Lắp máy bơm nước tăng áp',
        slug: 'sua-chua-lap-may-bom-nuoc-tang-ap',
        description: 'Kiểm tra rơ-le áp suất, thay phớt, tụ điện hoặc lắp bơm tăng áp gia đình.',
        basePrice: 200000,
        maxPrice: 450000,
        unit: 'máy',
        estimatedDurationMin: 60,
        isPopular: false,
        isActive: true,
      },
      {
        name: 'Thay phao cơ / Phao điện ngắt nước bồn chứa',
        slug: 'thay-phao-co-phao-dien-ngat-nuoc',
        description: 'Chống tràn và chống cạn bồn nước sinh hoạt mái nhà.',
        basePrice: 150000,
        maxPrice: 250000,
        unit: 'bộ',
        estimatedDurationMin: 45,
        isPopular: false,
        isActive: true,
      },
    ],
  },

  // 3. ĐIỆN LẠNH (dien-lanh)
  {
    name: 'Điện lạnh',
    slug: 'dien-lanh',
    description: 'Vệ sinh máy lạnh sạch sâu, nạp ga R32/R410A chuẩn, sửa máy giặt, tủ lạnh.',
    icon: 'snow',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/995/995053.png',
    basePrice: 150000,
    unit: 'bộ',
    estimatedMinutes: 60,
    warrantyDays: 30,
    isActive: true,
    services: [
      {
        name: 'Vệ sinh máy lạnh treo tường (1.0 HP - 2.5 HP)',
        slug: 've-sinh-may-lanh-treo-tuong',
        description: 'Rửa dàn lạnh bằng bạt chuyên dụng, xịt rửa dàn nóng, thông ống thoát nước thải.',
        basePrice: 150000,
        maxPrice: 220000,
        unit: 'bộ',
        estimatedDurationMin: 45,
        isPopular: true,
        isActive: true,
      },
      {
        name: 'Nạp gas bổ sung máy lạnh (R32 / R410A)',
        slug: 'nap-gas-bo-sung-may-lanh',
        description: 'Đo áp suất hút, hút chân không và nạp bù lượng gas hao hụt định kỳ.',
        basePrice: 200000,
        maxPrice: 450000,
        unit: 'máy',
        estimatedDurationMin: 30,
        isPopular: false,
        isActive: true,
      },
      {
        name: 'Khắc phục máy lạnh chảy nước máng sau',
        slug: 'khac-phuc-may-lanh-chay-nuoc-mang-sau',
        description: 'Thông tắc bụi bẩn đường ống thoát, cân chỉnh lại độ nghiêng dàn lạnh.',
        basePrice: 150000,
        maxPrice: 250000,
        unit: 'lần',
        estimatedDurationMin: 40,
        isPopular: true,
        isActive: true,
      },
      {
        name: 'Tháo dỡ, di dời và lắp đặt máy lạnh',
        slug: 'thao-do-di-doi-lap-dat-may-lanh',
        description: 'Thu hồi gas an toàn, tháo máy, khoan giá đỡ và lắp đặt tại vị trí mới.',
        basePrice: 350000,
        maxPrice: 650000,
        unit: 'bộ',
        estimatedDurationMin: 90,
        isPopular: false,
        isActive: true,
      },
      {
        name: 'Vệ sinh bảo dưỡng máy giặt lồng đứng / ngang',
        slug: 've-sinh-bao-duong-may-giat',
        description: 'Tháo mâm giặt, xịt rửa sạch cặn xà phòng và nấm mốc bám ngoài lồng inox.',
        basePrice: 250000,
        maxPrice: 550000,
        unit: 'cái',
        estimatedDurationMin: 75,
        isPopular: false,
        isActive: true,
      },
    ],
  },

  // 4. THIẾT BỊ GIA DỤNG (thiet-bi)
  {
    name: 'Thiết bị gia dụng',
    slug: 'thiet-bi',
    description: 'Sửa bếp từ, lò vi sóng, máy nước nóng, lắp máy lọc nước, máy rửa chén âm tủ.',
    icon: 'tv',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png',
    basePrice: 150000,
    unit: 'thiết bị',
    estimatedMinutes: 60,
    warrantyDays: 30,
    isActive: true,
    services: [
      {
        name: 'Sửa bếp từ, bếp hồng ngoại (Báo lỗi E0-E9)',
        slug: 'sua-bep-tu-bep-hong-ngoai',
        description: 'Thay sò công suất IGBT, sửa mạch nguồn, cảm biến nhiệt mâm từ.',
        basePrice: 250000,
        maxPrice: 550000,
        unit: 'bếp',
        estimatedDurationMin: 60,
        isPopular: true,
        isActive: true,
      },
      {
        name: 'Bảo dưỡng & Thay lõi lọc nước tinh khiết RO',
        slug: 'bao-duong-thay-loi-loc-nuoc-ro',
        description: 'Đo chỉ số TDS nước, thay thế combo lõi số 1-2-3 và màng lọc RO.',
        basePrice: 150000,
        maxPrice: 350000,
        unit: 'bộ',
        estimatedDurationMin: 30,
        isPopular: false,
        isActive: true,
      },
      {
        name: 'Sửa máy nước nóng trực tiếp / gián tiếp',
        slug: 'sua-may-nuoc-nong-truc-tiep-gian-tiep',
        description: 'Thay thanh đốt sợi đốt, thay rơ le nhiệt, sửa cầu dao chống giật ELCB.',
        basePrice: 200000,
        maxPrice: 450000,
        unit: 'bình',
        estimatedDurationMin: 45,
        isPopular: false,
        isActive: true,
      },
      {
        name: 'Lắp đặt máy rửa chén / Lò nướng âm tủ',
        slug: 'lap-dat-may-rua-chen-lo-nuong',
        description: 'Cắt đá, đấu nguồn cấp nước, thoát nước thải và căn chỉnh vị trí máy.',
        basePrice: 250000,
        maxPrice: 450000,
        unit: 'máy',
        estimatedDurationMin: 60,
        isPopular: false,
        isActive: true,
      },
    ],
  },

  // 5. LÀM VƯỜN (lam-vuon)
  {
    name: 'Làm vườn',
    slug: 'lam-vuon',
    description: 'Cắt tỉa cây cảnh, dọn cỏ dại, bón phân hữu cơ sinh học, tưới cây tự động.',
    icon: 'leaf',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1518/1518968.png',
    basePrice: 150000,
    unit: 'lần',
    estimatedMinutes: 60,
    warrantyDays: 14,
    isActive: true,
    services: [
      {
        name: 'Cắt tỉa cỏ sân vườn, dọn cỏ dại',
        slug: 'cat-tia-co-san-vuon-don-co-dai',
        description: 'Dùng máy cắt cỏ cầm tay, gom rác thực vật và dọn sạch mặt bằng.',
        basePrice: 250000,
        maxPrice: 500000,
        unit: 'buổi',
        estimatedDurationMin: 120,
        isPopular: false,
        isActive: true,
      },
      {
        name: 'Cắt tỉa, tạo tán cây cảnh / Hàng rào sân vườn',
        slug: 'cat-tia-tao-tan-cay-canh',
        description: 'Tỉa cành khô, cắt tạo hình cây cảnh bonsai, tỉa gọn tán lá che khuất.',
        basePrice: 150000,
        maxPrice: 400000,
        unit: 'cây',
        estimatedDurationMin: 60,
        isPopular: true,
        isActive: true,
      },
      {
        name: 'Cải tạo đất, bón phân vi sinh & Trừ sâu bệnh',
        slug: 'cai-tao-dat-bon-phan-vi-sinh',
        description: 'Xới đất chậu, bón phân hữu cơ và phun thuốc thảo mộc trừ rầy rệp.',
        basePrice: 200000,
        maxPrice: 350000,
        unit: 'lần',
        estimatedDurationMin: 60,
        isPopular: false,
        isActive: true,
      },
    ],
  },

  // 6. GIÚP VIỆC (giup-viec)
  {
    name: 'Giúp việc',
    slug: 'giup-viec',
    description: 'Dọn dẹp nhà theo giờ, tổng vệ sinh sau xây dựng, giặt hấp sofa nệm hơi nước.',
    icon: 'sparkles',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/995/995053.png',
    basePrice: 65000,
    unit: 'giờ',
    estimatedMinutes: 180,
    warrantyDays: 0,
    isActive: true,
    services: [
      {
        name: 'Dọn dẹp nhà cửa theo giờ',
        slug: 'don-dep-nha-cua-theo-gio',
        description: 'Quét dọn, lau nhà, lau chùi bàn ghế nội thất, dọn rửa nhà vệ sinh.',
        basePrice: 65000,
        maxPrice: 85000,
        unit: 'giờ',
        estimatedDurationMin: 180,
        isPopular: true,
        isActive: true,
      },
      {
        name: 'Tổng vệ sinh nhà sau xây dựng / dọn chuyển nhà',
        slug: 'tong-ve-sinh-nha-sau-xay-dung',
        description: 'Tẩy sơn vôi sàn nhà, hút bụi công nghiệp, lau kính cao tầng.',
        basePrice: 15000,
        maxPrice: 25000,
        unit: 'm²',
        estimatedDurationMin: 240,
        isPopular: false,
        isActive: true,
      },
      {
        name: 'Giặt hấp sofa nệm, rèm cửa tại nhà',
        slug: 'giat-hap-sofa-nem-rem-cua',
        description: 'Hút bụi sâu, phun bọt tẩy ố, giặt hơi nước nóng diệt khuẩn 99%.',
        basePrice: 300000,
        maxPrice: 500000,
        unit: 'bộ',
        estimatedDurationMin: 90,
        isPopular: false,
        isActive: true,
      },
    ],
  },

  // 7. BẢNG GIÁ (bang-gia)
  {
    name: 'Bảng giá',
    slug: 'bang-gia',
    description: 'Tra cứu bảng giá minh bạch 3 tầng chi phí: Khảo sát 0đ, Nhân công chuẩn hóa, Vật tư niêm yết.',
    icon: 'receipt',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1055/1055644.png',
    basePrice: 0,
    unit: 'lần',
    estimatedMinutes: 30,
    warrantyDays: 30,
    isActive: true,
    services: [
      {
        name: 'Khảo sát & Báo giá tại nhà',
        slug: 'khao-sat-bao-gia-tai-nha',
        description: 'Thợ đến tận nơi kiểm tra, đo đạc, chẩn đoán sự cố và báo giá miễn phí 100%.',
        basePrice: 0,
        maxPrice: 0,
        unit: 'lần',
        estimatedDurationMin: 30,
        isPopular: true,
        isActive: true,
      },
      {
        name: 'Phí nhân công tối thiểu theo ca',
        slug: 'phi-nhan-cong-toi-thieu',
        description: 'Định mức công thợ chuẩn hóa cho các ca sửa chữa đơn giản dưới 30 phút.',
        basePrice: 100000,
        maxPrice: 150000,
        unit: 'ca',
        estimatedDurationMin: 30,
        isPopular: true,
        isActive: true,
      },
      {
        name: 'Chi phí vật tư & linh kiện chính hãng',
        slug: 'chi-phi-vat-tu-linh-kien',
        description: 'Minh bạch 100% hóa đơn linh kiện xuất xưởng theo giá niêm yết của hãng.',
        basePrice: 0,
        maxPrice: 500000,
        unit: 'món',
        estimatedDurationMin: 30,
        isPopular: false,
        isActive: true,
      },
    ],
  },

  // 8. DỊCH VỤ KHÁC (dich-vu-khac)
  {
    name: 'Dịch vụ khác',
    slug: 'dich-vu-khac',
    description: 'Sửa khóa cửa, diệt côn trùng, chuyển nhà trọn gói, khoan tường treo tranh kệ.',
    icon: 'grid',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2942/2942813.png',
    basePrice: 150000,
    unit: 'lần',
    estimatedMinutes: 60,
    warrantyDays: 30,
    isActive: true,
    services: [
      {
        name: 'Sửa khóa cửa, thay ổ khóa vân tay',
        slug: 'sua-khoa-cua-thay-khoa-van-tay',
        description: 'Mở khóa khẩn cấp, thay ruột khóa tay gạt, lắp đặt khóa cửa điện tử.',
        basePrice: 150000,
        maxPrice: 400000,
        unit: 'bộ',
        estimatedDurationMin: 45,
        isPopular: true,
        isActive: true,
      },
      {
        name: 'Khoan tường treo tranh, giá kệ, rèm cửa',
        slug: 'khoan-tuong-treo-tranh-gia-ke',
        description: 'Định vị cân bằng laser, khoan vít nở chịu tải an toàn cho tranh ảnh/kệ TV.',
        basePrice: 150000,
        maxPrice: 300000,
        unit: 'lần',
        estimatedDurationMin: 45,
        isPopular: false,
        isActive: true,
      },
      {
        name: 'Phun thuốc diệt muỗi, kiến, gián sinh học',
        slug: 'phun-thuoc-diet-muoi-kien-gian',
        description: 'Phun mù nhiệt / ULV tồn lưu hoá chất an toàn của Bộ Y tế khắp các phòng.',
        basePrice: 350000,
        maxPrice: 650000,
        unit: 'căn hộ',
        estimatedDurationMin: 60,
        isPopular: false,
        isActive: true,
      },
    ],
  },
];

const MULTI_TIER_WORKERS_DATA = [
  {
    name: 'Lê Văn Thợ Điện',
    phone: '0903111001',
    email: 'tho1@fixgo.vn',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
    categorySlug: 'sua-dien',
    specialty: 'Sửa điện',
    bio: 'Kỹ thuật viên điện chuyên nghiệp 5 năm kinh nghiệm. Nhận xử lý chập điện khẩn cấp, thay thế CB, ổ cắm 24/7.',
    skills: ['Sửa chữa điện', 'Thay thế Aptomat', 'Xử lý chập điện', 'Đấu nối dây điện'],
    experienceYears: 5,
    rating: 5.0,
    totalReviews: 142,
    completedJobs: 142,
    currentLat: 10.8415,
    currentLng: 106.6795,
    locationNote: 'Đường Nguyễn Văn Lượng, Gò Vấp (~0.4 km)',
    walletBalance: 500000,
  },
  {
    name: 'Trần Văn Sửa Nước',
    phone: '0903111002',
    email: 'tho2@fixgo.vn',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80',
    categorySlug: 'sua-nuoc',
    specialty: 'Sửa nước',
    bio: 'Chuyên gia sửa ống nước rò rỉ, thông tắc cống lavabo bằng máy lò xo chuyên dụng, không đục phá.',
    skills: ['Sửa ống nước rò rỉ', 'Thông tắc cống nghẹt', 'Thay vòi sen lavabo', 'Sửa máy bơm nước'],
    experienceYears: 6,
    rating: 4.9,
    totalReviews: 98,
    completedJobs: 98,
    currentLat: 10.8320,
    currentLng: 106.6850,
    locationNote: 'Khu Cityland Park Hills, Gò Vấp (~1.2 km)',
    walletBalance: 500000,
  },
  {
    name: 'Phạm Văn Thợ Lạnh',
    phone: '0903111003',
    email: 'tho3@fixgo.vn',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80',
    categorySlug: 'dien-lanh',
    specialty: 'Điện lạnh',
    bio: 'Kỹ sư nhiệt điện lạnh 7 năm kinh nghiệm. Vệ sinh máy lạnh sạch sâu, nạp gas R32/R410A chuẩn, sửa máy giặt.',
    skills: ['Vệ sinh máy lạnh', 'Nạp gas điều hòa', 'Sửa máy giặt', 'Sửa tủ lạnh'],
    experienceYears: 7,
    rating: 4.9,
    totalReviews: 115,
    completedJobs: 115,
    currentLat: 10.8250,
    currentLng: 106.6960,
    locationNote: 'Đường Phan Văn Trị / Bình Thạnh (~2.8 km)',
    walletBalance: 500000,
  },
  {
    name: 'Hoàng Gia Dụng',
    phone: '0903111004',
    email: 'tho4@fixgo.vn',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=80',
    categorySlug: 'thiet-bi',
    specialty: 'Thiết bị gia dụng',
    bio: 'Chuyên sửa bo mạch bếp từ, lò vi sóng, bình nóng lạnh, lắp máy lọc nước RO chính hãng.',
    skills: ['Sửa bếp từ', 'Bảo dưỡng máy lọc nước', 'Sửa bình nóng lạnh', 'Lắp máy rửa chén'],
    experienceYears: 4,
    rating: 4.8,
    totalReviews: 64,
    completedJobs: 64,
    currentLat: 10.8050,
    currentLng: 106.6920,
    locationNote: 'Vòng xoay Hàng Xanh, Bình Thạnh (~5.5 km)',
    walletBalance: 500000,
  },
  {
    name: 'Nguyễn Thị Giúp Việc',
    phone: '0903111005',
    email: 'tho5@fixgo.vn',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80',
    categorySlug: 'giup-viec',
    specialty: 'Giúp việc',
    bio: 'Dọn dẹp nhà cửa theo giờ ngăn nắp, tổng vệ sinh nhà mới, giặt sofa hơi nước nóng diệt khuẩn 99%.',
    skills: ['Dọn dẹp nhà theo giờ', 'Tổng vệ sinh nhà mới', 'Giặt sofa nệm rèm', 'Nấu ăn gia đình'],
    experienceYears: 8,
    rating: 5.0,
    totalReviews: 210,
    completedJobs: 210,
    currentLat: 10.7760,
    currentLng: 106.7010,
    locationNote: 'Phường Bến Nghé, Quận 1 (~9.0 km)',
    walletBalance: 500000,
  },
  {
    name: 'Đỗ Văn Làm Vườn',
    phone: '0903111006',
    email: 'tho6@fixgo.vn',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80',
    categorySlug: 'lam-vuon',
    specialty: 'Làm vườn',
    bio: 'Cắt tỉa tạo thế cây cảnh bonsai, phát cỏ sân vườn, cải tạo đất hữu cơ, lắp hệ thống tưới tự động.',
    skills: ['Cắt tỉa cây cảnh', 'Dọn cỏ sân vườn', 'Bón phân hữu cơ', 'Tưới nhỏ giọt'],
    experienceYears: 10,
    rating: 4.7,
    totalReviews: 45,
    completedJobs: 45,
    currentLat: 10.7350,
    currentLng: 106.7220,
    locationNote: 'Khu đô thị Phú Mỹ Hưng, Quận 7 (~13.5 km)',
    walletBalance: 500000,
  },
];

async function main(): Promise<void> {
  await prisma.$connect();
  console.log('================================================================');
  console.log('       FIXGO PRO - SEEDING COMMERCIAL CATALOG & REAL WORKERS');
  console.log('================================================================\n');

  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  // 1. SEED SUPER ADMIN
  const adminEmail = 'admin@homeservice.com';
  let admin = await prisma.user.findFirst({
    where: { OR: [{ email: adminEmail }, { phone: '0900000000' }] },
  });
  if (admin) {
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: {
        name: 'Super Administrator',
        email: adminEmail,
        phone: '0900000000',
        passwordHash: defaultPasswordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
  } else {
    admin = await prisma.user.create({
      data: {
        name: 'Super Administrator',
        email: adminEmail,
        phone: '0900000000',
        passwordHash: defaultPasswordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
  }
  console.log(`✓ [Admin] Sẵn sàng: ${admin.email} (Pass: 123456)`);

  // 2. SEED 8 NHÓM DANH MỤC & CÁC DỊCH VỤ CON
  console.log('\n--- Seeding 8 Danh Mục & Dịch Vụ Thực Tế FixGo Pro ---');
  let categoryCount = 0;
  let serviceCount = 0;
  const createdCategories: Record<string, any> = {};
  const createdServices: Record<string, any> = {};

  for (const catData of REAL_COMMERCIAL_CATEGORIES) {
    const { services, slug, ...catFields } = catData;

    let category = await prisma.serviceCategory.findFirst({
      where: { OR: [{ slug }, { name: catFields.name }] },
    });

    const categoryPayload = {
      name: catFields.name,
      slug,
      description: catFields.description,
      icon: catFields.icon,
      iconUrl: catFields.iconUrl,
      basePrice: new Prisma.Decimal(catFields.basePrice),
      unit: catFields.unit,
      estimatedMinutes: catFields.estimatedMinutes,
      warrantyDays: catFields.warrantyDays,
      isActive: catFields.isActive ?? true,
    };

    if (category) {
      category = await prisma.serviceCategory.update({
        where: { id: category.id },
        data: categoryPayload,
      });
      console.log(`📦 [Category CẬP NHẬT]: ${category.name} (slug: ${category.slug})`);
    } else {
      category = await prisma.serviceCategory.create({
        data: categoryPayload,
      });
      console.log(`✨ [Category TẠO MỚI]: ${category.name} (slug: ${category.slug})`);
    }
    createdCategories[category.slug || category.name] = category;
    categoryCount++;

    for (const svc of services) {
      let existingSvc = await prisma.service.findFirst({
        where: {
          OR: [
            { slug: svc.slug },
            { name: svc.name, categoryId: category.id },
          ],
        },
      });

      const svcPayload = {
        name: svc.name,
        slug: svc.slug,
        description: svc.description,
        basePrice: new Prisma.Decimal(svc.basePrice),
        maxPrice: new Prisma.Decimal(svc.maxPrice),
        unit: svc.unit,
        estimatedDurationMin: svc.estimatedDurationMin,
        isPopular: svc.isPopular ?? false,
        isActive: svc.isActive !== false,
        categoryId: category.id,
      };

      let savedService;
      if (existingSvc) {
        savedService = await prisma.service.update({
          where: { id: existingSvc.id },
          data: svcPayload,
        });
      } else {
        savedService = await prisma.service.create({
          data: svcPayload,
        });
      }
      createdServices[svc.slug || svc.name] = savedService;
      serviceCount++;
    }
  }

  // 3. SEED KHÁCH HÀNG TẠI ANCHOR LOCATION (GÒ VẤP)
  console.log('\n--- Seeding Khách Hàng Thử Nghiệm (Anchor Location) ---');
  const CUSTOMERS_DATA = [
    {
      name: 'Nguyễn Văn Khách 1',
      phone: '0901111111',
      email: 'khach1@fixgo.vn',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      address: {
        title: 'Nhà riêng (Anchor Location)',
        street: ANCHOR_CUSTOMER.address,
        ward: 'Phường 16',
        district: 'Quận Gò Vấp',
        city: 'TP. Hồ Chí Minh',
        latitude: ANCHOR_CUSTOMER.lat,
        longitude: ANCHOR_CUSTOMER.lng,
      },
    },
    {
      name: 'Trần Thị Khách 2',
      phone: '0902222222',
      email: 'khach2@fixgo.vn',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      address: {
        title: 'Căn hộ chung cư',
        street: 'Số 456 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM',
        ward: 'Phường 25',
        district: 'Quận Bình Thạnh',
        city: 'TP. Hồ Chí Minh',
        latitude: 10.8031,
        longitude: 106.7144,
      },
    },
  ];

  for (const cData of CUSTOMERS_DATA) {
    let user = await prisma.user.findFirst({
      where: { OR: [{ phone: cData.phone }, { email: cData.email }] },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: cData.name,
          phone: cData.phone,
          email: cData.email,
          passwordHash: defaultPasswordHash,
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
          avatarUrl: cData.avatarUrl,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: cData.name,
          phone: cData.phone,
          email: cData.email,
          passwordHash: defaultPasswordHash,
          role: UserRole.CUSTOMER,
          status: UserStatus.ACTIVE,
          avatarUrl: cData.avatarUrl,
        },
      });
    }

    const customerProfile = await prisma.customerProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: cData.name,
        avatarUrl: cData.avatarUrl,
      },
      create: {
        userId: user.id,
        fullName: cData.name,
        avatarUrl: cData.avatarUrl,
      },
    });

    await prisma.wallet.upsert({
      where: { customerId: customerProfile.id },
      update: { balance: new Prisma.Decimal(1000000) },
      create: {
        customerId: customerProfile.id,
        balance: new Prisma.Decimal(1000000),
        currency: 'VND',
      },
    });

    const existingAddress = await prisma.address.findFirst({
      where: { customerId: customerProfile.id, isDefault: true },
    });

    if (existingAddress) {
      await prisma.address.update({
        where: { id: existingAddress.id },
        data: { ...cData.address, isDefault: true },
      });
    } else {
      await prisma.address.create({
        data: {
          customerId: customerProfile.id,
          ...cData.address,
          isDefault: true,
        },
      });
    }
    console.log(`👤 [Customer]: ${cData.name} | SĐT: ${cData.phone} | Tọa độ: (${cData.address.latitude}, ${cData.address.longitude})`);
  }

  // 4. SEED 6 THỢ CHUYÊN NGHIỆP PHÂN TẦNG BÁN KÍNH
  console.log('\n--- Seeding 6 Thợ Chuyên Nghiệp Phân Tầng Bán Kính ---');
  const summaryList: Array<{
    name: string;
    phone: string;
    specialty: string;
    rating: string;
    distance: string;
    locationNote: string;
  }> = [];

  for (const wData of MULTI_TIER_WORKERS_DATA) {
    const category = createdCategories[wData.categorySlug];
    const categoryId = category ? category.id : null;

    let user = await prisma.user.findFirst({
      where: { OR: [{ phone: wData.phone }, { email: wData.email }] },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: wData.name,
          phone: wData.phone,
          email: wData.email,
          passwordHash: defaultPasswordHash,
          role: UserRole.WORKER,
          status: UserStatus.ACTIVE,
          avatarUrl: wData.avatarUrl,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: wData.name,
          phone: wData.phone,
          email: wData.email,
          passwordHash: defaultPasswordHash,
          role: UserRole.WORKER,
          status: UserStatus.ACTIVE,
          avatarUrl: wData.avatarUrl,
        },
      });
    }

    const workerProfile = await prisma.workerProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: wData.name,
        avatarUrl: wData.avatarUrl,
        isOnline: true,
        approvalStatus: 'APPROVED',
        kycStatus: 'APPROVED',
        idCardVerified: true,
        faceVerifiedAt: new Date(),
        currentLat: wData.currentLat,
        currentLng: wData.currentLng,
        serviceCategoryIds: categoryId ? [categoryId] : [],
        skills: wData.skills,
        bio: wData.bio,
        experienceYears: wData.experienceYears,
        rating: wData.rating,
        ratingAvg: wData.rating,
        totalReviews: wData.totalReviews,
      },
      create: {
        userId: user.id,
        fullName: wData.name,
        avatarUrl: wData.avatarUrl,
        isOnline: true,
        approvalStatus: 'APPROVED',
        kycStatus: 'APPROVED',
        idCardVerified: true,
        faceVerifiedAt: new Date(),
        currentLat: wData.currentLat,
        currentLng: wData.currentLng,
        serviceCategoryIds: categoryId ? [categoryId] : [],
        skills: wData.skills,
        bio: wData.bio,
        experienceYears: wData.experienceYears,
        rating: wData.rating,
        ratingAvg: wData.rating,
        totalReviews: wData.totalReviews,
      },
    });

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE worker_profiles 
         SET "currentLocation" = ST_SetSRID(ST_MakePoint($1, $2), 4326) 
         WHERE id = $3`,
        wData.currentLng,
        wData.currentLat,
        workerProfile.id
      );
    } catch (gisErr) {
      // Fallback nếu chưa kích hoạt PostGIS
    }

    await prisma.workerWallet.upsert({
      where: { workerId: workerProfile.id },
      update: { balance: new Prisma.Decimal(wData.walletBalance) },
      create: {
        workerId: workerProfile.id,
        balance: new Prisma.Decimal(wData.walletBalance),
      },
    });

    await prisma.wallet.upsert({
      where: { workerId: workerProfile.id },
      update: { balance: new Prisma.Decimal(wData.walletBalance) },
      create: {
        workerId: workerProfile.id,
        balance: new Prisma.Decimal(wData.walletBalance),
        currency: 'VND',
      },
    });

    if (categoryId) {
      const categoryServices = await prisma.service.findMany({
        where: { categoryId },
      });

      for (const svc of categoryServices) {
        await prisma.workerService.upsert({
          where: {
            workerId_serviceId: {
              workerId: workerProfile.id,
              serviceId: svc.id,
            },
          },
          update: { isAvailable: true },
          create: {
            workerId: workerProfile.id,
            serviceId: svc.id,
            isAvailable: true,
          },
        });
      }
    }

    const distance = calculateDistanceKm(
      ANCHOR_CUSTOMER.lat,
      ANCHOR_CUSTOMER.lng,
      wData.currentLat,
      wData.currentLng
    );

    summaryList.push({
      'Họ tên': wData.name,
      'SĐT': wData.phone,
      'Chuyên môn': wData.specialty,
      'Đánh giá': `${wData.rating} ⭐ (${wData.totalReviews} đơn)`,
      'Cự ly Radar': `~${distance} km`,
      'Vị trí thực tế': wData.locationNote,
    } as any);
  }

  // 5. IN BẢNG TỔNG KẾT
  console.log('\n========================================================================================================');
  console.log('       BẢNG TỔNG KẾT DANH SÁCH THỢ FIXGO PRO PHÂN TẦNG BÁN KÍNH RADAR (Anchor: Gò Vấp)');
  console.log('========================================================================================================');
  console.table(summaryList);
  console.log('========================================================================================================');
  console.log(`🎉 [HOÀN TẤT]: Đã nạp thành công ${categoryCount} danh mục, ${serviceCount} dịch vụ và 6 Thợ chuyên nghiệp!`);
}

main()
  .catch((e: Error) => {
    console.error('❌ Lỗi Seeding:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

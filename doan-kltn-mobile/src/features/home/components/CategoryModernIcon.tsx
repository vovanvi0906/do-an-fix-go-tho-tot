/**
 * @file CategoryModernIcon.tsx
 * @description Bộ Icon Vector Hiện Đại, Bắt Mắt dành cho 8 danh mục dịch vụ FixGo.
 * Thiết kế chuẩn UI/UX cao cấp:
 * - Vẽ bằng react-native-svg với Gradient đa tầng (Dual-Tone Gradients)
 * - Tỷ lệ vàng, bóng đổ chiều sâu tinh tế, chi tiết phản quang sắc nét
 * - Phù hợp tuyệt đối với từng nghiệp vụ dịch vụ gia đình
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

interface CategoryModernIconProps {
  slug: string;
  size?: number;
  isSelected?: boolean;
}

export default function CategoryModernIcon({
  slug,
  size = 32,
  isSelected = false,
}: CategoryModernIconProps) {
  const primaryId = `grad_p_${slug}`;
  const secondaryId = `grad_s_${slug}`;

  // 1. SỬA ĐIỆN (Tia sét năng lượng + Ổ cắm/Bóng đèn phát sáng 3D)
  if (slug === 'sua-dien') {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id={primaryId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#DC2626" />
          </LinearGradient>
          <LinearGradient id={secondaryId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FDE047" />
            <Stop offset="100%" stopColor="#F59E0B" />
          </LinearGradient>
        </Defs>
        {/* Vòng hào quang phát sáng nhẹ */}
        <Circle cx="24" cy="24" r="20" fill="url(#secondaryId)" fillOpacity="0.18" />
        {/* Thân bóng đèn năng lượng */}
        <Path
          d="M24 6C16.268 6 10 12.268 10 20C10 24.845 12.456 29.117 16.2 31.625C17.3 32.36 18 33.6 18 34.93V36C18 37.1 18.9 38 20 38H28C29.1 38 30 37.1 30 36V34.93C30 33.6 30.7 32.36 31.8 31.625C35.544 29.117 38 24.845 38 20C38 12.268 31.732 6 24 6Z"
          fill="url(#secondaryId)"
          fillOpacity="0.25"
        />
        {/* Tia sét trung tâm siêu sắc sảo */}
        <Path
          d="M26 8L13 25H23L21 40L35 22H25L26 8Z"
          fill="url(#primaryId)"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Đuôi đèn tiếp xúc */}
        <Rect x="20" y="38" width="8" height="3" rx="1.5" fill="#B45309" />
        <Rect x="22" y="42" width="4" height="2" rx="1" fill="#78350F" />
      </Svg>
    );
  }

  // 2. SỬA NƯỚC (Giọt nước pha lê + Van nước & Sóng thủy lực công nghệ)
  if (slug === 'sua-nuoc') {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id={primaryId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#38BDF8" />
            <Stop offset="100%" stopColor="#0284C7" />
          </LinearGradient>
          <LinearGradient id={secondaryId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#06B6D4" />
            <Stop offset="100%" stopColor="#0369A1" />
          </LinearGradient>
        </Defs>
        {/* Vòng tỏa sóng nước */}
        <Circle cx="24" cy="24" r="20" fill="url(#primaryId)" fillOpacity="0.14" />
        {/* Giọt nước lớn pha lê 3D */}
        <Path
          d="M24 7C24 7 12 21.5 12 29.5C12 36.127 17.373 41.5 24 41.5C30.627 41.5 36 36.127 36 29.5C36 21.5 24 7 24 7Z"
          fill="url(#primaryId)"
        />
        {/* Vệt phản quang lấp lánh bên trái */}
        <Path
          d="M19 23C17 26 16.5 29 17.5 32"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
        {/* Cờ lê cơ khí mini uốn lượn bên trong */}
        <Path
          d="M24 23L27.5 26.5C28.3 27.3 28.3 28.6 27.5 29.4L25.4 31.5C24.6 32.3 23.3 32.3 22.5 31.5L20.5 29.5"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="27" cy="18" r="2" fill="#FFFFFF" fillOpacity="0.9" />
      </Svg>
    );
  }

  // 3. ĐIỆN LẠNH (Tinh thể tuyết Bắc Cực + Luồng gió điều hòa lạnh)
  if (slug === 'dien-lanh') {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id={primaryId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#22D3EE" />
            <Stop offset="100%" stopColor="#0284C7" />
          </LinearGradient>
          <LinearGradient id={secondaryId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#E0F2FE" />
            <Stop offset="100%" stopColor="#BAE6FD" />
          </LinearGradient>
        </Defs>
        {/* Nền quạt mát */}
        <Circle cx="24" cy="24" r="20" fill="url(#primaryId)" fillOpacity="0.12" />
        {/* Bông tuyết 6 cánh hình học cao cấp */}
        <Path
          d="M24 7V41M7 24H41M12 12L36 36M12 36L36 12"
          stroke="url(#primaryId)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Nhánh con bông tuyết sắc sảo */}
        <Path
          d="M20 11L24 7L28 11M20 37L24 41L28 37M11 20L7 24L11 28M37 20L41 24L37 28M13 19L12 12L19 13M35 19L36 12L29 13M13 29L12 36L19 35M35 29L36 36L29 35"
          stroke="url(#primaryId)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Nhân bông tuyết phát sáng */}
        <Circle cx="24" cy="24" r="5" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
        <Circle cx="24" cy="24" r="2" fill="#0284C7" />
      </Svg>
    );
  }

  // 4. THIẾT BỊ (Smart TV / Thiết bị gia dụng thông minh & vi mạch)
  if (slug === 'thiet-bi') {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id={primaryId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#818CF8" />
            <Stop offset="100%" stopColor="#4F46E5" />
          </LinearGradient>
          <LinearGradient id={secondaryId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#C084FC" />
            <Stop offset="100%" stopColor="#7E22CE" />
          </LinearGradient>
        </Defs>
        <Circle cx="24" cy="24" r="20" fill="url(#primaryId)" fillOpacity="0.12" />
        {/* Màn hình TV / Smart Hub vát góc cong */}
        <Rect
          x="8"
          y="10"
          width="32"
          height="22"
          rx="4"
          fill="url(#primaryId)"
          stroke="#312E81"
          strokeWidth="1.5"
        />
        {/* Kính màn hình bên trong */}
        <Rect x="11" y="13" width="26" height="16" rx="2" fill="#EEF2FF" />
        {/* Sóng chip cảm biến / Biểu đồ thiết bị */}
        <Path
          d="M15 22L19 17L23 21L27 16L33 23"
          stroke="#4F46E5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Chân đế kim loại sang trọng */}
        <Path
          d="M20 32L17 38H31L28 32"
          stroke="#4338CA"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="24" cy="11.5" r="1" fill="#FFFFFF" />
      </Svg>
    );
  }

  // 5. LÀM VƯỜN (Chồi non sinh thái vươn lên + Giọt sương xanh ngọc)
  if (slug === 'lam-vuon') {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id={primaryId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#34D399" />
            <Stop offset="100%" stopColor="#059669" />
          </LinearGradient>
          <LinearGradient id={secondaryId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#A7F3D0" />
            <Stop offset="100%" stopColor="#10B981" />
          </LinearGradient>
        </Defs>
        <Circle cx="24" cy="24" r="20" fill="url(#primaryId)" fillOpacity="0.14" />
        {/* Nhánh cây vươn mềm mại */}
        <Path
          d="M16 39C19 32 23 26 24 12"
          stroke="#047857"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Chiếc lá chính bên phải */}
        <Path
          d="M24 12C24 12 34 14 36 24C32 26 27 24 24 21C22 19 23 15 24 12Z"
          fill="url(#primaryId)"
          stroke="#065F46"
          strokeWidth="1.2"
        />
        {/* Chiếc lá con bên trái */}
        <Path
          d="M21 24C21 24 12 26 12 32C17 33 21 30 22 27Z"
          fill="url(#secondaryId)"
          stroke="#065F46"
          strokeWidth="1.2"
        />
        {/* Đất mẹ dinh dưỡng */}
        <Path
          d="M12 40C16 38 32 38 36 40"
          stroke="#059669"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Giọt sương phản chiếu */}
        <Circle cx="30" cy="20" r="1.8" fill="#FFFFFF" fillOpacity="0.9" />
      </Svg>
    );
  }

  // 6. GIÚP VIỆC (Ngôi nhà sạch bóng + Chùm sao lấp lánh Magic Sparkle)
  if (slug === 'giup-viec') {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id={primaryId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FB7185" />
            <Stop offset="100%" stopColor="#E11D48" />
          </LinearGradient>
        </Defs>
        <Circle cx="24" cy="24" r="20" fill="url(#primaryId)" fillOpacity="0.14" />
        {/* Mái nhà ấm cúng sạch sẽ */}
        <Path
          d="M12 22L24 12L36 22V36C36 37.1 35.1 38 34 38H14C12.9 38 12 37.1 12 36V22Z"
          fill="url(#primaryId)"
          stroke="#BE123C"
          strokeWidth="1.5"
        />
        {/* Cửa nhà sáng bóng */}
        <Rect x="20" y="27" width="8" height="11" rx="2" fill="#FFE4E6" />
        {/* Ngôi sao lấp lánh lớn (Magic Sparkle) */}
        <Path
          d="M36 8C36 12 39 14 43 14C39 14 36 16 36 20C36 16 33 14 29 14C33 14 36 12 36 8Z"
          fill="#FBBF24"
        />
        {/* Ngôi sao lấp lánh nhỏ */}
        <Path
          d="M12 8C12 10.5 14 11.5 16 11.5C14 11.5 12 12.5 12 15C12 12.5 10 11.5 8 11.5C10 11.5 12 10.5 12 8Z"
          fill="#FDE047"
        />
        <Circle cx="24" cy="32" r="1.2" fill="#E11D48" />
      </Svg>
    );
  }

  // 7. BẢNG GIÁ (Tài liệu báo giá minh bạch + Huy hiệu bảo đảm & Tick xanh)
  if (slug === 'bang-gia') {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id={primaryId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#2DD4BF" />
            <Stop offset="100%" stopColor="#0D9488" />
          </LinearGradient>
        </Defs>
        <Circle cx="24" cy="24" r="20" fill="url(#primaryId)" fillOpacity="0.14" />
        {/* Tờ hóa đơn/bảng giá gấp góc */}
        <Path
          d="M12 10C12 8.9 12.9 8 14 8H28L36 16V38C36 39.1 35.1 40 34 40H14C12.9 40 12 39.1 12 38V10Z"
          fill="url(#primaryId)"
          stroke="#115E59"
          strokeWidth="1.5"
        />
        {/* Góc gấp tài liệu */}
        <Path d="M28 8V16H36" fill="#CCFBF1" />
        {/* Các dòng báo giá minh bạch */}
        <Rect x="17" y="21" width="10" height="2.5" rx="1.2" fill="#CCFBF1" />
        <Rect x="17" y="26" width="14" height="2.5" rx="1.2" fill="#CCFBF1" />
        <Rect x="17" y="31" width="8" height="2.5" rx="1.2" fill="#CCFBF1" />
        {/* Huy hiệu cam kết giá chuẩn có dấu tick */}
        <Circle cx="32" cy="33" r="7" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
        <Path
          d="M29.5 33L31.2 34.7L34.5 31.3"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  // 8. DỊCH VỤ KHÁC (Khối đa năng 4 ô ma trận 3D + Dấu cộng mở rộng hoàng gia)
  // slug === 'dich-vu-khac'
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <LinearGradient id={primaryId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3B82F6" />
          <Stop offset="100%" stopColor="#1D4ED8" />
        </LinearGradient>
        <LinearGradient id={secondaryId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#60A5FA" />
          <Stop offset="100%" stopColor="#2563EB" />
        </LinearGradient>
      </Defs>
      <Circle cx="24" cy="24" r="20" fill="url(#primaryId)" fillOpacity="0.14" />
      {/* 4 khối ma trận dịch vụ 3D nổi bật */}
      <Rect
        x="10"
        y="10"
        width="11"
        height="11"
        rx="3"
        fill="url(#primaryId)"
        stroke="#1E40AF"
        strokeWidth="1.2"
      />
      <Rect
        x="27"
        y="10"
        width="11"
        height="11"
        rx="3"
        fill="url(#secondaryId)"
        stroke="#1E40AF"
        strokeWidth="1.2"
      />
      <Rect
        x="10"
        y="27"
        width="11"
        height="11"
        rx="3"
        fill="url(#secondaryId)"
        stroke="#1E40AF"
        strokeWidth="1.2"
      />
      {/* Khối thứ 4 là khối tương tác Dấu Cộng (Thêm dịch vụ mới / Custom) */}
      <Rect
        x="27"
        y="27"
        width="11"
        height="11"
        rx="3"
        fill="#0284C7"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      <Path
        d="M32.5 30V35M30 32.5H35"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Tia phản quang ở khối đầu tiên */}
      <Circle cx="15.5" cy="15.5" r="1.5" fill="#FFFFFF" fillOpacity="0.8" />
    </Svg>
  );
}

const styles = StyleSheet.create({});

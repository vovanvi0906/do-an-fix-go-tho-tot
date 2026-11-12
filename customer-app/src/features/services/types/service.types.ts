/**
 * @file service.types.ts
 * @description Định nghĩa TypeScript Interfaces cho hệ thống Dịch vụ con & Bảng giá minh bạch FixGo Pro.
 */

export interface SubService {
  id: string;
  categoryId: string;
  name: string;
  slug?: string;
  description: string;
  basePrice: number;
  maxPrice?: number;
  estimatedPriceRange: string; // vd: "80.000đ - 180.000đ"
  unit: string;               // "lần", "cái", "bộ", "giờ", "m²", "điểm", "máy", "bếp", "bình", "buổi", "cây", "căn hộ"
  estimatedDurationMin?: number; // thời gian dự kiến (phút)
  isPopular?: boolean;
  popularBadge?: string;      // "Bán chạy", "Khẩn cấp", "AI Ước tính", "Bảo hành 6T", etc.
  iconName: string;
  laborCostMin?: number;
  laborCostMax?: number;
  materialCostRange?: string;
  warrantyMonths?: number;
}

export interface ServiceCategoryDetail {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  accentBg: string;
  borderColor?: string;
  description?: string;
  services: SubService[];
}

export interface PriceTierItem {
  tierName: string;
  tierSubtitle: string;
  priceDisplay: string;
  description: string;
  iconName: string;
  badge?: string;
  isFree?: boolean;
}

export interface CategoryPricingTier {
  categoryId: string;
  categoryName: string;
  slug: string;
  color: string;
  accentBg: string;
  icon: string;
  inspectionFee: PriceTierItem;
  laborFee: PriceTierItem;
  materialFee: PriceTierItem;
  popularServices: SubService[];
  notes?: string[];
}

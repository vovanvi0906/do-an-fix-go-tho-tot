/**
 * ============================================================================
 * FIXGO PRO - CUSTOMER SERVICES CATALOG TYPE DEFINITIONS
 * ============================================================================
 * Định nghĩa chi tiết TypeScript Interfaces cho module
 * "Tất cả Dịch vụ & Bảng giá" (Customer Services & Pricing Catalog)
 */

import type { LucideIcon } from 'lucide-react';

/**
 * Phân loại huy hiệu tiếp thị theo ngữ cảnh thực tế (Tránh lạm dụng nhãn 'PHỔ BIẾN')
 */
export type ServiceBadgeType = 'popular' | 'best_price' | 'fastest' | 'warranty' | null;

/**
 * Dữ liệu một gói dịch vụ trong danh mục bảng giá khách hàng
 */
export interface CatalogService {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  unit: string;
  unitExplanation: string;
  durationText: string;
  warrantyText: string;
  badge: string | null;
  badgeType: ServiceBadgeType;
  categoryId: string;
  categoryName: string;
  icon: LucideIcon;
  iconColor: string;
  gradient: string;
  borderColor: string;
  isPrimaryAction: boolean;
}

/**
 * Tab lọc danh mục dịch vụ
 */
export interface CategoryTab {
  id: string;
  label: string;
  count: number;
}

/**
 * Kết quả trả về từ Custom Hook useServicesCatalog
 */
export interface UseServicesCatalogReturn {
  services: CatalogService[];
  categories: CategoryTab[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Props cho component ServicesCatalogView
 */
export interface ServicesCatalogViewProps {
  onOrderCreated?: (order: any) => void;
  setActiveTab?: (tab: string) => void;
}

/**
 * ============================================================================
 * FIXGO PRO - SERVICE MANAGEMENT TYPE DEFINITIONS & INTERFACES
 * ============================================================================
 * Định nghĩa chi tiết TypeScript Interfaces và JSDoc cho tính năng
 * Quản lý Danh mục & Gói Dịch Vụ (Service Category & Item Management CRUD)
 */

/**
 * Thông tin danh mục dịch vụ (Category)
 */
export interface ServiceCategoryItem {
  id: string;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  isActive?: boolean;
  _count?: {
    services?: number;
  };
}

/**
 * Thông tin một gói dịch vụ chi tiết (Service)
 */
export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  basePrice: number | string;
  unit?: string | null;
  estimatedDurationMin?: number | null;
  isActive: boolean;
  categoryId: string;
  category?: ServiceCategoryItem | null;
  _count?: {
    orders?: number;
    workerServices?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload form tạo mới hoặc cập nhật gói dịch vụ
 */
export interface ServiceFormData {
  name: string;
  categoryId: string;
  basePrice: number | string;
  unit: string;
  estimatedDurationMin: number | string;
  description: string;
  isActive: boolean;
}

/**
 * Thông số phân trang
 */
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Props cho Modal Thêm/Sửa Dịch Vụ
 */
export interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServiceFormData) => Promise<void> | void;
  initialData?: ServiceItem | null;
  categories: ServiceCategoryItem[];
  isSubmitting?: boolean;
}

/**
 * Props cho Modal Xác Nhận Xóa Dịch Vụ
 */
export interface DeleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (force?: boolean) => Promise<void> | void;
  serviceName?: string;
  orderCount?: number;
  isSubmitting?: boolean;
}

/**
 * Props cho Modal Xem Chi Tiết Dịch Vụ
 */
export interface ServiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: ServiceItem | null;
}

/**
 * Tương thích alias
 */
export type CategoryOption = ServiceCategoryItem;
export type ServicePagination = PaginationState;

export interface ServiceFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: 'active' | 'inactive';
}


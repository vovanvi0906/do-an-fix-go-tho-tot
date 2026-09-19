/**
 * ============================================================================
 * FIXGO PRO - CATEGORY MANAGEMENT TYPE DEFINITIONS & INTERFACES
 * ============================================================================
 * Định nghĩa chi tiết TypeScript Interfaces và JSDoc cho tính năng
 * Quản lý Danh mục Ngành nghề (Category Management CRUD)
 */

/**
 * Thông tin chi tiết một nhóm danh mục ngành nghề
 */
export interface CategoryItem {
  /** ID duy nhất của danh mục */
  id: string;
  /** Tên hiển thị nhóm ngành nghề (Điện - Nước, Vệ sinh & Dọn dẹp...) */
  name: string;
  /** Slug nhận diện URL/SEO (dien-nuoc, ve-sinh-don-dep...) */
  slug?: string;
  /** Mô tả ngắn gọn phạm vi ngành nghề */
  description?: string | null;
  /** Biểu tượng icon nhận diện */
  icon?: string | null;
  /** URL biểu tượng nhận diện (Icon preset, SVG URL hoặc emoji) */
  iconUrl?: string | null;
  /** Trạng thái cung cấp (Hoạt động / Tạm ngưng) */
  isActive: boolean;
  /** Số lượng gói dịch vụ trực thuộc danh mục */
  _count?: {
    services?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Dữ liệu Form tạo mới hoặc chỉnh sửa danh mục
 */
export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  iconUrl: string;
  isActive: boolean;
}

/**
 * Props cho Modal Thêm/Sửa Danh Mục (CategoryModal.tsx)
 */
export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoryFormData) => Promise<void> | void;
  initialData?: CategoryItem | null;
  isSubmitting?: boolean;
}

/**
 * Props cho Modal Xác Nhận Xóa Danh Mục (DeleteCategoryModal.jsx)
 */
export interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (force?: boolean) => Promise<void> | void;
  categoryName?: string;
  serviceCount?: number;
  isSubmitting?: boolean;
}

/**
 * Props cho Khối Quản lý Danh mục (CategoryManagementSection.tsx)
 */
export interface CategoryManagementSectionProps {
  categories: CategoryItem[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onOpenCreate: () => void;
  onOpenEdit: (category: CategoryItem) => void;
  onOpenDelete: (category: CategoryItem) => void;
  onToggleStatus: (category: CategoryItem) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSearchChange?: (searchTerm: string) => void;
}

/**
 * Tương thích ngược với CategorySectionProps
 */
export type CategorySectionProps = CategoryManagementSectionProps;


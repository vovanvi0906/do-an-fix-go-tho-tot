import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap,
  Droplets,
  Wind,
  Sparkles,
  Key,
  Wrench,
  Trees,
  Hammer,
  type LucideIcon,
} from 'lucide-react';
import apiClient from '../../../services/api/client';
import type {
  CatalogService,
  CategoryTab,
  ServiceBadgeType,
  UseServicesCatalogReturn,
} from '../../../types/serviceCatalog';

/**
 * Phân giải icon, màu sắc và viền phong cách Linear/Vercel theo tên dịch vụ & danh mục
 */
function getVisualMeta(name: string = '', categoryName: string = '', desc: string = '') {
  const text = `${name} ${categoryName} ${desc}`.toLowerCase();

  if (text.includes('điện') && !text.includes('lạnh')) {
    return {
      icon: Zap as LucideIcon,
      iconColor: 'text-amber-400',
      gradient: 'from-amber-500/15 via-orange-500/5 to-transparent',
      borderColor: 'hover:border-amber-500/40',
    };
  }

  if (text.includes('nước') || text.includes('ống') || text.includes('vòi') || text.includes('bồn')) {
    return {
      icon: Droplets as LucideIcon,
      iconColor: 'text-cyan-400',
      gradient: 'from-blue-500/15 via-cyan-500/5 to-transparent',
      borderColor: 'hover:border-cyan-500/40',
    };
  }

  if (text.includes('lạnh') || text.includes('điều hòa') || text.includes('máy giặt')) {
    return {
      icon: Wind as LucideIcon,
      iconColor: 'text-emerald-400',
      gradient: 'from-emerald-500/15 via-teal-500/5 to-transparent',
      borderColor: 'hover:border-emerald-500/40',
    };
  }

  if (text.includes('dọn') || text.includes('vệ sinh') || text.includes('nhà cửa') || text.includes('lau')) {
    return {
      icon: Sparkles as LucideIcon,
      iconColor: 'text-purple-400',
      gradient: 'from-purple-500/15 via-pink-500/5 to-transparent',
      borderColor: 'hover:border-purple-500/40',
    };
  }

  if (text.includes('khóa') || text.includes('cửa')) {
    return {
      icon: Key as LucideIcon,
      iconColor: 'text-rose-400',
      gradient: 'from-rose-500/15 via-red-500/5 to-transparent',
      borderColor: 'hover:border-rose-500/40',
    };
  }

  if (text.includes('vườn') || text.includes('cây') || text.includes('cỏ')) {
    return {
      icon: Trees as LucideIcon,
      iconColor: 'text-emerald-400',
      gradient: 'from-emerald-500/15 via-green-500/5 to-transparent',
      borderColor: 'hover:border-emerald-500/40',
    };
  }

  if (text.includes('nội thất') || text.includes('lắp đặt') || text.includes('kệ') || text.includes('bàn')) {
    return {
      icon: Hammer as LucideIcon,
      iconColor: 'text-amber-400',
      gradient: 'from-amber-500/15 via-orange-500/5 to-transparent',
      borderColor: 'hover:border-amber-500/40',
    };
  }

  return {
    icon: Wrench as LucideIcon,
    iconColor: 'text-blue-400',
    gradient: 'from-blue-500/15 via-indigo-500/5 to-transparent',
    borderColor: 'hover:border-blue-500/40',
  };
}

/**
 * Đồng bộ định dạng thời lượng thi công thành khoảng thời gian chuẩn (VD: '45 - 60 phút')
 */
function formatDurationRange(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return '30 - 45 phút';
  if (minutes <= 45) return '30 - 45 phút';
  if (minutes <= 60) return '45 - 60 phút';
  if (minutes <= 75) return '60 - 75 phút';
  if (minutes <= 90) return '60 - 90 phút';
  if (minutes <= 120) return '90 - 120 phút';
  return '2 - 3 giờ';
}

/**
 * Chuẩn hóa logic thời gian bảo hành theo tính chất kỹ thuật của dịch vụ
 */
function getWarrantyPolicy(name: string = '', categoryName: string = ''): string {
  const text = `${name} ${categoryName}`.toLowerCase();
  if (text.includes('dọn') || text.includes('vệ sinh nhà')) {
    return 'Nghiệm thu hài lòng';
  }
  if (text.includes('vườn') || text.includes('nội thất')) {
    return 'Bảo hành 15 ngày';
  }
  return 'Bảo hành 30 ngày';
}

/**
 * Minh bạch hóa đơn vị tính: Bổ sung giải thích chi tiết cho từng loại đơn vị
 */
function getUnitExplanation(unit: string = ''): string {
  const u = unit.toLowerCase().trim();
  switch (u) {
    case 'điểm':
      return '1 điểm = 1 vị trí lắp đặt/thay thế thực tế (ổ cắm, công tắc, bóng đèn)';
    case 'giờ':
      return 'Tính theo thời lượng nhân viên thực tế làm việc tại địa chỉ';
    case 'lần':
      return 'Gói dịch vụ xử lý trọn gói theo từng lượt gọi kỹ thuật viên';
    case 'bộ':
      return 'Tính trên 1 bộ máy lạnh / thiết bị điện máy hoàn chỉnh';
    case 'thiết bị':
      return 'Chi phí kiểm tra, bảo trì cho 1 thiết bị điện tử gia đình';
    case 'sản phẩm':
      return 'Tính trên 1 kiện nội thất hoàn chỉnh lắp ráp tại chỗ';
    case 'buổi':
      return 'Tính theo 1 buổi chăm sóc cảnh quan, cắt tỉa sân vườn';
    default:
      return 'Đơn vị tính niêm yết tiêu chuẩn của dịch vụ';
  }
}

/**
 * Xử lý triệt để lỗi lạm dụng Badge "PHỔ BIẾN":
 * Chỉ giữ lại cho 2 gói dịch vụ thật sự cốt lõi, đa dạng hóa nhãn dán theo ngữ cảnh
 */
function getContextualBadge(name: string = '', price: number = 0): { badge: string | null; badgeType: ServiceBadgeType } {
  const n = name.toLowerCase();

  // 1. Phổ biến nhất (chỉ 2 dịch vụ)
  if (n.includes('sự cố điện dân dụng') || n.includes('vệ sinh điện lạnh')) {
    return { badge: 'PHỔ BIẾN', badgeType: 'popular' };
  }

  // 2. Giá tốt nhất
  if (n === 'dọn dẹp nhà cửa' || price <= 80000) {
    return { badge: 'Giá tốt', badgeType: 'best_price' };
  }

  // 3. Xử lý nhanh nhất
  if (n === 'sửa chữa điện' || n.includes('khẩn cấp')) {
    return { badge: 'Nhanh nhất', badgeType: 'fastest' };
  }

  // 4. Bảo hành dài
  if (n.includes('sửa chữa thiết bị gia đình')) {
    return { badge: 'Bảo hành dài', badgeType: 'warranty' };
  }

  // Các dịch vụ còn lại không gán badge để giữ giao diện thoáng và sạch
  return { badge: null, badgeType: null };
}

/**
 * Custom Hook: useServicesCatalog
 * Quản lý fetching dữ liệu dịch vụ và danh mục từ Backend RESTful API
 *
 * RESTful API:
 * - GET /api/service-categories
 * - GET /api/services
 */
export function useServicesCatalog(): UseServicesCatalogReturn {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [categories, setCategories] = useState<CategoryTab[]>([
    { id: 'all', label: 'Tất cả dịch vụ', count: 0 },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const isFetchingRef = useRef<boolean>(false);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      // Gọi đồng thời cả danh mục và danh sách dịch vụ từ RESTful API
      const [categoriesRes, servicesRes] = await Promise.allSettled([
        apiClient.get('/service-categories'),
        apiClient.get('/services'),
      ]);

      if (!isMountedRef.current) return;

      let rawServices: any[] = [];
      let rawCategories: any[] = [];

      if (servicesRes.status === 'fulfilled') {
        rawServices = Array.isArray(servicesRes.value.data)
          ? servicesRes.value.data
          : Array.isArray(servicesRes.value)
          ? servicesRes.value
          : [];
      } else {
        console.warn('Lỗi khi fetch /api/services:', servicesRes.reason);
      }

      if (categoriesRes.status === 'fulfilled') {
        rawCategories = Array.isArray(categoriesRes.value.data)
          ? categoriesRes.value.data
          : Array.isArray(categoriesRes.value)
          ? categoriesRes.value
          : [];
      } else {
        console.warn('Lỗi khi fetch /api/service-categories:', categoriesRes.reason);
      }

      // Xử lý và chuẩn hóa danh sách dịch vụ
      const mappedServices: CatalogService[] = rawServices.map((s) => {
        const categoryName = s.category?.name || 'Dịch vụ tiện ích';
        const price = Number(s.basePrice) || 150000;
        const visual = getVisualMeta(s.name, categoryName, s.description || '');
        const durationText = formatDurationRange(s.estimatedDurationMin);
        const warrantyText = getWarrantyPolicy(s.name, categoryName);
        const unitExplanation = getUnitExplanation(s.unit || 'lần');
        const { badge, badgeType } = getContextualBadge(s.name, price);

        return {
          id: s.id,
          name: s.name,
          description: s.description || 'Dịch vụ kỹ thuật chuyên nghiệp bởi kỹ thuật viên đối tác FixGo.',
          basePrice: price,
          unit: s.unit || 'lần',
          unitExplanation,
          durationText,
          warrantyText,
          badge,
          badgeType,
          categoryId: s.categoryId || s.category?.id || 'all',
          categoryName,
          icon: visual.icon,
          iconColor: visual.iconColor,
          gradient: visual.gradient,
          borderColor: visual.borderColor,
          isPrimaryAction: badgeType === 'popular' || badgeType === 'fastest',
        };
      });

      // Lọc danh mục hợp lệ có chứa dịch vụ
      const categoryTabs: CategoryTab[] = [
        { id: 'all', label: 'Tất cả dịch vụ', count: mappedServices.length },
      ];

      // Đếm số lượng dịch vụ theo từng danh mục
      const categoryCounts: Record<string, number> = {};
      mappedServices.forEach((s) => {
        categoryCounts[s.categoryId] = (categoryCounts[s.categoryId] || 0) + 1;
      });

      rawCategories
        .filter((c) => c.isActive !== false && categoryCounts[c.id] > 0)
        .forEach((c) => {
          categoryTabs.push({
            id: c.id,
            label: c.name,
            count: categoryCounts[c.id] || 0,
          });
        });

      setServices(mappedServices);
      setCategories(categoryTabs);

      if (servicesRes.status === 'rejected' && categoriesRes.status === 'rejected') {
        setError('Không thể kết nối đến máy chủ bảng giá. Vui lòng kiểm tra lại kết nối!');
      } else {
        setError(null);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Lỗi khi tải bảng giá dịch vụ');
      }
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return {
    services,
    categories,
    isLoading,
    error,
    refetch: fetchData,
  };
}

export default useServicesCatalog;

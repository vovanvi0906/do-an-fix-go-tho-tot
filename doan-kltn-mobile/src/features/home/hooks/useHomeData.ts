/**
 * @file useHomeData.ts
 * @description Custom hook quản lý dữ liệu, bộ lọc và trạng thái nghiệp vụ cho Trang Chủ FixGo Mobile.
 * Tách biệt hoàn toàn tầng Logic khỏi UI Presentation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  HomeDataState,
  UserProfile,
  CategoryItem,
  WorkerItem,
  ServiceItem,
  VoucherItem,
} from '../types/home.types';

// ========================================================
// MOCK FALLBACK DATA (SEED COMPATIBLE)
// ========================================================

const MOCK_USER: UserProfile = {
  id: 'cust-001',
  fullName: 'Nguyễn Văn An',
  phone: '0901111111',
  email: 'khach1@fixgo.vn',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  role: 'CUSTOMER',
  rewardPoints: 0,
  currentDistrict: 'Q. Bình Thạnh, TP.HCM',
};

const MOCK_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-01',
    name: 'Sửa điện',
    slug: 'sua-dien',
    iconName: 'Zap',
    gradientColors: ['#F59E0B', '#EA580C'],
    serviceCount: 14,
    isPopular: true,
  },
  {
    id: 'cat-02',
    name: 'Sửa nước',
    slug: 'sua-nuoc',
    iconName: 'Droplets',
    gradientColors: ['#06B6D4', '#2563EB'],
    serviceCount: 12,
    isPopular: true,
  },
  {
    id: 'cat-03',
    name: 'Điện lạnh',
    slug: 'dien-lanh',
    iconName: 'Wind',
    gradientColors: ['#0284C7', '#4F46E5'],
    serviceCount: 18,
    isPopular: true,
  },
  {
    id: 'cat-04',
    name: 'Thiết bị',
    slug: 'thiet-bi',
    iconName: 'Tv',
    gradientColors: ['#6366F1', '#9333EA'],
    serviceCount: 9,
    isPopular: true,
  },
  {
    id: 'cat-05',
    name: 'Làm vườn',
    slug: 'lam-vuon',
    iconName: 'Trees',
    gradientColors: ['#10B981', '#0D9488'],
    serviceCount: 7,
    isPopular: false,
  },
  {
    id: 'cat-06',
    name: 'Giúp việc',
    slug: 'giup-viec',
    iconName: 'Sparkles',
    gradientColors: ['#EC4899', '#E11D48'],
    serviceCount: 15,
    isPopular: false,
  },
  {
    id: 'cat-07',
    name: 'Bảng giá',
    slug: 'bang-gia',
    iconName: 'FileText',
    gradientColors: ['#14B8A6', '#059669'],
    serviceCount: 45,
    isPopular: false,
  },
  {
    id: 'cat-08',
    name: 'Dịch vụ khác',
    slug: 'dich-vu-khac',
    iconName: 'LayoutGrid',
    gradientColors: ['#64748B', '#334155'],
    serviceCount: 22,
    isPopular: false,
  },
];

const MOCK_WORKERS: WorkerItem[] = [
  {
    id: 'w-01',
    fullName: 'Lê Văn Thợ Điện',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    specialty: 'Sửa điện - nước dân dụng',
    rating: 5.0,
    totalReviews: 48,
    distanceKm: 0.3,
    isOnline: true,
    completedJobs: 156,
    latitude: 10.7780,
    longitude: 106.6990,
  },
  {
    id: 'w-02',
    fullName: 'Phạm Văn Thợ Lạnh',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    specialty: 'Bảo dưỡng & Vệ sinh máy lạnh',
    rating: 4.9,
    totalReviews: 64,
    distanceKm: 0.6,
    isOnline: true,
    completedJobs: 210,
    latitude: 10.7795,
    longitude: 106.7025,
  },
  {
    id: 'w-03',
    fullName: 'Hoàng Minh Tuấn',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    specialty: 'Thông tắc & Cấp thoát nước',
    rating: 4.85,
    totalReviews: 32,
    distanceKm: 1.1,
    isOnline: true,
    completedJobs: 98,
    latitude: 10.7745,
    longitude: 106.6975,
  },
];

const MOCK_POPULAR_SERVICES: ServiceItem[] = [
  {
    id: 'svc-01',
    name: 'Vệ sinh máy lạnh treo tường (1.0 - 2.5 HP)',
    slug: 've-sinh-may-lanh',
    categoryName: 'Điện lạnh',
    basePrice: 150000,
    unit: 'bộ',
    durationMin: 60,
    rating: 4.9,
    reviewsCount: 342,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    tag: 'Bán chạy nhất',
  },
  {
    id: 'svc-02',
    name: 'Khắc phục chập điện & Thay Aptomat',
    slug: 'khac-phuc-chap-dien',
    categoryName: 'Sửa điện',
    basePrice: 150000,
    unit: 'lần',
    durationMin: 45,
    rating: 5.0,
    reviewsCount: 218,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80',
    tag: 'Cứu hộ khẩn cấp',
  },
  {
    id: 'svc-03',
    name: 'Sửa rò rỉ đường ống nước sinh hoạt',
    slug: 'sua-ro-ri-ong-nuoc',
    categoryName: 'Sửa nước',
    basePrice: 180000,
    unit: 'lần',
    durationMin: 60,
    rating: 4.85,
    reviewsCount: 165,
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80',
    tag: 'Bảo hành 30 ngày',
  },
  {
    id: 'svc-04',
    name: 'Tổng vệ sinh căn hộ gia đình (Gói 3 giờ)',
    slug: 'tong-ve-sinh-can-ho',
    categoryName: 'Giúp việc',
    basePrice: 240000,
    unit: 'gói',
    durationMin: 180,
    rating: 4.92,
    reviewsCount: 512,
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
  },
];

const MOCK_VOUCHERS: VoucherItem[] = [
  {
    id: 'v-01',
    code: 'FIXGO30',
    title: 'Giảm 30% lần đầu',
    subtitle: 'Tối đa 100K cho đơn dịch vụ đầu tiên',
    discountPercent: 30,
    maxDiscount: 100000,
    expiryDate: 'HSD: 30/11/2026',
    theme: 'orange',
    isClaimed: false,
  },
  {
    id: 'v-02',
    code: 'FREESCAN',
    title: 'Giảm 50K cho đơn',
    subtitle: 'Áp dụng cho dịch vụ Điện lạnh & Sửa nước',
    discountPercent: 20,
    maxDiscount: 50000,
    expiryDate: 'HSD: 15/12/2026',
    theme: 'blue',
    isClaimed: false,
  },
];

export interface UseHomeDataReturn {
  data: HomeDataState;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  searchQuery: string;
  selectedDistrict: string;
  selectedCategoryId: string | null;
  filteredPopularServices: ServiceItem[];
  setSearchQuery: (q: string) => void;
  setSelectedDistrict: (district: string) => void;
  setSelectedCategoryId: (catId: string | null) => void;
  claimVoucher: (voucherId: string) => void;
  refetch: () => Promise<void>;
}

/**
 * Custom hook `useHomeData`
 */
export function useHomeData(): UseHomeDataReturn {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [categories, setCategories] = useState<CategoryItem[]>(MOCK_CATEGORIES);
  const [nearbyWorkers, setNearbyWorkers] = useState<WorkerItem[]>(MOCK_WORKERS);
  const [popularServices, setPopularServices] = useState<ServiceItem[]>(MOCK_POPULAR_SERVICES);
  const [vouchers, setVouchers] = useState<VoucherItem[]>(MOCK_VOUCHERS);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Q. Bình Thạnh, TP.HCM');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  /**
   * Fetch toàn bộ dữ liệu trang chủ từ RESTful Backend
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      // Giả lập network delay nhẹ (300ms)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // =========================================================================
      // 1. TODO: API Integration - GET /api/v1/users/profile
      // const userRes = await apiClient.get('/api/v1/users/profile');
      // setUser(userRes.data);
      // =========================================================================
      setUser(MOCK_USER);

      // =========================================================================
      // 2. TODO: API Integration - GET /api/v1/workers/nearby?lat={lat}&lng={lng}
      // const workerRes = await apiClient.get(`/api/v1/workers/nearby?lat=10.8031&lng=106.7144`);
      // setNearbyWorkers(workerRes.data);
      // =========================================================================
      setNearbyWorkers(MOCK_WORKERS);

      // =========================================================================
      // 3. TODO: API Integration - GET /api/v1/services/categories
      // const catRes = await apiClient.get('/api/v1/services/categories');
      // setCategories(catRes.data);
      // =========================================================================
      setCategories(MOCK_CATEGORIES);

      // =========================================================================
      // 4. TODO: API Integration - GET /api/v1/services/popular
      // const popularRes = await apiClient.get('/api/v1/services/popular');
      // setPopularServices(popularRes.data);
      // =========================================================================
      setPopularServices(MOCK_POPULAR_SERVICES);

      // =========================================================================
      // 5. TODO: API Integration - GET /api/v1/promotions/active
      // const promoRes = await apiClient.get('/api/v1/promotions/active');
      // setVouchers(promoRes.data);
      // =========================================================================
      setVouchers(MOCK_VOUCHERS);

      setIsLoading(false);
    } catch (err: unknown) {
      console.error('❌ [useHomeData] Lỗi tải dữ liệu:', err);
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Không thể kết nối máy chủ FixGo');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Lọc danh sách dịch vụ phổ biến theo tìm kiếm và danh mục
   */
  const filteredPopularServices = useMemo(() => {
    return popularServices.filter((svc) => {
      const matchesSearch =
        !searchQuery.trim() ||
        svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        !selectedCategoryId ||
        categories.find((c) => c.id === selectedCategoryId)?.name === svc.categoryName;

      return matchesSearch && matchesCat;
    });
  }, [popularServices, searchQuery, selectedCategoryId, categories]);

  const claimVoucher = useCallback((voucherId: string) => {
    setVouchers((prev) =>
      prev.map((v) => (v.id === voucherId ? { ...v, isClaimed: true } : v))
    );
  }, []);

  const homeDataState: HomeDataState = useMemo(
    () => ({
      user,
      categories,
      nearbyWorkers,
      popularServices,
      vouchers,
      unreadNotificationsCount: 1,
    }),
    [user, categories, nearbyWorkers, popularServices, vouchers]
  );

  return {
    data: homeDataState,
    isLoading,
    isError,
    errorMessage,
    searchQuery,
    selectedDistrict,
    selectedCategoryId,
    filteredPopularServices,
    setSearchQuery,
    setSelectedDistrict,
    setSelectedCategoryId,
    claimVoucher,
    refetch: fetchData,
  };
}

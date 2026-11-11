/**
 * @file useHomeData.ts
 * @description Custom hook quản lý trạng thái, dữ liệu và tương tác nghiệp vụ cho Trang Chủ Mobile Web App FixGo Pro.
 * Tách biệt hoàn toàn tầng Logic và Presentation UI.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  HomeDataState,
  UserProfileDTO,
  ServiceCategoryDTO,
  PopularServiceDTO,
  WorkerNearbyDTO,
  PromotionDTO,
  AiDiagnosisResultDTO,
} from '../types/home.types';

// ========================================================
// MOCK FALLBACK DATA (PRODUCTION SEED READY)
// ========================================================

const MOCK_USER: UserProfileDTO = {
  id: 'cust-001',
  fullName: 'Nguyễn Văn Khách',
  email: 'khach1@fixgo.vn',
  phone: '0901111111',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  role: 'CUSTOMER',
  rewardPoints: 1250,
  currentDistrict: 'Quận 1, TP.HCM',
  savedAddresses: [
    {
      id: 'addr-01',
      title: 'Nhà riêng',
      street: '123 Lê Lợi',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      city: 'TP. Hồ Chí Minh',
      latitude: 10.7769,
      longitude: 106.7009,
      isDefault: true,
    },
    {
      id: 'addr-02',
      title: 'Công ty',
      street: '72 Lê Thánh Tôn',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      city: 'TP. Hồ Chí Minh',
      latitude: 10.7780,
      longitude: 106.7015,
      isDefault: false,
    },
  ],
};

const MOCK_CATEGORIES: ServiceCategoryDTO[] = [
  {
    id: 'cat-01',
    name: 'Sửa điện',
    slug: 'sua-dien',
    iconName: 'Zap',
    gradientFrom: 'from-amber-400',
    gradientTo: 'to-orange-500',
    serviceCount: 14,
    isPopular: true,
    description: 'Chập điện, thay CB, ổ cắm, công tắc, quạt trần',
  },
  {
    id: 'cat-02',
    name: 'Sửa nước',
    slug: 'sua-nuoc',
    iconName: 'Droplets',
    gradientFrom: 'from-cyan-400',
    gradientTo: 'to-blue-500',
    serviceCount: 12,
    isPopular: true,
    description: 'Rò rỉ ống nước, vòi nước, thông tắc lavabo',
  },
  {
    id: 'cat-03',
    name: 'Điện lạnh',
    slug: 'dien-lanh',
    iconName: 'Wind',
    gradientFrom: 'from-sky-400',
    gradientTo: 'to-indigo-500',
    serviceCount: 18,
    isPopular: true,
    description: 'Vệ sinh máy lạnh, nạp gas, sửa máy giặt',
  },
  {
    id: 'cat-04',
    name: 'Thiết bị',
    slug: 'thiet-bi',
    iconName: 'Tv',
    gradientFrom: 'from-indigo-400',
    gradientTo: 'to-purple-600',
    serviceCount: 9,
    isPopular: true,
    description: 'Tủ lạnh, lò vi sóng, máy hút mùi gia đình',
  },
  {
    id: 'cat-05',
    name: 'Làm vườn',
    slug: 'lam-vuon',
    iconName: 'Trees',
    gradientFrom: 'from-emerald-400',
    gradientTo: 'to-teal-600',
    serviceCount: 7,
    isPopular: false,
    description: 'Cắt tỉa cây cảnh, dọn cỏ sân vườn',
  },
  {
    id: 'cat-06',
    name: 'Giúp việc',
    slug: 'giup-viec',
    iconName: 'Sparkles',
    gradientFrom: 'from-pink-400',
    gradientTo: 'to-rose-500',
    serviceCount: 15,
    isPopular: false,
    description: 'Dọn nhà theo giờ, tổng vệ sinh căn hộ',
  },
  {
    id: 'cat-07',
    name: 'Bảng giá',
    slug: 'bang-gia',
    iconName: 'FileSpreadsheet',
    gradientFrom: 'from-teal-400',
    gradientTo: 'to-emerald-600',
    serviceCount: 45,
    isPopular: false,
    description: 'Biểu phí niêm yết minh bạch toàn hệ thống',
  },
  {
    id: 'cat-08',
    name: 'Dịch vụ khác',
    slug: 'dich-vu-khac',
    iconName: 'LayoutGrid',
    gradientFrom: 'from-slate-500',
    gradientTo: 'to-slate-700',
    serviceCount: 22,
    isPopular: false,
    description: 'Lắp ráp nội thất, khóa cửa, chống thấm',
  },
];

const MOCK_POPULAR_SERVICES: PopularServiceDTO[] = [
  {
    id: 'svc-01',
    name: 'Vệ sinh máy lạnh treo tường (1.0 - 2.5 HP)',
    slug: 've-sinh-may-lanh',
    categoryId: 'cat-03',
    categoryName: 'Điện lạnh',
    basePrice: 200000,
    unit: 'bộ',
    durationMin: 60,
    rating: 4.9,
    reviewsCount: 342,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    tag: 'Bán chạy nhất',
    discountPrice: 180000,
  },
  {
    id: 'svc-02',
    name: 'Khắc phục sự cố chập điện & Thay Aptomat',
    slug: 'khac-phuc-chap-dien',
    categoryId: 'cat-01',
    categoryName: 'Sửa điện',
    basePrice: 150000,
    unit: 'lần',
    durationMin: 45,
    rating: 5.0,
    reviewsCount: 218,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80',
    tag: 'Phản ứng nhanh',
  },
  {
    id: 'svc-03',
    name: 'Sửa rò rỉ đường ống nước & Thay vòi xả',
    slug: 'sua-ro-ri-ong-nuoc',
    categoryId: 'cat-02',
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
    name: 'Tổng vệ sinh căn hộ / Nhà phố (Gói 3 giờ)',
    slug: 'tong-ve-sinh-can-ho',
    categoryId: 'cat-06',
    categoryName: 'Giúp việc',
    basePrice: 240000,
    unit: 'gói 3h',
    durationMin: 180,
    rating: 4.92,
    reviewsCount: 512,
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
    tag: 'Ưa chuộng',
  },
  {
    id: 'svc-05',
    name: 'Bảo dưỡng & Kiểm tra tủ lạnh Inverter',
    slug: 'bao-duong-tu-lanh',
    categoryId: 'cat-04',
    categoryName: 'Thiết bị',
    basePrice: 250000,
    unit: 'thiết bị',
    durationMin: 75,
    rating: 4.88,
    reviewsCount: 89,
    imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&q=80',
  },
];

const MOCK_NEARBY_WORKERS: WorkerNearbyDTO[] = [
  {
    id: 'w-01',
    fullName: 'Lê Văn Thợ Điện',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    specialty: 'Điện - Nước & Thiết bị',
    rating: 5.0,
    totalReviews: 48,
    distanceKm: 0.3,
    latitude: 10.7780,
    longitude: 106.6990,
    isOnline: true,
    completedJobs: 156,
  },
  {
    id: 'w-02',
    fullName: 'Phạm Văn Thợ Lạnh',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    specialty: 'Điện lạnh & Điều hòa',
    rating: 4.95,
    totalReviews: 64,
    distanceKm: 0.6,
    latitude: 10.7795,
    longitude: 106.7025,
    isOnline: true,
    completedJobs: 210,
  },
  {
    id: 'w-03',
    fullName: 'Hoàng Minh Tuấn',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    specialty: 'Cấp thoát nước & Vệ sinh',
    rating: 4.9,
    totalReviews: 32,
    distanceKm: 1.1,
    latitude: 10.7745,
    longitude: 106.6975,
    isOnline: true,
    completedJobs: 98,
  },
  {
    id: 'w-04',
    fullName: 'Nguyễn Tấn Đạt',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    specialty: 'Sửa điện tử - Điện gia dụng',
    rating: 4.88,
    totalReviews: 53,
    distanceKm: 1.4,
    latitude: 10.7810,
    longitude: 106.7050,
    isOnline: true,
    completedJobs: 134,
  },
];

const MOCK_PROMOTIONS: PromotionDTO[] = [
  {
    id: 'promo-01',
    code: 'FIXGO30',
    title: 'GIẢM 30% ĐƠN ĐẦU TIÊN',
    subtitle: 'Áp dụng cho dịch vụ Điện, Nước & Điện lạnh',
    discountPercent: 30,
    maxDiscountAmount: 100000,
    minOrderAmount: 150000,
    expiryDateText: 'HSD: 30/11/2026',
    theme: 'orange',
    isClaimed: false,
  },
  {
    id: 'promo-02',
    code: 'FREESCAN',
    title: 'MIỄN PHÍ CÔNG KHẢO SÁT',
    subtitle: 'Thợ đến tận nhà chẩn đoán sự cố miễn phí',
    discountPercent: 100,
    maxDiscountAmount: 50000,
    minOrderAmount: 0,
    expiryDateText: 'HSD: 15/12/2026',
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
  selectedCategory: string | null;
  filteredPopularServices: PopularServiceDTO[];
  activeTab: string;
  isAiModalOpen: boolean;
  aiDiagnosisResult: AiDiagnosisResultDTO | null;
  isDiagnosing: boolean;
  setSearchQuery: (q: string) => void;
  setSelectedDistrict: (district: string) => void;
  setSelectedCategory: (catId: string | null) => void;
  setActiveTab: (tab: string) => void;
  setIsAiModalOpen: (open: boolean) => void;
  claimVoucher: (voucherId: string) => void;
  triggerAiDiagnosis: (imageFile?: File | string) => Promise<AiDiagnosisResultDTO>;
  refetch: () => Promise<void>;
}

/**
 * Hook `useHomeData` kết nối các luồng dữ liệu RESTful API và mock fallback
 */
export function useHomeData(): UseHomeDataReturn {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Home presentation state
  const [user, setUser] = useState<UserProfileDTO>(MOCK_USER);
  const [categories, setCategories] = useState<ServiceCategoryDTO[]>(MOCK_CATEGORIES);
  const [popularServices, setPopularServices] = useState<PopularServiceDTO[]>(MOCK_POPULAR_SERVICES);
  const [nearbyWorkers, setNearbyWorkers] = useState<WorkerNearbyDTO[]>(MOCK_NEARBY_WORKERS);
  const [promotions, setPromotions] = useState<PromotionDTO[]>(MOCK_PROMOTIONS);

  // Filters & Interactivity
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Quận 1, TP.HCM');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');

  // AI Diagnosis modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [aiDiagnosisResult, setAiDiagnosisResult] = useState<AiDiagnosisResultDTO | null>(null);

  /**
   * Fetch toàn bộ dữ liệu trang chủ từ Backend RESTful APIs
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      // Giả lập thời gian network response mượt mà (350ms)
      await new Promise((resolve) => setTimeout(resolve, 350));

      // =========================================================================
      // 1. TODO: API Integration - GET /api/v1/users/profile
      // Ví dụ: const userRes = await apiClient.get('/api/v1/users/profile');
      // setUser(userRes.data);
      // =========================================================================
      setUser(MOCK_USER);

      // =========================================================================
      // 2. TODO: API Integration - GET /api/v1/services/categories
      // Ví dụ: const catRes = await apiClient.get('/api/v1/services/categories');
      // setCategories(catRes.data);
      // =========================================================================
      setCategories(MOCK_CATEGORIES);

      // =========================================================================
      // 3. TODO: API Integration - GET /api/v1/services/popular
      // Ví dụ: const popularRes = await apiClient.get('/api/v1/services/popular');
      // setPopularServices(popularRes.data);
      // =========================================================================
      setPopularServices(MOCK_POPULAR_SERVICES);

      // =========================================================================
      // 4. TODO: API Integration - GET /api/v1/workers/nearby?lat=10.7769&lng=106.7009
      // Ví dụ: const workerRes = await apiClient.get(`/api/v1/workers/nearby?lat=${lat}&lng=${lng}`);
      // setNearbyWorkers(workerRes.data);
      // =========================================================================
      setNearbyWorkers(MOCK_NEARBY_WORKERS);

      // =========================================================================
      // 5. TODO: API Integration - GET /api/v1/promotions/active
      // Ví dụ: const promoRes = await apiClient.get('/api/v1/promotions/active');
      // setPromotions(promoRes.data);
      // =========================================================================
      setPromotions(MOCK_PROMOTIONS);

      setIsLoading(false);
    } catch (err: unknown) {
      console.error('❌ [useHomeData] Lỗi tải dữ liệu trang chủ:', err);
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Không thể kết nối máy chủ FixGo');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Bộ lọc tìm kiếm & danh mục cho Dịch vụ phổ biến
   */
  const filteredPopularServices = useMemo(() => {
    return popularServices.filter((service) => {
      const matchSearch =
        !searchQuery.trim() ||
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = !selectedCategory || service.categoryId === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [popularServices, searchQuery, selectedCategory]);

  /**
   * Nhận & kích hoạt mã giảm giá
   */
  const claimVoucher = useCallback((voucherId: string) => {
    setPromotions((prev) =>
      prev.map((item) => (item.id === voucherId ? { ...item, isClaimed: true } : item))
    );
  }, []);

  /**
   * =========================================================================
   * 6. TODO: API Integration - POST /api/v1/ai/diagnose-image
   * Gửi ảnh sự cố tới AI Computer Vision Service để phân tích và ước lượng chi phí
   * =========================================================================
   */
  const triggerAiDiagnosis = useCallback(
    async (_imageFile?: File | string): Promise<AiDiagnosisResultDTO> => {
      setIsDiagnosing(true);
      try {
        // Giả lập xử lý model YOLO / Gemini AI vision
        await new Promise((resolve) => setTimeout(resolve, 1400));

        const result: AiDiagnosisResultDTO = {
          issueCategory: 'Điện lạnh - Rò rỉ nước cục lạnh',
          confidence: 0.94,
          description:
            'Phát hiện ống thoát nước máy lạnh bị tắc hoặc máng nước đóng cặn gây trào nước cục bộ.',
          recommendedServices: ['Vệ sinh máy lạnh treo tường', 'Thông tắc đường ống xả'],
          estimatedCostMin: 180000,
          estimatedCostMax: 250000,
          urgencyLevel: 'MEDIUM',
        };

        setAiDiagnosisResult(result);
        setIsDiagnosing(false);
        return result;
      } catch (err) {
        setIsDiagnosing(false);
        throw err;
      }
    },
    []
  );

  const homeDataState: HomeDataState = useMemo(
    () => ({
      user,
      categories,
      popularServices,
      nearbyWorkers,
      promotions,
      activeOrderCount: 1,
      unreadNotificationsCount: 3,
      unreadMessagesCount: 2,
    }),
    [user, categories, popularServices, nearbyWorkers, promotions]
  );

  return {
    data: homeDataState,
    isLoading,
    isError,
    errorMessage,
    searchQuery,
    selectedDistrict,
    selectedCategory,
    filteredPopularServices,
    activeTab,
    isAiModalOpen,
    aiDiagnosisResult,
    isDiagnosing,
    setSearchQuery,
    setSelectedDistrict,
    setSelectedCategory,
    setActiveTab,
    setIsAiModalOpen,
    claimVoucher,
    triggerAiDiagnosis,
    refetch: fetchData,
  };
}

/**
 * @file home.types.ts
 * @description Định nghĩa toàn bộ TypeScript Interfaces và Data Transfer Objects (DTOs)
 * cho giao diện Trang Chủ Mobile Web App FixGo Pro.
 */

export interface SavedAddress {
  id: string;
  title: string;
  street: string;
  ward?: string;
  district: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface UserProfileDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: 'CUSTOMER' | 'WORKER' | 'ADMIN';
  rewardPoints: number;
  currentDistrict: string;
  savedAddresses: SavedAddress[];
}

export interface ServiceCategoryDTO {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  gradientFrom: string;
  gradientTo: string;
  serviceCount: number;
  isPopular?: boolean;
  description?: string;
}

export interface PopularServiceDTO {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  basePrice: number;
  unit: string;
  durationMin: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  tag?: string;
  discountPrice?: number;
}

export interface WorkerNearbyDTO {
  id: string;
  fullName: string;
  avatarUrl: string;
  specialty: string;
  rating: number;
  totalReviews: number;
  distanceKm: number;
  latitude: number;
  longitude: number;
  isOnline: boolean;
  completedJobs: number;
}

export interface PromotionDTO {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  discountPercent: number;
  maxDiscountAmount: number;
  minOrderAmount: number;
  expiryDateText: string;
  theme: 'orange' | 'blue' | 'purple';
  isClaimed: boolean;
}

export interface HomeDataState {
  user: UserProfileDTO;
  categories: ServiceCategoryDTO[];
  popularServices: PopularServiceDTO[];
  nearbyWorkers: WorkerNearbyDTO[];
  promotions: PromotionDTO[];
  activeOrderCount: number;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
}

export interface AiDiagnosisResultDTO {
  issueCategory: string;
  confidence: number;
  description: string;
  recommendedServices: string[];
  estimatedCostMin: number;
  estimatedCostMax: number;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

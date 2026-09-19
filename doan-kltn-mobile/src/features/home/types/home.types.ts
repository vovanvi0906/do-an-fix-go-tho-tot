/**
 * @file home.types.ts
 * @description Định nghĩa TypeScript Interfaces và Data Types cho màn hình Trang Chủ React Native FixGo.
 */

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  role: 'CUSTOMER' | 'WORKER' | 'ADMIN';
  rewardPoints: number;
  currentDistrict: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  bgColor?: string;
  gradientColors?: [string, string];
  serviceCount: number;
  isPopular?: boolean;
}

export interface WorkerItem {
  id: string;
  fullName: string;
  avatarUrl: string;
  specialty: string;
  rating: number;
  totalReviews: number;
  distanceKm: number;
  isOnline: boolean;
  completedJobs: number;
  latitude: number;
  longitude: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  slug: string;
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

export interface VoucherItem {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  discountPercent: number;
  maxDiscount: number;
  expiryDate: string;
  theme: 'orange' | 'blue';
  isClaimed: boolean;
}

export interface HomeDataState {
  user: UserProfile;
  categories: CategoryItem[];
  nearbyWorkers: WorkerItem[];
  popularServices: ServiceItem[];
  vouchers: VoucherItem[];
  unreadNotificationsCount: number;
}

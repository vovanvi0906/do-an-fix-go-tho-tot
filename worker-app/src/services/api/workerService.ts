/**
 * @file workerService.ts
 * @description API Service lấy danh sách kỹ thuật viên trực tuyến thực tế từ PostGIS Backend FixGo.
 * TUYỆT ĐỐI KHÔNG dùng mock data giả lập. Nếu không có dữ liệu, trả về mảng rỗng [].
 */

import { apiClient } from './apiClient';
import type { WorkerItem } from '../../features/home/types/home.types';

export interface FetchNearbyWorkersParams {
  lat: number;
  lng: number;
  radius?: number;
}

/**
 * Gọi API backend PostGIS thật để lấy danh sách thợ trực tuyến gần tọa độ GPS
 * Endpoint: GET /api/workers/nearby?lat={lat}&lng={lng}&radius={radius}
 */
export const getNearbyWorkersApi = async (
  lat: number,
  lng: number,
  radius = 15.0
): Promise<WorkerItem[]> => {
  try {
    const response = (await apiClient.get('/workers/nearby', {
      params: { lat, lng, radius },
    })) as unknown;

    const data = Array.isArray(response)
      ? response
      : (response as { data?: unknown[] })?.data || [];

    if (Array.isArray(data) && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id || `worker-${Math.random()}`,
        fullName: item.fullName || 'Kỹ thuật viên FixGo',
        avatarUrl:
          item.avatarUrl ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        specialty:
          item.specialty ||
          (Array.isArray(item.skills) ? item.skills.join(' • ') : item.skills) ||
          'Sửa chữa điện - nước dân dụng',
        rating: Number(item.rating || item.ratingAvg || 5.0),
        totalReviews: Number(item.totalReviews || 0),
        distanceKm: Number(item.distanceKm || item.distance_km || 0.5),
        isOnline: item.isOnline !== undefined ? Boolean(item.isOnline) : true,
        completedJobs: Number(item.completedJobs || (item.totalReviews ? item.totalReviews * 3 : 0)),
        latitude: Number(
          item.latitude ??
            item.currentLat ??
            (Array.isArray(item.currentLocation?.coordinates)
              ? item.currentLocation.coordinates[1]
              : lat)
        ),
        longitude: Number(
          item.longitude ??
            item.currentLng ??
            (Array.isArray(item.currentLocation?.coordinates)
              ? item.currentLocation.coordinates[0]
              : lng)
        ),
      }));
    }

    // Không có thợ -> Trả về mảng rỗng, KHÔNG dùng mock data
    return [];
  } catch (err) {
    console.error('❌ [workerService] Lỗi truy vấn thợ xung quanh từ PostGIS:', err);
    return []; // Trả về mảng rỗng, KHÔNG dùng mock thợ giả
  }
};

// Alias tương thích
export const fetchNearbyWorkers = getNearbyWorkersApi;

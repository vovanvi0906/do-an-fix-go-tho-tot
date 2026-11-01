import { apiClient } from './apiClient';

export interface BackendServiceCategory {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  services?: BackendService[];
  _count?: {
    services?: number;
  };
}

export interface BackendService {
  id: string;
  name: string;
  description?: string;
  basePrice: number | string;
  unit?: string;
  categoryId: string;
  isActive: boolean;
  category?: BackendServiceCategory;
}

export const catalogService = {
  /**
   * Lấy danh sách danh mục dịch vụ từ database
   */
  async getCategories(): Promise<BackendServiceCategory[]> {
    const res = await apiClient.get('/service-categories');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  /**
   * Lấy danh sách dịch vụ từ database (có thể lọc theo categoryId hoặc targetId)
   */
  async getServices(categoryId?: string, targetId?: string): Promise<BackendService[]> {
    const params: string[] = [];
    if (categoryId) params.push(`categoryId=${categoryId}`);
    if (targetId) params.push(`targetId=${targetId}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    const res = await apiClient.get(`/services${query}`);
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  /**
   * Lấy danh sách đối tượng / thiết bị (Targets)
   */
  async getTargets(categoryId?: string) {
    const url = categoryId ? `/service-targets?categoryId=${categoryId}` : '/service-targets';
    const res = await apiClient.get(url);
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  /**
   * Lấy toàn bộ cây phân cấp Category -> Targets -> Services
   */
  async getCategoryTree() {
    const res = await apiClient.get('/service-categories/tree');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },
};

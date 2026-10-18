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
   * Lấy danh sách dịch vụ từ database (có thể lọc theo categoryId)
   */
  async getServices(categoryId?: string): Promise<BackendService[]> {
    const url = categoryId ? `/services?categoryId=${categoryId}` : '/services';
    const res = await apiClient.get(url);
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },
};

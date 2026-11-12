import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../../services/api/apiClient';

const CACHE_KEY = '@fixgo_services_tree_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 giờ

export const serviceCatalogService = {
  async getCategories() {
    const res = await apiClient.get('/service-categories');
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  async getTargetsByCategory(categoryId?: string) {
    const url = categoryId ? `/service-targets?categoryId=${categoryId}` : '/service-targets';
    const res = await apiClient.get(url);
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  async getServices(categoryId?: string, targetId?: string) {
    const params: Record<string, string> = {};
    if (categoryId) params.categoryId = categoryId;
    if (targetId) params.targetId = targetId;
    const query = new URLSearchParams(params).toString();
    const url = query ? `/services?${query}` : '/services';
    const res = await apiClient.get(url);
    return Array.isArray(res) ? res : (res as any)?.data || [];
  },

  async getServicesTree(forceRefresh = false) {
    try {
      if (!forceRefresh) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp, data } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL_MS && Array.isArray(data) && data.length > 0) {
            return data;
          }
        }
      }

      const res = await apiClient.get('/service-categories/tree');
      const data = Array.isArray(res) ? res : (res as any)?.data || [];
      if (data.length > 0) {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      }
      return data;
    } catch (err) {
      console.warn('⚠️ [serviceCatalogService] Lỗi tải cây dịch vụ, đọc cache fallback:', err);
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data } = JSON.parse(cached);
        return data || [];
      }
      return [];
    }
  },
};

export default serviceCatalogService;


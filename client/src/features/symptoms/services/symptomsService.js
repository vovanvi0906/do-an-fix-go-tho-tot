import apiClient from '../../../services/api/client';
const body = response => response.data;
const rows = result => Array.isArray(result) ? result : result?.data || result?.items || [];
export const symptomsService = {
  categories: async () => rows(body(await apiClient.get('/admin/service-categories'))),
  targets: async categoryId => rows(body(await apiClient.get('/admin/services/targets', { params: { categoryId } }))),
  services: async (targetId, page = 1, search = '') => body(await apiClient.get('/admin/services', { params: { targetId, page, limit: 100, status: 'ALL', search } })),
  list: async params => body(await apiClient.get('/admin/symptoms', { params })),
  save: async (id, data) => body(await (id ? apiClient.patch(`/admin/symptoms/${id}`, data) : apiClient.post('/admin/symptoms', data))),
  map: async (id, serviceId, data) => body(await apiClient.put(`/admin/symptoms/${id}/services/${serviceId}`, data)),
  unmap: async (id, serviceId) => body(await apiClient.delete(`/admin/symptoms/${id}/services/${serviceId}`)),
  preview: async (targetId, symptomId) => body(await apiClient.get('/services/recommendations', { params: { targetId, symptomIds: symptomId, limit: 3 } })),
};

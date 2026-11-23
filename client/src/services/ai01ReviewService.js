import apiClient from './api/client';
const ROOT = '/admin/ai01';
const data = response => response.data.data;
export const ai01ReviewService = {
  permissions: search => apiClient.get(`${ROOT}/permissions`, {params:{search}}).then(data),
  changePermission: (action, body) => apiClient.post(`${ROOT}/permissions/${action}`, body).then(data),
  access: () => apiClient.get(`${ROOT}/access`).then(data),
  read: (operation, params = {}) => apiClient.get(`${ROOT}/data/${operation}`, { params, timeout: 45000 }).then(data),
  save: (operation, payload) => apiClient.post(`${ROOT}/actions/${operation}`, { payload }, { timeout: 45000 }).then(data),
  image: (id, memberId) => apiClient.get(`${ROOT}/images/${encodeURIComponent(id)}${memberId === undefined ? '' : `/related/${encodeURIComponent(memberId)}`}`, { responseType: 'blob', timeout: 45000 }).then(r => r.data),
  download: file => apiClient.get(`${ROOT}/exports/${encodeURIComponent(file)}`, { responseType: 'blob', timeout: 45000 }).then(r => r.data),
  fastDownload: file => apiClient.get(`${ROOT}/fast/exports/${encodeURIComponent(file)}`, {responseType:'blob', timeout:45000}).then(r=>r.data),
  qualityImage: id => apiClient.get(`${ROOT}/fast/quality/images/${encodeURIComponent(id)}`, {responseType:'blob', timeout:45000}).then(r=>r.data),
  fastImage: id => apiClient.get(`${ROOT}/fast/images/${encodeURIComponent(id)}`, {responseType:'blob', timeout:45000}).then(r=>r.data),
  soloImage: (id, memberId) => apiClient.get(`${ROOT}/solo/images/${encodeURIComponent(id)}${memberId === undefined ? '' : `/related/${encodeURIComponent(memberId)}`}`, { responseType: 'blob', timeout: 45000 }).then(r => r.data),
  soloDownload: file => apiClient.get(`${ROOT}/solo/exports/${encodeURIComponent(file)}`, { responseType: 'blob', timeout: 45000 }).then(r => r.data),
};

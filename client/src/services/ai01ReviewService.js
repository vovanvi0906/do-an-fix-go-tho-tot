import apiClient from './api/client';
const ROOT = '/admin/ai01';
const data = response => response.data.data;
export const ai01ReviewService = {
  permissions: search => apiClient.get(`${ROOT}/permissions`, {params:{search}}).then(data),
  changePermission: (action, body) => apiClient.post(`${ROOT}/permissions/${action}`, body).then(data),
  importImage: (file,metadata,onProgress) => {
    const form=new FormData();form.append('image',file);
    Object.entries(metadata).forEach(([key,value])=>form.append(key,String(value)));
    return apiClient.post(`${ROOT}/dataset/images`,form,{headers:{'Content-Type':'multipart/form-data'},timeout:90000,onUploadProgress:e=>onProgress?.(e.total?Math.min(95,Math.round(e.loaded/e.total*95)):0)}).then(data);
  },
  datasetLimits: () => apiClient.get(`${ROOT}/dataset/limits`).then(data),
  previewDataset: (files,options,onProgress) => {
    const form=new FormData();files.forEach(file=>form.append('files',file));
    Object.entries(options).forEach(([key,value])=>form.append(key,typeof value==='object'?JSON.stringify(value):String(value)));
    return apiClient.post(`${ROOT}/dataset/preview`,form,{headers:{'Content-Type':'multipart/form-data'},timeout:210000,onUploadProgress:e=>onProgress?.(e.total?Math.round(e.loaded/e.total*100):0)}).then(data);
  },
  datasetStatus: id => apiClient.get(`${ROOT}/dataset/batches/${id}`,{timeout:210000}).then(data),
  validateDataset: (id,options) => apiClient.post(`${ROOT}/dataset/batches/${id}/validate`,options,{timeout:210000}).then(data),
  commitDatasetItem: (id,item) => apiClient.post(`${ROOT}/dataset/batches/${id}/items/${item}`,{}, {timeout:210000}).then(data),
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

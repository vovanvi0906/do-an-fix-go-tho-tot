import apiClient from "../../../services/api/client";
const unwrap = (response) => response?.data?.data || response?.data || response;
const root = (id) => `/admin/workers/${encodeURIComponent(id)}/face`;
export const faceReviewService = {
  async pending(id, signal) {
    return unwrap(
      await apiClient.get(`${root(id)}/review-request`, { signal }),
    );
  },
  async approve(id, body) {
    return unwrap(await apiClient.post(`${root(id)}/identity-reviews`, body));
  },
  async reject(id, body) {
    return unwrap(
      await apiClient.post(`${root(id)}/review-request/reject`, body),
    );
  },
};

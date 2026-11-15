import { apiClient } from "../../../services/api/apiClient";
const unwrap = (response) => response?.data || response;
export const faceIdentityService = {
  async status(signal) {
    return unwrap(await apiClient.get("/workers/me/face/status", { signal }));
  },
  async profile(signal) {
    return unwrap(await apiClient.get("/workers/me", { signal }));
  },
};

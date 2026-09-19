import apiClient from '../../../services/api/client';

/**
 * Service quản lý người dùng (Users Management) kết nối trực tiếp với Backend NestJS API
 */
export const userService = {
  /**
   * Lấy danh sách người dùng có phân trang, bộ lọc role/status và tìm kiếm
   * @param {{ role?: string, status?: string, search?: string, page?: number, limit?: number }} params
   */
  async getUsers({ role, status, search, page = 1, limit = 10 } = {}) {
    const params = {
      page,
      limit,
    };

    if (role && role !== 'ALL') {
      params.role = role;
    }

    if (status && status !== 'ALL') {
      params.status = status;
    }

    if (search && search.trim()) {
      params.search = search.trim();
    }

    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Lấy thông tin chi tiết một người dùng theo ID
   * @param {string} id
   */
  async getUserById(id) {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data;
  },

  /**
   * Tạo tài khoản người dùng mới (Customer hoặc Worker)
   * @param {{ fullName: string, email: string, password: string, phone?: string, role?: string, status?: string, bio?: string, cccdNumber?: string }} userData
   */
  async createUser(userData) {
    const response = await apiClient.post('/admin/users', userData);
    return response.data;
  },

  /**
   * Cập nhật thông tin người dùng theo ID
   * @param {string} id
   * @param {object} updateData
   */
  async updateUser(id, updateData) {
    const response = await apiClient.patch(`/admin/users/${id}`, updateData);
    return response.data;
  },

  /**
   * Xóa người dùng theo ID
   * @param {string} id
   */
  async deleteUser(id) {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
  },

  /**
   * Phê duyệt hồ sơ thợ (chuyển sang APPROVED)
   * @param {string} workerId
   */
  async approveWorker(workerId) {
    const response = await apiClient.post(`/admin/workers/${workerId}/approve`);
    return response.data;
  },

  /**
   * Từ chối hồ sơ thợ (chuyển sang REJECTED)
   * @param {string} workerId
   */
  async rejectWorker(workerId) {
    const response = await apiClient.post(`/admin/workers/${workerId}/reject`);
    return response.data;
  },
};

export default userService;

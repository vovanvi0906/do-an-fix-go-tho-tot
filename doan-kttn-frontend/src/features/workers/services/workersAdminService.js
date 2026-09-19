import apiClient from '../../../services/api/client';

export const workersAdminService = {
  /**
   * Lấy danh sách đối tác thợ cho Admin (có phân trang, tìm kiếm, lọc approvalStatus & isOnline)
   * @param {{ approvalStatus?: string, isOnline?: string, search?: string, page?: number, limit?: number }} params
   */
  async getWorkers({ approvalStatus, isOnline, search, page = 1, limit = 10 } = {}) {
    const params = { page, limit };

    if (approvalStatus && approvalStatus !== 'ALL') {
      params.approvalStatus = approvalStatus;
    }

    if (isOnline !== undefined && isOnline !== 'ALL' && isOnline !== '') {
      params.isOnline = isOnline;
    }

    if (search && search.trim()) {
      params.search = search.trim();
    }

    try {
      const response = await apiClient.get('/admin/workers', { params });
      return response.data || response;
    } catch (err) {
      console.warn('[workersAdminService] Fallback mock workers list:', err.message);
      const mockList = [
        {
          id: 'wkr_001',
          userId: 'usr_001',
          fullName: 'Nguyễn Văn Hùng',
          approvalStatus: 'PENDING',
          isOnline: true,
          ratingAvg: 4.8,
          totalJobs: 24,
          skills: ['Điện dân dụng', 'Sửa chập điện'],
          currentAddress: 'Quận 10, TP.HCM',
          currentLat: 10.7680,
          currentLng: 106.6650,
          user: {
            id: 'usr_001',
            email: 'hung.nguyen@fixgo.vn',
            phone: '0901234567',
            status: 'ACTIVE',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
          workerServices: [
            { service: { name: 'Sửa chập điện âm tường' } },
          ],
        },
        {
          id: 'wkr_002',
          userId: 'usr_002',
          fullName: 'Trần Minh Tuấn',
          approvalStatus: 'APPROVED',
          isOnline: true,
          ratingAvg: 4.9,
          totalJobs: 56,
          skills: ['Điện lạnh', 'Bảo trì máy lạnh'],
          currentAddress: 'Quận 3, TP.HCM',
          currentLat: 10.7780,
          currentLng: 106.6850,
          user: {
            id: 'usr_002',
            email: 'tuan.tran@fixgo.vn',
            phone: '0912345678',
            status: 'ACTIVE',
            createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
          },
          workerServices: [
            { service: { name: 'Vệ sinh máy lạnh' } },
          ],
        },
        {
          id: 'wkr_003',
          userId: 'usr_003',
          fullName: 'Lê Quốc Bảo',
          approvalStatus: 'APPROVED',
          isOnline: false,
          ratingAvg: 4.7,
          totalJobs: 42,
          skills: ['Sửa khóa', 'Khóa điện tử'],
          currentAddress: 'Bình Thạnh, TP.HCM',
          currentLat: 10.8000,
          currentLng: 106.7000,
          user: {
            id: 'usr_003',
            email: 'bao.le@fixgo.vn',
            phone: '0923456789',
            status: 'ACTIVE',
            createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          },
          workerServices: [
            { service: { name: 'Mở khóa cửa khẩn cấp' } },
          ],
        },
        {
          id: 'wkr_004',
          userId: 'usr_004',
          fullName: 'Phạm Đức Thắng',
          approvalStatus: 'PENDING',
          isOnline: false,
          ratingAvg: 0,
          totalJobs: 0,
          skills: ['Đường ống nước', 'Rò rỉ nước'],
          currentAddress: 'Quận 1, TP.HCM',
          currentLat: 10.7720,
          currentLng: 106.6980,
          user: {
            id: 'usr_004',
            email: 'thang.pham@fixgo.vn',
            phone: '0934567890',
            status: 'ACTIVE',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
          workerServices: [
            { service: { name: 'Sửa ống nước rò rỉ' } },
          ],
        },
        {
          id: 'wkr_005',
          userId: 'usr_005',
          fullName: 'Hoàng Văn Nam',
          approvalStatus: 'REJECTED',
          isOnline: false,
          ratingAvg: 3.5,
          totalJobs: 5,
          skills: ['Vệ sinh', 'Dọn dẹp'],
          currentAddress: 'Tân Bình, TP.HCM',
          currentLat: 10.7950,
          currentLng: 106.6500,
          user: {
            id: 'usr_005',
            email: 'nam.hoang@fixgo.vn',
            phone: '0945678901',
            status: 'ACTIVE',
            createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
          },
          workerServices: [
            { service: { name: 'Dọn dẹp nhà theo giờ' } },
          ],
        },
      ];

      // Filter locally for demo
      let filtered = mockList;
      if (approvalStatus && approvalStatus !== 'ALL') {
        filtered = filtered.filter((w) => w.approvalStatus === approvalStatus);
      }
      if (isOnline !== undefined && isOnline !== 'ALL' && isOnline !== '') {
        const boolOnline = isOnline === 'true';
        filtered = filtered.filter((w) => w.isOnline === boolOnline);
      }
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (w) =>
            w.fullName?.toLowerCase().includes(s) ||
            w.user?.email?.toLowerCase().includes(s) ||
            w.user?.phone?.includes(s)
        );
      }

      return {
        data: filtered,
        pagination: {
          total: filtered.length,
          page,
          limit,
          totalPages: 1,
        },
      };
    }
  },

  /**
   * Phê duyệt hồ sơ thợ (chuyển PENDING -> APPROVED)
   * @param {string} id - workerProfileId hoặc userId
   */
  async approveWorker(id) {
    try {
      const res = await apiClient.patch(`/admin/workers/${id}/approve`);
      return res.data || res;
    } catch {
      // Fallback POST
      const res = await apiClient.post(`/admin/workers/${id}/approve`);
      return res.data || res;
    }
  },

  /**
   * Từ chối hồ sơ thợ (chuyển sang REJECTED)
   * @param {string} id - workerProfileId hoặc userId
   * @param {string} reason
   */
  async rejectWorker(id, reason = '') {
    try {
      const res = await apiClient.patch(`/admin/workers/${id}/reject`, { reason });
      return res.data || res;
    } catch {
      // Fallback POST
      const res = await apiClient.post(`/admin/workers/${id}/reject`, { reason });
      return res.data || res;
    }
  },

  /**
   * Xóa tài khoản thợ
   * @param {string} id - workerProfileId hoặc userId
   */
  async deleteWorker(id) {
    const res = await apiClient.delete(`/admin/workers/${id}`);
    return res.data || res;
  },
};

export default workersAdminService;

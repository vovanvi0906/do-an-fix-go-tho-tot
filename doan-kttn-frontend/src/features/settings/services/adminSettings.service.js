import apiClient from '../../../services/api/client';

export const adminSettingsService = {
  /**
   * Lấy cấu hình hệ thống hiện tại
   */
  async getSettings() {
    try {
      const response = await apiClient.get('/admin/settings');
      return response.data || response;
    } catch (err) {
      console.warn('[adminSettingsService] Fallback mock settings:', err.message);
      return {
        siteName: 'FixGo - Nền tảng Dịch vụ Cứu hộ & Sửa chữa',
        supportEmail: 'support@fixgo.vn',
        supportHotline: '1900-8888',
        maxSearchRadiusKm: 15.0,
        defaultCommissionRate: 15.0,
        orderTimeoutSeconds: 60,
        autoMatching: true,
        notifyOnArrival: true,
        smsOtpEnabled: true,
        maintenanceMode: false,
        maintenanceMessage: 'Hệ thống đang bảo trì nâng cấp định kỳ. Xin vui lòng quay lại sau ít phút!',
      };
    }
  },

  /**
   * Cập nhật cấu hình hệ thống
   * @param {object} settingsData
   */
  async updateSettings(settingsData) {
    const response = await apiClient.patch('/admin/settings', settingsData);
    return response.data || response;
  },
};

export default adminSettingsService;

import { create } from 'zustand';

/**
 * Zustand Store quản lý luồng đặt đơn hàng (Customer Order Flow)
 * Lưu trữ trạng thái chẩn đoán AI, thông tin đơn hàng hiện tại, trạng thái tải và lỗi.
 */
export const useOrderStore = create((set) => ({
  // ==========================================
  // STATE
  // ==========================================
  currentOrder: null,
  aiDiagnosisResult: null,
  isLoading: false,
  error: null,

  // ==========================================
  // ACTIONS (Pure Zustand State Mutators)
  // ==========================================

  /**
   * Lưu kết quả phân tích sự cố từ AI Computer Vision
   * @param {Object|null} result - { suggestedCategoryId, categoryName, confidence, detectedLabels, estimatedPrice }
   */
  setDiagnosisResult: (result) => {
    set({ aiDiagnosisResult: result, error: null });
  },

  /**
   * Thiết lập thông tin đơn hàng hiện tại đang theo dõi / thao tác
   * @param {Object|null} order - Thông tin chi tiết đơn hàng
   */
  setCurrentOrder: (order) => {
    set({ currentOrder: order, error: null });
  },

  /**
   * Cập nhật nhanh trạng thái đơn hàng (SEARCHING, ASSIGNED, ARRIVED, IN_PROGRESS, COMPLETED,...)
   * @param {string} status - Trạng thái mới của đơn hàng
   */
  updateOrderStatus: (status) => {
    set((state) => ({
      currentOrder: state.currentOrder ? { ...state.currentOrder, status } : null,
    }));
  },

  /**
   * Bật/tắt trạng thái tải dữ liệu
   * @param {boolean} bool
   */
  setLoading: (bool) => {
    set({ isLoading: Boolean(bool) });
  },

  /**
   * Thiết lập thông báo lỗi khi thao tác đặt đơn / gọi API
   * @param {string|null} err
   */
  setError: (err) => {
    set({ error: err, isLoading: false });
  },

  /**
   * Reset toàn bộ trạng thái luồng đặt đơn về mặc định
   */
  reset: () => {
    set({
      currentOrder: null,
      aiDiagnosisResult: null,
      isLoading: false,
      error: null,
    });
  },
}));

export default useOrderStore;

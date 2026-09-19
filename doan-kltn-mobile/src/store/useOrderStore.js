import { create } from 'zustand';

export const useOrderStore = create((set, get) => ({
  // 1. Kết quả chẩn đoán AI & Danh mục chọn
  diagnoseResult: null,
  selectedCategory: null,

  // 2. Thông tin xác nhận đơn
  selectedAddress: {
    addressText: 'Số 123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    lat: 10.7769,
    lng: 106.7009,
  },
  selectedTime: 'Càng sớm càng tốt (Trong 15-30 phút)',
  orderNote: '',
  appliedVoucher: null,

  // 3. Thông tin đơn hàng đang xử lý
  currentOrder: null,
  orderStatus: null, // SEARCHING_WORKER, MATCHED, WORKER_EN_ROUTE, IN_PROGRESS, AWAITING_ACCEPTANCE, COMPLETED, PAID, CANCELLED

  // 4. Thông tin thợ & Tọa độ GPS thời gian thực
  matchedWorker: null,
  workerLocation: null,
  socketConnected: false,

  // 5. Ảnh nghiệm thu & Kết quả AI
  beforeImage: null,
  afterImage: null,
  aiVerification: null, // { matchScore, passed, notes }

  // 6. Thanh toán & Đánh giá
  paymentMethod: 'VNPAY',
  paymentSuccess: false,
  reviewSubmitted: false,

  // ==========================================
  // ACTIONS
  // ==========================================
  setDiagnoseResult: (result) =>
    set({
      diagnoseResult: result,
      selectedCategory: result?.suggestedCategoryId
        ? {
            id: result.suggestedCategoryId,
            name: result.suggestedCategoryName || 'Dịch vụ được gợi ý',
            basePrice: result.estimatedPriceMin || 150000,
          }
        : null,
    }),

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  setSelectedAddress: (address) => set({ selectedAddress: address }),

  setSelectedTime: (time) => set({ selectedTime: time }),

  setOrderNote: (note) => set({ orderNote: note }),

  applyVoucher: (voucher) => set({ appliedVoucher: voucher }),

  setCurrentOrder: (order) =>
    set({
      currentOrder: order,
      orderStatus: order?.status || null,
      matchedWorker: order?.worker || null,
    }),

  setOrderStatus: (status) =>
    set((state) => ({
      orderStatus: status,
      currentOrder: state.currentOrder ? { ...state.currentOrder, status } : null,
    })),

  setMatchedWorker: (worker) =>
    set((state) => ({
      matchedWorker: worker,
      currentOrder: state.currentOrder ? { ...state.currentOrder, worker } : null,
    })),

  updateWorkerLocation: (location) =>
    set({
      workerLocation: {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng),
        timestamp: location.timestamp || new Date().toISOString(),
      },
    }),

  setSocketConnected: (connected) => set({ socketConnected: connected }),

  setBeforeImage: (url) => set({ beforeImage: url }),

  setAfterImage: (url) => set({ afterImage: url }),

  setAiVerification: (data) => set({ aiVerification: data }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setPaymentSuccess: (success) => set({ paymentSuccess: success }),

  setReviewSubmitted: (submitted) => set({ reviewSubmitted: submitted }),

  resetOrderFlow: () =>
    set({
      diagnoseResult: null,
      selectedCategory: null,
      orderNote: '',
      appliedVoucher: null,
      currentOrder: null,
      orderStatus: null,
      matchedWorker: null,
      workerLocation: null,
      beforeImage: null,
      afterImage: null,
      aiVerification: null,
      paymentSuccess: false,
      reviewSubmitted: false,
    }),
}));

import { useState, useEffect, useCallback, useRef } from 'react';
import { customerHomeService } from '../services/customerHomeService';
import type {
  CustomerHomeSummary,
  ActiveOrderPayload,
  UseCustomerHomeReturn,
} from '../../../types/customerHome';

/**
 * Custom Hook: useCustomerHome
 *
 * Quản lý trạng thái và đồng bộ số liệu thời gian thực (Real-time Data) cho trang chủ Khách Hàng FixGo Pro:
 * 1. Thống kê gói dịch vụ sẵn sàng & mã giảm giá khả dụng (GET /api/v1/customer/home/summary)
 * 2. Đơn hàng đang hoạt động gần nhất của khách hàng (GET /api/v1/customer/orders/active)
 *
 * Tối ưu hiệu năng:
 * - useCallback ổn định với dependency rỗng ngăn chặn triệt để infinite render loop và hiện tượng chớp tắt màn hình (flickering).
 * - useRef theo dõi vòng đời unmount để ngăn rò rỉ bộ nhớ.
 * - Gọi đồng thời qua Promise.allSettled tăng tốc tải trang.
 *
 * @returns {UseCustomerHomeReturn}
 */
export function useCustomerHome(): UseCustomerHomeReturn {
  const [summary, setSummary] = useState<CustomerHomeSummary | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrderPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dùng ref để đảm bảo không setState khi component đã unmount
  const isMountedRef = useRef<boolean>(true);

  // Cờ ngăn chặn các request trùng lặp đồng thời
  const isFetchingRef = useRef<boolean>(false);

  /**
   * Hàm gọi API đồng thời lấy thống kê tổng quan và đơn hàng đang chạy
   */
  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (isMountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      // Gọi song song hai API độc lập
      const [summaryResult, activeOrderResult] = await Promise.allSettled([
        customerHomeService.getSummary(),
        customerHomeService.getActiveOrder(),
      ]);

      if (!isMountedRef.current) return;

      // Xử lý kết quả Summary
      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      } else {
        console.warn('Lỗi khi lấy dữ liệu tổng quan trang chủ:', summaryResult.reason);
      }

      // Xử lý kết quả Active Order
      if (activeOrderResult.status === 'fulfilled') {
        const payload = activeOrderResult.value;
        setActiveOrder(payload?.activeOrder ?? null);
      } else {
        console.warn('Lỗi khi lấy đơn hàng đang hoạt động:', activeOrderResult.reason);
        setActiveOrder(null);
      }

      // Nếu cả hai đều thất bại thì báo lỗi
      if (
        summaryResult.status === 'rejected' &&
        activeOrderResult.status === 'rejected'
      ) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền!');
      } else {
        setError(null);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Không thể kết nối đến máy chủ. Vui lòng thử lại!';
        setError(errorMsg);
      }
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []); // Không phụ thuộc vào state ngoài, hàm luôn ổn định qua các lần render

  // Thực thi tải dữ liệu một lần duy nhất khi component mount
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return {
    summary,
    activeOrder,
    hasActiveOrder: Boolean(activeOrder),
    isLoading,
    error,
    refetch: fetchData,
  };
}

export default useCustomerHome;

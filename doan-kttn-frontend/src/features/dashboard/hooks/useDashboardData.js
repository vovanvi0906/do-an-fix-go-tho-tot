import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboard.service';

/**
 * Custom Hook: useDashboardData
 * Tách biệt hoàn toàn phần xử lý logic và gọi API ra khỏi giao diện hiển thị (UI).
 * Cung cấp state quản lý dữ liệu tổng quan, danh sách hoạt động và biểu đồ phân bổ.
 *
 * @param {'today' | 'week' | 'month'} [initialTimeframe='month']
 */
export function useDashboardData(initialTimeframe = 'month') {
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [totalOrdersDistribution, setTotalOrdersDistribution] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (tf = timeframe, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        // Gọi đồng thời 3 RESTful API endpoints độc lập
        const [overviewRes, activitiesRes, distributionRes] = await Promise.allSettled([
          dashboardService.getOverview(tf),
          dashboardService.getActivities(10),
          dashboardService.getServiceDistribution(tf),
        ]);

        // 1. Xử lý Overview Response (GET /api/v1/dashboard/overview)
        if (overviewRes.status === 'fulfilled' && overviewRes.value) {
          setOverview(overviewRes.value);
        } else if (overviewRes.status === 'rejected') {
          console.error('[useDashboardData] Overview request failed:', overviewRes.reason);
        }

        // 2. Xử lý Activities Response (GET /api/v1/dashboard/activities)
        if (activitiesRes.status === 'fulfilled' && activitiesRes.value) {
          const actData = Array.isArray(activitiesRes.value)
            ? activitiesRes.value
            : activitiesRes.value.activities || [];
          setActivities(actData);
        } else if (overviewRes.status === 'fulfilled' && overviewRes.value?.recentActivities) {
          // Fallback từ overview nếu có
          setActivities(overviewRes.value.recentActivities);
        }

        // 3. Xử lý Service Distribution Response (GET /api/v1/dashboard/service-distribution)
        if (distributionRes.status === 'fulfilled' && distributionRes.value) {
          const distData = distributionRes.value;
          setDistribution(distData.distribution || distData.services || []);
          setTotalOrdersDistribution(distData.totalOrders ?? overviewRes.value?.totalOrders ?? 0);
        } else if (overviewRes.status === 'fulfilled' && overviewRes.value?.serviceDistribution) {
          // Fallback từ overview nếu có
          setDistribution(overviewRes.value.serviceDistribution);
          setTotalOrdersDistribution(overviewRes.value.totalOrders ?? 0);
        }

        // Kiểm tra nếu tất cả đều thất bại
        if (
          overviewRes.status === 'rejected' &&
          activitiesRes.status === 'rejected' &&
          distributionRes.status === 'rejected'
        ) {
          throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ Backend.');
        }
      } catch (err) {
        console.error('[useDashboardData] Error fetching dashboard data:', err);
        setError(err.message || 'Đã có lỗi xảy ra khi nạp số liệu hệ thống');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeframe]
  );

  // Kích hoạt nạp dữ liệu khi timeframe thay đổi
  useEffect(() => {
    fetchData(timeframe, false);
  }, [timeframe, fetchData]);

  const refetch = useCallback(() => {
    return fetchData(timeframe, true);
  }, [timeframe, fetchData]);

  return {
    overview,
    activities,
    distribution,
    totalOrdersDistribution,
    loading,
    refreshing,
    error,
    timeframe,
    setTimeframe,
    refetch,
  };
}

export default useDashboardData;

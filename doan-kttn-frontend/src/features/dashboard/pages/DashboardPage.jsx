import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/authStore';
import { useDashboardData } from '../hooks/useDashboardData';
import StatisticCard from '../components/StatisticCard';
import ServiceDistributionChart from '../components/ServiceDistributionChart';
import RecentActivityTimeline from '../components/RecentActivityTimeline';
import { DashboardErrorState } from '../components/DashboardStates';
import {
  Users,
  Briefcase,
  Clock,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Activity,
  PieChart,
} from 'lucide-react';

/**
 * Enterprise Admin Dashboard Overview (Linear / Vercel Style)
 * - Tách biệt hoàn toàn UI và Logic qua Custom Hook `useDashboardData`
 * - Sử dụng Skeleton loading cho tất cả thành phần dữ liệu (tuyệt đối không dùng spinner)
 * - Tuân thủ nghiêm ngặt 8pt Grid System (p-4, gap-4, space-y-4)
 * - Giao diện sắc nét, viền mỏng border border-slate-200 dark:border-slate-800
 * - Kết nối trực tiếp 3 RESTful endpoints:
 *   - GET /api/v1/dashboard/overview
 *   - GET /api/v1/dashboard/activities
 *   - GET /api/v1/dashboard/service-distribution
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tách biệt logic thông qua Custom Hook chuyên biệt
  const {
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
  } = useDashboardData('month');

  return (
    <div className="h-full overflow-hidden flex flex-col justify-between select-none transition-colors duration-200">
      {/* ======================================================== */}
      {/* 1. HEADER SECTION (TIÊU ĐỀ SẮC NÉT & TIMEFRAME ACTION BAR) */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tổng Quan Hoạt Động
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Báo cáo hiệu suất vận hành dịch vụ FixGo thời gian thực từ hệ thống cơ sở dữ liệu
          </p>
        </div>

        {/* Action Bar: Timeframe Segmented Control + Refresh Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          {/* Timeframe Segmented Control */}
          <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center text-xs">
            <button
              type="button"
              onClick={() => setTimeframe('today')}
              className={`px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium ${
                timeframe === 'today'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('week')}
              className={`px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium ${
                timeframe === 'week'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              7 ngày
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer font-medium ${
                timeframe === 'month'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tháng này
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={refetch}
            disabled={loading || refreshing}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Làm mới dữ liệu từ máy chủ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ERROR STATE BANNER (NẾU GỌI API THẤT BẠI) */}
      {/* ======================================================== */}
      {error && <DashboardErrorState message={error} onRetry={refetch} />}

      {/* ======================================================== */}
      {/* 3. PENDING WORKER ALERT BANNER */}
      {/* ======================================================== */}
      {(overview?.pendingWorkers ?? 0) > 0 && (
        <div className="my-2 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs truncate">
              <span className="font-bold text-slate-900 dark:text-amber-100 mr-1.5">
                {overview.pendingWorkers} hồ sơ thợ chờ phê duyệt:
              </span>
              <span className="text-slate-600 dark:text-slate-400 hidden md:inline">
                Cần kiểm tra giấy tờ CCCD và bằng cấp kỹ năng để cấp quyền nhận việc trên hệ thống.
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/workers')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
          >
            <span>Phê duyệt ngay</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. METRIC CARDS (KPI GRID - 4 CỘT CHUẨN 8PT) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 my-2 shrink-0">
        <StatisticCard
          title="Khách Hàng"
          value={(overview?.totalCustomers ?? 0).toLocaleString()}
          subtext="Tài khoản khách hàng"
          icon={Users}
          trend="up"
          trendValue={overview?.growth?.customers || `${overview?.totalCustomers ?? 0} tài khoản`}
          colorScheme="blue"
          sparklineData={[
            Math.max(0, Math.round((overview?.totalCustomers ?? 0) * 0.4)),
            Math.max(0, Math.round((overview?.totalCustomers ?? 0) * 0.7)),
            overview?.totalCustomers ?? 0,
          ]}
          isLoading={loading}
          onClick={() => navigate('/admin/users')}
        />

        <StatisticCard
          title="Đối Tác Thợ"
          value={(overview?.totalWorkers ?? 0).toLocaleString()}
          subtext="Thợ đã kích hoạt"
          icon={Briefcase}
          trend="up"
          trendValue={
            overview?.growth?.workers ||
            `${overview?.onlineWorkers ?? 0} online / ${overview?.totalWorkers ?? 0} duyệt`
          }
          colorScheme="emerald"
          sparklineData={[
            Math.max(0, Math.round((overview?.totalWorkers ?? 0) * 0.4)),
            Math.max(0, Math.round((overview?.totalWorkers ?? 0) * 0.8)),
            overview?.totalWorkers ?? 0,
          ]}
          isLoading={loading}
          onClick={() => navigate('/admin/workers')}
        />

        <StatisticCard
          title="Hồ Sơ Chờ Duyệt"
          value={(overview?.pendingWorkers ?? 0).toLocaleString()}
          subtext="Cần xác thực CCCD"
          icon={Clock}
          trend={(overview?.pendingWorkers ?? 0) > 0 ? 'down' : 'up'}
          trendValue={
            (overview?.pendingWorkers ?? 0) > 0
              ? `${overview.pendingWorkers} hồ sơ mới`
              : 'Đã duyệt hết'
          }
          colorScheme="amber"
          sparklineData={[0, overview?.pendingWorkers ?? 0]}
          isLoading={loading}
          onClick={() => navigate('/admin/workers')}
        />

        <StatisticCard
          title="Tổng Đơn Đặt"
          value={(overview?.totalOrders ?? 0).toLocaleString()}
          subtext="Đơn đặt dịch vụ"
          icon={ShoppingBag}
          trend="up"
          trendValue={
            overview?.growth?.orders ||
            `${overview?.completedOrders ?? 0} đơn hoàn thành`
          }
          colorScheme="purple"
          sparklineData={[
            Math.max(0, Math.round((overview?.totalOrders ?? 0) * 0.3)),
            Math.max(0, Math.round((overview?.totalOrders ?? 0) * 0.6)),
            overview?.totalOrders ?? 0,
          ]}
          isLoading={loading}
          onClick={() => navigate('/admin/orders')}
        />
      </div>

      {/* ======================================================== */}
      {/* 5. SPLIT SECTIONS (TIMELINE 7 CỘT & PHÂN BỔ DỊCH VỤ 5 CỘT) */}
      {/* ======================================================== */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 mt-1">
        {/* Cột Trái: Hoạt Động Gần Đây (Timeline 7 Cột) */}
        <div className="lg:col-span-7 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between min-h-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Hoạt Động Gần Đây
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Thời gian thực</span>
            </div>
          </div>

          {/* Timeline List Component */}
          <RecentActivityTimeline activities={activities} isLoading={loading} />

          {/* Quick Action Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Xem chi tiết danh sách đơn đặt & hoạt động</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cột Phải: Phân Bổ Dịch Vụ (Recharts Donut Chart 5 Cột) */}
        <div className="lg:col-span-5 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between min-h-0">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <PieChart className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Phân Bổ Dịch Vụ
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Tỷ lệ nhu cầu
            </span>
          </div>

          {/* Recharts Donut Chart + Legend */}
          <ServiceDistributionChart
            services={distribution}
            totalOrders={totalOrdersDistribution || overview?.totalOrders || 0}
            isLoading={loading}
          />

          {/* Quick Action Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Thống kê danh mục dịch vụ</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                {distribution?.length ?? 0} danh mục
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

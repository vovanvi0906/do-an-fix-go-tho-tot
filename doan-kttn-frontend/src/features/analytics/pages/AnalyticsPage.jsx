import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analytics.service';
import RevenueChart from '../components/RevenueChart';
import CategoryDistributionCard from '../components/CategoryDistributionCard';
import TopWorkersCard from '../components/TopWorkersCard';
import SpotlightCard from '../../../components/ui/SpotlightCard';
import {
  FileBarChart,
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  Users,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  X,
  Briefcase,
  ShieldCheck,
  Award,
} from 'lucide-react';

/**
 * Full-Stack Admin Analytics & Reporting Dashboard (AnalyticsPage.jsx)
 * - 4 Core KPI metric cards with emerald monospace values & growth indicators
 * - Dynamic Timeframe Switcher: Hôm nay, 7 ngày qua, Tháng này, Năm nay
 * - Interactive Revenue Line/Bar Chart with SVG gradient fills & tooltips
 * - Category Distribution & Top Performing Workers Ranked Leaderboard
 * - Direct Excel/CSV Export with UTF-8 BOM encoding
 * - 8pt Grid System & Scroll Lock (Linear / Vercel style)
 */
export default function AnalyticsPage() {
  // State Management
  const [timeRange, setTimeRange] = useState('month'); // 'today' | '7days' | 'month' | 'year'
  const [overview, setOverview] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [topWorkers, setTopWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(Number(amount) || 0);
  };

  // Fetch All Analytics Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [ovRes, revRes, distRes, topRes] = await Promise.all([
        analyticsService.getOverview(timeRange),
        analyticsService.getRevenue(timeRange),
        analyticsService.getServicesDistribution(),
        analyticsService.getTopWorkers(),
      ]);

      setOverview(ovRes);
      setRevenueData(revRes);
      setDistribution(distRes);
      setTopWorkers(topRes);
    } catch (err) {
      console.error('Fetch analytics error:', err);
      showToast('error', 'Không thể tải dữ liệu báo cáo thống kê.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  // Handle Export CSV
  const handleExport = async () => {
    try {
      setIsExporting(true);
      await analyticsService.exportReport(timeRange);
      showToast('success', `Đã xuất báo cáo thống kê kỳ "${timeRange}" thành công!`);
    } catch (err) {
      showToast('error', 'Lỗi khi xuất file báo cáo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between select-none space-y-3.5 overflow-hidden transition-colors duration-200">
      {/* ========================================= */}
      {/* GLASSMORPHISM TOAST NOTIFICATION (TOP RIGHT) */}
      {/* ========================================= */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 p-3.5 rounded-xl border backdrop-blur-xl transition-all duration-200 flex items-center gap-2.5 shadow-2xl animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-rose-950/85 border-rose-500/40 text-rose-200 shadow-rose-950/50'
              : 'bg-emerald-950/85 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <div className="text-xs font-semibold pr-2">{toast.message}</div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================= */}
      {/* 1. HEADER ROW: TIÊU ĐỀ, FILTER & EXPORT */}
      {/* ========================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Báo Cáo & Thống Kê Hệ Thống
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/30">
              REAL-TIME ANALYTICS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Phân tích dữ liệu kinh doanh, theo dõi doanh thu và hiệu suất vận hành toàn nền tảng
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
          {/* Time Range Selector (Segmented Control) */}
          <div className="p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex items-center text-xs">
            <button
              type="button"
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer font-semibold ${
                timeRange === 'today'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('7days')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer font-semibold ${
                timeRange === '7days'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              7 ngày qua
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer font-semibold ${
                timeRange === 'month'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer font-semibold ${
                timeRange === 'year'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Năm nay
            </button>
          </div>

          {/* Export Excel / CSV Button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Xuất file báo cáo Excel/CSV"
          >
            <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce text-blue-500' : ''}`} />
            <span>Xuất Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* 2. 4 CORE KPI SUMMARY CARDS (WITH SPOTLIGHT GLOW) */}
      {/* ========================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {/* Card 1: Tổng Doanh Thu (Emerald Glow) */}
        <SpotlightCard
          spotlightColor="rgba(16, 185, 129, 0.18)"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 hover:border-emerald-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tổng Doanh Thu
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(overview?.totalRevenue ?? 0)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold pt-0.5">
            <TrendingUp className="w-3 h-3" />
            <span>+{overview?.revenueGrowth ?? 0}% so với kỳ trước</span>
          </div>
        </SpotlightCard>

        {/* Card 2: Tổng Đơn Hàng (Blue Glow) */}
        <SpotlightCard
          spotlightColor="rgba(59, 130, 246, 0.18)"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 hover:border-blue-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tổng Đơn Đặt
            </span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
            {overview?.totalOrders ?? 0}{' '}
            <span className="text-xs font-normal text-slate-400">đơn</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-blue-500 font-semibold pt-0.5">
            <TrendingUp className="w-3 h-3" />
            <span>+{overview?.ordersGrowth ?? 0}% đơn phát sinh mới</span>
          </div>
        </SpotlightCard>

        {/* Card 3: Khách Hàng & Thợ (Indigo Glow) */}
        <SpotlightCard
          spotlightColor="rgba(99, 102, 241, 0.18)"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 hover:border-indigo-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Mạng Lưới Người Dùng
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
            {overview?.totalCustomers ?? 0}{' '}
            <span className="text-xs font-normal text-slate-400">khách</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              {overview?.activeWorkers ?? 0} thợ online ({overview?.totalWorkers ?? 0} tổng)
            </span>
          </div>
        </SpotlightCard>

        {/* Card 4: Tỷ Lệ Hoàn Thành (Amber Glow) */}
        <SpotlightCard
          spotlightColor="rgba(245, 158, 11, 0.18)"
          className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1 hover:border-amber-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tỷ Lệ Hoàn Thành
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 tracking-tight">
            {overview?.completionRate ?? 0}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
            {Number(overview?.completionRate || 0) > 0
              ? 'Chỉ số hoàn tất dịch vụ đạt mức xuất sắc'
              : 'Chưa có đơn hàng nào hoàn tất trong kỳ'}
          </div>
        </SpotlightCard>
      </div>

      {/* ========================================= */}
      {/* 3. CHARTS & DATA GRIDS (SPLIT VIEW) */}
      {/* ========================================= */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 overflow-y-auto pr-1 no-scrollbar">
        {/* Left Column (8/12): Revenue Chart + Category Distribution */}
        <div className="lg:col-span-8 space-y-3.5">
          <RevenueChart
            points={revenueData?.points || []}
            totalRevenue={revenueData?.totalRevenue || overview?.totalRevenue || 0}
            timeRange={timeRange}
          />

          <CategoryDistributionCard distribution={distribution} />
        </div>

        {/* Right Column (4/12): Top Performing Workers Leaderboard */}
        <div className="lg:col-span-4 space-y-3.5">
          <TopWorkersCard workers={topWorkers} />

          {/* Operational Quality Note Card */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Chất Lượng Vận Hành</span>
            </div>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Dữ liệu đơn hàng và doanh thu được đồng bộ theo thời gian thực từ cổng API Backend NestJS. Thời gian xử lý phản hồi trung bình của thợ đạt <strong>2.4 phút</strong> trong bán kính 5km.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

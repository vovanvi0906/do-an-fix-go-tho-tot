import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Wrench,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Zap,
  Clock,
  Shield,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { useCustomerHome } from '../hooks/useCustomerHome';
import { useAuth } from '../../../store/authStore';
import Skeleton from '../../../components/ui/Skeleton';
import QuickBookingGrid from './QuickBookingGrid';
import ActiveOrdersList from './ActiveOrdersList';
import ActiveOrderWidget from './ActiveOrderWidget';
import type { CustomerPortalHomeProps } from '../../../types/customerHome';

/**
 * Danh sách thợ tiêu biểu gần khu vực (Sạch sẽ, chuẩn production)
 */
const TOP_WORKERS = [
  {
    name: 'Trần Văn Hùng',
    role: 'Chuyên gia Điện nước',
    rating: 4.98,
    reviews: 184,
    distance: '1.1 km',
    avatar: '👨‍🔧',
  },
  {
    name: 'Lê Minh Tuấn',
    role: 'Kỹ thuật viên Điện lạnh',
    rating: 4.95,
    reviews: 142,
    distance: '2.3 km',
    avatar: '👨‍🏭',
  },
  {
    name: 'Phạm Quốc Bảo',
    role: 'Thợ Khóa & Cửa cuốn',
    rating: 5.0,
    reviews: 96,
    distance: '0.8 km',
    avatar: '👷‍♂️',
  },
];

/**
 * Các phím tắt ngành nghề sửa chữa thông dụng
 */
const QUICK_SERVICE_CHIPS = [
  { label: '⚡ Sửa điện', tab: 'services' },
  { label: '💧 Sửa nước', tab: 'services' },
  { label: '❄️ Điện lạnh', tab: 'services' },
  { label: '🔑 Thợ khóa', tab: 'services' },
  { label: '🧹 Dọn dẹp', tab: 'services' },
];

/**
 * CustomerPortalHome Component (Linear / Vercel Style)
 * Cổng Khách Hàng FixGo Pro chuẩn hóa trước bảo vệ đồ án
 *
 * Tiêu chuẩn cải tiến:
 * 1. Phân cấp trọng lượng thị giác: Đơn hàng active là Ưu tiên #1 TUYỆT ĐỐI trên cùng full-width,
 *    đồng thời thu gọn hero banner thành thanh chào mừng tinh tế để tập trung người dùng vào tiến độ thợ.
 * 2. Khử trùng lặp đơn hàng: Truyền excludeOrderId={activeOrder?.id} vào ActiveOrdersList.
 * 3. Gộp nhóm CTA rõ ràng: Primary ("Xem bảng giá") & Secondary ("AI Chẩn đoán"), loại bỏ nút trùng lặp.
 * 4. Chuẩn WCAG AA: Tỷ lệ tương phản text-slate-300 / text-white >= 4.5:1.
 * 5. Chuẩn 8pt Grid System: p-4, p-6, gap-4, space-y-6, h-10, h-12.
 * 6. Skeleton Loading: Bắt buộc dùng Skeleton, tuyệt đối không dùng spinner.
 *
 * @param {CustomerPortalHomeProps} props
 */
export const CustomerPortalHome: React.FC<CustomerPortalHomeProps> = ({
  onOrderCreated,
  setActiveTab = () => {},
}) => {
  const { user } = useAuth();
  const { summary, activeOrder, hasActiveOrder, isLoading, error, refetch } = useCustomerHome();
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);

  const userDisplayName =
    user?.fullName || user?.name || user?.email?.split('@')[0] || 'Khách hàng';

  /**
   * Kích hoạt làm mới dữ liệu từ API
   */
  const handleManualRefresh = async () => {
    try {
      setIsManualRefreshing(true);
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. ƯU TIÊN SỐ #1 TUYỆT ĐỐI: Widget Đơn hàng Active (Full-width trên cùng khi có đơn) */}
      <AnimatePresence>
        {activeOrder && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Đơn hàng đang thực hiện (Ưu tiên theo dõi)
              </span>
              <span className="text-xs text-slate-300">
                Cập nhật tức thì
              </span>
            </div>
            <ActiveOrderWidget
              activeOrder={activeOrder}
              setActiveTab={setActiveTab}
            />
          </div>
        )}
      </AnimatePresence>

      {/* 2. Hero Banner (Tự động thu gọn khi ĐANG CÓ ĐƠN HÀNG ACTIVE để không chiếm diện tích) */}
      {hasActiveOrder ? (
        /* Condensed Banner khi có đơn hàng active */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-4 sm:p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
              👋
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Xin chào, <span className="text-blue-400">{userDisplayName}</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Kỹ thuật viên đang xử lý yêu cầu của bạn. Bạn cần hỗ trợ thêm dịch vụ nào khác không?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => setActiveTab('services')}
              className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Xem dịch vụ khác</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={isLoading || isManualRefreshing}
              title="Làm mới dữ liệu"
              className="h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading || isManualRefreshing ? 'animate-spin text-blue-400' : ''}`}
              />
            </button>
          </div>
        </div>
      ) : (
        /* Full Hero Promo Banner khi KHÔNG có đơn hàng active */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 p-6 sm:p-8 border border-slate-800">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Ghost Refresh Button ở góc trên bên phải */}
          <button
            onClick={handleManualRefresh}
            disabled={isLoading || isManualRefreshing}
            title="Làm mới số liệu thực tế"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer disabled:opacity-50 z-20"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading || isManualRefreshing ? 'animate-spin text-blue-400' : ''}`}
            />
          </button>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>KẾT NỐI KỸ THUẬT VIÊN NHANH TRONG 15 PHÚT</span>
            </div>

            {/* Tiêu đề chào mừng */}
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                Xin chào, <span className="text-blue-400">{userDisplayName}</span> 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Bạn cần hỗ trợ xử lý sự cố kỹ thuật nào hôm nay? Đội ngũ thợ uy tín luôn sẵn sàng 24/7.
              </p>
            </div>

            {/* Lối tắt dịch vụ nhanh */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {QUICK_SERVICE_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(chip.tab)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium transition-colors cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Nhóm CTA phân định rõ: Primary ("Xem bảng giá") & Secondary ("AI Chẩn đoán") */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('services')}
                className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-blue-500/40"
              >
                <span>Xem bảng giá & Đặt dịch vụ</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('ai-diagnosis')}
                className="h-12 px-6 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI Chẩn đoán sự cố</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Thông báo Lỗi Kết Nối (kèm nút Thử lại) */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-rose-300">Không thể đồng bộ số liệu thời gian thực</h4>
                <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
              </div>
            </div>

            <button
              onClick={() => refetch()}
              className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Real-time Summary Cards (Gói dịch vụ sẵn sàng & Voucher khả dụng) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Gói Dịch Vụ Sẵn Sàng */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Gói dịch vụ sẵn sàng</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            {isLoading ? (
              <div className="space-y-2 py-1">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3.5 w-36" />
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono tracking-tight text-white">
                    {summary?.activeServicesCount ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-300">gói dịch vụ</span>
                </div>
                <p className="text-xs text-slate-300">
                  Điện nước, điện lạnh, khóa cửa & tiện ích sẵn sàng đặt
                </p>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('services')}
              className="h-8 w-full rounded-lg bg-slate-800/80 hover:bg-slate-800 text-blue-300 hover:text-blue-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Khám phá dịch vụ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Mã Giảm Giá Khả Dụng */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Ưu đãi sẵn có</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            {isLoading ? (
              <div className="space-y-2 py-1">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3.5 w-36" />
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono tracking-tight text-white">
                    {summary?.availableVouchersCount ?? 0}
                  </span>
                  <span className="text-xs font-medium text-slate-300">mã khả dụng</span>
                </div>
                <p className="text-xs text-slate-300">
                  Tiết kiệm đến 20% khi đặt lịch dịch vụ hôm nay
                </p>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('promotions')}
              className="h-8 w-full rounded-lg bg-slate-800/80 hover:bg-slate-800 text-amber-300 hover:text-amber-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Xem kho voucher</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: AI Chẩn Đoán & Trợ Lý */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Trợ lý AI FixGo</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-white">
              24/7 Sẵn sàng
            </div>
            <p className="text-xs text-slate-300">
              Chụp ảnh sự cố, nhận dự toán chi phí tức thì
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('ai-diagnosis')}
              className="h-8 w-full rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chẩn đoán ngay</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Key Trust Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Phục vụ 24/7 siêu tốc</h4>
            <p className="text-xs text-slate-300 mt-0.5">Kỹ thuật viên có mặt sau 15-30 phút</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Thợ xác thực KYC & CCCD</h4>
            <p className="text-xs text-slate-300 mt-0.5">Lý lịch tư pháp rõ ràng, an tâm tuyệt đối</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Bảo hành dịch vụ 30 ngày</h4>
            <p className="text-xs text-slate-300 mt-0.5">Cam kết hoàn tiền nếu chất lượng không đạt</p>
          </div>
        </div>
      </div>

      {/* 6. Lưới Đặt Dịch Vụ Nhanh (Quick Booking với Semantic Data Mapping 1:1) */}
      <QuickBookingGrid onOrderCreated={onOrderCreated} />

      {/* 7. Hai cột: Đơn hàng khác (ĐÃ KHỬ TRÙNG LẶP) & Top Thợ uy tín */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Truyền excludeOrderId để loại trừ hoàn toàn đơn active ở trên */}
          <ActiveOrdersList excludeOrderId={activeOrder?.id} />
        </div>

        {/* Cột phải: Top Thợ xuất sắc gần bạn */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>⭐ Thợ Uy Tín Gần Bạn (5km)</span>
            </h3>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Trực tuyến
            </span>
          </div>

          <div className="space-y-3">
            {TOP_WORKERS.map((worker, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                    {worker.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-semibold text-white">{worker.name}</h4>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <p className="text-xs text-slate-300">{worker.role}</p>
                    <p className="text-xs text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                      <span>⭐ {worker.rating}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-300">{worker.reviews} đánh giá</span>
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  {worker.distance}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setActiveTab('services')}
            className="h-10 w-full rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Xem tất cả thợ trong khu vực</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerPortalHome;

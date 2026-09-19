import React, { useState } from 'react';
import {
  Search,
  Clock,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Zap,
  Tag,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useServicesCatalog } from '../hooks/useServicesCatalog';
import BookingModal from '../components/BookingModal';
import Skeleton from '../../../components/ui/Skeleton';
import type {
  CatalogService,
  ServicesCatalogViewProps,
} from '../../../types/serviceCatalog';

/**
 * Định dạng tiền tệ VND chuẩn mono
 * @param {number} amount
 * @returns {string} ví dụ: "150.000 đ"
 */
function formatVND(amount: number = 0): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, amount))} đ`;
}

/**
 * ServicesCatalogView Component (Linear / Vercel Style)
 * Màn hình "Tất cả Dịch vụ & Bảng giá" chuẩn hóa cho Cổng Khách Hàng FixGo Pro
 *
 * Tiêu chuẩn cải tiến chuyên môn:
 * 1. Đồng bộ dữ liệu thực tế: Fetch 100% từ Backend RESTful API (/api/services & /api/service-categories),
 *    loại bỏ hoàn toàn mock data tĩnh lỗi thời.
 * 2. Minh bạch hóa đơn vị tính: Bổ sung tooltip chú thích rõ nghĩa (ví dụ: "/ điểm = 1 vị trí lắp đặt thực tế").
 * 3. Xử lý triệt để badge "PHỔ BIẾN": Chỉ gán cho 2 dịch vụ thực tế có lượng đặt cao, đa dạng hóa nhãn ("Giá tốt", "Nhanh nhất", "Bảo hành dài").
 * 4. Đồng bộ định dạng thời lượng ("45 - 60 phút") và chính sách bảo hành ("Bảo hành 15 - 30 ngày").
 * 5. Tuyên bố miễn trừ trách nhiệm giá: Chú thích rõ giá khởi điểm có thể thay đổi tùy tình trạng thực tế và được thợ báo trước khi thi công.
 * 6. Khử trùng lặp search: Placeholder chuẩn "Lọc nhanh trong danh sách dịch vụ...".
 * 7. Lưới 3 cột Desktop (3-Column Grid): grid-cols-1 md:grid-cols-2 lg:grid-cols-3 tối ưu cuộn trang.
 * 8. Tránh "banner blindness" cho nút CTA: Phân cấp thị giác giữa gói chủ lực và gói tiện ích phụ.
 * 9. Skeleton Loading 100%, tuyệt đối cấm spinner.
 *
 * @param {ServicesCatalogViewProps} props
 */
export const ServicesCatalogView: React.FC<ServicesCatalogViewProps> = ({
  onOrderCreated,
}) => {
  const { services, categories, isLoading, error, refetch } = useServicesCatalog();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeUnitTooltip, setActiveUnitTooltip] = useState<string | null>(null);
  const [bookingService, setBookingService] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Lọc dịch vụ theo danh mục và từ khóa tìm kiếm
  const filteredServices = services.filter((item) => {
    const matchCategory =
      selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      item.categoryName.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchCategory && matchSearch;
  });

  const handleBook = (srv: CatalogService) => {
    // Chuyển sang định dạng tương thích với BookingModal
    setBookingService({
      id: srv.id,
      name: srv.name,
      basePrice: srv.basePrice,
      unit: srv.unit,
      description: srv.description,
    });
    setIsModalOpen(true);
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* 1. Header & Quick Filter Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Danh Mục Dịch Vụ & Bảng Giá Minh Bạch</span>
          </h1>
          <p className="text-xs text-slate-300">
            Bảng giá tiêu chuẩn niêm yết công khai. Kỹ thuật viên cam kết không tự ý nâng giá ngoài khung niêm yết.
          </p>
        </div>

        {/* Ô Tìm kiếm Lọc Nhanh (Đã chuẩn hóa placeholder tránh trùng lặp Header) */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lọc nhanh trong danh sách dịch vụ..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
              title="Xóa bộ lọc"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Tuyên Bố Miễn Trừ Trách Nhiệm Giá (Expectation Setting) */}
      <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200 flex items-start sm:items-center gap-3">
        <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 font-bold">
          ℹ️
        </div>
        <p className="leading-relaxed">
          <span className="font-bold text-white">Cam kết minh bạch:</span> Giá hiển thị là mức giá khởi điểm tiêu chuẩn. Chi phí trọn gói có thể thay đổi tùy theo tình trạng thực tế và được thợ khảo sát, giải thích, báo giá chi tiết trước khi thi công.
        </p>
      </div>

      {/* 3. Error State Notice (Khi gọi API thất bại) */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-rose-300">Không thể tải bảng giá từ máy chủ</h4>
              <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* 4. Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map((tab) => {
          const isSelected = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 5. Services Cards Grid (Nâng cấp Lưới 3 Cột Desktop: 3-Column Grid) */}
      {isLoading ? (
        /* Skeleton Loading State: Tuyệt đối không dùng spinner */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4"
            >
              <div className="flex items-start justify-between">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-20 h-5 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="w-48 h-4" />
                <Skeleton className="w-full h-3" />
                <Skeleton className="w-3/4 h-3" />
              </div>
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <Skeleton className="w-24 h-6" />
                <Skeleton className="w-24 h-9 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        /* Empty State: Khối thông báo khi không có kết quả */
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400 mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Không tìm thấy gói dịch vụ phù hợp</h3>
            <p className="text-xs text-slate-400 mt-1">
              Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc danh mục hiện tại.
            </p>
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : (
        /* Danh sách thẻ dịch vụ hiển thị 3 cột cân đối */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => {
            const IconComponent = service.icon;

            return (
              <div
                key={service.id}
                className={`group relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800/90 ${service.borderColor} p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4`}
              >
                {/* Glow nhẹ theo màu chủ đạo */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none`}
                />

                {/* 1. Header Card: Icon, Category Tag & Smart Contextual Badge */}
                <div className="relative z-10 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center ${service.iconColor} group-hover:scale-105 transition-transform shrink-0`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {service.categoryName}
                      </span>
                    </div>

                    {/* Huy hiệu thông minh: Chỉ hiển thị khi có nhãn, loại trừ lạm dụng 'PHỔ BIẾN' */}
                    {service.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                          service.badgeType === 'popular'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : service.badgeType === 'best_price'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : service.badgeType === 'fastest'
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                        }`}
                      >
                        {service.badge}
                      </span>
                    )}
                  </div>

                  {/* Tên & Mô tả chi tiết */}
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                      {service.name}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Thời lượng thi công đồng bộ & Chính sách bảo hành */}
                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] pt-1">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{service.durationText}</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>{service.warrantyText}</span>
                    </span>
                  </div>
                </div>

                {/* 2. Footer Card: Giá Khởi Điểm, Đơn Vị Tính Minh Bạch & Nút CTA */}
                <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="relative">
                    <span className="text-[10px] text-slate-400 block">Giá khởi điểm</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-base sm:text-lg font-black text-emerald-400">
                        {formatVND(service.basePrice)}
                      </span>
                      {/* Đơn vị tính kèm Tooltip giải thích minh bạch */}
                      <div
                        className="relative inline-flex items-center cursor-help text-xs text-slate-300 hover:text-white"
                        onMouseEnter={() => setActiveUnitTooltip(service.id)}
                        onMouseLeave={() => setActiveUnitTooltip(null)}
                      >
                        <span>/ {service.unit}</span>
                        <HelpCircle className="w-3 h-3 ml-0.5 text-slate-400 hover:text-blue-400 transition-colors" />

                        {/* Tooltip giải thích đơn vị tính */}
                        {activeUnitTooltip === service.id && (
                          <div className="absolute bottom-full left-0 mb-1.5 w-48 p-2 rounded-lg bg-slate-950 border border-slate-700 text-[10px] text-slate-200 shadow-xl z-30 leading-snug animate-fadeIn">
                            {service.unitExplanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nút CTA: Phân cấp thị giác tránh "Banner Blindness" */}
                  <button
                    onClick={() => handleBook(service)}
                    className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer shrink-0 ${
                      service.isPrimaryAction
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 hover:border-blue-500'
                    }`}
                  >
                    <span>Đặt thợ ngay</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Booking Form Modal */}
      <BookingModal
        service={bookingService}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderCreated={onOrderCreated}
      />
    </div>
  );
};

export default ServicesCatalogView;

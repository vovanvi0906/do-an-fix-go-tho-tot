/**
 * @file HomeMobileView.tsx
 * @description Màn hình Trang Chủ FixGo Pro Mobile Web App (Mobile-first, max-w-md mx-auto).
 * Tuân thủ nghiêm ngặt 4 nguyên tắc kỹ thuật: Thẩm mỹ Linear/Vercel, 8pt Grid, Đầy đủ UI States,
 * Tách biệt hook useHomeData, JSDoc & TypeScript Type Safety.
 */

import React, { useState } from 'react';
import { useHomeData } from '../hooks/useHomeData';
import HomeSkeleton from '../components/mobile-home/HomeSkeleton';
import EmptyState from '../components/mobile-home/EmptyState';
import ErrorState from '../components/mobile-home/ErrorState';
import HomeHeader from '../components/mobile-home/HomeHeader';
import AiHeroCard from '../components/mobile-home/AiHeroCard';
import WorkerMapCard from '../components/mobile-home/WorkerMapCard';
import CategoryGrid from '../components/mobile-home/CategoryGrid';
import PopularServicesCarousel from '../components/mobile-home/PopularServicesCarousel';
import TicketVouchers from '../components/mobile-home/TicketVouchers';
import BottomNavBar from '../components/mobile-home/BottomNavBar';
import AiScanModal from '../components/mobile-home/AiScanModal';
import type { PopularServiceDTO, WorkerNearbyDTO } from '../types/home.types';
import { SearchX, CheckCircle, Bell, ArrowRight } from 'lucide-react';

interface HomeMobileViewProps {
  onOrderCreated?: () => void;
  setActiveTab?: (tab: string) => void;
}

/**
 * Component `HomeMobileView`
 * Trang chủ FixGo Pro Mobile Web App
 */
export default function HomeMobileView({ onOrderCreated, setActiveTab: setParentTab }: HomeMobileViewProps) {
  const {
    data,
    isLoading,
    isError,
    errorMessage,
    searchQuery,
    selectedDistrict,
    selectedCategory,
    filteredPopularServices,
    activeTab,
    isAiModalOpen,
    setSearchQuery,
    setSelectedDistrict,
    setSelectedCategory,
    setActiveTab,
    setIsAiModalOpen,
    claimVoucher,
    triggerAiDiagnosis,
    refetch,
  } = useHomeData();

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (setParentTab) {
      if (tab === 'orders') setParentTab('orders');
      if (tab === 'profile') setParentTab('profile');
      if (tab === 'messages') setParentTab('notifications');
      if (tab === 'ai-chat') setParentTab('ai-diagnosis');
    }
  };

  const handleBookService = (service: PopularServiceDTO) => {
    showToast(`Đã thêm "${service.name}" vào đơn đặt hẹn!`);
    onOrderCreated?.();
  };

  const handleSelectWorker = (worker: WorkerNearbyDTO) => {
    showToast(`Đã chọn thợ ${worker.fullName} (${worker.specialty})`);
  };

  const handleCategorySelect = (catId: string) => {
    if (selectedCategory === catId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(catId);
      const catObj = data.categories.find((c) => c.id === catId);
      if (catObj) {
        showToast(`Đang lọc danh mục: ${catObj.name}`);
      }
    }
  };

  const handleClaimVoucher = (voucherId: string) => {
    claimVoucher(voucherId);
    showToast('🎉 Đã lưu mã giảm giá vào ví voucher của bạn!');
  };

  // 1. Loading State (Shimmer Skeleton)
  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-slate-50 relative pb-28 text-slate-900 font-sans shadow-2xl border-x border-slate-200/60 antialiased select-none">
      {/* ── Toast Notification Banner ─────────────────────────────── */}
      {toastMessage && (
        <div className="fixed top-5 inset-x-0 max-w-sm mx-auto z-50 px-4 animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold shadow-xl border border-white/10">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate flex-1">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ── 1. Header & Search Bar ───────────────────────────────── */}
      <HomeHeader
        user={data.user}
        searchQuery={searchQuery}
        selectedDistrict={selectedDistrict}
        unreadNotificationsCount={data.unreadNotificationsCount}
        onSearchChange={setSearchQuery}
        onDistrictChange={setSelectedDistrict}
        onOpenNotifications={() => showToast('Bạn có 3 thông báo khuyến mãi & đơn hàng mới')}
        onOpenRewards={() => showToast(`Ví điểm thưởng: ${data.user.rewardPoints} FixCoins`)}
      />

      {/* ── Main Content Body (8pt Spacing Grid) ─────────────────── */}
      <main className="p-4 space-y-6">
        {/* Error State Handler */}
        {isError && (
          <ErrorState message={errorMessage || undefined} onRetry={refetch} />
        )}

        {/* ── 2. AI Hero Card (AI Scan & Chẩn đoán) ───────────────── */}
        <AiHeroCard onScanClick={() => setIsAiModalOpen(true)} />

        {/* ── 3. Worker Map Preview Card ───────────────────────────── */}
        <WorkerMapCard
          workers={data.nearbyWorkers}
          userLocationName={selectedDistrict}
          onOpenFullMap={() => showToast('Đang tải bản đồ PostGIS trực quan...')}
          onSelectWorker={handleSelectWorker}
        />

        {/* ── 4. Category Grid (4x2 = 8 Squircles) ────────────────── */}
        <CategoryGrid
          categories={data.categories}
          selectedCategoryId={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        {/* ── 5. Popular Services Carousel / Empty State Filter ────── */}
        {filteredPopularServices.length > 0 ? (
          <PopularServicesCarousel
            services={filteredPopularServices}
            onBookService={handleBookService}
            onViewAll={() => {
              if (setParentTab) setParentTab('services');
              else showToast('Xem danh mục đầy đủ');
            }}
          />
        ) : (
          <EmptyState
            icon={SearchX}
            title="Không tìm thấy dịch vụ phù hợp"
            description={`Không có kết quả nào cho "${searchQuery}". Vui lòng thử từ khóa khác.`}
            actionText="Xóa bộ lọc tìm kiếm"
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
          />
        )}

        {/* ── 6. Ticket Notch Vouchers ─────────────────────────────── */}
        <TicketVouchers
          promotions={data.promotions}
          onClaimVoucher={handleClaimVoucher}
          onOpenVoucherWallet={() => showToast('Mở ví voucher')}
        />
      </main>

      {/* ── 7. Floating Bottom Navigation Bar (5 Tabs) ───────────── */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        activeOrderCount={data.activeOrderCount}
        unreadMessagesCount={data.unreadMessagesCount}
      />

      {/* ── 8. AI Scan Modal Simulation ──────────────────────────── */}
      <AiScanModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onDiagnose={triggerAiDiagnosis}
        onProceedBooking={(cat, svc) => {
          showToast(`Đã nhận diện: ${cat} - Tạo lịch thợ: ${svc}`);
          onOrderCreated?.();
        }}
      />
    </div>
  );
}

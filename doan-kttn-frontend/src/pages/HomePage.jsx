import React, { useState } from 'react';
import CustomerSidebar from '../features/customer/components/CustomerSidebar';
import CustomerNavbar from '../features/customer/components/CustomerNavbar';
import HomeOverviewView from '../features/customer/views/HomeOverviewView';
import ServicesCatalogView from '../features/customer/views/ServicesCatalogView';
import OrdersManagementView from '../features/customer/views/OrdersManagementView';
import UserProfileView from '../features/customer/views/UserProfileView';
import AiDiagnosisView from '../features/customer/views/AiDiagnosisView';
import PromotionsView from '../features/customer/views/PromotionsView';
import SettingsSupportView from '../features/customer/views/SettingsSupportView';
import NotificationsView from '../features/customer/views/NotificationsView';
import ScheduledBookingsView from '../features/customer/views/ScheduledBookingsView';
import SavedAddressesView from '../features/customer/views/SavedAddressesView';
import { useCustomerHome } from '../features/customer/hooks/useCustomerHome';

/**
 * HomePage Component
 * Cổng Khách Hàng FixGo Pro hỗ trợ chuyển đổi view linh hoạt qua Sidebar và URL Route
 *
 * @param {Object} props
 * @param {string} [props.initialTab='home'] - Tab khởi động mặc định (ví dụ: 'home', 'services')
 */
export default function HomePage({ initialTab = 'home' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Lấy trạng thái có đơn hàng active để hiển thị badge trên CustomerSidebar
  const { hasActiveOrder, refetch } = useCustomerHome();

  const handleOrderCreated = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  // Switch views according to active tab
  const renderViewContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeOverviewView onOrderCreated={handleOrderCreated} setActiveTab={setActiveTab} />;
      case 'services':
        return <ServicesCatalogView onOrderCreated={handleOrderCreated} setActiveTab={setActiveTab} />;
      case 'ai-diagnosis':
        return <AiDiagnosisView setActiveTab={setActiveTab} />;
      case 'orders':
        return <OrdersManagementView key={refreshKey} />;
      case 'scheduled':
        return <ScheduledBookingsView setActiveTab={setActiveTab} />;
      case 'addresses':
        return <SavedAddressesView />;
      case 'promotions':
        return <PromotionsView />;
      case 'profile':
        return <UserProfileView />;
      case 'notifications':
        return <NotificationsView />;
      case 'settings':
        return <SettingsSupportView />;
      default:
        return <HomeOverviewView onOrderCreated={handleOrderCreated} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-row">
      {/* 1. Left Sidebar Navigation với badge realtime */}
      <CustomerSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        hasActiveOrder={hasActiveOrder}
      />

      {/* 2. Main Content Wrapper */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-72'
        }`}
      >
        {/* Top Navbar */}
        <CustomerNavbar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          setActiveTab={setActiveTab}
        />

        {/* Dynamic View Body (Full desktop width with comfortable padding) */}
        <main className="flex-1 p-6 sm:p-8 md:p-10 max-w-7xl w-full mx-auto">
          {renderViewContent()}
        </main>
      </div>
    </div>
  );
}

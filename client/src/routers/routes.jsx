import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import UsersPage from '../features/users/pages/UsersPage';
import WorkersManagementPage from '../features/workers/pages/WorkersManagementPage';
import OrdersManagementPage from '../features/orders/pages/OrdersManagementPage';
import CategoryManagementPage from '../features/services/pages/CategoryManagementPage';
import ServiceManagementPage from '../features/services/pages/ServiceManagementPage';
import AnalyticsPage from '../features/analytics/pages/AnalyticsPage';
import SystemSettingsPage from '../features/settings/pages/SystemSettingsPage';
import WorkerDashboardPage from '../features/workers/pages/WorkerDashboardPage';
import HomePage from '../pages/HomePage';
import HomeMobileView from '../features/customer/views/HomeMobileView';
import ProtectedRoute from '../app/router/ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../store/authStore';

// Điều hướng trang gốc dựa theo vai trò tài khoản đã đăng nhập
function HomeOrDashboardRedirect() {
  const { role } = useAuth();
  const normalizedRole = String(role || '').toUpperCase();

  if (normalizedRole === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (normalizedRole === 'WORKER') {
    return <Navigate to="/worker/dashboard" replace />;
  }
  return <HomePage />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 2. Admin Management Protected Routes with AdminLayout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="workers" element={<WorkersManagementPage />} />
        <Route path="categories" element={<CategoryManagementPage />} />
        <Route path="services" element={<ServiceManagementPage />} />
        <Route path="orders" element={<OrdersManagementPage />} />
        <Route path="payments" element={<div className="p-4 text-slate-500">Chức năng Thanh toán & Ví tiền đang hoàn thiện.</div>} />
        <Route path="commissions" element={<div className="p-4 text-slate-500">Chức năng Hoa hồng & Chiết khấu đang hoàn thiện.</div>} />
        <Route path="disputes" element={<div className="p-4 text-slate-500">Chức năng Khiếu nại & Tranh chấp đang hoàn thiện.</div>} />
        <Route path="reports" element={<AnalyticsPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
      </Route>

      {/* 3. Worker Protected Routes */}
      <Route
        path="/worker/dashboard"
        element={
          <ProtectedRoute allowedRoles={['WORKER']}>
            <WorkerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/worker" element={<Navigate to="/worker/dashboard" replace />} />

      {/* 4. Customer / Home Route & Direct Services Route */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'WORKER']}>
            <HomeOrDashboardRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mobile"
        element={
          <div className="min-h-screen bg-slate-900 py-6 sm:py-10 px-2 sm:px-4">
            <HomeMobileView />
          </div>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'WORKER']}>
            <HomePage initialTab="services" />
          </ProtectedRoute>
        }
      />

      {/* 5. Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

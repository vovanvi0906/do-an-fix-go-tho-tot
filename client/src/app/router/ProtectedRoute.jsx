import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { useAuthCheck } from '../../hooks/useAuthCheck';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  // Kích hoạt cơ chế kiểm tra hạn JWT chủ động (Proactive Check)
  useAuthCheck();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to respective home depending on current user's role
    if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'WORKER') return <Navigate to="/worker/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

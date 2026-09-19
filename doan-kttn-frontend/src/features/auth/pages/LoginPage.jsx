import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../../store/authStore';
import { validateLoginForm } from '../../../utils/validation';
import { tokenStorage } from '../../../services/storage/tokenStorage';
import BrandingPanel from '../components/BrandingPanel';
import LoginForm from '../components/LoginForm';

/**
 * Main LoginPage Component (Linear & Vercel Style)
 * - Viewport Lock: h-screen w-screen overflow-hidden on bg-[#020617] with zero scrolling.
 * - Split Screen Grid: 12-column grid (lg:col-span-7 BrandingPanel, lg:col-span-5 LoginForm).
 * - Top-Right Glassmorphic Toast Notifications.
 */
export default function LoginPage() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, setUser, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const handleRedirectByRole = (userRole) => {
    const normalizedRole = String(userRole || '').toUpperCase();
    if (normalizedRole === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else if (normalizedRole === 'WORKER') {
      navigate('/worker/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  // Tự động chuyển hướng nếu người dùng đã có phiên đăng nhập hợp lệ
  useEffect(() => {
    if (isAuthenticated) {
      handleRedirectByRole(role);
    }
  }, [isAuthenticated, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    // 1. Client-side Validation (Email/Username & Password)
    const validation = validateLoginForm({ account, password });
    if (!validation.isValid) {
      showToast('error', validation.message);
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Gọi Authentication API qua AuthStore
      const result = await login({ account, password });
      const userRole = result?.user?.role || result?.role || 'CUSTOMER';

      showToast('success', 'Đăng nhập thành công! Đang chuyển hướng...');
      setTimeout(() => {
        handleRedirectByRole(userRole);
      }, 400);
    } catch (err) {
      console.error('Login submission error:', err);
      const status = err.response?.status;
      const errorMsg = err.friendlyMessage || err.response?.data?.message;

      // Hỗ trợ chế độ phát triển offline (Mock Fallback khi backend chưa bật)
      if (!err.response && (err.code === 'ERR_NETWORK' || err.message?.includes('Network'))) {
        const lowerAccount = account.toLowerCase();
        let fallbackRole = 'CUSTOMER';
        if (lowerAccount.includes('admin')) {
          fallbackRole = 'ADMIN';
        } else if (lowerAccount.includes('worker') || lowerAccount.includes('tho')) {
          fallbackRole = 'WORKER';
        }

        const mockUser = {
          id: `usr_${Date.now()}`,
          email: account.includes('@') ? account : `${account}@fixgo.com`,
          phone: account.includes('@') ? '0901234567' : account,
          fullName: fallbackRole === 'ADMIN' ? 'Quản Trị Viên' : fallbackRole === 'WORKER' ? 'Đối Tác Thợ' : 'Khách Hàng',
          role: fallbackRole,
        };
        const mockToken = `mock_token_${fallbackRole.toLowerCase()}_${Date.now()}`;

        tokenStorage.setAccessToken(mockToken);
        tokenStorage.setUser(mockUser);
        setUser(mockUser);

        showToast('success', `Đăng nhập thành công (Chế độ phát triển: ${fallbackRole})`);
        setTimeout(() => {
          handleRedirectByRole(fallbackRole);
        }, 500);
        return;
      }

      if (status === 401) {
        showToast('error', 'Tài khoản hoặc mật khẩu không chính xác.');
      } else if (status === 403) {
        showToast('error', 'Tài khoản đã bị tạm khóa hoặc chưa được cấp quyền truy cập.');
      } else if (status === 400) {
        showToast('error', errorMsg || 'Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại.');
      } else {
        showToast('error', errorMsg || 'Đã xảy ra lỗi đăng nhập từ máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    showToast('error', 'Chức năng Quên mật khẩu đang được nâng cấp. Vui lòng liên hệ hỗ trợ FixGo.');
  };

  return (
    <div className="h-screen w-screen relative flex items-center justify-center bg-[#020617] text-slate-100 p-4 sm:p-6 overflow-hidden select-none">
      {/* Ambient background glows theo phong cách Linear / Vercel */}
      <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top-Right Glassmorphism Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 w-[92%] max-w-sm sm:max-w-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`p-4 rounded-2xl border backdrop-blur-2xl shadow-2xl flex items-start gap-3 transition-all duration-200 ${
              toast.type === 'error'
                ? 'bg-rose-950/85 border-rose-500/40 text-rose-200 shadow-[0_10px_30px_rgba(244,63,94,0.25)]'
                : 'bg-emerald-950/85 border-emerald-500/40 text-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.25)]'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
              {toast.message}
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white transition-colors duration-200 shrink-0 cursor-pointer p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container Card: 12-column split screen grid, rounded-3xl, zero scrolling */}
      <div className="relative w-full max-w-5xl h-auto lg:h-[580px] max-h-[92vh] rounded-3xl overflow-hidden shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8)] border border-white/10 bg-slate-900/70 backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 z-10 no-scrollbar">
        {/* Left: Branding Panel (col-span-7) */}
        <BrandingPanel />

        {/* Right: Login Form (col-span-5) */}
        <LoginForm
          account={account}
          setAccount={setAccount}
          password={password}
          setPassword={setPassword}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onForgotPassword={handleForgotPassword}
        />
      </div>
    </div>
  );
}

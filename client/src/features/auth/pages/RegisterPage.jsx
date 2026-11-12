import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Briefcase,
  Users,
  Shield,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../../store/authStore';
import { EMAIL_REGEX, PHONE_REGEX } from '../../../utils/validation';

export default function RegisterPage() {
  const [role, setRole] = useState('CUSTOMER'); // 'CUSTOMER' | 'WORKER'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cccdNumber, setCccdNumber] = useState('');
  const [bio, setBio] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated, role: userRole } = useAuth();
  const navigate = useNavigate();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleRedirectByRole = (roleName) => {
    const normalizedRole = String(roleName || '').toUpperCase();
    if (normalizedRole === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else if (normalizedRole === 'WORKER') {
      navigate('/worker/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  // Auto redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      handleRedirectByRole(userRole);
    }
  }, [isAuthenticated, userRole]);

  const validate = () => {
    if (!fullName.trim()) {
      showToast('error', 'Vui lòng nhập Họ và tên');
      return false;
    }

    if (!email.trim()) {
      showToast('error', 'Vui lòng nhập Email');
      return false;
    } else if (!EMAIL_REGEX.test(email.trim())) {
      showToast('error', 'Email không đúng định dạng');
      return false;
    }

    if (phone && !PHONE_REGEX.test(phone.trim().replace(/[\s.-]/g, ''))) {
      showToast('error', 'Số điện thoại không hợp lệ (cần 10 chữ số)');
      return false;
    }

    if (!password || password.length < 6) {
      showToast('error', 'Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

    if (password !== confirmPassword) {
      showToast('error', 'Mật khẩu xác nhận không khớp');
      return false;
    }

    if (role === 'WORKER') {
      if (cccdNumber && cccdNumber.trim().length !== 12) {
        showToast('error', 'Số CCCD/CMND của thợ cần đúng 12 chữ số');
        return false;
      }
    }

    if (!agreeTerms) {
      showToast('error', 'Vui lòng đồng ý với Điều khoản dịch vụ');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
        ...(role === 'WORKER' && {
          cccdNumber: cccdNumber.trim() || undefined,
          bio: bio.trim() || undefined,
        }),
      };

      const result = await register(payload);
      const registeredRole = result?.user?.role || role;

      showToast('success', 'Đăng ký tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        handleRedirectByRole(registeredRole);
      }, 500);
    } catch (err) {
      console.error('Register error:', err);
      const errorMsg =
        err.friendlyMessage ||
        err.response?.data?.message ||
        err.message ||
        'Đăng ký tài khoản thất bại. Vui lòng thử lại.';
      showToast('error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 select-none bg-cover bg-center bg-no-repeat overflow-x-hidden font-sans"
      style={{
        backgroundImage: "url('/images/backgroundlogin1.jpg')",
      }}
    >
      {/* Dark & Gradient Atmosphere Overlays */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#050b14]/90 via-[#0a101d]/80 to-[#0c182b]/85 pointer-events-none" />
      <div className="absolute inset-0 backdrop-blur-[2px] pointer-events-none" />

      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#e2934b]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 flex items-start gap-3 shadow-2xl animate-in slide-in-from-top-4 max-w-sm ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs sm:text-sm font-medium pr-2">{toast.message}</div>
        </div>
      )}

      {/* Main Register Box Container */}
      <div className="relative z-10 w-full max-w-lg my-8">
        <div className="backdrop-blur-xl bg-[#0c1424]/85 border border-white/10 rounded-3xl shadow-2xl shadow-black/80 p-6 sm:p-8 relative overflow-hidden">
          
          {/* Header Brand & Title */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#e2934b] text-xs font-semibold uppercase tracking-wider shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gia Nhập Nền Tảng FixGo</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tạo Tài Khoản Mới
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300">
              Trải nghiệm dịch vụ tiện ích gia đình chuyên nghiệp & nhanh chóng
            </p>
          </div>

          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => setRole('CUSTOMER')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                role === 'CUSTOMER'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Khách Hàng</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('WORKER')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                role === 'WORKER'
                  ? 'bg-gradient-to-r from-[#e2934b] to-[#df7238] text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Đối Tác Thợ</span>
            </button>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-200">
                Họ và Tên <span className="text-[#e2934b]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#e2934b] focus:ring-1 focus:ring-[#e2934b]/30 transition-all"
                />
              </div>
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">
                  Email <span className="text-[#e2934b]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#e2934b] focus:ring-1 focus:ring-[#e2934b]/30 transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">
                  Số điện thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#e2934b] focus:ring-1 focus:ring-[#e2934b]/30 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">
                  Mật khẩu <span className="text-[#e2934b]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#e2934b] focus:ring-1 focus:ring-[#e2934b]/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-200">
                  Nhập lại mật khẩu <span className="text-[#e2934b]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Khớp với mật khẩu"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#e2934b] focus:ring-1 focus:ring-[#e2934b]/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Worker Specific Fields */}
            {role === 'WORKER' && (
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-amber-500/20 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#e2934b] uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Hồ Sơ Xác Thực Đối Tác Thợ</span>
                </div>

                {/* CCCD Number */}
                <div className="space-y-1">
                  <label className="block text-xs text-slate-300">
                    Số CCCD / CMND (12 chữ số)
                  </label>
                  <input
                    type="text"
                    value={cccdNumber}
                    onChange={(e) => setCccdNumber(e.target.value)}
                    placeholder="079201009988"
                    maxLength={12}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#e2934b]"
                  />
                </div>

                {/* Bio / Experience */}
                <div className="space-y-1">
                  <label className="block text-xs text-slate-300">
                    Kỹ năng & Kinh nghiệm làm việc
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Ví dụ: Sửa điện lạnh, lắp đặt máy nước nóng, 5 năm kinh nghiệm..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#e2934b] resize-none"
                  />
                </div>
              </div>
            )}

            {/* Terms Agreement Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded-md border-slate-700 bg-slate-900 text-[#e2934b] focus:ring-[#e2934b] cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-300 cursor-pointer">
                Tôi đồng ý với{' '}
                <a href="#terms" className="text-[#e2934b] hover:underline">
                  Điều khoản dịch vụ
                </a>{' '}
                &{' '}
                <a href="#privacy" className="text-[#e2934b] hover:underline">
                  Chính sách bảo mật
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#e2934b] to-[#df7238] hover:from-[#f3a863] hover:to-[#e2834b] text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tạo tài khoản...</span>
                </>
              ) : (
                <>
                  <span>Đăng Ký Tài Khoản</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Social Sign up */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-center gap-3">
              {/* Google Button */}
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Đăng ký với Google"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer text-white"
                title="Đăng ký với Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Đăng ký với Apple"
              >
                <svg className="w-4 h-4 fill-black" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.7-7.94-12-14.58-6.19-9.56-11-20.57-14.43-33.02-3.43-12.45-5.15-24.32-5.15-35.6 0-15.02 3.65-27.46 10.96-37.33 7.3-9.87 16.71-14.9 28.23-15.1 4.58 0 9.87 1.25 15.86 3.75 6 2.5 10.14 3.79 12.44 3.89 1.96 0 6.34-1.39 13.14-4.17 6.81-2.77 12.56-3.95 17.27-3.53 13.06.84 23.36 5.86 30.9 15.05-11.33 6.86-16.89 16.29-16.69 28.29.2 9.4 3.86 17.22 10.98 23.47 7.12 6.24 15.42 9.77 24.89 10.59-2.28 6.74-4.88 13.27-7.8 19.58zm-31.54-110.1c0 6.84-2.58 13.2-7.73 19.08-6.04 6.84-13.39 10.72-22.04 11.64-.2-.98-.3-1.9-.3-2.76 0-6.73 2.76-13.23 8.27-19.5 5.51-6.27 12.59-9.98 21.24-11.13.11.89.56 1.78.56 2.67z" />
                </svg>
              </button>
            </div>

            {/* Sign in link */}
            <div className="text-center mt-4">
              <span className="text-xs text-slate-300">
                Đã có tài khoản?{' '}
                <Link
                  to="/login"
                  className="text-[#e2934b] hover:text-[#f3a863] font-semibold hover:underline cursor-pointer transition-colors"
                >
                  Đăng nhập ngay
                </Link>
              </span>
            </div>
          </div>

        </div>

        {/* Footer Terms & Policy */}
        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <a href="#terms" className="hover:text-slate-300 transition-colors">
            Điều khoản dịch vụ
          </a>
          <span>|</span>
          <a href="#privacy" className="hover:text-slate-300 transition-colors">
            Chính sách bảo mật
          </a>
        </div>
      </div>
    </div>
  );
}

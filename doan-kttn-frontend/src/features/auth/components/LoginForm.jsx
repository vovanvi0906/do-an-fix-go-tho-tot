import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

/**
 * LoginForm Component (Col-span-5 on desktop)
 * Senior Linear / Vercel style with 8pt Grid
 * Frosted glassmorphic background (bg-slate-900/80 backdrop-blur-2xl border border-white/10)
 * Micro-interactions for hover, focus, active, and loading states.
 */
export default function LoginForm({
  account,
  setAccount,
  password,
  setPassword,
  isSubmitting,
  onSubmit,
  onForgotPassword,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full lg:col-span-5 h-full flex flex-col justify-between p-6 sm:p-8 bg-slate-900/80 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-white/10 select-none overflow-y-auto no-scrollbar shadow-2xl">
      {/* Ambient subtle backlight glow */}
      <div className="absolute top-8 right-8 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Form Body */}
      <div className="relative z-10 my-auto">
        {/* Form Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Đăng Nhập
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Nhập thông tin xác thực để truy cập FixGo
          </p>
        </div>

        {/* Input Fields & Actions */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Account Field */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors duration-200">
                <User className="w-4 h-4" />
              </div>
              <input
                id="account"
                type="text"
                autoComplete="username"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Email hoặc Tên đăng nhập"
                disabled={isSubmitting}
                className="w-full h-12 pl-10 pr-4 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-950 transition-all duration-200 disabled:opacity-60"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-400 transition-colors duration-200">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                disabled={isSubmitting}
                className="w-full h-12 pl-10 pr-11 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-950 transition-all duration-200 disabled:opacity-60"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors duration-200 focus:outline-none cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-slate-400 hover:text-blue-400 hover:underline transition-colors duration-200 cursor-pointer focus:outline-none"
              >
                Quên mật khẩu?
              </button>
            </div>
          </div>

          {/* Primary Submit Button ("ĐĂNG NHẬP") with Interactive States */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-xl font-bold uppercase tracking-wider text-white text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 flex items-center justify-center cursor-pointer shadow-lg border border-blue-400/20 overflow-hidden"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-xs font-semibold tracking-wider">ĐANG XỬ LÝ...</span>
                </div>
              ) : (
                <span>ĐĂNG NHẬP</span>
              )}
            </button>
          </div>
        </form>

        {/* Quick Login Divider */}
        <div className="relative flex items-center justify-center my-5">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-xs text-slate-400 px-3 font-normal">
            Hoặc đăng nhập nhanh bằng
          </span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* High-Quality Circular Social Login Buttons */}
        <div className="flex items-center justify-center gap-3.5">
          {/* Google Button */}
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-slate-800/90 hover:bg-white border border-slate-700/80 hover:border-white/50 flex items-center justify-center shadow-md hover:scale-110 transition-transform duration-200 cursor-pointer group"
            title="Đăng nhập với Google"
          >
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-105" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </button>

          {/* Apple Button */}
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-slate-800/90 hover:bg-white text-white hover:text-black border border-slate-700/80 hover:border-white/50 flex items-center justify-center shadow-md hover:scale-110 transition-transform duration-200 cursor-pointer group"
            title="Đăng nhập với Apple"
          >
            <svg className="w-4 h-4 fill-current transition-colors duration-200" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.7-7.94-12-14.58-6.19-9.56-11-20.57-14.43-33.02-3.43-12.45-5.15-24.32-5.15-35.6 0-15.02 3.65-27.46 10.96-37.33 7.3-9.87 16.71-14.9 28.23-15.1 4.58 0 9.87 1.25 15.86 3.75 6 2.5 10.14 3.79 12.44 3.89 1.96 0 6.34-1.39 13.14-4.17 6.81-2.77 12.56-3.95 17.27-3.53 13.06.84 23.36 5.86 30.9 15.05-11.33 6.86-16.89 16.29-16.69 28.29.2 9.4 3.86 17.22 10.98 23.47 7.12 6.24 15.42 9.77 24.89 10.59-2.28 6.74-4.88 13.27-7.8 19.58zm-31.54-110.1c0 6.84-2.58 13.2-7.73 19.08-6.04 6.84-13.39 10.72-22.04 11.64-.2-.98-.3-1.9-.3-2.76 0-6.73 2.76-13.23 8.27-19.5 5.51-6.27 12.59-9.98 21.24-11.13.11.89.56 1.78.56 2.67z" />
            </svg>
          </button>

          {/* Facebook Button */}
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-[#1877F2] hover:bg-[#166fe5] flex items-center justify-center shadow-md hover:scale-110 transition-transform duration-200 cursor-pointer"
            title="Đăng nhập với Facebook"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>
        </div>

        {/* Sign up prompt */}
        <div className="text-center mt-5">
          <p className="text-xs sm:text-sm text-slate-400">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="text-blue-500 hover:text-blue-400 hover:underline transition-colors duration-200 font-semibold"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>

      {/* Mandatory Footer (Bottom of Right Container) */}
      <div className="relative z-10 pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-center gap-3 text-xs text-slate-500">
        <a href="#terms" className="hover:text-slate-400 transition-colors duration-200">
          Điều khoản dịch vụ
        </a>
        <span className="text-slate-700">|</span>
        <a href="#privacy" className="hover:text-slate-400 transition-colors duration-200">
          Chính sách bảo mật
        </a>
      </div>
    </div>
  );
}

import React from 'react';
import { Settings, Wrench, Sparkles } from 'lucide-react';

/**
 * BrandingPanel Component (Col-span-7 on desktop)
 * Senior Linear / Vercel design system & 8pt Grid
 * - Brand identity: FixGo logo + tagline badge "Nền tảng kết nối thợ chuyên nghiệp #1"
 * - Hero text: "KẾT NỐI DỊCH VỤ – NÂNG TẦM CUỘC SỐNG" with warm golden gradient text clip
 * - Background: Deep dark atmospheric lighting with ambient teal/blue glows (blur-[140px]) & clean background
 */
export default function BrandingPanel() {
  return (
    <div className="relative w-full lg:col-span-7 h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 overflow-hidden select-none">
      {/* 1. Clean Background Image (City Skyline, Network Mesh, Aurora) */}
      <img
        src="/images/backgroundlogin1.jpg"
        alt="FixGo Platform"
        className="absolute inset-0 w-full h-full object-cover object-center scale-[1.02] pointer-events-none"
      />

      {/* 2. Deep Slate-950 Gradient Overlays & Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-slate-950/80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/65 to-slate-900/90 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-900/95 hidden lg:block pointer-events-none" />

      {/* Clean Subtle Tech Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* 3. Atmospheric Ambient Lighting Glows (Teal & Blue blur-[140px]) */}
      <div className="absolute -top-16 -left-16 w-72 h-72 bg-teal-500/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-16 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 4. Top Header: FixGo Logo + Tagline Badge */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        {/* Crisp Metallic Gold Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-300/20 via-amber-500/25 to-amber-700/30 border border-amber-400/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(217,119,6,0.35)] transition-all duration-200 hover:scale-105">
            <svg
              className="w-6 h-6 text-amber-300 drop-shadow-[0_2px_8px_rgba(217,119,6,0.6)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 5l7 7-7 7" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(217,119,6,0.4)]">
              FixGo
            </span>
            <span className="block text-[10px] tracking-widest uppercase font-semibold text-amber-400/80">
              Smart Home Services
            </span>
          </div>
        </div>

        {/* Tagline Badge: "Nền tảng kết nối thợ chuyên nghiệp #1" */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 backdrop-blur-md text-[11px] font-medium text-slate-300 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Nền tảng kết nối thợ chuyên nghiệp #1</span>
        </div>
      </div>

      {/* 5. Center Hero Branding: Slogan & Sub-slogan */}
      <div className="relative z-10 my-auto py-6 sm:py-8 max-w-lg space-y-3">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug uppercase text-white drop-shadow-sm">
          KẾT NỐI DỊCH VỤ – <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_2px_16px_rgba(217,119,6,0.35)]">
            NÂNG TẦM CUỘC SỐNG
          </span>
        </h2>

        <p className="text-sm text-slate-300 font-normal leading-relaxed max-w-md">
          Giải pháp công nghệ kết nối khách hàng với các đối tác thợ lành nghề nhanh chóng, minh bạch và an tâm tuyệt đối cho mọi gia đình.
        </p>
      </div>

      {/* 6. Footer Area: Highlights & Service Icons (Opacity 60%) */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-400/80">
        <div>Đồng hành cùng hàng ngàn khách hàng & đối tác thợ</div>

        <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity duration-200">
          <div
            className="w-8 h-8 rounded-lg bg-slate-800/80 border border-amber-500/30 flex items-center justify-center text-amber-300/90 shadow-sm"
            title="Cài đặt hệ thống"
          >
            <Settings className="w-4 h-4 animate-spin-slow" />
          </div>
          <div
            className="w-8 h-8 rounded-lg bg-slate-800/80 border border-amber-500/30 flex items-center justify-center text-amber-300/90 shadow-sm"
            title="Công cụ dịch vụ"
          >
            <Wrench className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

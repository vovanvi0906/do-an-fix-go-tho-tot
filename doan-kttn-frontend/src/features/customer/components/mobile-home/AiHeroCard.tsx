/**
 * @file AiHeroCard.tsx
 * @description Hero Card tính năng AI Scan & Chẩn đoán sự cố hình ảnh thông minh FixGo AI.
 */

import React from 'react';
import { Camera, Sparkles, ArrowRight, ScanLine } from 'lucide-react';

interface AiHeroCardProps {
  onScanClick: () => void;
}

/**
 * Component `AiHeroCard`
 */
export default function AiHeroCard({ onScanClick }: AiHeroCardProps) {
  return (
    <div className="relative rounded-3xl p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-lg shadow-blue-500/20 border border-white/20 overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-6 -top-6 w-28 h-28 bg-indigo-300/15 rounded-full blur-xl pointer-events-none" />
      <div className="absolute right-4 top-4 opacity-10 pointer-events-none">
        <ScanLine className="w-24 h-24 text-white" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 space-y-3">
        {/* Top: Glowing "AI Scan" Badge */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-bold text-sky-200 tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>AI SCAN 2.0</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>

          <span className="text-[11px] font-medium text-sky-200/90 bg-black/20 px-2.5 py-0.5 rounded-full">
            Miễn phí
          </span>
        </div>

        {/* Heading & Description */}
        <div className="pr-4">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            Nhà bạn gặp sự cố?
          </h3>
          <p className="text-xs text-sky-100/90 mt-1 font-normal leading-relaxed">
            Chụp ảnh vị trí hỏng hóc để AI tự động nhận diện nguyên nhân & báo giá tức thì.
          </p>
        </div>

        {/* Action Button: White pill with blue text */}
        <div className="pt-1 flex items-center gap-3">
          <button
            type="button"
            onClick={onScanClick}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white text-blue-600 font-bold text-xs shadow-md shadow-black/10 hover:bg-sky-50 active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Chụp ảnh ngay</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
          </button>

          <span className="text-[11px] text-sky-200/80 italic">
            Xử lý trong ~2s
          </span>
        </div>
      </div>
    </div>
  );
}

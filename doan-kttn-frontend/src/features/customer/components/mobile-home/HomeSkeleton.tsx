/**
 * @file HomeSkeleton.tsx
 * @description Loading skeleton shimmer state theo chuẩn Linear / Vercel style.
 * Tuyệt đối không dùng spinner xoay tròn, hiển thị khung xương mượt mà chống giật bố cục.
 */

import React from 'react';

/**
 * Component `HomeSkeleton`
 * Khung tải shimmer cho toàn bộ bố cục trang chủ mobile
 */
export default function HomeSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-slate-50 pb-28 text-slate-900 font-sans overflow-hidden">
      {/* 1. Header & Search Skeleton */}
      <div className="bg-gradient-to-b from-sky-400/50 via-sky-300/30 to-sky-100/20 pb-6 pt-8 px-4 rounded-b-[2.5rem] space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 bg-white/70 rounded-full animate-pulse" />
            <div className="h-5 w-36 bg-white/90 rounded-lg animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-20 bg-black/20 rounded-full animate-pulse" />
            <div className="h-9 w-9 bg-white/70 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="h-12 w-full bg-white rounded-full shadow-sm animate-pulse" />
      </div>

      {/* Main Content Skeletons */}
      <div className="p-4 space-y-6">
        {/* 2. AI Hero Card Skeleton */}
        <div className="h-36 w-full rounded-3xl bg-slate-200/70 animate-pulse p-5 relative overflow-hidden" />

        {/* 3. Worker Map Card Skeleton */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-slate-200 rounded-md animate-pulse" />
            <div className="h-3 w-16 bg-slate-200 rounded-md animate-pulse" />
          </div>
          <div className="h-44 w-full rounded-3xl bg-slate-200/80 animate-pulse relative" />
        </div>

        {/* 4. Category Grid (4x2 = 8 items) */}
        <div className="space-y-2">
          <div className="h-4 w-36 bg-slate-200 rounded-md animate-pulse" />
          <div className="grid grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-1">
                <div className="w-14 h-14 rounded-2xl bg-slate-200/80 animate-pulse shadow-sm" />
                <div className="h-3 w-11 bg-slate-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* 5. Popular Services Carousel Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 bg-slate-200 rounded-md animate-pulse" />
            <div className="h-3 w-16 bg-slate-200 rounded-md animate-pulse" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-48 flex-shrink-0 h-60 rounded-2xl bg-slate-200/70 animate-pulse p-3 space-y-2"
              >
                <div className="w-full h-28 bg-slate-300/60 rounded-xl" />
                <div className="h-4 w-3/4 bg-slate-300/60 rounded" />
                <div className="h-3 w-1/2 bg-slate-300/50 rounded" />
                <div className="h-5 w-20 bg-slate-300/70 rounded-md mt-2" />
              </div>
            ))}
          </div>
        </div>

        {/* 6. Vouchers Skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded-md animate-pulse" />
          <div className="space-y-2.5">
            <div className="h-24 w-full rounded-2xl bg-slate-200/70 animate-pulse" />
            <div className="h-24 w-full rounded-2xl bg-slate-200/70 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

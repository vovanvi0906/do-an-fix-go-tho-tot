/**
 * @file WorkerMapCard.tsx
 * @description Card preview bản đồ khu vực làm việc hiển thị các Pin thợ đang hoạt động xung quanh người dùng.
 */

import React, { useState } from 'react';
import { MapPin, Navigation, Users, Star, ArrowUpRight } from 'lucide-react';
import type { WorkerNearbyDTO } from '../../types/home.types';

interface WorkerMapCardProps {
  workers: WorkerNearbyDTO[];
  userLocationName?: string;
  onOpenFullMap?: () => void;
  onSelectWorker?: (worker: WorkerNearbyDTO) => void;
}

/**
 * Component `WorkerMapCard`
 */
export default function WorkerMapCard({
  workers,
  userLocationName = 'Bến Nghé, Quận 1, TP.HCM',
  onOpenFullMap,
  onSelectWorker,
}: WorkerMapCardProps) {
  const [activeWorkerId, setActiveWorkerId] = useState<string | null>(workers[0]?.id || null);

  const activeWorker = workers.find((w) => w.id === activeWorkerId) || workers[0];

  return (
    <section className="space-y-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span>Khu vực làm việc</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              {workers.length} Thợ sẵn sàng
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Xung quanh {userLocationName}</p>
        </div>

        {onOpenFullMap && (
          <button
            type="button"
            onClick={onOpenFullMap}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-0.5 active:scale-95 transition-all"
          >
            Mở rộng
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Map Preview Container */}
      <div className="rounded-3xl border border-slate-200/80 overflow-hidden relative shadow-sm h-48 bg-slate-100">
        {/* Stylized Vector Map Background (Streets & Water Grids) */}
        <div className="absolute inset-0 bg-[#EBF0F5] overflow-hidden">
          {/* River shape */}
          <div className="absolute -top-10 left-1/3 w-28 h-64 bg-sky-200/60 rounded-full rotate-45 blur-xs pointer-events-none" />
          
          {/* Main roads grid */}
          <div className="absolute top-1/4 inset-x-0 h-4 bg-white/90 border-y border-slate-300/40 pointer-events-none" />
          <div className="absolute top-2/3 inset-x-0 h-5 bg-white/90 border-y border-slate-300/40 pointer-events-none" />
          <div className="absolute left-1/4 inset-y-0 w-4 bg-white/90 border-x border-slate-300/40 pointer-events-none" />
          <div className="absolute left-2/3 inset-y-0 w-5 bg-white/90 border-x border-slate-300/40 pointer-events-none" />
          
          {/* Secondary streets */}
          <div className="absolute top-1/2 inset-x-0 h-2 bg-slate-200/80 pointer-events-none" />
          <div className="absolute left-1/2 inset-y-0 w-2 bg-slate-200/80 pointer-events-none" />
        </div>

        {/* Center User Location Marker with Pulsing Radar Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
          {/* Radar Waves */}
          <div className="absolute w-20 h-20 rounded-full bg-sky-500/15 animate-ping pointer-events-none" />
          <div className="absolute w-12 h-12 rounded-full bg-sky-500/20 pointer-events-none" />
          
          {/* User Location Dot */}
          <div className="relative z-10 w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-md ring-2 ring-white">
            <Navigation className="w-3 h-3 rotate-45 fill-white" />
          </div>
          
          {/* User Label */}
          <div className="absolute top-7 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-bold text-white shadow-sm whitespace-nowrap">
            Vị trí của bạn
          </div>
        </div>

        {/* Dynamic Worker Pins */}
        {workers.map((worker, index) => {
          // Calculate relative offsets for visual simulation
          const positions = [
            { top: '22%', left: '26%' }, // Worker 1 (top-left)
            { top: '28%', left: '74%' }, // Worker 2 (top-right)
            { top: '72%', left: '22%' }, // Worker 3 (bottom-left)
            { top: '75%', left: '76%' }, // Worker 4 (bottom-right)
          ];
          const pos = positions[index % positions.length];
          const isSelected = activeWorker?.id === worker.id;

          return (
            <div
              key={worker.id}
              style={{ top: pos.top, left: pos.left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <button
                type="button"
                onClick={() => {
                  setActiveWorkerId(worker.id);
                  onSelectWorker?.(worker);
                }}
                className={`group relative flex items-center gap-1.5 p-1 rounded-full transition-all focus:outline-none ${
                  isSelected
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/25 shadow-lg scale-110 z-30'
                    : 'bg-white text-slate-800 shadow-md ring-1 ring-slate-900/10 hover:scale-105'
                }`}
                title={worker.fullName}
              >
                <img
                  src={worker.avatarUrl}
                  alt={worker.fullName}
                  className="w-6 h-6 rounded-full object-cover border border-white"
                />
                <div className="pr-1.5 flex items-center gap-0.5 text-[10px] font-bold">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>{worker.rating.toFixed(1)}</span>
                </div>
              </button>
            </div>
          );
        })}

        {/* Selected Worker Info Badge (Top-left floating chip) */}
        {activeWorker && (
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm max-w-[210px]">
            <img
              src={activeWorker.avatarUrl}
              alt={activeWorker.fullName}
              className="w-5 h-5 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-900 truncate">
                {activeWorker.fullName}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {activeWorker.specialty} • Cách {activeWorker.distanceKm}km
              </p>
            </div>
          </div>
        )}

        {/* Floating Pill Button: "Xem bản đồ chi tiết" at bottom center */}
        <div className="absolute bottom-2.5 inset-x-0 flex justify-center z-20">
          <button
            type="button"
            onClick={onOpenFullMap}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 text-slate-800 text-xs font-semibold shadow-md hover:bg-white hover:border-sky-300 active:scale-95 transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>Xem bản đồ chi tiết</span>
          </button>
        </div>
      </div>
    </section>
  );
}

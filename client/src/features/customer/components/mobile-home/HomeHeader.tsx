/**
 * @file HomeHeader.tsx
 * @description Component Header và Thanh tìm kiếm chuẩn Mobile Web App FixGo Pro.
 * Gradient bầu trời, chọn nhanh địa điểm, điểm thưởng VIP, chuông báo có ping và Search Pill trắng tinh tế.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  Bell,
  Sparkles,
  MapPin,
  X,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import type { UserProfileDTO } from '../../types/home.types';

interface HomeHeaderProps {
  user: UserProfileDTO;
  searchQuery: string;
  selectedDistrict: string;
  unreadNotificationsCount?: number;
  onSearchChange: (q: string) => void;
  onDistrictChange: (district: string) => void;
  onOpenNotifications?: () => void;
  onOpenRewards?: () => void;
}

const DISTRICT_OPTIONS = [
  'Quận 1, TP.HCM',
  'Quận 3, TP.HCM',
  'Quận Bình Thạnh, TP.HCM',
  'Quận Phú Nhuận, TP.HCM',
  'Quận 7, TP.HCM',
  'TP. Thủ Đức, TP.HCM',
  'Quận Tân Bình, TP.HCM',
  'Quận 10, TP.HCM',
];

/**
 * Component `HomeHeader`
 */
export default function HomeHeader({
  user,
  searchQuery,
  selectedDistrict,
  unreadNotificationsCount = 3,
  onSearchChange,
  onDistrictChange,
  onOpenNotifications,
  onOpenRewards,
}: HomeHeaderProps) {
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDistrictDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-gradient-to-b from-sky-500 via-sky-400 to-sky-100/30 pb-6 pt-8 px-4 rounded-b-[2.5rem] shadow-sm relative z-30">
      {/* ── 1. Top Row: Greeting, District Selector & Right Actions ──────── */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {/* Left: Lời chào & Menu chọn nhanh khu vực */}
        <div className="relative flex-1 min-w-0" ref={dropdownRef}>
          <div className="flex items-center gap-1.5 text-sky-50 text-xs font-medium">
            <span>Xin chào, {user.fullName ? user.fullName.split(' ').slice(-1)[0] : 'bạn'}</span>
            <span className="text-sm">👋</span>
          </div>

          <button
            type="button"
            onClick={() => setIsDistrictDropdownOpen((prev) => !prev)}
            className="group flex items-center gap-1 mt-0.5 text-white font-bold text-sm hover:text-sky-100 transition-colors focus:outline-none"
            aria-expanded={isDistrictDropdownOpen}
            aria-haspopup="listbox"
          >
            <MapPin className="w-3.5 h-3.5 text-white/90 shrink-0" />
            <span className="truncate max-w-[140px] text-left">{selectedDistrict}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${
                isDistrictDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Accessible District Dropdown Menu */}
          {isDistrictDropdownOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-56 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl shadow-sky-950/10 p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150"
              role="listbox"
            >
              <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Chọn khu vực làm việc
              </div>
              <div className="space-y-0.5 max-h-56 overflow-y-auto">
                {DISTRICT_OPTIONS.map((district) => {
                  const isSelected = district === selectedDistrict;
                  return (
                    <button
                      key={district}
                      type="button"
                      onClick={() => {
                        onDistrictChange(district);
                        setIsDistrictDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between text-xs px-2.5 py-2 rounded-xl text-left font-medium transition-colors ${
                        isSelected
                          ? 'bg-sky-50 text-sky-600 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100/80'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="truncate">{district}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Pill Điểm thưởng đen sang trọng + Chuông thông báo Ping */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Pill Điểm thưởng */}
          <button
            type="button"
            onClick={onOpenRewards}
            className="flex items-center gap-1.5 bg-black/35 backdrop-blur-md text-amber-400 text-xs px-3 py-1 rounded-full font-bold border border-white/10 hover:bg-black/45 active:scale-95 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{user.rewardPoints?.toLocaleString('vi-VN') || 0}đ</span>
          </button>

          {/* Chuông thông báo kèm Ping dot */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all shadow-sm"
            aria-label="Thông báo"
          >
            <Bell className="w-4 h-4 text-white" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 border border-white" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── 2. Search Bar: Input Pill trắng tinh khôi bóng mờ nhẹ ──────── */}
      <div className="relative mt-2">
        <div className="flex items-center w-full h-12 px-4 rounded-full bg-white text-slate-800 shadow-lg shadow-sky-900/5 border border-white/80 ring-1 ring-black/5 transition-all focus-within:ring-2 focus-within:ring-sky-400/50">
          <Search className="w-4 h-4 text-sky-500 shrink-0 mr-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Gần 100 dịch vụ Quý khách đang cần"
            className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200/80 text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 hover:text-sky-600 cursor-pointer" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

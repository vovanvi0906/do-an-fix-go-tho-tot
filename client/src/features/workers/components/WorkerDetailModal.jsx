import React from 'react';
import {
  X,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Star,
  ShieldCheck,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Wrench,
} from 'lucide-react';
import { formatDate } from '../../../utils/formatDate';

export default function WorkerDetailModal({ isOpen, onClose, worker }) {
  if (!isOpen || !worker) return null;

  const status = worker.approvalStatus || 'PENDING';
  const isApproved = status === 'APPROVED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: Avatar, Name & Status */}
        <div className="flex items-start gap-4 pr-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white font-black text-xl uppercase shadow-md shadow-amber-600/20 shrink-0">
            {worker.fullName ? worker.fullName.charAt(0) : 'W'}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {worker.fullName || 'Chưa đặt tên'}
              </h2>
              {isApproved ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>ĐÃ DUYỆT</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300">
                  <Clock className="w-3 h-3" />
                  <span>CHỜ PHÊ DUYỆT</span>
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-slate-400">
              Worker Profile ID: <span className="text-slate-600 dark:text-slate-300">{worker.id}</span>
            </p>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Email */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Email liên hệ</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {worker.user?.email || 'N/A'}
              </span>
            </div>
          </div>

          {/* Phone */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Số điện thoại</span>
              <span className="font-semibold font-mono text-slate-800 dark:text-slate-200 truncate block">
                {worker.user?.phone || 'Chưa cập nhật'}
              </span>
            </div>
          </div>

          {/* Location / Area */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Khu vực hoạt động</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {worker.currentAddress || 'TP. Hồ Chí Minh'}
              </span>
            </div>
          </div>

          {/* Online State */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${worker.isOnline ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Trạng thái sóng</span>
              <span className={`font-semibold ${worker.isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                {worker.isOnline ? 'Trực tuyến (Bán kính 5km)' : 'Ngoại tuyến'}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Đánh giá sao</span>
            <div className="text-lg font-bold font-mono text-amber-500 flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-4 h-4 fill-amber-500" />
              <span>{worker.ratingAvg ? Number(worker.ratingAvg).toFixed(1) : '5.0'}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Đơn hoàn thành</span>
            <div className="text-lg font-bold font-mono text-blue-500 mt-0.5">
              {worker.totalJobs ?? 0}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Ngày gia nhập</span>
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
              {worker.createdAt ? formatDate(worker.createdAt) : 'Mới tạo'}
            </div>
          </div>
        </div>

        {/* Services & Skills */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Dịch vụ & Kỹ năng đăng ký
          </span>
          <div className="flex flex-wrap gap-1.5">
            {worker.workerServices && worker.workerServices.length > 0 ? (
              worker.workerServices.map((ws, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center gap-1"
                >
                  <Wrench className="w-3 h-3" />
                  <span>{ws.service?.name}</span>
                </span>
              ))
            ) : worker.skills && worker.skills.length > 0 ? (
              worker.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center gap-1"
                >
                  <Wrench className="w-3 h-3" />
                  <span>{skill}</span>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">Chưa đăng ký dịch vụ chuyên môn.</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition-all hover:opacity-90 cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}

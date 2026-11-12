import React from 'react';
import { Calendar, Clock, MapPin, Plus, CheckCircle2 } from 'lucide-react';

export default function ScheduledBookingsView({ setActiveTab }) {
  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Lịch Hẹn Đặt Trước (Scheduled Bookings)</h1>
          <p className="text-xs text-slate-400 mt-1">Quản lý các lịch hẹn sửa chữa định kỳ hoặc hẹn giờ cố định trong tuần.</p>
        </div>

        <button
          onClick={() => setActiveTab('services')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Đặt lịch hẹn mới</span>
        </button>
      </div>

      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
          <Calendar className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white">Bạn chưa có lịch hẹn nào sắp tới</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Bạn có thể chủ động đặt trước lịch vệ sinh máy lạnh, bảo dưỡng bình nóng lạnh hoặc dọn nhà theo khung giờ rảnh của bạn.
        </p>
      </div>
    </div>
  );
}

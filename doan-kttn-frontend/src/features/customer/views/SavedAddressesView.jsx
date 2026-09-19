import React, { useState } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, Home, Building2, Heart } from 'lucide-react';

export default function SavedAddressesView() {
  const [addresses, setAddresses] = useState([
    { id: 1, title: 'Nhà riêng', icon: Home, street: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM', isDefault: true },
    { id: 2, title: 'Văn phòng công ty', icon: Building2, street: 'Tầng 12, Tòa nhà Bitexco, Quận 1, TP.HCM', isDefault: false },
    { id: 3, title: 'Nhà bố mẹ', icon: Heart, street: '125 Nguyễn Trãi, Phường 2, Quận 5, TP.HCM', isDefault: false },
  ]);

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sổ Địa Chỉ Giao Dịch Đã Lưu</h1>
          <p className="text-xs text-slate-400 mt-1">Lưu sẵn các địa điểm quen thuộc để đặt thợ nhanh chỉ trong 1 chạm.</p>
        </div>

        <button
          onClick={() => alert('Thêm địa chỉ mới')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm địa chỉ mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => {
          const IconComp = addr.icon || MapPin;
          return (
            <div
              key={addr.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-4 shadow-xl transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white">{addr.title}</h3>
                  </div>

                  {addr.isDefault && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Mặc định
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed pl-10">{addr.street}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => alert('Đặt làm mặc định')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Đặt mặc định
                </button>
                <button
                  onClick={() => setAddresses(addresses.filter(a => a.id !== addr.id))}
                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

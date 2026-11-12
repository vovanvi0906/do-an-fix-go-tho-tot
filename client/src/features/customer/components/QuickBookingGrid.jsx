import React, { useState, useEffect } from 'react';
import {
  Zap,
  Droplets,
  Wind,
  Sparkles,
  Key,
  Wrench,
  Trees,
  Hammer,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import BookingModal from './BookingModal';
import customerOrderService from '../services/customerOrderService';

/**
 * Hàm phân giải ngữ nghĩa: Gán chính xác Icon, dải màu gradient và mô tả tiêu chuẩn theo tên dịch vụ.
 * Giải quyết triệt để lỗi Data Mismatch (ví dụ: Dọn dẹp nhà cửa phải đi kèm icon/mô tả vệ sinh, Sửa điện phải đi kèm aptomat/chập cháy).
 *
 * @param {string} name - Tên dịch vụ
 * @param {string} [customDesc] - Mô tả hiện có từ database
 */
function getServiceVisualMeta(name = '', customDesc = '') {
  const text = (name + ' ' + customDesc).toLowerCase();

  if (text.includes('điện') && !text.includes('lạnh')) {
    return {
      icon: Zap,
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      iconColor: 'text-amber-400',
      borderColor: 'hover:border-amber-500/50',
      defaultDesc: 'Xử lý chập cháy điện, thay aptomat, sửa ổ cắm & quạt trần',
      popular: true,
    };
  }

  if (text.includes('nước') || text.includes('ống') || text.includes('vòi') || text.includes('bồn cầu')) {
    return {
      icon: Droplets,
      gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
      iconColor: 'text-cyan-400',
      borderColor: 'hover:border-cyan-500/50',
      defaultDesc: 'Khắc phục rò rỉ đường ống, thay vòi sen, thông tắc lavabo',
      popular: true,
    };
  }

  if (text.includes('lạnh') || text.includes('điều hòa') || text.includes('máy giặt')) {
    return {
      icon: Wind,
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      iconColor: 'text-emerald-400',
      borderColor: 'hover:border-emerald-500/50',
      defaultDesc: 'Bảo dưỡng, vệ sinh máy lạnh định kỳ, nạp gas R32/R410A',
      popular: true,
    };
  }

  if (text.includes('dọn') || text.includes('vệ sinh') || text.includes('nhà cửa') || text.includes('lau')) {
    return {
      icon: Sparkles,
      gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
      iconColor: 'text-purple-400',
      borderColor: 'hover:border-purple-500/50',
      defaultDesc: 'Dọn dẹp nhà ở theo giờ, lau chùi khử khuẩn & tổng vệ sinh',
      popular: false,
    };
  }

  if (text.includes('khóa') || text.includes('cửa')) {
    return {
      icon: Key,
      gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
      iconColor: 'text-rose-400',
      borderColor: 'hover:border-rose-500/50',
      defaultDesc: 'Mở khóa khẩn cấp 24/7, thay ổ khóa cơ & lắp khóa vân tay',
      popular: false,
    };
  }

  if (text.includes('vườn') || text.includes('cây') || text.includes('cỏ')) {
    return {
      icon: Trees,
      gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
      iconColor: 'text-emerald-400',
      borderColor: 'hover:border-emerald-500/50',
      defaultDesc: 'Cắt tỉa cây cảnh, dọn cỏ & chăm sóc sân vườn gia đình',
      popular: false,
    };
  }

  if (text.includes('nội thất') || text.includes('lắp đặt') || text.includes('kệ') || text.includes('bàn ghế')) {
    return {
      icon: Hammer,
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      iconColor: 'text-amber-400',
      borderColor: 'hover:border-amber-500/50',
      defaultDesc: 'Lắp ráp kệ treo tường, tủ giường, ráp bàn ghế hoàn chỉnh',
      popular: false,
    };
  }

  return {
    icon: Wrench,
    gradient: 'from-indigo-500/20 via-blue-500/10 to-transparent',
    iconColor: 'text-indigo-400',
    borderColor: 'hover:border-indigo-500/50',
    defaultDesc: 'Kiểm tra, bảo trì và khắc phục sự cố thiết bị gia đình',
    popular: false,
  };
}

const DEFAULT_CATEGORIES = [
  {
    id: 'srv-electric-01',
    name: 'Sửa điện gia dụng',
    desc: 'Chập điện, hỏng aptomat, ổ cắm & quạt trần',
    basePrice: 150000,
    icon: Zap,
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    iconColor: 'text-amber-400',
    borderColor: 'hover:border-amber-500/50',
    popular: true,
  },
  {
    id: 'srv-plumbing-02',
    name: 'Sửa ống nước & WC',
    desc: 'Rò rỉ ống, thay vòi sen, thông tắc lavabo',
    basePrice: 180000,
    icon: Droplets,
    gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    iconColor: 'text-cyan-400',
    borderColor: 'hover:border-cyan-500/50',
    popular: true,
  },
  {
    id: 'srv-aircon-03',
    name: 'Vệ sinh & Nạp gas máy lạnh',
    desc: 'Rửa máy lạnh, nạp gas R32/R410A, xử lý chảy nước',
    basePrice: 250000,
    icon: Wind,
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    iconColor: 'text-emerald-400',
    borderColor: 'hover:border-emerald-500/50',
    popular: true,
  },
  {
    id: 'srv-cleaning-04',
    name: 'Dọn dẹp nhà theo giờ',
    desc: 'Lau dọn nhà ở, khử khuẩn & tổng vệ sinh',
    basePrice: 120000,
    icon: Sparkles,
    gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
    iconColor: 'text-purple-400',
    borderColor: 'hover:border-purple-500/50',
    popular: false,
  },
  {
    id: 'srv-lock-05',
    name: 'Sửa khóa & Mở khóa',
    desc: 'Mở khóa khẩn cấp 24/7, thay ổ khóa vân tay',
    basePrice: 200000,
    icon: Key,
    gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
    iconColor: 'text-rose-400',
    borderColor: 'hover:border-rose-500/50',
    popular: false,
  },
  {
    id: 'srv-mechanic-06',
    name: 'Cơ khí & Sửa chữa thiết bị',
    desc: 'Hàn cửa sắt, sửa bản lề, bảo dưỡng thiết bị gia đình',
    basePrice: 250000,
    icon: Wrench,
    gradient: 'from-indigo-500/20 via-blue-500/10 to-transparent',
    iconColor: 'text-indigo-400',
    borderColor: 'hover:border-indigo-500/50',
    popular: false,
  },
];

/**
 * QuickBookingGrid Component
 * Lưới đặt dịch vụ nhanh với tính năng mapping chính xác tên dịch vụ, icon và mô tả
 */
export default function QuickBookingGrid({ onOrderCreated }) {
  const [services, setServices] = useState(DEFAULT_CATEGORIES);
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadBackendServices = async () => {
      try {
        const backendServices = await customerOrderService.getServices();
        if (Array.isArray(backendServices) && backendServices.length > 0) {
          // Ánh xạ ngữ nghĩa chính xác 100% giữa Tên dịch vụ - Icon - Mô tả
          const mapped = backendServices.slice(0, 6).map((bs) => {
            const meta = getServiceVisualMeta(bs.name, bs.description);
            return {
              ...bs,
              desc: bs.description || meta.defaultDesc,
              icon: meta.icon,
              gradient: meta.gradient,
              iconColor: meta.iconColor,
              borderColor: meta.borderColor,
              popular: meta.popular,
            };
          });
          setServices(mapped);
        }
      } catch (e) {
        console.warn('Using default client services due to load failure:', e.message);
      }
    };
    loadBackendServices();
  }, []);

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>⚡ Đặt Dịch Vụ Nhanh (Quick Booking)</span>
          </h2>
          <p className="text-xs text-slate-300">Chọn gói dịch vụ để thợ có mặt xử lý trong 15-30 phút</p>
        </div>
        <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
          {services.length} Dịch vụ sẵn sàng
        </span>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {services.map((item) => {
          const IconComponent = item.icon || Wrench;
          return (
            <div
              key={item.id}
              onClick={() => handleOpenBooking(item)}
              className={`group relative overflow-hidden rounded-2xl bg-slate-900/90 p-4 border border-slate-800/80 ${item.borderColor} shadow-sm hover:border-slate-700 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between`}
            >
              {/* Card gradient glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-30 group-hover:opacity-70 transition-opacity`} />

              <div className="relative z-10 space-y-3">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center ${item.iconColor} group-hover:scale-105 transition-transform`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {item.popular && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      HOT
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs mt-3">
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {Number(item.basePrice || 150000).toLocaleString('vi-VN')} đ
                </span>
                <span className="flex items-center text-xs text-slate-400 group-hover:text-white transition-colors">
                  <span>Đặt ngay</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Form Modal */}
      <BookingModal
        service={selectedService}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOrderCreated={(newOrder) => {
          if (onOrderCreated) onOrderCreated(newOrder);
        }}
      />
    </section>
  );
}

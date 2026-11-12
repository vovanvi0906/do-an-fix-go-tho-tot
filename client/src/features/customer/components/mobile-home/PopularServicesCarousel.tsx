/**
 * @file PopularServicesCarousel.tsx
 * @description Carousel dịch vụ phổ biến vuốt ngang mượt mà phong cách Linear/Vercel.
 * Hình ảnh thực tế, giá in đậm màu xanh dương, đánh giá sao vàng và nút Đặt ngay.
 */

import React from 'react';
import { Star, Clock, ArrowRight, Plus } from 'lucide-react';
import type { PopularServiceDTO } from '../../types/home.types';

interface PopularServicesCarouselProps {
  services: PopularServiceDTO[];
  onBookService: (service: PopularServiceDTO) => void;
  onViewAll?: () => void;
}

/**
 * Component `PopularServicesCarousel`
 */
export default function PopularServicesCarousel({
  services,
  onBookService,
  onViewAll,
}: PopularServicesCarouselProps) {
  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Dịch vụ phổ biến</h3>
          <p className="text-xs text-slate-500">Được khách hàng đặt nhiều nhất tuần qua</p>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-0.5 active:scale-95 transition-all"
          >
            Tất cả
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Carousel */}
      <div className="-mx-4 px-4 flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 pb-2 pt-1">
        {services.map((service) => (
          <div
            key={service.id}
            className="w-52 shrink-0 snap-start rounded-3xl bg-white border border-slate-200/80 p-3 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between"
          >
            {/* Image & Badges */}
            <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-slate-100 mb-2.5">
              <img
                src={service.imageUrl}
                alt={service.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />

              {/* Category Tag Badge */}
              {service.tag && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-bold text-white shadow-sm">
                  {service.tag}
                </span>
              )}

              {/* Duration Chip */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-semibold text-slate-700">
                <Clock className="w-3 h-3 text-sky-600" />
                <span>{service.durationMin} phút</span>
              </div>
            </div>

            {/* Service Information */}
            <div className="space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                {/* Rating & Reviews */}
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{service.rating.toFixed(1)}</span>
                  <span className="text-slate-400">({service.reviewsCount})</span>
                  <span className="mx-1 text-slate-300">•</span>
                  <span className="text-slate-500 font-normal truncate max-w-[70px]">
                    {service.categoryName}
                  </span>
                </div>

                {/* Service Name */}
                <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight mt-1">
                  {service.name}
                </h4>
              </div>

              {/* Price & Action Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-normal">Từ</span>
                  <div className="text-sm font-extrabold text-blue-600">
                    {service.basePrice.toLocaleString('vi-VN')}
                    <span className="text-[10px] font-semibold text-slate-500">đ/{service.unit}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onBookService(service)}
                  className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 active:scale-90 transition-all shadow-sm shadow-sky-500/20"
                  aria-label={`Đặt dịch vụ ${service.name}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

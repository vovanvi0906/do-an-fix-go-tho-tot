import React from 'react';
import { Wrench, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { ServiceItem } from '../../../types/service';

interface CategoryServiceCardProps {
  service: ServiceItem;
}

export default function CategoryServiceCard({ service }: CategoryServiceCardProps) {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
          <Wrench className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {service.name}
            </h4>
            {service.isActive ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Hoạt động</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400">
                <XCircle className="w-3 h-3" />
                <span>Tạm ngưng</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
            {service.description || 'Không có mô tả chi tiết'}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
          {Number(service.basePrice).toLocaleString('vi-VN')} đ
          <span className="text-[10px] text-slate-400 font-normal">
            /{service.unit || 'lần'}
          </span>
        </div>
        <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-0.5">
          <Clock className="w-3 h-3" />
          <span>{service.estimatedDurationMin || 60}p</span>
        </div>
      </div>
    </div>
  );
}

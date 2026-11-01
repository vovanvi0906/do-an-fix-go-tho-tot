import React from 'react';
import { Wrench, Plus, Power, Edit2, Trash2 } from 'lucide-react';
import type { ServiceItem } from '../../../types/service';

interface ServiceColumnProps {
  services: ServiceItem[];
  selectedService: ServiceItem | null;
  onSelect: (svc: ServiceItem) => void;
  onAdd: () => void;
  onEdit: (svc: ServiceItem) => void;
  onToggle: (svc: ServiceItem) => void;
  onDelete: (svc: ServiceItem) => void;
  targetName?: string;
}

export const ServiceColumn: React.FC<ServiceColumnProps> = ({
  services,
  selectedService,
  onSelect,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
  targetName,
}) => {
  return (
    <div className="flex-1 flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0b0f19]/70 overflow-hidden shadow-2xs min-h-[460px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            Dịch vụ ({services.length}) {targetName ? `- ${targetName}` : ''}
          </h3>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-xs"
          title="Thêm Dịch Vụ Mới"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[420px] scrollbar-thin">
        {services.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Chưa có dịch vụ nào thuộc đối tượng này
          </div>
        ) : (
          services.map((svc) => {
            const isSelected = selectedService?.id === svc.id;
            return (
              <div
                key={svc.id}
                onClick={() => onSelect(svc)}
                className={`group px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-600/10 dark:bg-emerald-500/15 border-emerald-500/50 shadow-sm'
                    : 'bg-white dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <span className={`text-xs font-bold truncate block ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {svc.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5 text-[10.5px]">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {new Intl.NumberFormat('vi-VN').format(Number(svc.basePrice))} đ
                    </span>
                    <span className="text-slate-400">/ {svc.unit || 'lần'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    svc.isActive ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {svc.isActive ? 'Hoạt động' : 'Tắt'}
                  </span>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onToggle(svc); }}
                      className="p-1 rounded text-slate-400 hover:text-amber-500 cursor-pointer"
                      title="Bật/Tắt"
                    >
                      <Power className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onEdit(svc); }}
                      className="p-1 rounded text-slate-400 hover:text-emerald-500 cursor-pointer"
                      title="Sửa"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDelete(svc); }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ServiceColumn;


/**
 * @file TicketVouchers.tsx
 * @description Thẻ ưu đãi phong cách vé răng cưa khoét góc hai bên mép (Ticket Notch)
 * Sử dụng kỹ thuật pseudo-classes Tailwind tạo vết khuyết tròn chuẩn xác không phụ thuộc SVG ngoài.
 */

import React from 'react';
import { Tag, Sparkles, Check, ArrowRight } from 'lucide-react';
import type { PromotionDTO } from '../../types/home.types';

interface TicketVouchersProps {
  promotions: PromotionDTO[];
  onClaimVoucher: (voucherId: string) => void;
  onOpenVoucherWallet?: () => void;
}

/**
 * Component `TicketVouchers`
 */
export default function TicketVouchers({
  promotions,
  onClaimVoucher,
  onOpenVoucherWallet,
}: TicketVouchersProps) {
  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-bold text-slate-900">Ưu đãi cho bạn</h3>
        </div>

        {onOpenVoucherWallet && (
          <button
            type="button"
            onClick={onOpenVoucherWallet}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-0.5 active:scale-95 transition-all"
          >
            Ví voucher
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* List of Ticket Notch Vouchers */}
      <div className="space-y-3">
        {promotions.map((promo) => {
          const isOrange = promo.theme === 'orange';

          return (
            <div
              key={promo.id}
              className={`relative rounded-3xl p-4 overflow-hidden border shadow-sm transition-all ${
                isOrange
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400/40 shadow-orange-500/15'
                  : 'bg-gradient-to-r from-blue-600 to-sky-500 text-white border-blue-400/40 shadow-blue-500/15'
              } before:absolute before:-left-3.5 before:top-1/2 before:-translate-y-1/2 before:w-7 before:h-7 before:bg-slate-50 before:rounded-full before:border-r before:border-slate-200/80 after:absolute after:-right-3.5 after:top-1/2 after:-translate-y-1/2 after:w-7 after:h-7 after:bg-slate-50 after:rounded-full after:border-l after:border-slate-200/80`}
            >
              {/* Internal Dashed Divider simulating ticket perforation */}
              <div className="flex items-center justify-between gap-3 px-2">
                {/* Left side: Voucher Discount info */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm text-[10px] font-bold text-amber-200 tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>MÃ: {promo.code}</span>
                  </div>

                  <h4 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                    {promo.title}
                  </h4>

                  <p className="text-[11px] text-white/90 truncate font-medium">
                    {promo.subtitle}
                  </p>

                  <p className="text-[10px] text-white/75 italic">{promo.expiryDateText}</p>
                </div>

                {/* Right side: Action Button */}
                <div className="shrink-0 flex flex-col items-end justify-center pl-3 border-l border-dashed border-white/40">
                  <button
                    type="button"
                    onClick={() => onClaimVoucher(promo.id)}
                    disabled={promo.isClaimed}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                      promo.isClaimed
                        ? 'bg-white/20 text-white cursor-default'
                        : isOrange
                        ? 'bg-white text-orange-600 hover:bg-orange-50 active:scale-90 shadow-black/10'
                        : 'bg-white text-blue-600 hover:bg-blue-50 active:scale-90 shadow-black/10'
                    }`}
                  >
                    {promo.isClaimed ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Đã lưu
                      </span>
                    ) : (
                      'Dùng ngay'
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

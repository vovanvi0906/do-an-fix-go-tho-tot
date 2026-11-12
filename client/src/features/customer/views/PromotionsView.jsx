import React, { useState } from 'react';
import { Gift, Copy, Check, Sparkles, Tag, ArrowRight } from 'lucide-react';

const VOUCHERS = [
  { id: 'FIXGO50', title: 'Giảm 50.000 đ cho đơn hàng đầu tiên', minOrder: 150000, expire: '30/09/2026', code: 'FIXGO50' },
  { id: 'DIENNUOC20', title: 'Giảm 20% Dịch vụ Sửa Điện Nước', minOrder: 200000, expire: '15/10/2026', code: 'DIENNUOC20' },
  { id: 'FREESHIP', title: 'Miễn phí công di chuyển thợ 5km', minOrder: 100000, expire: '31/12/2026', code: 'FREESHIP' },
];

export default function PromotionsView() {
  const [copiedCode, setCopiedCode] = useState('');

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight">Kho Voucher & Mã Giảm Giá Ưu Đãi</h1>
        <p className="text-xs text-slate-400 mt-1">
          Thu thập các mã ưu đãi độc quyền để tiết kiệm chi phí khi đặt dịch vụ sửa chữa gia đình FixGo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VOUCHERS.map((v) => (
          <div
            key={v.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 shadow-xl hover:border-amber-500/40 transition-all"
          >
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <Tag className="w-3 h-3" /> MÃ: {v.code}
              </span>
              <h3 className="text-sm font-bold text-white leading-tight">{v.title}</h3>
              <p className="text-[11px] text-slate-400">Đơn tối thiểu: {v.minOrder.toLocaleString('vi-VN')} đ • HSD: {v.expire}</p>
            </div>

            <button
              onClick={() => handleCopy(v.code)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedCode === v.code ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Đã sao chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

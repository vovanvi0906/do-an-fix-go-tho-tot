import React, { useState } from 'react';
import { Bell, CheckCircle2, Zap, Gift, ShieldAlert, Clock, Trash2 } from 'lucide-react';

const NOTIFICATIONS = [
  { id: 1, title: 'Đơn hàng #ORD-8862 đã được tiếp nhận', desc: 'Thợ Nguyễn Văn Hùng đã nhận đơn sửa điện âm tường và đang di chuyển.', time: '10 phút trước', type: 'order', isRead: false },
  { id: 2, title: 'Tặng bạn Voucher 50.000 đ', desc: 'Mã FIXGO50 đã được thêm vào kho voucher của bạn. Áp dụng cho đơn từ 150k.', time: '2 giờ trước', type: 'promo', isRead: false },
  { id: 3, title: 'Xác thực tài khoản thành công', desc: 'Hồ sơ khách hàng FixGo của bạn đã được xác thực email an toàn.', time: '1 ngày trước', type: 'system', isRead: true },
];

export default function NotificationsView() {
  const [list, setList] = useState(NOTIFICATIONS);

  const markAllAsRead = () => {
    setList(list.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Trung Tâm Thông Báo</h1>
          <p className="text-xs text-slate-400 mt-1">Cập nhật tin tức đơn hàng, biến động ví và chương trình khuyến mãi.</p>
        </div>

        <button
          onClick={markAllAsRead}
          className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
        >
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div className="space-y-3">
        {list.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
              item.isRead ? 'bg-slate-900/60 border-slate-800/80 opacity-75' : 'bg-slate-900 border-slate-700 shadow-lg'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.type === 'order'
                    ? 'bg-blue-500/15 text-blue-400'
                    : item.type === 'promo'
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                {item.type === 'order' ? <Zap className="w-5 h-5" /> : item.type === 'promo' ? <Gift className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white">{item.title}</h4>
                  {!item.isRead && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" /> {item.time}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

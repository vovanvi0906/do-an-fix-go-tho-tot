import React, { useState, useEffect } from 'react';
import { ClipboardList, Radio, Clock, CheckCircle2, UserCheck, Wrench, MapPin, RefreshCw, XCircle, Search } from 'lucide-react';
import customerOrderService from '../services/customerOrderService';

const FILTER_TABS = [
  { id: 'ALL', label: 'Tất cả đơn' },
  { id: 'SEARCHING', label: 'Đang tìm thợ' },
  { id: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { id: 'COMPLETED', label: 'Đã hoàn thành' },
  { id: 'CANCELLED', label: 'Đã hủy' },
];

export default function OrdersManagementView() {
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await customerOrderService.getMyOrders();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (e) {
      console.warn('Orders fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    let matchFilter = true;
    if (activeFilter === 'SEARCHING') matchFilter = o.status === 'SEARCHING';
    else if (activeFilter === 'IN_PROGRESS') matchFilter = ['ASSIGNED', 'WORKER_ARRIVING', 'ARRIVED', 'IN_PROGRESS'].includes(o.status);
    else if (activeFilter === 'COMPLETED') matchFilter = ['AWAITING_PAYMENT', 'COMPLETED'].includes(o.status);
    else if (activeFilter === 'CANCELLED') matchFilter = o.status === 'CANCELLED';

    const matchSearch =
      (o.service?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.pickupAddress || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Quản Lý Đơn Hàng & Lịch Sử Dịch Vụ</h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi trạng thái thợ di chuyển, lịch sử nghiệm thu và đánh giá chất lượng phục vụ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn hoặc dịch vụ..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={loadOrders}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span>Đang tải danh sách đơn hàng...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500 mx-auto">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-300">Không tìm thấy đơn hàng nào phù hợp</h3>
            <p className="text-xs text-slate-500 mt-0.5">Các đơn hàng mới bạn đặt sẽ hiển thị đầy đủ tại đây</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {order.service?.name || 'Dịch vụ sửa chữa On-Demand'}
                    </h3>
                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                      #{order.id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{order.pickupAddress || '268 Lý Thường Kiệt, Q.10, TP.HCM'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-right">
                    <span className="text-[11px] text-slate-500 block">Thành tiền</span>
                    <span className="text-lg font-black text-emerald-400">
                      {Number(order.totalPrice || 180000).toLocaleString('vi-VN')} đ
                    </span>
                  </span>
                </div>
              </div>

              {/* Progress Steps bar */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tiến trình dịch vụ</p>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 1. Khởi tạo
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className={order.status !== 'SEARCHING' ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-500'}>
                    2. Thợ nhận việc
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className={['IN_PROGRESS', 'COMPLETED'].includes(order.status) ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-500'}>
                    3. Đang thực hiện
                  </span>
                  <span className="text-slate-600">➔</span>
                  <span className={order.status === 'COMPLETED' ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-500'}>
                    4. Hoàn tất
                  </span>
                </div>
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Đặt ngày: {new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                <span className="text-slate-400 font-medium">Bảo hành 30 ngày kể từ ngày nghiệm thu</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

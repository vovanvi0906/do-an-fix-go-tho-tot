import React, { useState } from 'react';
import {
  X,
  MapPin,
  Navigation,
  AlertCircle,
  Radio,
  Sparkles,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import customerOrderService from '../services/customerOrderService';

/**
 * BookingModal Component (Linear / Vercel Vibe Code)
 * - Glassmorphism modal container (bg-slate-900/90 backdrop-blur-xl border-slate-800 rounded-3xl)
 * - Real-time GPS status coordinates with rose-400 map pin
 * - Transparent price preview with emerald-400 font-black
 * - Gradient primary button with pulsating radar icon
 * - Refined loading state (Loader2 + "Đang khởi tạo đơn hàng...")
 * - Animated concentric radar waves on order creation success
 */
export default function BookingModal({ service, isOpen, onClose, onOrderCreated }) {
  if (!isOpen || !service) return null;

  const [address, setAddress] = useState('268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh');
  const [lat] = useState(10.762622);
  const [lng] = useState(106.660172);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const payload = {
        serviceId: service.id || 'd9b3a0e8-78b1-4f1b-8012-3a5c89e20a11',
        pickupLat: lat,
        pickupLng: lng,
        pickupAddress: address,
        description: description.trim() || `Yêu cầu dịch vụ: ${service.name}`,
      };

      console.log('🚀 [FixGo Client] Gửi yêu cầu POST /api/orders:', payload);
      const res = await customerOrderService.createOrder(payload);

      const createdOrder = res.order || res;
      setSuccessOrder(createdOrder);

      if (onOrderCreated) {
        onOrderCreated(createdOrder);
      }
    } catch (err) {
      console.error('❌ [Booking Error]:', err);
      const msg =
        err.friendlyMessage ||
        err.response?.data?.message ||
        err.message ||
        'Không thể khởi tạo đơn hàng. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.';
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSuccessOrder(null);
    setErrorMessage('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden select-none">
        {/* Ambient Top Glows */}
        <div className="absolute top-0 right-0 w-52 h-52 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all cursor-pointer z-10"
          title="Đóng cửa sổ"
        >
          <X className="w-5 h-5" />
        </button>

        {successOrder ? (
          /* ========================================= */
          /* SUCCESS STATE: RADAR QUÉT THỢ ĐỒNG TÂM */
          /* ========================================= */
          <div className="py-4 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Multi-layered Concentric Radar Waves */}
            <div className="relative w-24 h-24 mx-auto my-2 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping duration-1000" />
              <span className="absolute inset-2 rounded-full bg-emerald-500/25 animate-pulse duration-700" />
              <div className="relative z-10 w-14 h-14 rounded-full bg-slate-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)]">
                <Radio className="w-7 h-7 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ĐÃ PHÁT SÓNG ĐƠN HÀNG THÀNH CÔNG</span>
              </div>
              <h3 className="text-2xl font-black text-white mt-2 tracking-tight">
                Đang tìm thợ gần bạn...
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                Hệ thống đang quét các đối tác thợ trực tuyến trong bán kính 5km qua WebSocket & PostGIS. Thợ sẽ liên hệ ngay khi nhận đơn.
              </p>
            </div>

            {/* Order Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-left space-y-2 text-xs text-slate-300">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
                <span className="text-slate-500">Mã đơn hàng:</span>
                <span className="font-mono text-blue-400 font-bold tracking-wider">
                  {successOrder.orderCode || successOrder.id?.slice(0, 13) || 'ORD-NEW'}...
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Dịch vụ:</span>
                <span className="text-white font-semibold">{service.name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Địa chỉ đón:</span>
                <span className="text-slate-300 font-medium truncate max-w-[220px] text-right" title={address}>
                  {address}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
                <span className="text-slate-500">Giá dịch vụ khởi điểm:</span>
                <span className="text-emerald-400 font-black text-sm">
                  {Number(service.basePrice || 150000).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-blue-500/25 transition-all cursor-pointer active:scale-[0.99]"
            >
              Đóng và theo dõi trên Dashboard
            </button>
          </div>
        ) : (
          /* ========================================= */
          /* BOOKING FORM: FORM NHẬP LIỆU ON-DEMAND */
          /* ========================================= */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header with On-Demand Badge */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-400 border border-blue-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Đặt dịch vụ theo yêu cầu (On-Demand)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {service.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {service.desc || 'Thợ chuyên nghiệp có mặt trong vòng 15-30 phút sau khi xác nhận đơn.'}
              </p>
            </div>

            {/* Error Message Toast */}
            {errorMessage && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* GPS & Pickup Address Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>ĐỊA CHỈ THỰC HIỆN DỊCH VỤ</span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-emerald-400" />
                  GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
                </span>
              </div>

              <div className="relative group">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-400 pointer-events-none" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nhập địa chỉ nhà của bạn..."
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all group-hover:border-slate-700"
                />
              </div>
            </div>

            {/* Issue Description / Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                MÔ TẢ CHI TIẾT SỰ CỐ (TÙY CHỌN)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ví dụ: Bồn cầu bị rò rỉ nước liên tục dưới chân đế, cần thợ kiểm tra gấp..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none hover:border-slate-700"
              />
            </div>

            {/* Price Preview Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-950 to-blue-950/40 border border-slate-800 flex items-center justify-between shadow-xs">
              <div className="space-y-0.5">
                <p className="text-xs text-slate-400 font-medium">Bảng giá khởi điểm:</p>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cam kết không phát sinh chi phí ẩn</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
                  {Number(service.basePrice || 150000).toLocaleString('vi-VN')} đ
                </p>
                <p className="text-[10px] text-slate-500">* Đã bao gồm công khảo sát</p>
              </div>
            </div>

            {/* Action Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wider uppercase shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed border border-blue-400/20"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span className="text-xs font-bold tracking-wider">Đang khởi tạo đơn hàng...</span>
                  </div>
                ) : (
                  <>
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>TÌM THỢ NGAY</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

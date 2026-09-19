import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/authStore';
import { workerService } from '../services/worker.service';
import { socketService } from '../../../services/socket/socketService';
import IncomingOrderCard from '../components/IncomingOrderCard';
import ActiveJobCard from '../components/ActiveJobCard';
import WorkerStatsPanel from '../components/WorkerStatsPanel';
import {
  Briefcase,
  LogOut,
  MapPin,
  Radio,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Loader2,
  Wifi,
  WifiOff,
  Sparkles,
} from 'lucide-react';

/**
 * Enterprise Worker Dashboard & Real-Time Order Management (Linear/Vercel style)
 * - Online Availability Toggle with emerald pulsing waves (5km radius)
 * - GPS Coordinate tracker with real-time refresh
 * - 2-Column Split Layout: Performance KPI (30%) & Live Orders Stream (70%)
 * - Socket.IO real-time event listener ('order.new', 'order.taken')
 * - Active Job 5-Step Lifecycle Workflow with atomic state transitions
 */
export default function WorkerDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Profile & Online Availability
  const [profile, setProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    address: 'Quận 10, TP. Hồ Chí Minh',
    lat: 10.768,
    lng: 106.665,
  });

  // Orders State
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [isAcceptingId, setIsAcceptingId] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Initial Load: Profile & Active Job
  const loadInitialData = async () => {
    try {
      const p = await workerService.getProfile();
      setProfile(p);
      setIsOnline(p.isOnline ?? true);
      if (p.currentLat && p.currentLng) {
        setCurrentLocation({
          address: p.currentAddress || 'Quận 10, TP. Hồ Chí Minh',
          lat: Number(p.currentLat),
          lng: Number(p.currentLng),
        });
      }

      // Check for current active order
      const job = await workerService.getCurrentOrder();
      if (job) {
        setActiveJob(job);
      }
    } catch (err) {
      console.warn('Load worker initial data error:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Socket.IO Real-time Connection & Room Subscription
  useEffect(() => {
    if (!isOnline) {
      socketService.disconnect();
      return;
    }

    const socket = socketService.connect();
    if (socket && profile) {
      socketService.joinRoom('WORKER', profile.id, user?.id);
    }

    // Handler for incoming new order broadcast
    const handleNewOrder = (data) => {
      console.log('📡 [Worker Socket] Nhận sóng order.new:', data);
      setIncomingOrders((prev) => {
        // Prevent duplicates
        if (prev.some((o) => (o.id || o.orderId) === (data.orderId || data.id))) {
          return prev;
        }
        return [
          {
            id: data.orderId || data.id,
            orderId: data.orderId || data.id,
            service: data.service || { name: data.serviceName || 'Dịch vụ sửa chữa' },
            pickupAddress: data.pickupAddress,
            pickupLat: data.pickupLat,
            pickupLng: data.pickupLng,
            totalPrice: data.totalPrice,
            description: data.note || data.description,
            distanceKm: data.distanceKm || '1.2',
            countdownSeconds: data.countdownSeconds || 30,
          },
          ...prev,
        ];
      });
      showToast('info', `📡 Đơn hàng mới gần bạn: ${data.service?.name || 'Sửa chữa tại nhà'}`);
    };

    // Handler when another worker takes the order
    const handleOrderTaken = (data) => {
      console.log('ℹ️ [Worker Socket] Đơn hàng đã có người nhận:', data);
      setIncomingOrders((prev) =>
        prev.filter((o) => (o.id || o.orderId) !== (data.orderId || data.id))
      );
    };

    socketService.on('order.new', handleNewOrder);
    socketService.on('order.new.public', handleNewOrder);
    socketService.on('order.taken', handleOrderTaken);

    return () => {
      socketService.off('order.new', handleNewOrder);
      socketService.off('order.new.public', handleNewOrder);
      socketService.off('order.taken', handleOrderTaken);
    };
  }, [isOnline, profile, user?.id]);

  // 3. Online/Offline Toggle Handler
  const handleToggleOnline = async () => {
    try {
      setIsTogglingOnline(true);
      const nextState = !isOnline;
      await workerService.toggleAvailability(nextState);
      setIsOnline(nextState);
      if (nextState) {
        showToast('success', 'Đã bật trực tuyến. Đang lắng nghe sóng đơn hàng bán kính 5km.');
      } else {
        setIncomingOrders([]);
        showToast('info', 'Bạn đã chuyển sang trạng thái ngoại tuyến.');
      }
    } catch (err) {
      showToast('error', 'Không thể chuyển đổi trạng thái trực tuyến.');
    } finally {
      setIsTogglingOnline(false);
    }
  };

  // 4. Update GPS Location Handler
  const handleUpdateLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            await workerService.updateLocation(lat, lng);
            setCurrentLocation((prev) => ({ ...prev, lat, lng }));
            showToast('success', `Đã cập nhật vị trí GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          } catch {
            showToast('error', 'Lỗi khi cập nhật vị trí lên máy chủ.');
          }
        },
        () => {
          showToast('error', 'Không thể lấy quyền truy cập vị trí của trình duyệt.');
        }
      );
    } else {
      showToast('error', 'Trình duyệt không hỗ trợ Geolocation.');
    }
  };

  // 5. Accept Order Handler (Atomic / Race Condition Protected)
  const handleAcceptOrder = async (orderId) => {
    try {
      setIsAcceptingId(orderId);
      const accepted = await workerService.acceptOrder(orderId);
      setActiveJob(accepted);
      // Remove from pool
      setIncomingOrders((prev) => prev.filter((o) => (o.id || o.orderId) !== orderId));
      showToast('success', '🎉 Nhận đơn thành công! Bắt đầu thực hiện dịch vụ.');
    } catch (err) {
      console.error('Accept order failed:', err);
      const status = err.response?.status;
      if (status === 409) {
        showToast('error', '⚠️ Đơn hàng đã có thợ khác nhận trước bạn!');
      } else {
        showToast('error', err.friendlyMessage || 'Không thể nhận đơn. Vui lòng thử lại.');
      }
      // Remove from pool
      setIncomingOrders((prev) => prev.filter((o) => (o.id || o.orderId) !== orderId));
    } finally {
      setIsAcceptingId(null);
    }
  };

  // 6. Update Active Job Step Handler
  const handleUpdateJobStep = async (orderId, action) => {
    try {
      const updated = await workerService.updateJobStep(orderId, action);
      if (action === 'finish') {
        setActiveJob(null);
        showToast('success', 'Đã báo cáo hoàn thành công việc! Chờ khách nghiệm thu.');
      } else {
        setActiveJob(updated);
        showToast('success', 'Đã cập nhật trạng thái tiến trình công việc.');
      }
    } catch (err) {
      showToast('error', 'Không thể cập nhật trạng thái công việc.');
    }
  };

  // 7. Demo Broadcast Helper (For Immediate Testing)
  const handleSimulateOrder = () => {
    const mockId = `ord_sim_${Date.now()}`;
    const mock = {
      id: mockId,
      orderId: mockId,
      service: { name: 'Sửa chữa điện nước khẩn cấp' },
      pickupAddress: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM',
      pickupLat: 10.7626,
      pickupLng: 106.6601,
      totalPrice: 150000,
      description: 'Bồn cầu bị rò rỉ nước liên tục dưới chân đế',
      distanceKm: '0.8',
      countdownSeconds: 30,
    };
    setIncomingOrders((prev) => [mock, ...prev]);
    showToast('info', 'Đã tạo đơn mô phỏng phát sóng trong bán kính 5km.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 p-3.5 rounded-xl border backdrop-blur-xl transition-all duration-200 flex items-center gap-2.5 shadow-2xl animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error'
              ? 'bg-rose-950/85 border-rose-500/40 text-rose-200'
              : toast.type === 'success'
              ? 'bg-emerald-950/85 border-emerald-500/40 text-emerald-200'
              : 'bg-blue-950/85 border-blue-500/40 text-blue-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Radio className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
          )}
          <div className="text-xs font-semibold pr-2">{toast.message}</div>
        </div>
      )}

      {/* ========================================= */}
      {/* 1. TOP CONTROL BAR & ONLINE TOGGLE */}
      {/* ========================================= */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Worker Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Bàn Làm Việc Đối Tác Thợ
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  WORKSPACE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Thợ đối tác: <span className="text-slate-200 font-semibold">{user?.fullName || 'Lê Văn Thợ'}</span> • ID: <span className="font-mono text-slate-500">{user?.id?.slice(0, 8) || 'wkr_demo'}...</span>
              </p>
            </div>
          </div>

          {/* Right Controls: Location & Online Toggle Switch */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Location GPS Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{currentLocation.address}</span>
              <span className="text-[10.5px] font-mono text-slate-500">
                [{currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}]
              </span>
              <button
                type="button"
                onClick={handleUpdateLocation}
                className="ml-1 p-1 hover:text-blue-400 transition-colors cursor-pointer"
                title="Cập nhật vị trí GPS"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {/* Online Toggle Switch */}
            <div className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                disabled={isTogglingOnline}
                onClick={handleToggleOnline}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isOnline ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isOnline ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>

              <div className="text-xs">
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>TRỰC TUYẾN (5KM)</span>
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium text-[11px]">
                    NGOẠI TUYẾN
                  </span>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================= */}
      {/* 2. MAIN WORKSPACE BODY (SPLIT 30% / 70%) */}
      {/* ========================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-6">
        {/* Status Notification Banner when Offline */}
        {!isOnline && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-xs text-amber-300">
            <div className="flex items-center gap-2.5">
              <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                Bạn đang ở trạng thái <strong>Ngoại tuyến</strong>. Bật nút trực tuyến ở thanh điều khiển phía trên để bắt đầu nhận sóng đơn hàng mới từ khách hàng.
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleOnline}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-all cursor-pointer shrink-0"
            >
              Bật Online ngay
            </button>
          </div>
        )}

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (30% - 4 COLS): STATS & THÔNG TIN HỒ SƠ */}
          <div className="lg:col-span-4 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hiệu suất & Thống kê cá nhân
            </div>
            <WorkerStatsPanel
              profile={profile}
              onSimulateOrder={handleSimulateOrder}
            />
          </div>

          {/* CỘT PHẢI (70% - 8 COLS): ACTIVE JOB & LIVE ORDERS STREAM */}
          <div className="lg:col-span-8 space-y-6">
            {/* KHU VỰC 1: ACTIVE JOB (NẾU CÓ ĐƠN ĐANG NHẬN) */}
            {activeJob && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <span>Tiến trình xử lý công việc hiện tại</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    CẬP NHẬT REALTIME
                  </span>
                </div>
                <ActiveJobCard
                  job={activeJob}
                  onUpdateStep={handleUpdateJobStep}
                />
              </div>
            )}

            {/* KHU VỰC 2: LIVE ORDERS STREAM (DANH SÁCH ĐƠN CHỜ NHẬN) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span>Đơn hàng chờ nhận trực tiếp (Live Stream)</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-blue-400 font-bold">
                  {incomingOrders.length} đơn khả dụng
                </span>
              </div>

              {incomingOrders.length > 0 ? (
                /* List of Incoming Orders */
                <div className="space-y-4">
                  {incomingOrders.map((order) => (
                    <IncomingOrderCard
                      key={order.id || order.orderId}
                      order={order}
                      onAccept={handleAcceptOrder}
                      onExpired={(id) =>
                        setIncomingOrders((prev) =>
                          prev.filter((o) => (o.id || o.orderId) !== id)
                        )
                      }
                      isAccepting={isAcceptingId === (order.id || order.orderId)}
                    />
                  ))}
                </div>
              ) : (
                /* Empty Radar Listening State */
                <div className="p-10 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-4">
                  {/* Concentric Radar Waves */}
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping duration-1000" />
                    <span className="absolute inset-2 rounded-full bg-blue-500/15 animate-pulse duration-700" />
                    <div className="relative z-10 w-12 h-12 rounded-full bg-slate-950 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {isOnline
                        ? 'Đang lắng nghe sóng đơn hàng trong bán kính 5km...'
                        : 'Hệ thống đang ở trạng thái ngoại tuyến'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      {isOnline
                        ? 'Khi có khách hàng lân cận đặt đơn dịch vụ phù hợp với chuyên môn của bạn, thông báo và đồng hồ đếm ngược 30s sẽ hiển thị ngay tại đây.'
                        : 'Vui lòng gạt nút trực tuyến ở góc trên bên phải để bắt đầu nhận sóng đơn hàng mới.'}
                    </p>
                  </div>

                  {isOnline && (
                    <button
                      type="button"
                      onClick={handleSimulateOrder}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>Thử tạo 1 đơn mẫu ngay</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-[11px] text-slate-500 font-mono">
        FixGo Worker Realtime Protocol • WebSocket Socket.IO v4 • PostGIS 5km Geofence
      </footer>
    </div>
  );
}

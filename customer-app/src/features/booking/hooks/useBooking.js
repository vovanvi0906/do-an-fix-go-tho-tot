/**
 * useBooking — Custom hook for BookingFlowScreen
 * Manages form state, photo picking, order submission, and matching state
 * Logging prefix: 🚀 [BookingService], 📡 [SocketService]
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { orderStorage } from '../../../services/storage/orderStorage';
import * as ImagePicker from 'expo-image-picker';
import { socketService } from '../../../services/socket/socketService';
import { bookingService } from '../services/bookingService';

const MATCHING_TIMEOUT_SECONDS = 120;


export function useBooking(initialService = null) {
  // ─── Services list ─────────────────────────────────────────────────
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(
    initialService || null
  );

  // ─── Form fields ──────────────────────────────────────────────────
  const [address, setAddress] = useState(
    '268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh'
  );
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [note, setNote] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const [scheduleType, setScheduleType] = useState('INSTANT');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [urgency, setUrgency] = useState('NORMAL');
  const [proposedPrice, setProposedPrice] = useState('');
  const [voucherCode, setVoucherCode] = useState('');

  // ─── Matching state ───────────────────────────────────────────────
  const [matchingStatus, setMatchingStatus] = useState('IDLE');
  const [orderId, setOrderId] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(MATCHING_TIMEOUT_SECONDS);
  const [assignedWorker, setAssignedWorker] = useState(null);

  // ─── UI state ─────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Refs
  const countdownRef = useRef(null);
  const matchingStatusRef = useRef(matchingStatus);
  matchingStatusRef.current = matchingStatus;

  // ─── Load services on mount ────────────────────────────────────────
  useEffect(() => {
    const loadServices = async () => {
      const fetched = await bookingService.getAvailableServices();
      if (Array.isArray(fetched) && fetched.length > 0) {
        setServices(fetched);

      }
    };
    loadServices();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if ((await Location.requestForegroundPermissionsAsync()).status !== 'granted') return;
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (active) { setLat(position.coords.latitude); setLng(position.coords.longitude); }
      } catch (error) { console.warn('Không lấy được GPS đặt đơn:', error.message); }
    })();
    return () => { active = false; };
  }, []);

  const orderIdRef = useRef(null);
  // ─── Socket listeners ─────────────────────────────────────────────
  useEffect(() => {
    socketService.connect();

    const handleOrderAccepted = async (data) => {
      if (!orderIdRef.current || data.orderId !== orderIdRef.current || matchingStatusRef.current === 'FOUND') return;
      matchingStatusRef.current = 'FOUND';
      clearInterval(countdownRef.current);
      const worker = data.worker;
      const orders = await orderStorage.getLocalOrders();
      const cached = orders.find((order) => order.id === data.orderId) || { id: data.orderId };
      await orderStorage.saveOrder({ ...cached, status: 'MATCHED', worker, assignedWorker: worker });
      setAssignedWorker(worker);
      setMatchingStatus('FOUND');
    };

    const handleOrderTimeout = (data) => {
      if (data.orderId !== orderIdRef.current) return;
      console.log('📡 [SocketService] ⏰ Hết thời gian tìm thợ:', data);
      clearInterval(countdownRef.current);
      setMatchingStatus('TIMEOUT');
    };

    socketService.on('order:matched', handleOrderAccepted);
    socketService.on('order.accepted', handleOrderAccepted);
    socketService.on('order.timeout', handleOrderTimeout);

    return () => {
      socketService.off('order:matched', handleOrderAccepted);
      socketService.off('order.accepted', handleOrderAccepted);
      socketService.off('order.timeout', handleOrderTimeout);
      clearInterval(countdownRef.current);
    };
  }, []);

  // ─── Photo Picker ──────────────────────────────────────────────────
  const pickPhoto = useCallback(async () => {
    console.log('🚀 [BookingService] Mở camera/album chọn ảnh sự cố...');
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Cần quyền truy cập thư viện ảnh để tải ảnh sự cố!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.7,
      });

      if (!result.canceled && result.assets) {
        const uris = result.assets.map((a) => a.uri);
        setEvidencePhotos((prev) => [...prev, ...uris].slice(0, 5));
        console.log('🚀 [BookingService] ✅ Đã chọn', uris.length, 'ảnh');
      }
    } catch (error) {
      console.error('🚀 [BookingService] ❌ Lỗi chọn ảnh:', error);
      setErrorMessage('Không thể mở thư viện ảnh. Vui lòng thử lại!');
    }
  }, []);

  const takePhoto = useCallback(async () => {
    console.log('🚀 [BookingService] Mở camera chụp ảnh sự cố...');
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Cần quyền truy cập camera để chụp ảnh sự cố!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets?.[0]) {
        setEvidencePhotos((prev) => [...prev, result.assets[0].uri].slice(0, 5));
        console.log('🚀 [BookingService] ✅ Đã chụp 1 ảnh');
      }
    } catch (error) {
      console.error('🚀 [BookingService] ❌ Lỗi chụp ảnh:', error);
      setErrorMessage('Không thể mở camera. Vui lòng thử lại!');
    }
  }, []);

  const removePhoto = useCallback((index) => {
    setEvidencePhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Submit order ──────────────────────────────────────────────────
  const submitOrder = useCallback(async (options = {}) => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (!selectedService?.id) throw new Error('Vui lòng chọn dịch vụ hợp lệ');
      const bookingLat = options.lat ?? lat;
      const bookingLng = options.lng ?? lng;
      if (!Number.isFinite(bookingLat) || !Number.isFinite(bookingLng)) throw new Error('Vui lòng bật GPS hoặc chọn vị trí trên bản đồ');
      const requestedSchedule = options.scheduleType ?? scheduleType;
      const payload = {
        serviceId: selectedService.id,
        categoryId: selectedService.categoryId,
        imageUrl: options.imageUrl,
        aiConfidence: options.aiConfidence,
        aiSuggestedCategoryId: options.aiSuggestedCategoryId,
        lat: bookingLat,
        lng: bookingLng,
        addressText: options.addressText ?? address,
        note: options.note ?? (note || `Yêu cầu dịch vụ: ${selectedService.name}`),
        evidencePhotos,
        scheduleType: requestedSchedule,
        scheduledAt: requestedSchedule === 'SCHEDULED' ? (options.scheduledAt ?? scheduledDate.toISOString()) : null,
        urgency,
        proposedPrice: parseFloat(proposedPrice) || 0,
        voucherCode: voucherCode.trim(),
      };

      console.log('🚀 [BookingService] Gửi yêu cầu đặt thợ:', payload);
      const result = await bookingService.createBooking(payload);

      const newOrderId = result.orderId;
      orderIdRef.current = newOrderId;
      setOrderId(newOrderId);
      matchingStatusRef.current = 'SEARCHING';
      setMatchingStatus('SEARCHING');
      setRemainingSeconds(MATCHING_TIMEOUT_SECONDS);

      // Start countdown
      countdownRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            if (matchingStatusRef.current === 'SEARCHING') {
              setMatchingStatus('TIMEOUT');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Join socket room for this order
      console.log('📡 [SocketService] Joining order room:', newOrderId);
      socketService.joinOrderRoom(newOrderId);
      return result;
    } catch (err) {
      console.error('🚀 [BookingService] ❌ Lỗi tạo đơn:', err);
      setErrorMessage(err.message || 'Không thể tạo đơn hàng. Vui lòng thử lại!');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedService, lat, lng, address, note, evidencePhotos,
    scheduleType, scheduledDate, urgency, proposedPrice, voucherCode,
  ]);

  // ─── Cancel matching ──────────────────────────────────────────────
  const cancelMatching = useCallback(async () => {
    console.log('🚀 [BookingService] Hủy tìm thợ cho đơn:', orderId);
    clearInterval(countdownRef.current);
    matchingStatusRef.current = 'CANCELLED';
    orderIdRef.current = null;
    setMatchingStatus('CANCELLED');

    if (orderId) {
      try {
        await bookingService.cancelBooking(orderId);
        socketService.leaveOrderRoom(orderId);
      } catch (error) {
        console.error('🚀 [BookingService] ❌ Lỗi hủy đơn:', error);
      }
    }

    // Reset after short delay
    setTimeout(() => {
      setMatchingStatus('IDLE');
      orderIdRef.current = null;
      setOrderId(null);
      setRemainingSeconds(MATCHING_TIMEOUT_SECONDS);
      setAssignedWorker(null);
    }, 300);
  }, [orderId]);

  // ─── Reset all ─────────────────────────────────────────────────────
  const resetMatching = useCallback(() => {
    setMatchingStatus('IDLE');
    orderIdRef.current = null;
    setOrderId(null);
    setRemainingSeconds(MATCHING_TIMEOUT_SECONDS);
    setAssignedWorker(null);
  }, []);

  return {
    // Services
    services,
    selectedService,
    setSelectedService,
    // Form
    address, setAddress,
    lat, lng,
    note, setNote,
    evidencePhotos,
    scheduleType, setScheduleType,
    scheduledDate, setScheduledDate,
    urgency, setUrgency,
    proposedPrice, setProposedPrice,
    voucherCode, setVoucherCode,
    showDatePicker, setShowDatePicker,
    // Photos
    pickPhoto,
    takePhoto,
    removePhoto,
    // Matching
    matchingStatus,
    orderId,
    remainingSeconds,
    assignedWorker,
    // Actions
    isSubmitting,
    errorMessage,
    setErrorMessage,
    submitOrder,
    cancelMatching,
    resetMatching,
  };
}

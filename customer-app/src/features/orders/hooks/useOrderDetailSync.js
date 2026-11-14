/**
 * @file useOrderDetailSync.js
 * @description Hook đồng bộ chi tiết đơn hàng với server, bảo vệ cache theo user và xử lý offline/lỗi.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { orderService } from '../../../services/api/orderService';
import { orderStorage } from '../../../services/storage/orderStorage';
import { socketService } from '../../../services/socket/socketService';
import { tokenStorage } from '../../../services/storage/tokenStorage';

export function useOrderDetailSync(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const orderRef = useRef(order);
  orderRef.current = order;

  const handleFetchError = useCallback(async (err, userId) => {
    const status = err.status || err.response?.status;
    if (status === 403 || status === 404) {
      if (userId) await orderStorage.removeLocalOrder(orderId, userId);
      setOrder(null);
      setError({ status, message: status === 403 ? 'Bạn không có quyền truy cập đơn hàng này' : 'Không tìm thấy đơn hàng', type: status === 403 ? 'FORBIDDEN' : 'NOT_FOUND' });
    } else if (status === 401) {
      setOrder(null);
      setError({ status: 401, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', type: 'UNAUTHORIZED' });
    } else if (err.message?.includes('kết nối') || err.message?.includes('Network Error') || !status) {
      setIsOffline(true);
      if (!orderRef.current) setError({ status: 0, message: 'Không thể kết nối đến máy chủ', type: 'OFFLINE' });
    } else {
      setError({ status: status || 500, message: err.message || 'Lỗi tải đơn hàng', type: 'SERVER_ERROR' });
    }
  }, [orderId]);

  const fetchSnapshot = useCallback(async (isPull = false) => {
    if (!orderId) { setLoading(false); return; }
    if (isPull) setRefreshing(true);
    let userId = null;
    try {
      const user = await tokenStorage.getUser().catch(() => null);
      userId = user?.id ? String(user.id) : null;
      if (!orderRef.current && userId) {
        const cached = await orderStorage.getLocalOrderById(orderId, userId);
        if (cached) { setOrder(cached); setLoading(false); }
      }
      const fresh = await orderService.getOrderById(orderId);
      if (fresh) {
        setOrder(fresh); setError(null); setIsOffline(false);
        if (userId) await orderStorage.saveOrder(fresh, userId);
      }
    } catch (err) {
      await handleFetchError(err, userId);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [orderId, handleFetchError]);

  useEffect(() => {
    fetchSnapshot();
    socketService.connect();
    if (orderId) socketService.joinOrderRoom(orderId);
    const onReconnect = () => fetchSnapshot();
    const onStatus = (d) => { if (!d?.orderId || d.orderId === orderId) fetchSnapshot(); };
    socketService.on('connect', onReconnect);
    if (orderId) socketService.on(`order:${orderId}:status`, onStatus);
    socketService.on('order:status_changed', onStatus);
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') fetchSnapshot(); });
    return () => {
      socketService.off('connect', onReconnect);
      if (orderId) socketService.off(`order:${orderId}:status`, onStatus);
      socketService.off('order:status_changed', onStatus);
      sub.remove();
    };
  }, [orderId, fetchSnapshot]);

  return { order, loading, refreshing, error, isOffline, refetch: fetchSnapshot };
}

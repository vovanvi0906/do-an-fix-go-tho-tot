import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { socketService } from '../../../services/socket/socketService';

// A request started before blur, identity/route change or a newer request cannot publish.
export function useOrderRecovery(load, identity) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const generation = useRef(0);
  const focused = useRef(false);
  const reload = useCallback(async () => {
    if (!focused.current) return;
    const request = ++generation.current;
    setState({ data: null, loading: true, error: '' });
    try {
      const data = await load();
      if (focused.current && request === generation.current) setState({ data, loading: false, error: '' });
    } catch (error) {
      if (focused.current && request === generation.current) setState({ data: null, loading: false, error: error.message || 'Không thể tải đơn hàng' });
    }
  }, [load, identity]);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    reload();
    const subscription = AppState.addEventListener('change', status => { if (status === 'active') reload(); });
    socketService.on('connect', reload);
    socketService.on('order:status_changed', reload);
    return () => {
      focused.current = false;
      ++generation.current;
      subscription.remove();
      socketService.off('connect', reload);
      socketService.off('order:status_changed', reload);
    };
  }, [reload]));
  return { ...state, reload };
}

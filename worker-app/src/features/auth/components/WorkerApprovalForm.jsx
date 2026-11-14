import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { apiClient } from '../../../services/api/apiClient';
import { catalogService } from '../../../services/api/catalogService';

export function WorkerApprovalForm({ profile, onSaved }) {
  const [name, setName] = useState(profile.fullName || '');
  const [idCard, setIdCard] = useState(profile.idCardNumber || '');
  const [services, setServices] = useState(null);
  const [selected, setSelected] = useState(() => (profile.workerServices || []).map(item => item.serviceId));
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    catalogService.getServices().then(items => {
      if (current) { setServices(items.filter(item => item.isActive)); setError(''); }
    }).catch(err => { if (current) setError(err.message); });
    return () => { current = false; };
  }, [retry]);
  const submit = async () => {
    if (lock.current) return;
    if (!name.trim() || !/^\d{12}$/.test(idCard.trim()) || !selected.length) {
      setError('Cần họ tên, CCCD 12 chữ số và ít nhất một dịch vụ.'); return;
    }
    lock.current = true; setPending(true); setError('');
    try {
      await apiClient.patch('/workers/me', { fullName: name.trim(), idCardNumber: idCard.trim() });
      await apiClient.put('/workers/me/services', { serviceIds: selected });
      await apiClient.post('/workers/me/submit-approval');
      await onSaved();
    } catch (err) { setError(err.message); }
    finally { lock.current = false; setPending(false); }
  };
  return <View nativeID="worker-approval-form" style={{ padding: 16, gap: 12, backgroundColor: 'white', borderRadius: 12 }}>
    <Text nativeID="worker-approval-title">Hoàn thiện hồ sơ và nộp duyệt</Text>
    <TextInput nativeID="worker-approval-name" accessibilityLabel="Họ tên thợ" value={name} onChangeText={setName} placeholder="Họ và tên" editable={!pending} />
    <TextInput nativeID="worker-approval-id-card" accessibilityLabel="Số CCCD" value={idCard} onChangeText={setIdCard} placeholder="CCCD 12 chữ số" keyboardType="number-pad" maxLength={12} editable={!pending} />
    <Text>Kỹ năng tự khai không thay thế dịch vụ đăng ký. Chọn dịch vụ bạn có thể thực hiện:</Text>
    {services === null && !error ? <ActivityIndicator /> : null}
    {services?.length === 0 ? <Text>Chưa có dịch vụ khả dụng. Vui lòng liên hệ hỗ trợ.</Text> : null}
    {services?.map(service => <TouchableOpacity nativeID={`worker-approval-service-${service.id}`} key={service.id} disabled={pending} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(service.id) }} onPress={() => setSelected(ids => ids.includes(service.id) ? ids.filter(id => id !== service.id) : [...ids, service.id])}>
      <Text>{selected.includes(service.id) ? '☑' : '☐'} {service.name}</Text>
    </TouchableOpacity>)}
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    {services === null && error ? <TouchableOpacity nativeID="worker-approval-retry" onPress={() => setRetry(value => value + 1)}><Text>Tải lại dịch vụ</Text></TouchableOpacity> : null}
    <Text>Hồ sơ cần quản trị viên phê duyệt. Chưa có chức năng gửi ảnh giấy tờ hoặc đăng ký ảnh khuôn mặt trong contract hiện tại; liên hệ hỗ trợ nếu cần bổ sung.</Text>
    <TouchableOpacity nativeID="worker-approval-submit" disabled={pending || !services?.length} onPress={submit}><Text>{pending ? 'Đang nộp hồ sơ…' : 'Lưu và nộp duyệt'}</Text></TouchableOpacity>
  </View>;
}

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { catalogService } from '../../services/api/catalogService';

export default function ServiceRecommendationSection({ suggestedServices, targetId, categoryId, onSelectService, busy }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  useEffect(() => { const timer = setTimeout(() => { setSearch(query); setPage(1); setServices([]); }, 300); return () => clearTimeout(timer); }, [query]);
  useEffect(() => {
    if (!open || !targetId) return;
    let active = true;
    setLoading(true); setError('');
    catalogService.getServicesPage(categoryId, targetId, { page, search }).then(result => {
      if (active) {
        const rows = result.items.filter(s => s.isActive && s.targetId === targetId && s.categoryId === categoryId);
        setServices(previous => page === 1 ? rows : [...new Map([...previous, ...rows].map(s => [s.id, s])).values()]);
        setHasMore(result.hasMore);
      }
    }).catch(() => { if (active) setError('Không tải được dịch vụ. Kiểm tra kết nối và thử lại.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, targetId, categoryId, attempt, page, search]);
  const renderService = (svc, manual = false) => (
    <Pressable key={svc.id} nativeID={`diagnosis-choice-${svc.id}`} disabled={busy}
      onPress={() => { setOpen(false); onSelectService(svc.id, { manual }); }}
      style={{ padding: 14, marginVertical: 4, borderWidth: 1, borderColor: '#BAE6FD', borderRadius: 10 }}>
      <Text style={{ fontWeight: '700', color: '#0C4A6E' }}>{svc.name}</Text>
      <Text>{svc.basePrice == null ? 'Thợ báo giá sau kiểm tra' : `Từ ${Number(svc.basePrice).toLocaleString('vi-VN')} đ / ${svc.unit || 'lần'}`}</Text>
      {!!svc.description && <Text numberOfLines={2}>{svc.description}</Text>}
      {!!svc.reason && <Text>{svc.reason}</Text>}
    </Pressable>
  );
  const top = (suggestedServices || []).filter(s => s.targetId === targetId).slice(0, 3);
  return <View nativeID="service-recommendation-section">
    {!!top.length && <Text style={{ fontWeight: '700' }}>Dịch vụ phù hợp với thông tin bạn xác nhận</Text>}
    {top.map(svc => renderService(svc))}
    {!top.length && <Text>Chưa có gợi ý phù hợp. Bạn có thể chọn dịch vụ thủ công cho thiết bị này.</Text>}
    <Pressable disabled={busy} onPress={() => setOpen(true)} style={{ padding: 14 }}><Text>Không biết lỗi gì / Chọn dịch vụ thủ công</Text></Pressable>
    <Pressable disabled={busy} onPress={() => setOpen(true)} style={{ padding: 14 }}><Text>Xem thêm dịch vụ cho thiết bị này</Text></Pressable>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, padding: 20, paddingTop: 48 }}>
        <Pressable onPress={() => setOpen(false)} style={{ padding: 14 }}><Text>Quay lại</Text></Pressable>
        <Text style={{ fontWeight: '700', fontSize: 18 }}>Dịch vụ cho thiết bị đã xác nhận</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder="Tìm tên dịch vụ" style={{ padding: 14, borderWidth: 1, borderColor: '#CBD5E1', marginVertical: 12 }} />
        {loading ? <ActivityIndicator /> : error ? <View><Text accessibilityRole="alert">{error}</Text>
          <Pressable onPress={() => setAttempt(v => v + 1)} style={{ padding: 14 }}><Text>Thử lại</Text></Pressable></View> :
          <FlatList data={services}
            keyExtractor={s => s.id} renderItem={({ item }) => renderService(item, true)}
            ListFooterComponent={hasMore ? <Pressable disabled={loading} onPress={() => setPage(value => value + 1)} style={{ padding: 14 }}><Text>Tải thêm dịch vụ</Text></Pressable> : null}
            ListEmptyComponent={<Text>Chưa tìm thấy dịch vụ phù hợp. Thử từ khóa khác hoặc đổi thiết bị.</Text>} />}
      </View>
    </Modal>
  </View>;
}

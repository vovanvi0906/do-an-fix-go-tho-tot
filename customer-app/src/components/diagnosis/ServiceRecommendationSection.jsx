import React from 'react';
import { View, Text, Pressable } from 'react-native';

export default function ServiceRecommendationSection({ suggestedServices, availableServices, onSelectService, busy }) {
  const topServices = suggestedServices?.length ? suggestedServices : [];
  const otherServices = availableServices?.length
    ? availableServices.filter((s) => !topServices.some((t) => t.id === s.id))
    : [];

  return (
    <View nativeID="service-recommendation-section" style={{ marginVertical: 8 }}>
      {topServices.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontWeight: '700', color: '#0F172A', marginBottom: 6 }}>Dịch vụ đề xuất:</Text>
          {topServices.map((svc) => (
            <Pressable
              key={svc.id}
              nativeID={`diagnosis-choice-${svc.id}`}
              disabled={busy}
              onPress={() => onSelectService(svc.id)}
              style={{
                padding: 12,
                marginVertical: 4,
                backgroundColor: '#F0FDF4',
                borderColor: '#86EFAC',
                borderWidth: 1,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontWeight: '600', color: '#166534', fontSize: 15 }}>{svc.name}</Text>
              <Text style={{ color: '#15803D', fontSize: 13, marginTop: 2 }}>
                {svc.basePrice?.toLocaleString('vi-VN')} đ / {svc.unit || 'lần'}
              </Text>
              {svc.reason && (
                <Text style={{ color: '#4B5563', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                  {svc.reason}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}

      {otherServices.length > 0 && (
        <View style={{ marginTop: 6 }}>
          <Text style={{ fontWeight: '600', color: '#475569', marginBottom: 4 }}>Hoặc chọn dịch vụ phù hợp:</Text>
          {otherServices.map((svc) => (
            <Pressable
              key={svc.id}
              nativeID={`diagnosis-choice-${svc.id}`}
              disabled={busy}
              onPress={() => onSelectService(svc.id)}
              style={{ padding: 10, marginVertical: 3, backgroundColor: '#E2E8F0', borderRadius: 8 }}
            >
              <Text style={{ color: '#1E293B' }}>{svc.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

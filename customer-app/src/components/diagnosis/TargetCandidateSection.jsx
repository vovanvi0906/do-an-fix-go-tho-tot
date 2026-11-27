import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';

const searchable = value => String(value || '').toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

export default function TargetCandidateSection({ result, onSelectTarget, onSelectCategory, busy }) {
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState('');
  const available = (result?.availableTargets || []).filter(t => searchable(`${t.name} ${t.slug || ''}`).includes(searchable(query.trim())));
  const target = (result?.suggestedTargetName ? {
    targetId: result.suggestedTargetId, targetName: result.suggestedTargetName,
  } : null);

  return (
    <View nativeID="target-candidate-section" style={{ marginVertical: 8 }}>
      {target && !showPicker && (
        <View style={{ padding: 12, backgroundColor: '#F0F9FF', borderRadius: 8, borderColor: '#BAE6FD', borderWidth: 1 }}>
          <Text style={{ fontSize: 13, color: '#0369A1', fontWeight: '600' }}>{result?.target ? 'Bạn đã xác nhận thiết bị:' : 'AI gợi ý thiết bị (cần xác nhận):'}</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0C4A6E', marginVertical: 4 }}>
            {target.targetName}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <Pressable nativeID="btn-confirm-target" disabled={busy}
              onPress={() => onSelectTarget(target.targetId)}
              style={{ flex: 1, padding: 10, backgroundColor: '#0284C7', borderRadius: 6, alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Đúng thiết bị này</Text>
            </Pressable>
            <Pressable nativeID="btn-change-target" disabled={busy}
              onPress={() => { setQuery(''); setShowPicker(true); }}
              style={{ padding: 10, backgroundColor: '#E2E8F0', borderRadius: 6 }}>
              <Text style={{ color: '#475569' }}>Không đúng thiết bị</Text>
            </Pressable>
          </View>
        </View>
      )}

      {(showPicker || !target) && (
        <View style={{ marginTop: 8 }}>
          {!target && !!result?.aiTargetOptions?.length && <View nativeID="ai-target-options" style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: '600', marginBottom: 6 }}>AI chưa chắc chắn. Ảnh có thể là một trong các thiết bị sau:</Text>
            {result.aiTargetOptions.map((t) => (
              <Pressable key={t.id} nativeID={`ai-target-option-${t.id}`} disabled={busy}
                onPress={() => { setShowPicker(false); onSelectTarget(t.id); }}
                style={{ padding: 12, marginVertical: 3, backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', borderWidth: 1, borderRadius: 6 }}>
                <Text style={{ color: '#0C4A6E', fontSize: 16, fontWeight: '600' }}>{t.name}</Text>
              </Pressable>
            ))}
            <Text style={{ marginTop: 4 }}>Không đúng? Tìm thiết bị khác bên dưới.</Text>
          </View>}
          <Text style={{ fontWeight: '600', marginBottom: 6 }}>Chọn thiết bị chính xác:</Text>
          <TextInput accessibilityLabel="Tìm thiết bị" placeholder="Gõ tên thiết bị, có hoặc không dấu" value={query} onChangeText={setQuery} editable={!busy}
            style={{ fontSize: 16, padding: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, marginBottom: 8 }} />
          {!available.length && <Text>Không tìm thấy thiết bị phù hợp. Bạn có thể đổi danh mục bên dưới.</Text>}
          {available.map((t) => (
            <Pressable key={t.id} nativeID={`target-choice-${t.id}`} disabled={busy}
              onPress={() => { setShowPicker(false); onSelectTarget(t.id); }}
              style={{ padding: 10, marginVertical: 3, backgroundColor: '#F1F5F9', borderRadius: 6 }}>
              <Text style={{ color: '#1E293B', fontSize: 16 }}>{t.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

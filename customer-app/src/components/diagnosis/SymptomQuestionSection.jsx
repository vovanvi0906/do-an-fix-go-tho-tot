import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, TextInput } from 'react-native';
export default function SymptomQuestionSection({ questions, onAnswerQuestion, busy }) {
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  if (!questions?.length) return <Text>Chưa có triệu chứng được duyệt cho thiết bị này. Bạn có thể chọn dịch vụ thủ công.</Text>;
  const choose = (q, opt) => <Pressable key={opt.value} nativeID={`diagnosis-choice-${opt.value}`} disabled={busy}
    onPress={() => { setExpanded(null); onAnswerQuestion(q.id, opt.value); }}
    style={{ padding: 12, marginVertical: 4, backgroundColor: '#E2E8F0', borderRadius: 8 }}>
    <Text style={{ color: '#0F172A' }}>{opt.label}</Text>
    {opt.kind === 'REQUIRES_TECHNICIAN_CHECK' && <Text>Cần thợ kiểm tra; ảnh chưa xác nhận nguyên nhân.</Text>}
  </Pressable>;
  return <View nativeID="symptom-questions-container" style={{ marginVertical: 8 }}>
    {questions.map(q => <View key={q.id}>
      <Text style={{ fontWeight: '600' }}>{q.label}</Text>
      {q.options?.slice(0, 3).map(opt => choose(q, opt))}
      {q.options?.length > 3 && <Pressable disabled={busy} onPress={() => { setSearch(''); setExpanded(q); }} style={{ padding: 12 }}><Text>Xem thêm triệu chứng</Text></Pressable>}
    </View>)}
    <Modal visible={!!expanded} onRequestClose={() => setExpanded(null)} animationType="slide">
      <View style={{ flex: 1, padding: 20, paddingTop: 48 }}>
        <Pressable onPress={() => setExpanded(null)} style={{ padding: 14 }}><Text>Quay lại</Text></Pressable>
        <TextInput placeholder="Tìm triệu chứng" value={search} onChangeText={setSearch} style={{ padding: 14, borderWidth: 1, borderColor: '#CBD5E1' }} />
        <FlatList data={(expanded?.options || []).filter(opt => opt.label.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')))}
          keyExtractor={opt => opt.value} renderItem={({ item }) => choose(expanded, item)} ListEmptyComponent={<Text>Không có triệu chứng phù hợp. Bạn có thể chọn dịch vụ thủ công.</Text>} />
      </View>
    </Modal>
  </View>;
}

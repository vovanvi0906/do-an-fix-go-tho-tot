import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { diagnoseIssueImage } from '../../services/api/aiService';

// Dùng chung cho cả modal Home và màn hình đặt đơn cũ.
export default function DiagnosisChoices({ result, imageUrl, description = '', onResult, onReset }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState(description);
  const answer = async (answers) => {
    if (busy) return;
    setBusy(true);
    setError('');
    onReset?.();
    try {
      onResult(await diagnoseIssueImage(result?.imageUrl || imageUrl, note, answers));
    } catch (err) {
      setError(err.message || 'Không thể kết nối. Vui lòng thử lại.');
    } finally { setBusy(false); }
  };
  const button = (id, label, answers) => (
    <Pressable key={id} nativeID={`diagnosis-choice-${id}`} disabled={busy}
      onPress={() => answer(answers)} style={{ padding: 12, marginVertical: 4, backgroundColor: '#E2E8F0', borderRadius: 8 }}>
      <Text>{label}</Text>
    </Pressable>
  );
  return (
    <View nativeID="diagnosis-choices-container" style={{ marginVertical: 12 }}>
      <TextInput nativeID="diagnosis-description-input" value={note} onChangeText={setNote}
        placeholder="Mô tả thiết bị và triệu chứng" multiline editable={!busy}
        style={{ padding: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8 }} />
      {button('retry', 'Phân tích lại ảnh và mô tả', {})}
      {busy && <ActivityIndicator nativeID="diagnosis-choices-loading" />}
      {!!error && <Text nativeID="diagnosis-choices-error" accessibilityRole="alert">{error}</Text>}
      {result?.questions?.map(q => (
        <View key={q.id} nativeID={`diagnosis-question-${q.id}`}>
          <Text>{q.label}</Text>
          {q.options.map(option => button(option.value, option.label, {
            categoryId: result.suggestedCategoryId, [q.id]: option.value,
          }))}
        </View>
      ))}
      {!!result?.availableServices?.length && <Text>Hoặc chọn dịch vụ phù hợp:</Text>}
      {result?.availableServices?.map(service => button(service.id, service.name, {
        categoryId: result.suggestedCategoryId, serviceId: service.id,
      }))}
      <Text>Đổi / chọn danh mục:</Text>
      {result?.availableCategories?.map(category => button(category.id, category.name, { categoryId: category.id }))}
    </View>
  );
}

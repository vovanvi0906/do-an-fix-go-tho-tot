import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { diagnoseIssueImage } from '../../services/api/aiService';
import TargetCandidateSection from './TargetCandidateSection';
import SymptomQuestionSection from './SymptomQuestionSection';
import ServiceRecommendationSection from './ServiceRecommendationSection';

export default function DiagnosisChoices({ result, imageUrl, description = '', onResult, onReset }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState(description);
  const [targetId, setTargetId] = useState(result?.suggestedTargetId || null);

  const answer = async (answers) => {
    if (busy) return;
    setBusy(true);
    setError('');
    onReset?.();
    try {
      const res = await diagnoseIssueImage(result?.imageUrl || imageUrl, note, answers);
      onResult(res);
      if (res.suggestedTargetId) setTargetId(res.suggestedTargetId);
    } catch (err) {
      setError(err.message || 'Không thể kết nối. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const handleSelectTarget = (selectedTgtId) => {
    setTargetId(selectedTgtId);
    answer({ categoryId: result?.suggestedCategoryId, targetId: selectedTgtId });
  };

  const handleAnswerQuestion = (questionId, value) => {
    const payload = { categoryId: result?.suggestedCategoryId, [questionId]: value };
    if (targetId) payload.targetId = targetId;
    answer(payload);
  };

  const handleSelectService = (serviceId) => {
    const payload = { categoryId: result?.suggestedCategoryId, serviceId };
    if (targetId) payload.targetId = targetId;
    answer(payload);
  };

  return (
    <View nativeID="diagnosis-choices-container" style={{ marginVertical: 12 }}>
      <TextInput
        nativeID="diagnosis-description-input"
        value={note}
        onChangeText={setNote}
        placeholder="Mô tả thiết bị và triệu chứng"
        multiline
        editable={!busy}
        style={{ padding: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, marginBottom: 8 }}
      />
      <Pressable
        nativeID="diagnosis-choice-retry"
        disabled={busy}
        onPress={() => answer({})}
        style={{ padding: 10, backgroundColor: '#E2E8F0', borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: '#334155' }}>Phân tích lại ảnh và mô tả</Text>
      </Pressable>

      {busy && <ActivityIndicator nativeID="diagnosis-choices-loading" style={{ marginVertical: 12 }} />}
      {!!error && (
        <Text nativeID="diagnosis-choices-error" accessibilityRole="alert" style={{ color: '#DC2626', marginVertical: 6 }}>
          {error}
        </Text>
      )}

      <TargetCandidateSection
        result={result}
        onSelectTarget={handleSelectTarget}
        onSelectCategory={(catId) => { setTargetId(null); answer({ categoryId: catId }); }}
        busy={busy}
      />

      <SymptomQuestionSection
        questions={result?.questions}
        onAnswerQuestion={handleAnswerQuestion}
        busy={busy}
      />

      <ServiceRecommendationSection
        suggestedServices={result?.suggestedServices}
        availableServices={result?.availableServices}
        onSelectService={handleSelectService}
        busy={busy}
      />

      <Text style={{ fontWeight: '600', marginTop: 12, marginBottom: 4 }}>Đổi / chọn danh mục:</Text>
      {result?.availableCategories?.map((category) => (
        <Pressable
          key={category.id}
          nativeID={`diagnosis-choice-${category.id}`}
          disabled={busy}
          onPress={() => { setTargetId(null); answer({ categoryId: category.id }); }}
          style={{ padding: 10, marginVertical: 3, backgroundColor: '#E2E8F0', borderRadius: 8 }}
        >
          <Text style={{ color: '#334155' }}>{category.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

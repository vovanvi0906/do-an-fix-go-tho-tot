import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { diagnoseIssueImage } from '../../services/api/aiService';
import { catalogService } from '../../services/api/catalogService';
import TargetCandidateSection from './TargetCandidateSection';
import SymptomQuestionSection from './SymptomQuestionSection';
import ServiceRecommendationSection from './ServiceRecommendationSection';

export default function DiagnosisChoices({ result, imageUrl, description = '', onResult, onReset }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState(description);
  const [categories, setCategories] = useState([]);
  const [changingCategory, setChangingCategory] = useState(false);
  const [lastAnswers, setLastAnswers] = useState({});
  const generation = useRef(0);
  const locked = useRef(false);
  const targetId = result?.target?.id || null; // Confirmed server state, never a cached AI suggestion.
  useEffect(() => {
    generation.current += 1;
    locked.current = false;
    setBusy(false);
    setError('');
    return () => { generation.current += 1; locked.current = false; };
  }, [imageUrl]);
  useEffect(() => {
    if (result?.availableCategories?.length) return;
    let active = true;
    catalogService.getCategories().then(rows => { if (active) setCategories(rows); })
      .catch(() => { if (active) setError('Không tải được danh mục. Kiểm tra kết nối và thử lại.'); });
    return () => { active = false; };
  }, [result?.availableCategories]);

  const answer = async (answers) => {
    if (locked.current) return;
    locked.current = true;
    const version = ++generation.current;
    setBusy(true);
    setError('');
    setLastAnswers(answers);
    onReset?.();
    try {
      const res = await diagnoseIssueImage(result?.imageUrl || imageUrl, note, answers);
      if (version === generation.current) onResult(res);
    } catch (err) {
      if (version === generation.current) setError(err.message || 'Không thể kết nối. Vui lòng thử lại hoặc chọn thủ công.');
    } finally {
      if (version === generation.current) { locked.current = false; setBusy(false); }
    }
  };
  const selectCategory = categoryId => { setChangingCategory(false); answer({ categoryId }); };
  const categoryRows = result?.availableCategories?.length ? result.availableCategories : categories;
  const context = { categoryId: result?.suggestedCategoryId, ...(targetId ? { targetId } : {}) };
  return (
    <View nativeID="diagnosis-choices-container" style={{ marginVertical: 12 }}>
      <Text style={{ fontWeight: '700', marginBottom: 8 }}>1. Xác nhận thiết bị → 2. Triệu chứng → 3. Dịch vụ</Text>
      <TextInput nativeID="diagnosis-description-input" value={note} onChangeText={setNote}
        placeholder="Mô tả thiết bị và triệu chứng" multiline editable={!busy}
        style={{ padding: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, marginBottom: 8 }} />
      <Pressable nativeID="diagnosis-choice-retry" disabled={busy} onPress={() => answer({})} style={{ padding: 12 }}>
        <Text>Phân tích lại ảnh và mô tả</Text>
      </Pressable>
      {busy && <ActivityIndicator nativeID="diagnosis-choices-loading" />}
      {!!error && <View><Text accessibilityRole="alert" style={{ color: '#DC2626' }}>{error}</Text>
        <Pressable disabled={busy} onPress={() => answer(lastAnswers)} style={{ padding: 12 }}><Text>Thử lại</Text></Pressable>
      </View>}
      {!!result?.suggestedCategoryId && <TargetCandidateSection result={result} onSelectTarget={id => answer({ categoryId: result?.suggestedCategoryId, targetId: id })}
        onSelectCategory={selectCategory} busy={busy} />}
      {targetId && <>
        <Text style={{ fontWeight: '600' }}>Bạn đã xác nhận: {result?.target?.name}</Text>
        <Text>Ảnh chưa đủ để kết luận nguyên nhân hỏng. Chọn tình trạng bạn đang gặp.</Text>
        <SymptomQuestionSection key={`${result?.suggestedCategoryId}:${targetId}`} questions={result?.questions} onAnswerQuestion={(id, value) => answer({ ...context, [id]: value })} busy={busy} />
        <ServiceRecommendationSection key={targetId} targetId={targetId} categoryId={result?.suggestedCategoryId}
          suggestedServices={result?.suggestedServices} onSelectService={(id, options) => answer({ ...context, ...(!options?.manual && result?.selectedSymptomIds?.length ? { symptomIds: result.selectedSymptomIds } : {}), serviceId: id })} busy={busy} />
      </>}
      <Pressable disabled={busy} onPress={() => setChangingCategory(v => !v)} style={{ padding: 12 }}><Text>Đổi / chọn danh mục</Text></Pressable>
      {(changingCategory || !result?.suggestedCategoryId) && categoryRows.map(category => (
        <Pressable key={category.id} nativeID={`diagnosis-choice-${category.id}`} disabled={busy} onPress={() => selectCategory(category.id)} style={{ padding: 12 }}>
          <Text>{category.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

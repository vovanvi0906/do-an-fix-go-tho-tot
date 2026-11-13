import React from 'react';
import { View, Text, Pressable } from 'react-native';

export default function SymptomQuestionSection({ questions, onAnswerQuestion, busy }) {
  if (!questions || !questions.length) return null;

  return (
    <View nativeID="symptom-questions-container" style={{ marginVertical: 8 }}>
      {questions.map((q) => (
        <View key={q.id} nativeID={`diagnosis-question-${q.id}`} style={{ marginBottom: 10 }}>
          <Text style={{ fontWeight: '600', color: '#1E293B', marginBottom: 6 }}>{q.label}</Text>
          {q.options?.map((opt) => (
            <Pressable
              key={opt.value}
              nativeID={`diagnosis-choice-${opt.value}`}
              disabled={busy}
              onPress={() => onAnswerQuestion(q.id, opt.value)}
              style={({ pressed }) => ({
                padding: 12,
                marginVertical: 4,
                backgroundColor: pressed ? '#CBD5E1' : '#E2E8F0',
                borderRadius: 8,
              })}
            >
              <Text style={{ color: '#0F172A', fontSize: 14 }}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

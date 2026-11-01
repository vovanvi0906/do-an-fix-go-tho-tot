import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelectServiceWizard } from '../../../src/features/services/hooks/useSelectServiceWizard';

export default function SelectServiceScreen() {
  const {
    step, tree, selectedCategory, selectedTarget, loading,
    handleSelectCategory, handleSelectTarget, handleSelectService, handleBackStep,
  } = useSelectServiceWizard();

  const renderStepIndicator = () => (
    <View style={styles.stepBar}>
      {['1. Danh mục', '2. Thiết bị', '3. Công việc'].map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = step === stepNum;
        const isDone = step > stepNum;
        return (
          <View key={label} style={[styles.stepItem, isActive && styles.stepItemActive, isDone && styles.stepItemDone]}>
            <Text style={[styles.stepText, (isActive || isDone) && styles.stepTextActive]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleBackStep} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Chọn dịch vụ đặt lịch</Text>
        <View style={styles.placeholder} />
      </View>
      {renderStepIndicator()}
      {loading ? (
        <ActivityIndicator size="large" color="#0084FF" style={styles.loader} />
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {step === 1 && (
            <View style={styles.grid}>
              {tree.map((cat) => (
                <Pressable key={cat.id} style={styles.card} onPress={() => handleSelectCategory(cat)}>
                  <View style={styles.iconBox}><Ionicons name="apps-outline" size={20} color="#0084FF" /></View>
                  <Text style={styles.cardTitle}>{cat.name}</Text>
                  <Text style={styles.cardSub}>{cat.targets?.length || 0} nhóm thiết bị</Text>
                </Pressable>
              ))}
            </View>
          )}

          {step === 2 && (
            <View style={styles.list}>
              <Text style={styles.sectionHeader}>{selectedCategory?.name} • Chọn thiết bị / khu vực:</Text>
              {(selectedCategory?.targets || []).map((tgt: any) => (
                <Pressable key={tgt.id} style={styles.rowCard} onPress={() => handleSelectTarget(tgt)}>
                  <View style={styles.rowLeft}>
                    <Ionicons name="cube-outline" size={18} color="#0084FF" />
                    <Text style={styles.rowTitle}>{tgt.name}</Text>
                  </View>
                  <Text style={styles.rowMeta}>{tgt.services?.length || 0} dịch vụ ›</Text>
                </Pressable>
              ))}
            </View>
          )}

          {step === 3 && (
            <View style={styles.list}>
              <Text style={styles.sectionHeader}>{selectedCategory?.name} › {selectedTarget?.name}:</Text>
              {(selectedTarget?.services || []).map((svc: any) => (
                <Pressable key={svc.id} style={styles.rowCard} onPress={() => handleSelectService(svc)}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowTitle}>{svc.name}</Text>
                    <Text style={styles.priceTag}>{Number(svc.basePrice).toLocaleString('vi-VN')} đ / {svc.unit || 'lần'}</Text>
                  </View>
                  <View style={styles.selectBtn}><Text style={styles.selectBtnText}>Chọn</Text></View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  placeholder: { width: 30 },
  stepBar: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  stepItem: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8, backgroundColor: '#F1F5F9' },
  stepItemActive: { backgroundColor: '#0084FF' },
  stepItemDone: { backgroundColor: '#E0F2FE' },
  stepText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  stepTextActive: { color: '#FFF' },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  grid: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', flex: 1 },
  cardSub: { fontSize: 12, color: '#64748B' },
  list: { gap: 10 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#0084FF', marginBottom: 4 },
  rowCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  rowLeft: { flex: 1, paddingRight: 10 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  rowMeta: { fontSize: 12, fontWeight: '600', color: '#0084FF' },
  priceTag: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
  selectBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  selectBtnText: { fontSize: 12, fontWeight: '700', color: '#0084FF' },
  loader: { marginTop: 40 },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePriceList } from '../hooks/usePriceList';
import { PriceListAccordion } from '../components/PriceListAccordion';

export default function PriceListScreen() {
  const router = useRouter();
  const {
    tree, currentCategory, selectedCatId, setSelectedCatId,
    expandedTargetIds, toggleTarget, searchQuery, setSearchQuery,
    filteredTargets, loading, refreshing, onRefresh,
  } = usePriceList();

  const handleSelectService = (service: any, target: any) => {
    router.push({
      pathname: '/(user)/booking/create-booking',
      params: {
        serviceId: service.id,
        serviceName: service.name,
        categoryId: currentCategory?.id || '',
        categoryName: currentCategory?.name || '',
        targetId: target?.id || '',
        targetName: target?.name || '',
        basePrice: String(service.basePrice ?? 0),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Bảng giá dịch vụ minh bạch</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm công việc, thiết bị..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tree.map((cat) => {
            const isSelected = cat.id === selectedCatId;
            return (
              <Pressable
                key={cat.id}
                style={[styles.tabChip, isSelected && styles.tabChipActive]}
                onPress={() => setSelectedCatId(cat.id)}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0084FF" style={styles.loader} />
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0084FF']} />}
        >
          <PriceListAccordion
            targets={filteredTargets}
            expandedTargetIds={expandedTargetIds}
            onToggleTarget={toggleTarget}
            onSelectService={handleSelectService}
          />
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
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, paddingHorizontal: 12, height: 42, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  tabsContainer: { backgroundColor: '#F8FAFC', paddingVertical: 10 },
  tabsScroll: { paddingHorizontal: 16, gap: 8 },
  tabChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  tabChipActive: { backgroundColor: '#0084FF', borderColor: '#0084FF' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#FFF', fontWeight: '700' },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingTop: 6 },
  loader: { marginTop: 40 },
});

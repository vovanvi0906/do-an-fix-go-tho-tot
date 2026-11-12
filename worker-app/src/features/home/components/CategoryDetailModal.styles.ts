import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '82%', minHeight: 460, paddingBottom: 24 },
  dragHandle: { width: 36, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  title: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  closeBtn: { padding: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, paddingHorizontal: 12, height: 40, backgroundColor: '#F1F5F9', borderRadius: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  chipsScroll: { paddingHorizontal: 20, marginTop: 12, marginBottom: 8, maxHeight: 38 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8, height: 32 },
  chipActive: { backgroundColor: '#EFF6FF', borderColor: '#0084FF' },
  chipText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#0084FF', fontWeight: '700' },
  listContent: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20 },
  serviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cardLeft: { flex: 1, paddingRight: 12 },
  serviceName: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  targetBadge: { fontSize: 11, color: '#64748B', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  priceText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  bookBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 2 },
  bookBtnText: { fontSize: 12, fontWeight: '700', color: '#0084FF' },
  loading: { paddingVertical: 40 },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 13, marginTop: 40 },
});


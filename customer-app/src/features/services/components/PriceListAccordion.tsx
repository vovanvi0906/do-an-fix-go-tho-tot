import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PriceListAccordionProps {
  targets: any[];
  expandedTargetIds: Record<string, boolean>;
  onToggleTarget: (targetId: string) => void;
  onSelectService: (service: any, target: any) => void;
}

export const PriceListAccordion: React.FC<PriceListAccordionProps> = ({
  targets,
  expandedTargetIds,
  onToggleTarget,
  onSelectService,
}) => {
  if (targets.length === 0) {
    return <Text style={styles.emptyText}>Không tìm thấy hạng mục nào phù hợp</Text>;
  }

  return (
    <View style={styles.container}>
      {targets.map((tgt) => {
        const isExpanded = Boolean(expandedTargetIds[tgt.id]);
        return (
          <View key={tgt.id} style={styles.targetCard}>
            <Pressable style={styles.targetHeader} onPress={() => onToggleTarget(tgt.id)}>
              <View style={styles.headerLeft}>
                <View style={styles.iconBox}>
                  <Ionicons name="cube-outline" size={16} color="#0084FF" />
                </View>
                <View>
                  <Text style={styles.targetTitle}>{tgt.name}</Text>
                  <Text style={styles.targetCount}>{tgt.services?.length || 0} dịch vụ chi tiết</Text>
                </View>
              </View>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748B"
              />
            </Pressable>

            {isExpanded && (
              <View style={styles.serviceList}>
                {(tgt.services || []).map((svc: any) => (
                  <View key={svc.id} style={styles.serviceRow}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{svc.name}</Text>
                      <Text style={styles.servicePrice}>
                        {Number(svc.basePrice).toLocaleString('vi-VN')} đ / {svc.unit || 'lần'}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.bookNowBtn}
                      onPress={() => onSelectService(svc, tgt)}
                    >
                      <Text style={styles.bookNowText}>Đặt ngay</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

export default PriceListAccordion;

const styles = StyleSheet.create({
  container: { gap: 10, paddingBottom: 24 },
  targetCard: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  targetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#FFF' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  targetTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  targetCount: { fontSize: 11, color: '#64748B', marginTop: 2 },
  serviceList: { borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 6 },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEF2F6' },
  serviceInfo: { flex: 1, paddingRight: 10 },
  serviceName: { fontSize: 13, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  servicePrice: { fontSize: 12, fontWeight: '700', color: '#16A34A' },
  bookNowBtn: { backgroundColor: '#0084FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  bookNowText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 13, paddingVertical: 40 },
});


import React from 'react';
import { View, Text, Modal, Pressable, TextInput, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CategoryItem } from '../types/home.types';
import { useCategoryDetailModal } from '../hooks/useCategoryDetailModal';
import { styles } from './CategoryDetailModal.styles';

export interface SubServiceItem {
  id: string;
  name: string;
  basePrice?: number;
  unit?: string;
  categorySlug: string;
  categoryName: string;
  categoryId?: string;
  targetId?: string;
  targetName?: string;
}

interface CategoryDetailModalProps {
  visible: boolean;
  category: CategoryItem | null;
  onClose: () => void;
  onSelectSubService: (subService: SubServiceItem) => void;
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  visible,
  category,
  onClose,
  onSelectSubService,
}) => {
  const {
    targets,
    selectedTargetId,
    setSelectedTargetId,
    searchQuery,
    setSearchQuery,
    filteredServices,
    loading,
  } = useCategoryDetailModal(category, visible);

  if (!category) return null;

  const renderServiceItem = ({ item }: { item: any }) => (
    <Pressable
      style={styles.serviceCard}
      onPress={() =>
        onSelectSubService({
          id: item.id,
          name: item.name,
          basePrice: Number(item.basePrice),
          unit: item.unit || (category as any).unit || 'lần',
          categorySlug: category.slug,
          categoryName: category.name,
          categoryId: category.id,
          targetId: item.targetId,
          targetName: item.targetName,
        })
      }
    >
      <View style={styles.cardLeft}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <View style={styles.badgeRow}>
          {item.targetName && <Text style={styles.targetBadge}>#{item.targetName}</Text>}
          <Text style={styles.priceText}>
            {Number(item.basePrice).toLocaleString('vi-VN')} đ / {item.unit || 'lần'}
          </Text>
        </View>
      </View>
      <View style={styles.bookBtn}>
        <Text style={styles.bookBtnText}>Đặt</Text>
        <Ionicons name="chevron-forward" size={14} color="#0084FF" />
      </View>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.dragHandle} />
          <View style={styles.header}>
            <Text style={styles.title}>{category.name}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm dịch vụ, thiết bị..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            <Pressable
              style={[styles.chip, selectedTargetId === 'ALL' && styles.chipActive]}
              onPress={() => setSelectedTargetId('ALL')}
            >
              <Text style={[styles.chipText, selectedTargetId === 'ALL' && styles.chipTextActive]}>
                Tất cả ({filteredServices.length})
              </Text>
            </Pressable>
            {targets.map((tgt) => (
              <Pressable
                key={tgt.id}
                style={[styles.chip, selectedTargetId === tgt.id && styles.chipActive]}
                onPress={() => setSelectedTargetId(tgt.id)}
              >
                <Text style={[styles.chipText, selectedTargetId === tgt.id && styles.chipTextActive]}>
                  {tgt.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {loading ? (
            <ActivityIndicator size="large" color="#0084FF" style={styles.loading} />
          ) : (
            <FlatList
              data={filteredServices}
              keyExtractor={(item) => item.id}
              renderItem={renderServiceItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Không tìm thấy dịch vụ phù hợp</Text>
              }
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default CategoryDetailModal;

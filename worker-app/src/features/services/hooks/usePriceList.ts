import { useState, useEffect, useMemo, useCallback } from 'react';
import { serviceCatalogService } from '../services/serviceCatalog.service';

export function usePriceList() {
  const [tree, setTree] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [expandedTargetIds, setExpandedTargetIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);

      const data = await serviceCatalogService.getServicesTree(force);
      setTree(data);
      if (data.length > 0 && !selectedCatId) {
        setSelectedCatId(data[0].id);
        // Mở sẵn đối tượng đầu tiên
        if (data[0].targets?.length > 0) {
          setExpandedTargetIds({ [data[0].targets[0].id]: true });
        }
      }
    } catch (err) {
      console.warn('⚠️ [usePriceList] Lỗi tải dữ liệu bảng giá:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCatId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleTarget = (targetId: string) => {
    setExpandedTargetIds((prev) => ({
      ...prev,
      [targetId]: !prev[targetId],
    }));
  };

  const currentCategory = useMemo(() => {
    return tree.find((c) => c.id === selectedCatId) || tree[0];
  }, [tree, selectedCatId]);

  const filteredTargets = useMemo(() => {
    if (!currentCategory) return [];
    if (!searchQuery.trim()) return currentCategory.targets || [];

    const q = searchQuery.toLowerCase();
    return (currentCategory.targets || [])
      .map((t: any) => {
        const matchesTarget = t.name.toLowerCase().includes(q);
        const matchedServices = (t.services || []).filter((s: any) =>
          s.name.toLowerCase().includes(q)
        );
        if (matchesTarget || matchedServices.length > 0) {
          return { ...t, services: matchedServices.length > 0 ? matchedServices : t.services };
        }
        return null;
      })
      .filter(Boolean);
  }, [currentCategory, searchQuery]);

  return {
    tree,
    currentCategory,
    selectedCatId,
    setSelectedCatId,
    expandedTargetIds,
    toggleTarget,
    searchQuery,
    setSearchQuery,
    filteredTargets,
    loading,
    refreshing,
    onRefresh: () => loadData(true),
  };
}

export default usePriceList;


import { useState, useEffect, useMemo } from 'react';
import { serviceCatalogService } from '../../services/services/serviceCatalog.service';
import type { CategoryItem } from '../types/home.types';

export function useCategoryDetailModal(category: CategoryItem | null, visible: boolean) {
  const [targets, setTargets] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !category) {
      setSearchQuery('');
      setSelectedTargetId('ALL');
      return;
    }

    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const tree = await serviceCatalogService.getServicesTree();
        const found = tree.find((c: any) => c.id === category?.id || c.slug === category?.slug);

        if (found && isMounted) {
          setTargets(found.targets || []);
          const flat = (found.targets || []).flatMap((t: any) =>
            (t.services || []).map((s: any) => ({ ...s, targetName: t.name, targetId: t.id }))
          );
          setAllServices(flat);
        } else if (isMounted) {
          const [tgts, svcs] = await Promise.all([
            serviceCatalogService.getTargetsByCategory(category?.id),
            serviceCatalogService.getServices(category?.id),
          ]);
          setTargets(tgts);
          setAllServices(svcs);
        }
      } catch (err) {
        console.warn('⚠️ [useCategoryDetailModal] Lỗi tải dữ liệu dịch vụ:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [category, visible]);

  const filteredServices = useMemo(() => {
    let list = allServices;
    if (selectedTargetId !== 'ALL') {
      list = list.filter((s) => s.targetId === selectedTargetId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.name?.toLowerCase().includes(q) || s.targetName?.toLowerCase().includes(q));
    }
    return list;
  }, [allServices, selectedTargetId, searchQuery]);

  return {
    targets,
    selectedTargetId,
    setSelectedTargetId,
    searchQuery,
    setSearchQuery,
    filteredServices,
    loading,
  };
}


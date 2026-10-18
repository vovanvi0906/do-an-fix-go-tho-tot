import { useState, useEffect } from 'react';
import { adminServicesService } from '../services/adminServices.service';
import type { CategoryItem } from '../../../types/category';
import type { ServiceItem } from '../../../types/service';

export function useCategoryServices(isOpen: boolean, category: CategoryItem | null) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !category) return;

    let isMounted = true;
    const categoryId = category.id;
    async function loadCategoryServices() {
      try {
        setLoading(true);
        setError(null);
        const res = (await adminServicesService.getServices({
          categoryId,
          limit: 100,
        })) as any;

        if (isMounted) {
          if (res?.data && Array.isArray(res.data)) {
            setServices(res.data);
          } else if (Array.isArray(res)) {
            setServices(res);
          } else {
            setServices([]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[useCategoryServices] Lỗi nạp dịch vụ:', err);
          setError(err?.response?.data?.message || err.message || 'Không thể tải danh sách dịch vụ.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCategoryServices();
    return () => {
      isMounted = false;
    };
  }, [isOpen, category]);

  return { services, loading, error };
}

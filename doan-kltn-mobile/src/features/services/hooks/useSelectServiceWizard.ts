import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { serviceCatalogService } from '../services/serviceCatalog.service';

export function useSelectServiceWizard() {
  const router = useRouter();
  const [tree, setTree] = useState<any[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTree() {
      try {
        setLoading(true);
        const data = await serviceCatalogService.getServicesTree();
        setTree(data);
      } catch (err) {
        console.warn('⚠️ [useSelectServiceWizard] Lỗi tải dữ liệu dịch vụ:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTree();
  }, []);

  const handleSelectCategory = (cat: any) => {
    setSelectedCategory(cat);
    setSelectedTarget(null);
    setStep(2);
  };

  const handleSelectTarget = (tgt: any) => {
    setSelectedTarget(tgt);
    setStep(3);
  };

  const handleSelectService = (service: any) => {
    router.push({
      pathname: '/(user)/booking/create-booking',
      params: {
        serviceId: service.id,
        serviceName: service.name,
        categoryId: selectedCategory?.id || '',
        categoryName: selectedCategory?.name || '',
        targetId: selectedTarget?.id || '',
        targetName: selectedTarget?.name || '',
        basePrice: String(service.basePrice || 150000),
      },
    });
  };

  const handleBackStep = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else router.back();
  };

  return {
    step,
    tree,
    selectedCategory,
    selectedTarget,
    loading,
    handleSelectCategory,
    handleSelectTarget,
    handleSelectService,
    handleBackStep,
  };
}

export default useSelectServiceWizard;


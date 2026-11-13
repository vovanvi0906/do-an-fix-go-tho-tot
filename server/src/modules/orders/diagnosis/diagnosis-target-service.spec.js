import { resolveDiagnosis } from './diagnosis-resolver';

describe('Diagnosis target and service ranking', () => {
  let prisma, ai;
  const category = { id: 'cat-1', slug: 'sua-dien', name: 'Sửa điện', basePrice: 100000 };
  const target1 = { id: 'tgt-1', categoryId: 'cat-1', slug: 'cong-tac-dien', name: 'Công tắc điện', isActive: true };
  const service1 = { id: 'srv-1', categoryId: 'cat-1', targetId: 'tgt-1', slug: 'sua-cong-tac-khong-hoat-dong',
    name: 'Sửa công tắc không hoạt động', basePrice: 100000, maxPrice: 200000, unit: 'điểm', isActive: true };
  const service2 = { id: 'srv-2', categoryId: 'cat-1', targetId: 'tgt-1', slug: 'thay-cong-tac-hong',
    name: 'Thay công tắc hỏng', basePrice: 120000, maxPrice: null, unit: 'điểm', isActive: true };

  beforeEach(() => {
    prisma = {
      serviceCategory: { findMany: jest.fn().mockResolvedValue([category]) },
      serviceTarget: { findMany: jest.fn().mockResolvedValue([target1]) },
      service: { findMany: jest.fn().mockResolvedValue([service1, service2]) },
    };
    ai = {
      confidenceThreshold: 0.6,
      diagnoseIncident: jest.fn().mockResolvedValue({
        engine: 'model', confidence: 0.85, suggestedCategoryId: 'sua-dien',
        suggestedTargetId: 'tgt-1', suggestedTargetName: 'Công tắc điện',
      }),
    };
  });

  it('rejects target belonging to a different category', async () => {
    await expect(
      resolveDiagnosis(prisma, ai, { imageUrl: 'https://img.test/1.jpg', answers: { categoryId: 'cat-1', targetId: 'foreign-target' } })
    ).rejects.toThrow('Thiết bị không thuộc danh mục');
  });

  it('passes target and scopes services when valid target is selected', async () => {
    const res = await resolveDiagnosis(prisma, ai, {
      imageUrl: 'https://img.test/1.jpg',
      answers: { categoryId: 'cat-1', targetId: 'tgt-1' },
    });
    expect(res.status).toBe('needs_more_info');
    expect(res.target).toEqual({ id: 'tgt-1', slug: 'cong-tac-dien', name: 'Công tắc điện' });
    expect(res.availableTargets).toHaveLength(1);
    expect(res.availableServices).toHaveLength(2);
  });

  it('ranks services and includes top ranked recommendations upon symptom confirmation', async () => {
    const res = await resolveDiagnosis(prisma, ai, {
      imageUrl: 'https://img.test/1.jpg',
      answers: { categoryId: 'cat-1', targetId: 'tgt-1', symptom: 'switch_power' },
    });
    expect(res.status).toBe('suggested');
    expect(res.source).toBe('rules');
    expect(res.suggestedServiceId).toBe('srv-1');
    expect(res.suggestedServices.length).toBeGreaterThan(0);
    expect(res.suggestedServices[0].id).toBe('srv-1');
    expect(res.suggestedServices[0].reason).toContain('Khớp chính xác triệu chứng');
  });

  it('excludes inactive services from suggestions', async () => {
    prisma.service.findMany.mockResolvedValue([]);
    const res = await resolveDiagnosis(prisma, ai, { imageUrl: 'https://img.test/1.jpg' });
    expect(res.availableServices).toEqual([]);
    expect(res.suggestedServiceId).toBeNull();
  });

  it('rejects invalid or missing imageUrl with BadRequestException', async () => {
    await expect(resolveDiagnosis(prisma, ai, { imageUrl: '' })).rejects.toThrow('Dữ liệu chẩn đoán không hợp lệ');
    await expect(resolveDiagnosis(prisma, ai, null)).rejects.toThrow('Dữ liệu chẩn đoán không hợp lệ');
  });

  it('handles unknown object with image_uncertain status', async () => {
    ai.diagnoseIncident.mockResolvedValue({ engine: 'model', confidence: 0.35, suggestedCategoryId: 'unknown' });
    const res = await resolveDiagnosis(prisma, ai, { imageUrl: 'https://img.test/1.jpg' });
    expect(res.status).toBe('manual_selection');
    expect(res.reason).toBe('image_uncertain');
    expect(res.suggestedCategoryId).toBeNull();
  });
});

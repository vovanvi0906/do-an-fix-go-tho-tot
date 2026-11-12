import { resolveDiagnosis } from './diagnosis-resolver';

const category = { id: 'cat-1', slug: 'dien-lanh', name: 'Điện lạnh', basePrice: 100000 };
const service = { id: 'srv-1', categoryId: 'cat-1', slug: 'sua-may-lanh-chay-nuoc',
  name: 'Sửa máy lạnh chảy nước', basePrice: 180000, maxPrice: 350000, unit: 'máy' };

describe('Diagnosis workflow', () => {
  let prisma, ai;
  const input = { imageUrl: 'https://example.test/incident.jpg' };
  beforeEach(() => {
    prisma = { serviceCategory: { findMany: jest.fn().mockResolvedValue([category]) },
      service: { findMany: jest.fn().mockResolvedValue([service]) } };
    ai = { confidenceThreshold: 0.6, diagnoseIncident: jest.fn().mockResolvedValue({
      engine: 'model', confidence: 0.8, suggestedCategoryId: 'dien-lanh',
      suggestedServiceId: service.slug,
    }) };
  });
  it('asks for symptoms even when the image model returns a service', async () => {
    const result = await resolveDiagnosis(prisma, ai, input);
    expect(result.status).toBe('needs_more_info');
    expect(result.suggestedServiceId).toBeNull();
    expect(result.questions[0].options).toEqual([{ value: 'ac_leak', label: 'Máy lạnh chảy nước' }]);
  });
  it('does not turn an outage or heuristic into a diagnosis', async () => {
    ai.diagnoseIncident.mockResolvedValue({ engine: 'heuristic', confidence: 0.93, suggestedCategoryId: 'sua-dien' });
    const result = await resolveDiagnosis(prisma, ai, input);
    expect(result.status).toBe('unavailable');
    expect(result.confidence).toBeNull();
    expect(result.suggestedCategoryId).toBeNull();
  });
  it.each([0, 0.59, null, NaN, 2])('rejects insufficient/invalid score %s', async confidence => {
    ai.diagnoseIncident.mockResolvedValue({ engine: 'model', confidence, suggestedCategoryId: 'dien-lanh' });
    const result = await resolveDiagnosis(prisma, ai, input);
    expect(result.status).toBe('manual_selection');
    expect(result.suggestedCategoryId).toBeNull();
  });
  it('does not replace an unknown category with the first category', async () => {
    ai.diagnoseIncident.mockResolvedValue({ engine: 'model', confidence: 0.99, suggestedCategoryId: 'missing' });
    expect((await resolveDiagnosis(prisma, ai, input)).suggestedCategoryId).toBeNull();
  });
  it('resolves confirmed symptom to the exact active DB service and catalog price', async () => {
    const result = await resolveDiagnosis(prisma, ai, { ...input,
      answers: { categoryId: category.id, symptom: 'ac_leak' } });
    expect(result).toMatchObject({ status: 'suggested', source: 'rules', suggestedServiceId: service.id,
      confidence: null, suggestedServiceConfidence: null, estimatedPriceMin: 180000, estimatedPriceMax: 350000 });
    expect(ai.diagnoseIncident).not.toHaveBeenCalled();
  });
  it('allows manual service selection without AI', async () => {
    expect(await resolveDiagnosis(prisma, ai, { ...input,
      answers: { categoryId: category.id, serviceId: service.id } })).toMatchObject({ status: 'suggested', source: 'manual' });
  });
  it.each([
    { categoryId: 'missing' }, { categoryId: category.id, serviceId: 'foreign-service' },
    { categoryId: category.id, symptom: 'unsupported' }, { serviceId: service.id },
    { categoryId: category.id, unknown: 'x' },
  ])('rejects forged or stale answers %j', async answers => {
    await expect(resolveDiagnosis(prisma, ai, { ...input, answers })).rejects.toThrow();
  });
  it('never manufactures an upper price when catalog has none', async () => {
    prisma.service.findMany.mockResolvedValue([{ ...service, maxPrice: null }]);
    const result = await resolveDiagnosis(prisma, ai, { ...input, answers: { categoryId: category.id, serviceId: service.id } });
    expect(result.estimatedPriceMax).toBeNull();
    expect(result.estimatedPriceRange.formatted).toContain('Từ');
  });
  it('does not offer a symptom whose mapped service has been disabled', async () => {
    prisma.service.findMany.mockResolvedValue([]);
    const result = await resolveDiagnosis(prisma, ai, input);
    expect(result.questions).toEqual([]);
    expect(result.suggestedServiceId).toBeNull();
  });
});

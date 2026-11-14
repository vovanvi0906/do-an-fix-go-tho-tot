// Read-only catalog integration check. AI is a stub, not an inference benchmark.
require('@babel/register')({ extensions: ['.js'] });
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const { resolveDiagnosis } = require('../src/modules/orders/diagnosis/diagnosis-resolver');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
      const target = await tx.serviceTarget.findFirst({ where: { slug: 'tu-lanh-tu-lanh-side-by-side', isActive: true, category: { isActive: true } }, include: { category: true } });
      if (!target) { console.log('SKIP: active refrigerator catalog target is missing'); return; }
      const ai = { confidenceThreshold: .6, diagnoseIncident: async () => ({ engine: 'model', confidence: .85, suggestedCategoryId: target.category.slug, suggestedTargetId: target.slug }) };
      const imageUrl = 'https://example.test/catalog-contract-only.jpg';
      const initial = await resolveDiagnosis(tx, ai, { imageUrl });
      assert.equal(initial.suggestedTargetId, target.id);
      assert.equal(initial.suggestedCategoryId, target.categoryId);
      assert.equal(initial.availableServices.length, 0);
      const answers = { categoryId: target.categoryId, targetId: target.id };
      const confirmed = await resolveDiagnosis(tx, ai, { imageUrl, answers });
      assert(confirmed.availableServices.every(s => s.targetId === target.id));
      const frost = confirmed.questions.flatMap(q => q.options).find(o => o.value === 'fridge_frost');
      assert(frost, 'Verified active catalog frost service must have a user-reported symptom option');
      const recommendation = await resolveDiagnosis(tx, ai, { imageUrl, answers: { ...answers, symptom: frost.value } });
      assert.equal(recommendation.suggestedServices.length, 1);
      const service = await tx.service.findUnique({ where: { id: recommendation.suggestedServiceId } });
      assert.equal(service.slug, 'sua-ngan-mat-dong-tuyet');
      assert.equal(recommendation.estimatedPriceMin, Number(service.basePrice));
      const other = await tx.serviceCategory.findFirst({ where: { isActive: true, id: { not: target.categoryId } } });
      assert(other, 'Requires a second active category');
      await assert.rejects(() => resolveDiagnosis(tx, ai, { imageUrl, answers: { categoryId: other.id, targetId: target.id } }), e => e.getStatus() === 400 && e.getResponse().code === 'TARGET_CATEGORY_MISMATCH');
      await assert.rejects(() => resolveDiagnosis(tx, ai, { imageUrl, answers: { ...answers, symptom: 'washer_spin' } }));
      console.log(JSON.stringify({ status: 'PASS', readOnly: true, aiStub: true, categoryId: target.categoryId, targetId: target.id, serviceId: service.id, serviceName: service.name, priceFromDatabase: recommendation.estimatedPriceMin, invalidPairRejected: true, wrongSymptomRejected: true }, null, 2));
    });
  } finally { await prisma.$disconnect(); }
})().catch(error => { console.error('FAIL', error.code || error.message); process.exitCode = 1; });

// Replay real AI responses through the backend resolver without a database or booking.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { resolveDiagnosis } = require('../dist/modules/orders/diagnosis/diagnosis-resolver');
async function main() {
  const [input, output, expectedVersion = 'fixgo-multiservice-observer-v2-tested'] = process.argv.slice(2);
  if (!input || !output) throw new Error('Usage: node scripts/smoke-multiservice-evidence.cjs AI_SMOKE_JSON OUTPUT_JSON');
  if (fs.existsSync(output)) throw new Error('Evidence already exists');
  const smoke = JSON.parse(fs.readFileSync(input, 'utf8'));
  const categories = ['sua-dien','sua-nuoc','dien-lanh','thiet-bi','giup-viec','lam-vuon'].map(slug => ({ id: `db-${slug}`, slug, name: slug, basePrice: null }));
  const prisma = { serviceCategory: { findMany: async () => categories }, serviceTarget: { findMany: async () => [] }, service: { findMany: async () => [] } };
  const results = [];
  for (const item of smoke.cases) {
    const result = await resolveDiagnosis(prisma, { diagnoseIncident: async () => item.response }, { imageUrl: 'https://integration.invalid/development-image.jpg' });
    assert.equal(result.observableAnalysis.modelVersion, expectedVersion);
    assert.equal(result.observableAnalysis.proposals.length, item.response.observableAnalysis.proposals.length);
    assert.equal(result.suggestedServiceId, null);
    assert.deepEqual(result.reportedSymptoms, []);
    assert.deepEqual(result.visualServiceSuggestions, []);
    results.push({ scope: item.scope, imageId: item.imageId, result });
  }
  fs.writeFileSync(output, JSON.stringify({ status: 'PASSED', accuracyClaim: false, databaseUsed: false, cases: results }, null, 2)+'\n', { flag: 'wx' });
  console.log(JSON.stringify({ status: 'PASSED', cases: results.length, output }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

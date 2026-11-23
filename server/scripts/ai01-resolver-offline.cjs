// Evaluation only: no Prisma, network, application bootstrap, or database writes.
const fs = require('node:fs');
const path = require('node:path');
require('@babel/register')({ extensions: ['.js'], configFile: false,
  babelrc: false, presets: [[require.resolve('@babel/preset-env'), {targets: {node: 'current'}}]] });
const {resolveDiagnosis} = require('../src/modules/orders/diagnosis/diagnosis-resolver');
const catalog = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
function matches(row, where = {}) {
  return Object.entries(where).every(([key, value]) => {
    if (value && typeof value === 'object') {
      if (Array.isArray(value.in)) return value.in.includes(row[key]);
      return matches(row[key] || {}, value);
    }
    return row[key] === value;
  });
}
function table(rows) {
  return {findMany: async ({where, orderBy} = {}) => {
    let out = rows.filter(r => matches(r, where));
    for (const order of [...(Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [])].reverse()) {
      const [key, direction] = Object.entries(order)[0];
      out.sort((a,b) => String(a[key] ?? '').localeCompare(String(b[key] ?? ''), 'en', {numeric:true}) * (direction === 'desc' ? -1 : 1));
    }
    return out;
  }, findUnique: async ({where}) => rows.find(r => matches(r, where)) || null};
}
const categories = catalog.categories;
const targets = catalog.targets.map(t => ({...t, category: categories.find(c => c.id === t.categoryId)}));
const services = catalog.services.map(s => ({...s, category: categories.find(c => c.id === s.categoryId), target: targets.find(t => t.id === s.targetId)}));
const symptoms = catalog.symptoms || [];
const links = (catalog.symptomServices || []).map(l => ({...l, service: services.find(s => s.id === l.serviceId), symptom: symptoms.find(s => s.id === l.symptomId)}));
const db = {serviceCategory: table(categories), serviceTarget: table(targets), service: table(services), symptom: table(symptoms), symptomService: table(links)};
const readline = require('node:readline').createInterface({input: process.stdin});
readline.on('line', async line => {
  try {
    const request = JSON.parse(line);
    const ai = {confidenceThreshold: request.threshold,
      diagnoseIncident: async () => request.prediction}; // Fresh inference from runner, never GT.
    const started = performance.now();
    const result = await resolveDiagnosis(db, ai, request.input);
    process.stdout.write(JSON.stringify({result, resolverMs: performance.now()-started})+'\n');
  } catch (error) {
    process.stdout.write(JSON.stringify({error: {type: error.constructor.name, message: error.message,
      detail: error.getResponse?.()}})+'\n');
  }
});

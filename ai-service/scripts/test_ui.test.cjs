// Run from repository root: node --test ai-service/scripts/test_ui.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require(require.resolve('jsdom', {
  paths: [path.resolve(__dirname, '../../doan-kltn-mobile')],
}));
const html = fs.readFileSync(path.join(__dirname, 'test_ui.html'), 'utf8');
function page() {
  const downloads = [];
  const dom = new JSDOM(html, { runScripts: 'dangerously', beforeParse(window) {
    window.URL.createObjectURL = blob => { downloads.push(blob); return `blob:test-${downloads.length}`; };
    window.URL.revokeObjectURL = () => {};
    window.HTMLAnchorElement.prototype.click = () => {};
    window.Blob = Blob;
  } });
  return { window: dom.window, downloads };
}
function base(extra = {}) {
  return { engine: 'model', confidence: 0.8, detectedLabels: ['dien_lanh'],
    suggestedCategoryId: 'dien-lanh', suggestedCategoryName: 'Điện lạnh', ...extra };
}
async function run(window, responses, names) {
  const calls = [];
  window.fetch = async (url, options) => {
    calls.push({ url, options });
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return { ok: true, json: async () => response };
  };
  const input = window.document.getElementById('fileInput');
  Object.defineProperty(input, 'files', { configurable: true,
    value: names.map(name => new window.File(['image'], name, { type: 'image/jpeg' })) });
  input.dispatchEvent(new window.Event('change'));
  window.document.getElementById('btnRun').click();
  for (let i = 0; i < 100 && input.disabled; i++) await new Promise(resolve => setImmediate(resolve));
  assert.equal(input.disabled, false, 'batch must release controls');
  return calls;
}
test('never promotes an unaccepted CLIP candidate or invents garden services', () => {
  const { window } = page();
  const result = window.normalizeDiagnosis(base({ suggestedCategoryId: null, suggestedCategoryName: null,
    clip_label: 'lam_vuon', clip_probs: { lam_vuon: 0.4, other_unclear: 0.6 } }));
  assert.equal(result.categoryKey, 'other-unclear');
  assert.equal(result.status, 'UNCERTAIN');
  assert.equal(result.targetName, null);
  assert.equal(result.suggestedServiceName, null);
  assert.equal(result.estimatedPriceRange, '');
  assert.equal(result.clipLabel, 'other_unclear');
  window.close();
});
test('preserves zero and unavailable scores, and missing upper prices', () => {
  const { window } = page();
  assert.equal(window.percent(0), '0.0%');
  assert.equal(window.percent(null), 'Chưa có');
  assert.equal(window.normalizeDiagnosis(base({ engine: 'unavailable', confidence: null })).status, 'UNAVAILABLE');
  assert.match(window.formatPrice({ min: 0, max: null }, 'máy'), /^Từ 0 đ \/ máy$/);
  window.close();
});
test('renders target/service separately, filters targets, exports raw results, sends neutral filenames', async () => {
  const { window, downloads } = page();
  const doc = window.document;
  const raw = base({ suggestedTargetId: 'may-lanh', suggestedTargetName: 'Máy lạnh',
    suggestedServiceId: 'sua-may-lanh-chay-nuoc', suggestedServiceName: 'Sửa máy lạnh chảy nước',
    suggestedServiceConfidence: 0, estimatedPriceRange: { min: 180000, max: null, unit: 'máy' },
    clip_label: 'sua_dien', clip_probs: { dien_lanh: 0.85, sua_dien: 0.15 },
    all_probs: { dien_lanh: 0.75, sua_dien: 0.25 } });
  const calls = await run(window, [raw, base({ suggestedCategoryId: 'lam-vuon', suggestedCategoryName: 'Làm vườn' })],
    ['sua_dien_leaked.jpg', 'garden.jpg']);
  assert.equal(calls[0].options.body.get('file').name, 'incident-image');
  assert.equal(calls[0].options.body.has('description'), false);
  assert.equal(calls[0].options.body.has('imageUrl'), false);
  assert.match(doc.getElementById('target-0').textContent, /Máy lạnh/);
  assert.match(doc.getElementById('service-0').textContent, /Sửa máy lạnh chảy nước/);
  assert.match(doc.getElementById('service-1').textContent, /Chưa có đề xuất/);
  assert.match(doc.getElementById('clip-0').textContent, /CLIP: dien_lanh/);
  assert.equal(doc.querySelectorAll('[id="imageModal"]').length, 1);
  doc.getElementById('filterTarget').value = 'Máy lạnh';
  doc.getElementById('filterTarget').dispatchEvent(new window.Event('change'));
  assert.equal(doc.getElementById('row-0').style.display, 'grid');
  assert.equal(doc.getElementById('row-1').style.display, 'none');
  doc.getElementById('btnExportJson').click();
  const report = JSON.parse(await downloads.at(-1).text());
  assert.equal(report.targetStatistics['Máy lạnh'], 1);
  assert.equal(report.details[0].targetId, 'may-lanh');
  assert.deepEqual(report.details[0].rawResponse, raw);
  doc.getElementById('btnExportCsv').click();
  assert.match(await downloads.at(-1).text(), /"Đối tượng","Mã đối tượng"/);
  window.close();
});
test('a failed rerun clears the previous service, object and scores', async () => {
  const { window } = page();
  await run(window, [base({ suggestedTargetName: 'Máy lạnh', suggestedServiceName: 'Sửa máy lạnh' })], ['a.jpg']);
  await run(window, [new Error('offline')], ['a.jpg']);
  const doc = window.document;
  assert.equal(doc.getElementById('status-0').textContent, 'Lỗi yêu cầu');
  assert.doesNotMatch(doc.getElementById('target-0').textContent, /Máy lạnh/);
  assert.doesNotMatch(doc.getElementById('service-0').textContent, /Sửa máy lạnh/);
  assert.equal(doc.getElementById('score-0').textContent, 'Chưa có');
  window.close();
});
test('HTML escapes model labels and CSV protects spreadsheet formulas', () => {
  const { window } = page();
  assert.equal(window.escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
  assert.equal(window.escapeCsv('=SUM(A1)'), '"\'=SUM(A1)"');
  window.close();
});

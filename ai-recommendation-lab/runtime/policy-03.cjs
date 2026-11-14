const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../.."),
  f = JSON.parse(
    fs.readFileSync(
      path.join(root, "ai-recommendation-lab/.runtime/fixtures.json"),
    ),
  ),
  cases = [];
const base = "http://127.0.0.1:3108/api";
async function call(pathname, init = {}) {
  const res = await fetch(base + pathname, init);
  return { status: res.status, body: await res.json() };
}
async function test(name, query, status, ids) {
  const r = await call(
    "/services/recommendations?" +
      new URLSearchParams({
        categoryId: f.categoryId,
        targetId: f.targetId,
        symptomIds: f.symptoms[query] || query,
        limit: "3",
        ...ids,
      }),
  );
  const pass = r.status === status;
  cases.push({
    name,
    result: pass ? "PASS" : "FAIL",
    status: r.status,
    code: r.body.code || null,
    items: r.body.items?.map((s) => ({
      id: s.id,
      price: s.basePrice,
      reason: s.reason,
      targetId: s.targetId,
      categoryId: s.categoryId,
    })),
  });
  assert(pass, name);
  return r;
}
(async () => {
  const one = await test("one_service", "one", 200);
  assert.equal(one.body.items.length, 1);
  assert.equal(one.body.items[0].basePrice, 110000);
  const three = await test("exact_three_mappings", "three", 200);
  assert.equal(three.body.items.length, 3);
  assert.equal(three.body.hasMore, false);
  const many = await test("four_valid_mappings_cap_three", "many", 200);
  assert.equal(many.body.items.length, 3);
  assert.equal(many.body.hasMore, true);
  for (const code of ["empty", "inactive-mapping", "inactive-service"]) {
    const r = await test(code, code, 200);
    assert.equal(r.body.items.length, 0);
  }
  for (const code of ["needs-review", "inactive", "foreign"])
    await test(code, code, 400);
  await test("category_target_mismatch", "one", 400, {
    categoryId: "wrong-category",
  });
  await test("limit_four_rejected", "many", 400, { limit: "4" });
  const list = await call(
    `/service-targets/${f.targetId}/symptoms?categoryId=${f.categoryId}`,
  );
  assert.equal(list.status, 200);
  assert(
    !list.body.some((s) =>
      [
        f.symptoms["needs-review"],
        f.symptoms.inactive,
        f.symptoms.foreign,
      ].includes(s.id),
    ),
  );
  cases.push({
    name: "public_approved_active_ownership_filter",
    result: "PASS",
    count: list.body.length,
  });
  const disabled = await fetch(
    "http://127.0.0.1:3110/api/services/recommendations?" +
      new URLSearchParams({ targetId: f.targetId, symptomIds: f.symptoms.one }),
  );
  const b = await disabled.json();
  assert.equal(disabled.status, 503);
  assert.equal(b.code, "SYMPTOM_CATALOG_NOT_ENABLED");
  cases.push({
    name: "catalog_disabled_is_503_not_empty",
    result: "PASS",
    code: b.code,
  });
  for (const backend of [true, false]) {
    const url = backend
      ? base + "/internal/recommendation/inspect"
      : "http://127.0.0.1:8108/ai/v2/internal/diagnose-debug";
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(r.status, 401);
    cases.push({
      name: (backend ? "backend" : "ai") + "_debug_unauthorized",
      result: "PASS",
      status: r.status,
    });
  }
  const token = fs
    .readFileSync(
      path.join(root, "ai-recommendation-lab/.runtime/debug-token"),
      "utf8",
    )
    .trim();
  const image =
    "data:image/jpeg;base64," +
    fs
      .readFileSync(
        path.join(root, "ai-service/dataset/test/dien_lanh/dien_lanh_0001.jpg"),
      )
      .toString("base64");
  const r = await call("/internal/recommendation/inspect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
      "X-Request-ID": "lab03-telemetry-chain",
    },
    body: JSON.stringify({ imageUrl: image }),
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.debug.requestId, "lab03-telemetry-chain");
  assert.equal(r.body.backend.requestId, "lab03-telemetry-chain");
  assert.equal(r.body.debug.gates.categoryMinConfidence, 0.48);
  assert.equal(r.body.backend.confidenceThreshold, 0.6);
  assert.equal(r.body.debug.catalog.targetCount, 70);
  assert.equal(r.body.debug.catalog.source, "backend");
  assert.equal(r.body.debug.gates.categoryAccepted, true);
  assert.equal(r.body.backend.categoryThresholdPassed, false);
  cases.push({
    name: "same_request_telemetry_and_unchanged_thresholds",
    result: "PASS",
  });
  fs.writeFileSync(
    path.join(root, "docs/ai-labs/runtime-03/telemetry.json"),
    JSON.stringify(r.body, null, 2),
  );
})()
  .catch((e) => {
    cases.push({ name: "execution", result: "FAIL", message: e.message });
    process.exitCode = 1;
  })
  .finally(() => {
    fs.writeFileSync(
      path.join(root, "docs/ai-labs/runtime-03/policy.json"),
      JSON.stringify({ cases }, null, 2),
    );
    console.log(JSON.stringify(cases, null, 2));
  });

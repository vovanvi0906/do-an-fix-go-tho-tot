// Actual loopback HTTP integration. No mocks, no DB writes. Uploads synthetic image to configured Cloudinary.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const root = path.resolve(__dirname, "../..");
const out = path.join(root, "docs/ai-labs/runtime-02/http-evidence.json");
const records = [],
  cases = [];
function sanitize(v) {
  if (typeof v === "string")
    return v
      .replace(/https?:\/\/[^\s"<>]+/g, "[URL REDACTED]")
      .replace(/data:image[^\s]+/g, "[IMAGE REDACTED]");
  if (Array.isArray(v)) return v.map(sanitize);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [
        k,
        /imageurl|secret|token|credential/i.test(k)
          ? "[REDACTED]"
          : sanitize(x),
      ]),
    );
  return v;
}
async function request(base, url, init = {}) {
  const id = crypto.randomUUID(),
    start = performance.now();
  const res = await fetch(base + url, {
    ...init,
    headers: { ...init.headers, "X-Request-ID": id },
    signal: AbortSignal.timeout(60000),
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  records.push({
    method: init.method || "GET",
    endpoint: url,
    clientRequestId: id,
    headerRequestId: res.headers.get("x-request-id"),
    bodyRequestId: body.requestId || null,
    status: res.status,
    elapsedMs: performance.now() - start,
    response: sanitize(body),
  });
  return { status: res.status, body };
}
const backend = "http://127.0.0.1:3108/api",
  ai = "http://127.0.0.1:8108";
const json = (body) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const dataUrl = (file) =>
  "data:image/jpeg;base64," + fs.readFileSync(file).toString("base64");
function check(name, pass, notes) {
  cases.push({ name, result: pass ? "PASS" : "FAIL", notes });
}
(async () => {
  await request(ai, "/health");
  await request(ai, "/ai/v2/catalog/status");
  const categories = await request(backend, "/service-categories");
  // Keep public catalog response compact: IDs/counts sufficient for this evidence.
  records.at(-1).response = {
    categoryCount: categories.body.length,
    serviceCount: categories.body.reduce((n, c) => n + c.services.length, 0),
  };
  const image = path.join(
    root,
    "ai-service/dataset/test/lam_vuon/lam_vuon_0001.jpg",
  );
  const form = new FormData();
  form.append(
    "image",
    new Blob([fs.readFileSync(image)], { type: "image/jpeg" }),
    "rec-lab-02-synthetic.jpg",
  );
  form.append("description", "");
  form.append("answers", "{}");
  const upload = await request(backend, "/orders/diagnose-upload", {
    method: "POST",
    body: form,
  });
  check(
    "storage_upload_and_backend_diagnosis",
    upload.status === 201 &&
      !!upload.body.imageUrl &&
      upload.body.status !== "unavailable",
    { status: upload.status, diagnosisStatus: upload.body.status },
  );
  let result = upload.body;
  if (upload.status === 201 && result.category) {
    // Explicit user confirmation from active DB catalog. Does not fabricate AI target.
    const targetId =
      result.suggestedTargetId || result.availableTargets?.[0]?.id;
    if (targetId) {
      const confirm = await request(
        backend,
        "/orders/diagnose",
        json({
          imageUrl: result.imageUrl,
          answers: { categoryId: result.category.id, targetId },
        }),
      );
      check(
        "canonical_category_target_confirmation",
        confirm.status === 201 && confirm.body.target?.id === targetId,
        {
          aiSuggested: !!result.suggestedTargetId,
          userSelectedFallback: !result.suggestedTargetId,
        },
      );
      const symptoms = await request(
        backend,
        `/service-targets/${targetId}/symptoms?categoryId=${result.category.id}`,
      );
      check(
        "catalog_disabled_returns_503",
        symptoms.status === 503 &&
          symptoms.body.code === "SYMPTOM_CATALOG_NOT_ENABLED",
        symptoms.body.code,
      );
      const recommend = await request(
        backend,
        `/services/recommendations?targetId=${targetId}&categoryId=${result.category.id}&symptomIds=not-approved&limit=3`,
      );
      check(
        "recommendations_gated_without_approved_schema",
        recommend.status === 503,
        recommend.body.code,
      );
    }
  }
  for (const folder of ["dien_lanh", "sua_dien", "other_unclear"]) {
    const f = path.join(
      root,
      `ai-service/dataset/test/${folder}/${folder}_0001.jpg`,
    );
    const uri = dataUrl(f);
    const raw = await request(ai, "/ai/v2/diagnose", json({ imageUrl: uri }));
    const diagnosis = await request(
      backend,
      "/orders/diagnose",
      json({ imageUrl: uri }),
    );
    if (folder === "dien_lanh")
      check(
        "threshold_difference_kept",
        raw.status === 200 && diagnosis.status === 201,
        {
          v2Category: raw.body.suggestedCategoryId,
          v2Confidence: raw.body.confidence,
          backendCategory: diagnosis.body.category,
          backendReasonCodes: diagnosis.body.reasonCodes,
        },
      );
    else
      check(
        `low_confidence_or_ood_${folder}`,
        diagnosis.status === 201 && !diagnosis.body.category,
        {
          v2Source: raw.body.decision_source,
          backendStatus: diagnosis.body.status,
          backendReasonCodes: diagnosis.body.reasonCodes,
        },
      );
  }
  const corrupt = new FormData();
  corrupt.append(
    "image",
    new Blob(["not-an-image"], { type: "image/jpeg" }),
    "invalid.jpg",
  );
  const invalid = await request(backend, "/orders/diagnose-upload", {
    method: "POST",
    body: corrupt,
  });
  check("corrupt_storage_upload_rejected", invalid.status >= 400, {
    status: invalid.status,
  });
  check(
    "corrupt_upload_has_actionable_4xx",
    invalid.status >= 400 && invalid.status < 500,
    {
      status: invalid.status,
      issue: "Storage error currently mapped to generic 500",
    },
  );
  const missing = await request(backend, "/orders/diagnose-upload", {
    method: "POST",
    body: new FormData(),
  });
  check("missing_upload_rejected", missing.status === 400, {
    status: missing.status,
  });
  const forbidden = await request(backend, "/orders", {
    method: "POST",
    body: "{}",
    headers: { "Content-Type": "application/json" },
  });
  check("non_diagnosis_route_disabled", forbidden.status === 404, {
    status: forbidden.status,
  });
  cases.push(
    {
      name: "approved_symptoms_service_success",
      result: "BLOCKED",
      notes:
        "Main DB has no symptom tables; shared flag unset. No approvals/migrations performed.",
    },
    {
      name: "no_active_mapping_real_catalog",
      result: "BLOCKED",
      notes: "No approved schema/data to exercise genuine empty mapping.",
    },
  );
})()
  .catch((e) =>
    cases.push({ name: "runtime_transport", result: "FAIL", notes: e.name }),
  )
  .finally(() => {
    fs.writeFileSync(
      out,
      JSON.stringify(
        {
          at: new Date().toISOString(),
          kind: "actual_loopback_http_real_models_real_catalog_readonly_real_cloudinary",
          cases,
          records,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(JSON.stringify(cases, null, 2));
  });

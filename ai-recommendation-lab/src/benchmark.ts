import { ApiError, LabApi, validateImage, redact, type Trace } from "./api";
import type { Diagnosis, ModelResult, Service } from "./contracts";
export type Sample = {
  id: string;
  image: string;
  category: string | null;
  target: string | null;
  serviceIds: string[];
  symptomIds: string[];
  description?: string;
  sha256?: string;
  source?: string;
  annotationVersion?: string;
};
export type Manifest = {
  version: 1 | 2;
  dataset?: {
    source: string;
    split: "eval" | "test";
    labelReview: "reviewed";
    trainImageSha256: string[];
  };
  provenance: "real" | "synthetic";
  samples: Sample[];
};
export type RecordResult = {
  sampleId: string;
  image: string;
  imageSha256: string | null;
  provenance: string;
  mode: "real_http_inference";
  at: string;
  modelVersion: string | null;
  backendVersion: string | null;
  source?: string;
  annotationVersion?: string;
  dataset?: Manifest["dataset"];
  modelFingerprint?: Record<string, unknown>;
  configGates?: Record<string, unknown>;
  catalogSnapshot?: Record<string, unknown>;
  telemetrySampledSeparately?: boolean;
  expectedCategory: string | null;
  expectedTarget: string | null;
  expectedServiceIds: string[];
  predictedCategory: string | null;
  predictedTargetIds: string[];
  predictedServiceIds: string[];
  categoryCorrect: boolean;
  targetTop3: boolean | null;
  targetTop1?: boolean | null;
  falseRecommendations?: number | null;
  serviceRecall3: number | null;
  abstained: boolean;
  latencyMs: number;
  inferenceMs: number | null;
  error?: string;
  failedStage?: string;
  traces: Trace[];
};
export function parseManifest(text: string): Manifest {
  const m = JSON.parse(text) as Manifest;
  if (
    ![1, 2].includes(m.version) ||
    !["real", "synthetic"].includes(m.provenance) ||
    !Array.isArray(m.samples) ||
    !m.samples.length ||
    m.samples.length > 1000
  )
    throw new Error(
      "MANIFEST_INVALID: version=1, provenance=real|synthetic, 1–1000 samples.",
    );
  if (m.version === 2) {
    if (
      !m.dataset?.source ||
      !["eval", "test"].includes(m.dataset.split) ||
      m.dataset.labelReview !== "reviewed" ||
      !Array.isArray(m.dataset.trainImageSha256)
    )
      throw new Error("DATASET_PROVENANCE_REQUIRED");
    const hashes = m.samples.map((s) => s.sha256);
    if (
      hashes.some((h) => !h || !/^[a-f0-9]{64}$/.test(h)) ||
      new Set(hashes).size !== hashes.length ||
      hashes.some((h) => m.dataset!.trainImageSha256.includes(h!))
    )
      throw new Error("DATASET_HASH_OR_TRAIN_EVAL_LEAKAGE");
    if (m.samples.some((s) => !s.source || !s.annotationVersion))
      throw new Error("LABEL_PROVENANCE_REQUIRED");
  }
  const ids = new Set();
  for (const s of m.samples) {
    if (
      !s ||
      typeof s.id !== "string" ||
      !s.id ||
      ids.has(s.id) ||
      typeof s.image !== "string" ||
      !s.image ||
      s.image.startsWith("/") ||
      s.image.split("/").some((p) => p === ".." || p === ".") ||
      /[\\:?#]/.test(s.image) ||
      !(
        s.category === null ||
        (typeof s.category === "string" && !!s.category)
      ) ||
      !(s.target === null || (typeof s.target === "string" && !!s.target)) ||
      !Array.isArray(s.serviceIds) ||
      !Array.isArray(s.symptomIds) ||
      [...s.serviceIds, ...s.symptomIds].some(
        (id) => typeof id !== "string" || !id,
      ) ||
      new Set(s.serviceIds).size !== s.serviceIds.length ||
      new Set(s.symptomIds).size !== s.symptomIds.length ||
      s.symptomIds.length > 10 ||
      (s.description !== undefined && typeof s.description !== "string")
    )
      throw new Error("MANIFEST_SAMPLE_INVALID");
    if (
      (s.category === null && (s.target !== null || s.serviceIds.length)) ||
      (s.target === null && s.serviceIds.length)
    )
      throw new Error("GROUND_TRUTH_INCONSISTENT");
    ids.add(s.id);
  }
  return m;
}
export function scoreSample(
  s: Sample,
  model: ModelResult,
  diagnosis: Diagnosis | null,
  services: Service[],
) {
  const predictedCategory = model.suggestedCategoryId || null;
  const predictedTargetIds = [
    ...new Set(
      (model.targetCandidates || []).slice(0, 3).flatMap((t) => {
        if (!t.targetId) return [];
        const canonical = diagnosis?.availableTargets.find(
          (v) => v.id === t.targetId || v.slug === t.targetId,
        );
        return [
          t.targetId,
          ...(canonical
            ? [canonical.id, ...(canonical.slug ? [canonical.slug] : [])]
            : []),
        ];
      }),
    ),
  ];
  const targetHit =
    s.target === null ? null : predictedTargetIds.includes(s.target);
  return {
    predictedCategory,
    predictedTargetIds,
    predictedServiceIds: services.slice(0, 3).map((s) => s.id),
    categoryCorrect: predictedCategory === s.category,
    targetTop3: targetHit,
    targetTop1:
      s.target === null
        ? null
        : (() => {
            const first = model.targetCandidates?.[0]?.targetId;
            const canonical = diagnosis?.availableTargets.find(
              (v) => v.id === first || v.slug === first,
            );
            return !!(
              first === s.target ||
              canonical?.id === s.target ||
              canonical?.slug === s.target
            );
          })(),
    falseRecommendations: s.serviceIds.length
      ? services.slice(0, 3).filter((v) => !s.serviceIds.includes(v.id)).length
      : null,
    serviceRecall3: s.serviceIds.length
      ? s.serviceIds.filter((id) =>
          services.slice(0, 3).some((v) => v.id === id),
        ).length / s.serviceIds.length
      : null,
    abstained: model.engine === "model" && !predictedCategory,
  };
}
export async function runSample(
  s: Sample,
  file: File,
  provenance: string,
  api: LabApi,
): Promise<RecordResult> {
  const start = performance.now(),
    traces: Trace[] = [],
    client = new LabApi(api.config, (t) => traces.push(t));
  const row: RecordResult = {
    sampleId: s.id,
    source: s.source,
    annotationVersion: s.annotationVersion,
    image: s.image,
    imageSha256: null,
    provenance,
    mode: "real_http_inference",
    at: new Date().toISOString(),
    modelVersion: null,
    backendVersion: null,
    expectedCategory: s.category,
    expectedTarget: s.target,
    expectedServiceIds: s.serviceIds,
    predictedCategory: null,
    predictedTargetIds: [],
    predictedServiceIds: [],
    categoryCorrect: false,
    targetTop3: s.target === null ? null : false,
    targetTop1: s.target === null ? null : false,
    falseRecommendations: s.serviceIds.length ? 0 : null,
    serviceRecall3: s.serviceIds.length ? 0 : null,
    abstained: false,
    latencyMs: 0,
    inferenceMs: null,
    traces,
  };
  try {
    await validateImage(file);
    row.imageSha256 = [
      ...new Uint8Array(
        await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
      ),
    ]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (s.sha256 && row.imageSha256 !== s.sha256)
      throw new ApiError("dataset integrity", null, "IMAGE_HASH_MISMATCH");
    const t = performance.now();
    const model = await client.infer(file, s.description || "");
    row.inferenceMs = performance.now() - t;
    row.modelVersion = model.model_version || null;
    Object.assign(row, scoreSample(s, model, null, []));
    if (model.engine !== "model")
      throw new ApiError("V2 model", 200, "MODEL_UNAVAILABLE");
    // Always run backend flow to measure catalog resolution, not just model prediction.
    let diagnosis = await client.upload(file, s.description || "");
    row.backendVersion = diagnosis.modelVersion || null;
    if (api.config.captureDebug) {
      const telemetry = await client.inspect(
        diagnosis.imageUrl,
        s.description || "",
      );
      row.modelFingerprint = telemetry.debug.model;
      row.configGates = {
        ...telemetry.debug.gates,
        backendThreshold: telemetry.backend.confidenceThreshold,
      };
      row.catalogSnapshot = telemetry.debug.catalog;
      row.telemetrySampledSeparately = true;
    }
    const services: Service[] = [];
    if (diagnosis.status === "unavailable")
      throw new ApiError("backend inference", 200, "BACKEND_AI_UNAVAILABLE");
    Object.assign(row, scoreSample(s, model, diagnosis, services));
    if (diagnosis.category && diagnosis.suggestedTargetId) {
      diagnosis = await client.answer(diagnosis, s.description || "", {
        categoryId: diagnosis.category.id,
        targetId: diagnosis.suggestedTargetId,
      });
      if (!diagnosis.target || !diagnosis.category)
        throw new ApiError("device confirmation", 200, "TARGET_NOT_CONFIRMED");
      if (s.symptomIds.length) {
        const symptoms = await client.symptoms(
          diagnosis.target.id,
          diagnosis.category.id,
        );
        if (s.symptomIds.some((id) => !symptoms.some((v) => v.id === id)))
          throw new ApiError(
            "approved symptoms / DB",
            200,
            "SYMPTOM_NOT_AVAILABLE_FOR_PREDICTED_TARGET",
          );
        services.push(
          ...(
            await client.recommend(
              diagnosis.target.id,
              diagnosis.category.id,
              s.symptomIds,
            )
          ).items,
        );
      } else if (s.serviceIds.length)
        throw new ApiError(
          "benchmark input",
          null,
          "SERVICE_GROUND_TRUTH_REQUIRES_REPORTED_SYMPTOMS",
        );
    }
    Object.assign(row, scoreSample(s, model, diagnosis, services));
  } catch (e) {
    row.error = String(redact(e instanceof Error ? e.message : String(e)));
    row.failedStage = e instanceof ApiError ? e.stage : "image validation";
  }
  row.latencyMs = performance.now() - start;
  return row;
}
export function metrics(rows: RecordResult[]) {
  const avg = (v: number[]) =>
    v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  const latency = rows.map((r) => r.latencyMs).sort((a, b) => a - b);
  const ok = rows.filter((r) => !r.error);
  return {
    samples: rows.length,
    completed: ok.length,
    errors: rows.length - ok.length,
    categoryAccuracy: avg(rows.map((r) => Number(r.categoryCorrect))),
    targetTop3: avg(
      rows
        .filter((r) => r.targetTop3 !== null)
        .map((r) => Number(r.targetTop3)),
    ),
    serviceRecallAt3: avg(
      rows.flatMap((r) =>
        r.serviceRecall3 === null ? [] : [r.serviceRecall3],
      ),
    ),
    targetTop1: avg(
      rows
        .filter((r) => r.targetTop1 !== null && r.targetTop1 !== undefined)
        .map((r) => Number(r.targetTop1)),
    ),
    falseRecommendations: rows.reduce(
      (sum, r) => sum + (r.falseRecommendations || 0),
      0,
    ),
    failureRate: rows.length ? (rows.length - ok.length) / rows.length : null,
    abstentionRate: avg(ok.map((r) => Number(r.abstained))),
    latencyP50Ms: latency.length
      ? latency[Math.ceil(latency.length * 0.5) - 1]
      : null,
    latencyP95Ms: latency.length
      ? latency[Math.ceil(latency.length * 0.95) - 1]
      : null,
    inferenceMeanMs: avg(
      rows.flatMap((r) => (r.inferenceMs === null ? [] : [r.inferenceMs])),
    ),
  };
}
export function toCsv(rows: RecordResult[]): string {
  const keys: (keyof RecordResult)[] = [
    "sampleId",
    "imageSha256",
    "provenance",
    "mode",
    "at",
    "modelVersion",
    "backendVersion",
    "source",
    "annotationVersion",
    "modelFingerprint",
    "configGates",
    "catalogSnapshot",
    "expectedCategory",
    "expectedTarget",
    "expectedServiceIds",
    "predictedCategory",
    "predictedTargetIds",
    "predictedServiceIds",
    "categoryCorrect",
    "targetTop3",
    "targetTop1",
    "falseRecommendations",
    "serviceRecall3",
    "abstained",
    "latencyMs",
    "inferenceMs",
    "failedStage",
    "error",
  ];
  const cell = (v: unknown) => {
    let text =
      v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => cell(r[k])).join(",")),
  ].join("\r\n");
}
export function download(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

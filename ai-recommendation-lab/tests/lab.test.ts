import { describe, it, expect, vi } from "vitest";
import {
  ApiError,
  LabApi,
  defaultConfig,
  redact,
  validateImage,
  type Trace,
} from "../src/api";
import {
  approvedSymptoms,
  diagnosisContract,
  modelContract,
  validServices,
  type Diagnosis,
  type ModelResult,
} from "../src/contracts";
import {
  metrics,
  parseManifest,
  scoreSample,
  toCsv,
  type RecordResult,
  type Sample,
} from "../src/benchmark";
const sample: Sample = {
  id: "s1",
  image: "fridge.jpg",
  category: "dien-lanh",
  target: "fridge",
  serviceIds: ["a", "b"],
  symptomIds: ["symptom"],
};
const model: ModelResult = {
  engine: "model",
  suggestedCategoryId: "dien-lanh",
  targetCandidates: [{ targetId: "fridge" }],
  categoryCandidates: [],
};
const diagnosis: Diagnosis = {
  requestId: "r",
  status: "needs_more_info",
  imageUrl: "https://example.test/image",
  category: { id: "cat", slug: "dien-lanh", name: "Category" },
  target: null,
  availableCategories: [],
  availableTargets: [],
  suggestedServices: [],
};
const makeApi = (fetcher: typeof fetch) => {
  const traces: Trace[] = [];
  return {
    api: new LabApi(
      { ...defaultConfig, timeoutMs: 10, token: "private" },
      (t) => traces.push(t),
      fetcher,
    ),
    traces,
  };
};
describe("image boundary", () => {
  it.each([
    ["image/jpeg", [255, 216, 255]],
    ["image/png", [137, 80, 78, 71, 13, 10, 26, 10]],
    ["image/webp", [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]],
  ])("accepts %s signature", async (type, bytes) => {
    await expect(
      validateImage(
        new File([new Uint8Array(bytes as number[])], "image", {
          type: type as string,
        }),
      ),
    ).resolves.toBeUndefined();
  });
  it("rejects disguised content, empty, unsupported and oversized images", async () => {
    for (const file of [
      new File(["text"], "x.jpg", { type: "image/jpeg" }),
      new File([], "empty", { type: "image/png" }),
      new File(["svg"], "x.svg", { type: "image/svg+xml" }),
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big", {
        type: "image/png",
      }),
    ])
      await expect(validateImage(file)).rejects.toThrow("IMAGE_INVALID");
  });
});
describe("real API contracts and failure stages", () => {
  it("allows absent category/target and low-confidence without client threshold changes", () => {
    expect(
      diagnosisContract({
        ...diagnosis,
        category: null,
        target: null,
        confidence: 0.01,
      }),
    ).toMatchObject({ confidence: 0.01 });
    expect(
      modelContract({
        ...model,
        suggestedCategoryId: null,
        targetCandidates: [],
        confidence: null,
      }),
    ).toMatchObject({ suggestedCategoryId: null });
  });
  it("rejects mock-success and malformed envelopes", () => {
    expect(() => diagnosisContract({ status: "success" })).toThrow();
    expect(() => modelContract({ engine: "heuristic" })).toThrow();
  });
  it.each([503, 404, 400])(
    "retains HTTP %s and stage, including inactive catalog / unapproved symptoms",
    async (status) => {
      const { api, traces } = makeApi(
        vi.fn(
          async () =>
            new Response(
              JSON.stringify({
                code:
                  status === 503
                    ? "SYMPTOM_CATALOG_NOT_ENABLED"
                    : status === 404
                      ? "TARGET_NOT_AVAILABLE"
                      : "SYMPTOM_NOT_AVAILABLE",
              }),
              { status },
            ),
        ) as typeof fetch,
      );
      await expect(api.symptoms("t", "c")).rejects.toBeInstanceOf(ApiError);
      expect(traces[0]).toMatchObject({
        stage: "approved symptoms / DB",
        status,
      });
    },
  );
  it("network offline is an error, not abstention success", async () => {
    const { api, traces } = makeApi(
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }) as typeof fetch,
    );
    await expect(api.infer(new File(["x"], "x"), "")).rejects.toThrow(
      "fetch failed",
    );
    expect(traces[0].status).toBeNull();
  });
  it("timeout aborts and emits stage", async () => {
    const { api, traces } = makeApi(
      vi.fn(
        (_url, init) =>
          new Promise((_resolve, reject) =>
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            ),
          ),
      ) as typeof fetch,
    );
    await expect(api.request("ai", "/health", "health")).rejects.toThrow(
      "API_TIMEOUT",
    );
    expect(traces[0].error).toBe("API_TIMEOUT");
  });
  it("sends token only to backend and generates correlated request IDs", async () => {
    const fetcher = vi.fn(
      async (_url: RequestInfo | URL, _init?: RequestInit) =>
        new Response('{"requestId":"server-id"}'),
    );
    const { api, traces } = makeApi(fetcher as typeof fetch);
    await api.request("ai", "/health", "health");
    expect(
      new Headers(fetcher.mock.calls[0]?.[1]?.headers).has("Authorization"),
    ).toBe(false);
    await api.request("backend", "/categories", "catalog");
    expect(
      new Headers(fetcher.mock.calls[1]?.[1]?.headers).get("Authorization"),
    ).toBe("Bearer private");
    expect(traces[1].serverRequestId).toBe("server-id");
    expect(traces[1].clientRequestId).toBeTruthy();
  });
  it("removes secrets, signed URLs and user details recursively", () => {
    const value = JSON.stringify(
      redact({
        token: "secret",
        nested: {
          imageUrl: "url",
          description: "private",
          message:
            "https://example.test/?secret=abc Bearer abc test@example.test",
        },
        phone: "1234567890",
      }),
    );
    expect(value).not.toContain("secret");
    expect(value).not.toContain("example.test");
    expect(value).not.toContain("1234567890");
    expect(value).not.toContain("Bearer abc");
  });
});
describe("catalog trust boundaries", () => {
  it("accepts public approved contract without invented review metadata", () => {
    const items = [
      { id: "s", name: "n", targetId: "t", code: "x", kind: "USER_REPORTED" },
    ];
    expect(approvedSymptoms(items, "t")).toEqual(items);
  });
  it("rejects explicitly inactive, unapproved or wrong-target symptom", () => {
    for (const item of [
      { isActive: false },
      { reviewStatus: "NEEDS_REVIEW" },
      { targetId: "foreign" },
    ])
      expect(() =>
        approvedSymptoms(
          [
            {
              id: "s",
              name: "n",
              targetId: "t",
              code: "x",
              kind: "USER_REPORTED",
              ...item,
            },
          ],
          "t",
        ),
      ).toThrow("SYMPTOM_NOT_AVAILABLE");
  });
  it("rejects invalid service and over-three responses", () => {
    const s = {
      id: "a",
      name: "A",
      targetId: "t",
      categoryId: "c",
      isActive: true,
      symptomIds: ["symptom"],
      provenance: "confirmed_symptom_catalog",
    };
    expect(validServices([s], "c", "t", ["symptom"])).toEqual([s]);
    for (const bad of [
      { ...s, isActive: false },
      { ...s, targetId: "foreign" },
      { ...s, categoryId: "foreign" },
      { ...s, symptomIds: ["wrong"] },
      { ...s, provenance: "rules" },
    ])
      expect(() => validServices([bad], "c", "t", ["symptom"])).toThrow();
    expect(() => validServices([s, s, s, s], "c", "t", ["symptom"])).toThrow();
  });
});
describe("ground truth and benchmark evidence", () => {
  it("validates explicit provenance and never consumes predicted fixture values", () => {
    const m = { version: 1, provenance: "real", samples: [sample] };
    expect(parseManifest(JSON.stringify(m)).samples[0]).toEqual(sample);
    for (const bad of [
      { ...m, provenance: "unknown" },
      { ...m, samples: [sample, sample] },
      { ...m, samples: [{ ...sample, image: "../escape.jpg" }] },
      { ...m, samples: [{ ...sample, category: null }] },
    ])
      expect(() => parseManifest(JSON.stringify(bad))).toThrow();
  });
  it("computes partial service recall and top3 from predictions", () => {
    expect(
      scoreSample(sample, model, null, [{ id: "a", name: "A" }]),
    ).toMatchObject({
      categoryCorrect: true,
      targetTop3: true,
      serviceRecall3: 0.5,
      abstained: false,
    });
    expect(
      scoreSample(
        sample,
        { ...model, suggestedCategoryId: null, targetCandidates: [] },
        null,
        [],
      ),
    ).toMatchObject({
      categoryCorrect: false,
      targetTop3: false,
      serviceRecall3: 0,
      abstained: true,
    });
  });
  it("keeps backend failures in accuracy denominator, not abstention denominator", () => {
    const rows = [
      {
        categoryCorrect: true,
        targetTop3: true,
        serviceRecall3: 0.5,
        abstained: false,
        latencyMs: 10,
        inferenceMs: 5,
      },
      {
        categoryCorrect: false,
        targetTop3: false,
        serviceRecall3: 0,
        abstained: false,
        latencyMs: 30,
        inferenceMs: null,
        error: "offline",
      },
    ] as RecordResult[];
    expect(metrics(rows)).toMatchObject({
      samples: 2,
      completed: 1,
      errors: 1,
      categoryAccuracy: 0.5,
      targetTop3: 0.5,
      serviceRecallAt3: 0.25,
      abstentionRate: 0,
      latencyP50Ms: 10,
      latencyP95Ms: 30,
    });
    expect(metrics([]).categoryAccuracy).toBeNull();
  });
  it("exports CSV with escaping and formula protection", () => {
    const csv = toCsv([
      {
        sampleId: '=HYPERLINK("x")',
        expectedServiceIds: ["a", "b"],
      } as RecordResult,
    ]);
    expect(csv).toContain('"\'=HYPERLINK(""x"")"');
    expect(csv).toContain('"[""a"",""b""]"');
  });
});

describe("benchmark real-request orchestration (HTTP doubles, not benchmark evidence)", () => {
  it("uses predicted target and reported symptom IDs, never expected services in request bodies", async () => {
    const { runSample } = await import("../src/benchmark");
    const requests: { url: string; init?: RequestInit }[] = [];
    const fetcher = vi.fn(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        requests.push({ url: String(url), init });
        let response: unknown;
        if (String(url).endsWith("/ai/v2/diagnose"))
          response = { ...model, model_version: "test-model" };
        else if (String(url).endsWith("/orders/diagnose-upload"))
          response = { ...diagnosis, suggestedTargetId: "predicted-target" };
        else if (String(url).endsWith("/orders/diagnose"))
          response = {
            ...diagnosis,
            target: { id: "predicted-target", name: "Device" },
          };
        else if (String(url).includes("/symptoms?"))
          response = [
            {
              id: "symptom",
              targetId: "predicted-target",
              name: "Reported",
              code: "reported",
              kind: "USER_REPORTED",
            },
          ];
        else
          response = {
            items: [
              {
                id: "a",
                name: "A",
                categoryId: "cat",
                targetId: "predicted-target",
                isActive: true,
                provenance: "confirmed_symptom_catalog",
                symptomIds: ["symptom"],
              },
            ],
          };
        return new Response(JSON.stringify(response));
      },
    );
    vi.stubGlobal("fetch", fetcher);
    try {
      const row = await runSample(
        sample,
        new File([new Uint8Array([255, 216, 255])], "fridge.jpg", {
          type: "image/jpeg",
        }),
        "synthetic",
        new LabApi(defaultConfig),
      );
      expect(row.error).toBeUndefined();
      expect(row).toMatchObject({
        modelVersion: "test-model",
        serviceRecall3: 0.5,
        mode: "real_http_inference",
        provenance: "synthetic",
      });
      expect(row.imageSha256).toHaveLength(64);
      const confirmation = requests.find((r) =>
        r.url.endsWith("/orders/diagnose"),
      )!;
      expect(JSON.parse(String(confirmation.init?.body)).answers.targetId).toBe(
        "predicted-target",
      );
      expect(
        requests.find((r) => r.url.includes("/recommendations?"))?.url,
      ).toContain("symptomIds=symptom");
      expect(row.traces).toHaveLength(5);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("records model offline as failure with no fake completion or abstention", async () => {
    const { runSample } = await import("../src/benchmark");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              engine: "unavailable",
              categoryCandidates: [],
              targetCandidates: [],
            }),
          ),
      ),
    );
    try {
      const row = await runSample(
        sample,
        new File([new Uint8Array([255, 216, 255])], "fridge.jpg", {
          type: "image/jpeg",
        }),
        "real",
        new LabApi(defaultConfig),
      );
      expect(row).toMatchObject({
        error: "MODEL_UNAVAILABLE",
        failedStage: "V2 model",
        abstained: false,
        categoryCorrect: false,
      });
      expect(metrics([row])).toMatchObject({
        completed: 0,
        errors: 1,
        abstentionRate: null,
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("browser transport receiver regression", () => {
  it("does not invoke the global fetch function with a LabApi receiver", async () => {
    let receiver: unknown;
    vi.stubGlobal("fetch", function (this: unknown) {
      receiver = this;
      return Promise.resolve(new Response("{}"));
    });
    try {
      await new LabApi(defaultConfig).request("ai", "/health", "health");
      expect(receiver).not.toBeInstanceOf(LabApi);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("version 2 real-photo manifest and quality metrics", () => {
  it("requires reviewed source, image hashes and train/eval separation", () => {
    const valid = {
      version: 2,
      provenance: "real",
      dataset: {
        source: "consented device photos",
        split: "test",
        labelReview: "reviewed",
        trainImageSha256: [],
      },
      samples: [
        {
          ...sample,
          sha256: "a".repeat(64),
          source: "owner capture",
          annotationVersion: "review-01",
        },
      ],
    };
    expect(parseManifest(JSON.stringify(valid)).version).toBe(2);
    expect(() =>
      parseManifest(
        JSON.stringify({
          ...valid,
          dataset: { ...valid.dataset, trainImageSha256: ["a".repeat(64)] },
        }),
      ),
    ).toThrow("LEAKAGE");
    expect(() =>
      parseManifest(JSON.stringify({ ...valid, samples: [{ ...sample }] })),
    ).toThrow();
  });
  it("measures target top1 and false service recommendations without assuming missing GT", () => {
    const scored = scoreSample(sample, model, null, [
      { id: "a", name: "A" },
      { id: "wrong", name: "Wrong" },
    ]);
    expect(scored.targetTop1).toBe(true);
    expect(scored.falseRecommendations).toBe(1);
    expect(
      metrics([{ ...scored, latencyMs: 10, inferenceMs: 5 } as RecordResult]),
    ).toMatchObject({ failureRate: 0, falseRecommendations: 1, targetTop1: 1 });
  });
});

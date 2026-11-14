import {
  diagnosisContract,
  modelContract,
  approvedSymptoms,
  validServices,
  type Diagnosis,
  type ModelResult,
  type Symptom,
  type Service,
} from "./contracts";
export type Trace = {
  clientRequestId: string;
  serverRequestId?: string;
  stage: string;
  endpoint: string;
  status: number | null;
  durationMs: number;
  at: string;
  response: unknown;
  error?: string;
};
export type Config = {
  backend: string;
  ai: string;
  token: string;
  timeoutMs: number;
  captureDebug?: boolean;
};
export const defaultConfig: Config = {
  backend: "/backend",
  ai: "/inference",
  token: "",
  timeoutMs: 45000,
  captureDebug: false,
};
const sensitive =
  /authorization|cookie|token|password|secret|credential|email|phone|address|imageurl|description|issuedescription|reportedSymptoms|observableSigns|createdBy|updatedBy/i;
export function redact(value: unknown): unknown {
  if (typeof value === "string")
    return value
      .replace(/https?:\/\/[^\s"<>]+/gi, "[URL REDACTED]")
      .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
      .replace(
        /(token|password|secret|api[_-]?key|credential)\s*[:=]\s*[^\s,;]+/gi,
        "$1=[REDACTED]",
      )
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL REDACTED]")
      .replace(/\b(?:\+?\d[\d .()-]{8,}\d)\b/g, "[NUMBER REDACTED]");
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        sensitive.test(k) ? "[REDACTED]" : redact(v),
      ]),
    );
  return value;
}
export class ApiError extends Error {
  constructor(
    public stage: string,
    public status: number | null,
    message: string,
  ) {
    super(message);
  }
}
export class LabApi {
  constructor(
    public config: Config,
    private onTrace: (trace: Trace) => void = () => {},
    private fetcher: typeof fetch = (input, init) => fetch(input, init),
  ) {}
  async request<T>(
    side: "backend" | "ai",
    path: string,
    stage: string,
    init: RequestInit = {},
    decode: (v: unknown) => T = (v) => v as T,
  ): Promise<T> {
    const clientRequestId = crypto.randomUUID(),
      started = performance.now(),
      controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    let status: number | null = null,
      response: unknown = null,
      serverRequestId: string | undefined;
    try {
      const headers = new Headers(init.headers);
      headers.set("X-Request-ID", clientRequestId);
      // Credentials are sent only to the backend, never the AI service.
      if (side === "backend" && this.config.token)
        headers.set("Authorization", `Bearer ${this.config.token}`);
      const res = await this.fetcher(`${this.config[side]}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
      status = res.status;
      const text = await res.text();
      try {
        response = JSON.parse(text);
      } catch {
        response = { message: text.slice(0, 2000) };
      }
      serverRequestId =
        res.headers.get("x-request-id") ||
        (response as { requestId?: string })?.requestId;
      if (!res.ok)
        throw new ApiError(stage, status, JSON.stringify(redact(response)));
      const result = decode(response);
      this.onTrace({
        clientRequestId,
        serverRequestId,
        stage,
        endpoint: `${side}${path.split("?")[0]}`,
        status,
        durationMs: performance.now() - started,
        at: new Date().toISOString(),
        response: redact(response),
      });
      return result;
    } catch (e) {
      const message = controller.signal.aborted
        ? "API_TIMEOUT"
        : e instanceof Error
          ? e.message
          : "NETWORK_ERROR";
      this.onTrace({
        clientRequestId,
        serverRequestId,
        stage,
        endpoint: `${side}${path.split("?")[0]}`,
        status,
        durationMs: performance.now() - started,
        at: new Date().toISOString(),
        response: redact(response),
        error: String(redact(message)),
      });
      throw new ApiError(stage, status, String(redact(message)));
    } finally {
      clearTimeout(timer);
    }
  }
  inspect(imageUrl: string, description: string) {
    return this.request<import("./contracts").DebugReport>(
      "backend",
      "/internal/recommendation/inspect",
      "authenticated same-request model telemetry",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, description }),
      },
    );
  }
  upload(file: File, description: string): Promise<Diagnosis> {
    const form = new FormData();
    form.append("image", file);
    form.append("description", description);
    form.append("answers", "{}");
    return this.request(
      "backend",
      "/orders/diagnose-upload",
      "backend inference / catalog",
      { method: "POST", body: form },
      diagnosisContract,
    );
  }
  infer(file: File, description: string): Promise<ModelResult> {
    const form = new FormData();
    form.append("file", file);
    form.append("description", description);
    return this.request(
      "ai",
      "/ai/v2/diagnose",
      "V2 fusion / target",
      { method: "POST", body: form },
      modelContract,
    );
  }
  inspectLegacy(file: File, description: string): Promise<ModelResult> {
    const form = new FormData();
    form.append("file", file);
    form.append("description", description);
    return this.request(
      "ai",
      "/ai/diagnose",
      "V1 CLIP / YOLO (separate inference)",
      { method: "POST", body: form },
    );
  }
  answer(
    result: Diagnosis,
    description: string,
    answers: Record<string, string | string[]>,
  ): Promise<Diagnosis> {
    return this.request(
      "backend",
      "/orders/diagnose",
      "device confirmation",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: result.imageUrl,
          description,
          answers,
        }),
      },
      diagnosisContract,
    );
  }
  symptoms(targetId: string, categoryId: string): Promise<Symptom[]> {
    return this.request(
      "backend",
      `/service-targets/${encodeURIComponent(targetId)}/symptoms?categoryId=${encodeURIComponent(categoryId)}`,
      "approved symptoms / DB",
      {},
      (v) => approvedSymptoms(v as Symptom[], targetId),
    );
  }
  recommend(
    targetId: string,
    categoryId: string,
    symptomIds: string[],
  ): Promise<{ items: Service[] }> {
    const query = new URLSearchParams({
      targetId,
      categoryId,
      symptomIds: symptomIds.join(","),
      limit: "3",
    });
    return this.request(
      "backend",
      `/services/recommendations?${query}`,
      "symptom → service mapping",
      {},
      (v) => ({
        items: validServices(
          (v as { items: Service[] }).items,
          categoryId,
          targetId,
          symptomIds,
        ),
      }),
    );
  }
}
export async function validateImage(file: File): Promise<void> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size === 0 ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error("IMAGE_INVALID: JPG/PNG/WebP, tối đa 10 MB.");
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = b[0] === 255 && b[1] === 216 && b[2] === 255;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v);
  const webp =
    String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...b.slice(8, 12)) === "WEBP";
  if (!(
    (file.type === "image/jpeg" && jpeg) ||
    (file.type === "image/png" && png) ||
    (file.type === "image/webp" && webp)
  ))
    throw new Error("IMAGE_INVALID_SIGNATURE");
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      bitmap.close();
    } catch {
      throw new Error("IMAGE_INVALID_DECODE");
    }
  }
}

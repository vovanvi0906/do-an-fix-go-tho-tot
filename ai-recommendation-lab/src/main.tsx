import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ApiError,
  LabApi,
  defaultConfig,
  validateImage,
  redact,
  type Config,
  type Trace,
} from "./api";
import type {
  Candidate,
  Diagnosis,
  ModelResult,
  Service,
  Symptom,
} from "./contracts";
import {
  download,
  metrics,
  parseManifest,
  runSample,
  toCsv,
  type RecordResult,
} from "./benchmark";
import "./style.css";

function Raw({ value }: { value: unknown }) {
  return <pre>{JSON.stringify(redact(value), null, 2)}</pre>;
}
function Candidates({ items = [] }: { items?: Candidate[] }) {
  return items.length ? (
    <div className="candidates">
      {items.map((c, i) => (
        <div className="candidate" key={i}>
          <span className="rank">0{i + 1}</span>
          <div>
            <strong>{c.name || c.targetName || c.id || c.targetId}</strong>
            <small>
              {c.slug || c.id || c.targetId} · {c.provenance || "API"}
            </small>
          </div>
          <code>
            {typeof c.confidence === "number" ? c.confidence.toFixed(4) : "N/A"}
          </code>
          {typeof c.similarity === "number" && (
            <small>similarity {c.similarity.toFixed(4)}</small>
          )}
        </div>
      ))}
    </div>
  ) : (
    <p className="empty">API chưa trả ứng viên.</p>
  );
}
function Probabilities({ scores }: { scores?: Record<string, number> | null }) {
  return scores ? (
    <Candidates
      items={Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .map(([name, confidence]) => ({ name, confidence }))}
    />
  ) : (
    <p className="empty">Chưa có telemetry riêng. Chạy phép đo V1 bên dưới.</p>
  );
}
export function App() {
  const [tab, setTab] = useState("Image testing"),
    [config, setConfig] = useState<Config>(defaultConfig),
    [settings, setSettings] = useState(false);
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [description, setDescription] = useState("");
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null),
    [model, setModel] = useState<ModelResult | null>(null),
    [legacy, setLegacy] = useState<ModelResult | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [services, setServices] = useState<Service[]>([]),
    [targetId, setTargetId] = useState(""),
    [mappingDone, setMappingDone] = useState(false);
  const [traces, setTraces] = useState<Trace[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [health, setHealth] = useState<unknown>(null);
  const [manifest, setManifest] = useState(""),
    [files, setFiles] = useState<File[]>([]),
    [rows, setRows] = useState<RecordResult[]>([]),
    [saved, setSaved] = useState("");
  const [inspector, setInspector] = useState<
    import("./contracts").DebugReport | null
  >(null);
  const lock = useRef(false),
    cancel = useRef(false),
    generation = useRef(0),
    retry = useRef<null | (() => Promise<void>)>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const api = () =>
    new LabApi({ ...configRef.current }, (t) =>
      setTraces((prev) => [t, ...prev].slice(0, 250)),
    );
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function clearFlow() {
    generation.current++;
    setInspector(null);
    setDiagnosis(null);
    setModel(null);
    setLegacy(null);
    setSymptoms([]);
    setSelected([]);
    setServices([]);
    setMappingDone(false);
    setTargetId("");
    setError("");
  }
  async function perform(label: string, fn: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(label);
    setError("");
    retry.current = () => perform(label, fn);
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof ApiError
          ? `${e.stage} · HTTP ${e.status ?? "—"} · ${e.message}`
          : e instanceof Error
            ? e.message
            : String(e),
      );
    } finally {
      setBusy("");
      lock.current = false;
    }
  }
  async function scan() {
    if (!file) throw new Error("Chọn ảnh trước.");
    await validateImage(file);
    clearFlow();
    const g = generation.current;
    const client = api();
    const results = await Promise.allSettled([
      client.upload(file, description),
      client.infer(file, description),
    ]);
    if (g !== generation.current) return;
    if (results[0].status === "fulfilled") {
      setDiagnosis(results[0].value);
      setTargetId(results[0].value.suggestedTargetId || "");
    }
    if (results[1].status === "fulfilled") setModel(results[1].value);
    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (failures.length) throw failures[0].reason;
  }
  async function confirm(categoryId: string, deviceId?: string) {
    if (!diagnosis) throw new Error("Chưa có diagnosis.");
    setServices([]);
    setMappingDone(false);
    setSelected([]);
    setSymptoms([]);
    setDiagnosis({ ...diagnosis, target: null });
    const result = await api().answer(diagnosis, description, {
      categoryId,
      ...(deviceId ? { targetId: deviceId } : {}),
    });
    setDiagnosis(result);
    setTargetId(result.target?.id || result.suggestedTargetId || "");
    if (result.target && result.category) {
      const items = await api().symptoms(result.target.id, result.category.id);
      setSymptoms(items);
      if (!items.length)
        throw new ApiError(
          "approved symptoms / DB",
          200,
          "NO_APPROVED_SYMPTOMS: Không có triệu chứng active đã duyệt.",
        );
    }
  }
  async function recommend() {
    if (!diagnosis?.target || !diagnosis.category || !selected.length)
      throw new Error("Xác nhận thiết bị và chọn triệu chứng.");
    setServices([]);
    setMappingDone(false);
    setServices(
      (
        await api().recommend(
          diagnosis.target.id,
          diagnosis.category.id,
          selected,
        )
      ).items,
    );
    setMappingDone(true);
  }
  async function checkHealth() {
    const client = api();
    const result = await Promise.allSettled([
      client.request("ai", "/health", "AI health"),
      client.request("ai", "/ai/v2/catalog/status", "AI catalog status"),
      client.request("backend", "/service-categories", "backend catalog / DB"),
    ]);
    setHealth(
      Object.fromEntries(
        result.map((r, i) => [
          ["models", "aiCatalog", "backendCatalogRead"][i],
          r.status === "fulfilled" ? r.value : { error: String(r.reason) },
        ]),
      ),
    );
  }
  async function benchmark() {
    const m = parseManifest(manifest);
    const paths = new Map<string, File>();
    for (const f of files) {
      const relative = f.webkitRelativePath || f.name;
      const path = f.webkitRelativePath
        ? relative.slice(relative.indexOf("/") + 1)
        : relative;
      if (paths.has(path)) throw new Error(`DUPLICATE_IMAGE_PATH: ${path}`);
      paths.set(path, f);
    }
    for (const s of m.samples)
      if (!paths.has(s.image)) throw new Error(`MISSING_IMAGE: ${s.image}`);
    cancel.current = false;
    setRows([]);
    const out: RecordResult[] = [];
    for (const s of m.samples) {
      if (cancel.current) break;
      setBusy(`Benchmark ${out.length + 1}/${m.samples.length}`);
      const record = await runSample(
        s,
        paths.get(s.image)!,
        m.provenance,
        api(),
      );
      record.dataset = m.dataset;
      out.push(record);
      setRows([...out]);
      setTraces((prev) =>
        [...record.traces.slice().reverse(), ...prev].slice(0, 250),
      );
    }
  }
  function save() {
    try {
      localStorage.setItem(
        "fixgo-rec-lab-results-v1",
        JSON.stringify(redact(rows)),
      );
      setSaved(`Đã lưu ${rows.length} sample trên trình duyệt này.`);
    } catch {
      setSaved("Không thể lưu: storage không khả dụng hoặc hết dung lượng.");
    }
  }
  function restore() {
    try {
      const value = JSON.parse(
        localStorage.getItem("fixgo-rec-lab-results-v1") || "[]",
      );
      if (
        !Array.isArray(value) ||
        value.some(
          (r) =>
            r.mode !== "real_http_inference" ||
            typeof r.latencyMs !== "number" ||
            !Array.isArray(r.traces),
        )
      )
        throw new Error();
      setRows(value);
      setSaved(`Đã khôi phục ${value.length} sample.`);
    } catch {
      setSaved("Kết quả lưu không hợp lệ.");
    }
  }
  const latestFailure = traces.find((t) => t.error),
    stats = metrics(rows);
  return (
    <div className="shell">
      <aside>
        <a className="brand" href="#">
          <span className="logo">f</span>fixgo
          <span className="lab-label">LAB</span>
        </a>
        <div className="workspace">
          <span className="dot" />
          AI Engineering<small>Recommendation V3</small>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {[
            "Image testing",
            "Model inspector",
            "Diagnosis inspector",
            "Benchmark",
            "Debug & health",
          ].map((item, i) => (
            <button
              className={tab === item ? "active" : ""}
              key={item}
              onClick={() => setTab(item)}
            >
              <span>{["▧", "◈", "⌘", "▥", "⌁"][i]}</span>
              {item}
            </button>
          ))}
        </nav>
        <div className="aside-bottom">
          <span className="tag">LOCAL DEVELOPMENT</span>
          <p>Pixels → catalog → services</p>
          <small>API thật · Không ghi dữ liệu catalog</small>
        </div>
      </aside>
      <main>
        <header>
          <div className="breadcrumbs">
            Engineering <span>/</span> AI Recommendation <span>/</span>{" "}
            <b>{tab}</b>
          </div>
          <button
            className="secondary"
            onClick={() => setSettings(!settings)}
            disabled={!!busy}
          >
            ⚙ Kết nối API
          </button>
        </header>
        {settings && (
          <section className="panel settings">
            <h3>Kết nối trong phiên</h3>
            <p>
              Proxy local mặc định. Token chỉ giữ trong bộ nhớ và gửi tới
              backend.
            </p>
            <fieldset disabled={!!busy} className="form-grid">
              <label>
                Backend base
                <input
                  value={config.backend}
                  onChange={(e) => {
                    clearFlow();
                    setConfig({
                      ...config,
                      backend: e.target.value.replace(/\/$/, ""),
                    });
                  }}
                />
              </label>
              <label>
                AI base
                <input
                  value={config.ai}
                  onChange={(e) => {
                    clearFlow();
                    setConfig({
                      ...config,
                      ai: e.target.value.replace(/\/$/, ""),
                    });
                  }}
                />
              </label>
              <label>
                Bearer token
                <input
                  type="password"
                  autoComplete="off"
                  value={config.token}
                  onChange={(e) =>
                    setConfig({ ...config, token: e.target.value })
                  }
                />
              </label>
              <label>
                Timeout (ms)
                <input
                  type="number"
                  min="1000"
                  max="180000"
                  value={config.timeoutMs}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      timeoutMs: Math.max(
                        1000,
                        Math.min(180000, Number(e.target.value) || 45000),
                      ),
                    })
                  }
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!config.captureDebug}
                  onChange={(e) =>
                    setConfig({ ...config, captureDebug: e.target.checked })
                  }
                />{" "}
                Thu model/config telemetry cho benchmark (internal token;
                inference riêng)
              </label>
            </fieldset>
          </section>
        )}
        <div className="title-row">
          <div>
            <div className="eyebrow">FIXGO / AI-REC-LAB-01</div>
            <h1>{tab}</h1>
            <p className="subtitle">
              Kiểm thử từng bước. Truy vết từng quyết định.
            </p>
          </div>
          <span className="status-pill">
            <span className="dot" />
            Real API mode
          </span>
        </div>
        <div className="pipeline">
          {[
            "Ảnh thiết bị",
            "Category",
            "Target",
            "Xác nhận",
            "Triệu chứng",
            "Top 3 dịch vụ",
          ].map((x, i) => (
            <React.Fragment key={x}>
              <span
                className={
                  (i === 0 && file) ||
                  (i === 1 && diagnosis?.category) ||
                  (i === 2 && diagnosis?.suggestedTargetId) ||
                  (i === 3 && diagnosis?.target) ||
                  (i === 4 && selected.length) ||
                  (i === 5 && services.length)
                    ? "done"
                    : ""
                }
              >
                <b>{i + 1}</b>
                {x}
              </span>
              {i < 5 && <i>›</i>}
            </React.Fragment>
          ))}
        </div>
        {error && (
          <div className="error" role="alert">
            <strong>Stage cần kiểm tra</strong>
            <p>{error}</p>
            <button onClick={() => retry.current?.()} disabled={!!busy}>
              Thử lại thao tác
            </button>
          </div>
        )}
        {busy && (
          <div className="loading" role="status">
            <div className="skeleton" />
            <span>{busy}…</span>
          </div>
        )}
        {tab === "Image testing" && (
          <div className="grid">
            <section className="panel">
              <div className="panel-heading">
                <h2>
                  <span>01</span> Ảnh đầu vào
                </h2>
                <span className="tag">JPG · PNG · WEBP</span>
              </div>
              <label className="upload">
                {preview ? (
                  <img src={preview} alt="Ảnh thiết bị đang kiểm thử" />
                ) : (
                  <>
                    <div className="upload-icon">↥</div>
                    <strong>Chọn ảnh thiết bị</strong>
                    <span>Ảnh thật giúp kiểm chứng kết quả thật.</span>
                    <small>Tối đa 10 MB</small>
                  </>
                )}
                <input
                  aria-label="Upload ảnh thiết bị"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={!!busy}
                  onChange={(e) => {
                    clearFlow();
                    setFile(e.target.files?.[0] || null);
                  }}
                />
              </label>
              {file && (
                <div className="file-info">
                  <span>{file.name}</span>
                  <small>{(file.size / 1024).toFixed(0)} KB</small>
                </div>
              )}
              <label>
                Mô tả lỗi <span className="muted">/ tùy chọn</span>
                <textarea
                  placeholder="Ví dụ: Tủ lạnh không mát, có tiếng kêu…"
                  value={description}
                  disabled={!!busy}
                  onChange={(e) => {
                    clearFlow();
                    setDescription(e.target.value);
                  }}
                />
              </label>
              <button
                className="primary wide"
                disabled={!file || !!busy}
                onClick={() => perform("Phân tích ảnh", scan)}
              >
                Phân tích với API thật <span>↗</span>
              </button>
              <p className="footnote">
                Ảnh được upload qua backend/Cloudinary. V2 inspector chạy một
                request độc lập song song; hai kết quả có thể khác nhau.
              </p>
            </section>
            <section className="panel">
              <div className="panel-heading">
                <h2>
                  <span>02</span> Kết quả quan sát
                </h2>
                <span className="tag">LIVE RESPONSE</span>
              </div>
              {diagnosis ? (
                <>
                  <div className="result-hero">
                    <small>BACKEND DECISION</small>
                    <h2>
                      {diagnosis.category?.name || "Chưa xác định danh mục"}
                    </h2>
                    <p>{diagnosis.message}</p>
                    <span className="tag">{diagnosis.status}</span>
                  </div>
                  <dl>
                    <dt>Request ID</dt>
                    <dd>{diagnosis.requestId}</dd>
                    <dt>Confidence từ backend</dt>
                    <dd>{diagnosis.confidence ?? "Không có"}</dd>
                    <dt>Model version khai báo</dt>
                    <dd>{diagnosis.modelVersion || "Không có"}</dd>
                    <dt>Reason codes</dt>
                    <dd>{diagnosis.reasonCodes?.join(", ") || "Không có"}</dd>
                  </dl>
                  <button
                    className="secondary wide"
                    onClick={() => setTab("Diagnosis inspector")}
                  >
                    Xác nhận thiết bị & chọn triệu chứng →
                  </button>
                </>
              ) : (
                <div className="empty-state">
                  <div>◈</div>
                  <h3>Sẵn sàng kiểm thử</h3>
                  <p>
                    Upload ảnh để xem quyết định từ model và catalog.
                    <br />
                    Không tạo kết quả mẫu hoặc confidence giả.
                  </p>
                </div>
              )}
              <div className="notice">
                <b>Chẩn đoán có xác nhận</b>
                <p>
                  Ảnh hỗ trợ nhận diện thiết bị. Triệu chứng do người kiểm thử
                  chọn; dịch vụ lấy từ mapping được duyệt.
                </p>
              </div>
            </section>
          </div>
        )}
        {(tab === "Model inspector" || tab === "Debug & health") && (
          <section className="panel">
            <h2>Authenticated same-request Recommendation Inspector</h2>
            <p>
              Dev/staging only. Nhập token debug trong Kết nối API / Bearer
              token. Một request chạy cùng CLIP, YOLO và fusion; không thay
              threshold.
            </p>
            <button
              disabled={!diagnosis || !!busy}
              onClick={() =>
                perform("Internal telemetry", async () => {
                  if (diagnosis)
                    setInspector(
                      await api().inspect(diagnosis.imageUrl, description),
                    );
                })
              }
            >
              Đo telemetry cùng request
            </button>
            {inspector && (
              <>
                <dl>
                  <dt>AI category gate</dt>
                  <dd>
                    ≥ {inspector.debug.gates.categoryMinConfidence}; margin ≥{" "}
                    {inspector.debug.gates.categoryMinMargin}; accepted:{" "}
                    {String(inspector.debug.gates.categoryAccepted)}
                  </dd>
                  <dt>Backend gate</dt>
                  <dd>
                    ≥ {inspector.backend.confidenceThreshold} (
                    {inspector.backend.thresholdSource}); passed:{" "}
                    {String(inspector.backend.categoryThresholdPassed)}
                  </dd>
                  <dt>Confidence thật</dt>
                  <dd>{inspector.result.confidence ?? "abstained"}</dd>
                  <dt>Correlation ID</dt>
                  <dd>
                    {inspector.backend.requestId} / AI:{" "}
                    {inspector.debug.requestId}
                  </dd>
                </dl>
                <h3>CLIP · cùng request</h3>
                <Probabilities scores={inspector.debug.clipScores} />
                <h3>YOLO · cùng request</h3>
                <Probabilities scores={inspector.debug.yoloScores} />
                <Raw
                  value={{
                    stageLatencyMs: inspector.debug.stagesMs,
                    stageOutcomes: inspector.debug.stageOutcomes,
                    backendResolution: inspector.backend,
                    models: inspector.debug.model,
                    catalog: inspector.debug.catalog,
                    gates: inspector.debug.gates,
                  }}
                />
              </>
            )}
          </section>
        )}
        {tab === "Model inspector" && (
          <>
            <div className="grid">
              <section className="panel">
                <h2>V2 · Fusion category</h2>
                <p>
                  Source: {model?.decision_source || "Chưa có"} · version:{" "}
                  {model?.model_version || "Chưa có"}
                </p>
                <Candidates items={model?.categoryCandidates} />
                <h3>Target top-K</h3>
                <Candidates items={model?.targetCandidates} />
                <p className="footnote">
                  Target confidence là score API, similarity không phải xác suất
                  đã hiệu chuẩn. Version là chuỗi API khai báo, chưa phải hash
                  weights.
                </p>
              </section>
              <section className="panel">
                <h2>CLIP / YOLO riêng</h2>
                <p>
                  V1 chạy lại trên cùng ảnh; không đại diện cho intermediate
                  tensors của lần V2.
                </p>
                <button
                  className="secondary"
                  disabled={!file || !!busy}
                  onClick={() =>
                    perform("V1 model inspection", async () => {
                      if (file) {
                        await validateImage(file);
                        setLegacy(await api().inspectLegacy(file, description));
                      }
                    })
                  }
                >
                  Chạy thêm V1 inspector
                </button>
                <h3>CLIP scores</h3>
                <Probabilities scores={legacy?.clip_probs} />
                <h3>YOLO scores</h3>
                <Probabilities scores={legacy?.all_probs} />
              </section>
            </div>
            <section className="panel">
              <h2>Telemetry</h2>
              <p>
                Thời gian dưới đây đo HTTP tại client, gồm network. Inference
                latency thuần / thời gian từng stage / hash weights: API hiện
                chưa cung cấp.
              </p>
              <TraceTable
                traces={traces.filter((t) => t.endpoint.startsWith("ai"))}
              />
            </section>
          </>
        )}
        {tab === "Diagnosis inspector" && (
          <div className="grid">
            <section className="panel">
              <h2>01 / Category → target confirmation</h2>
              {diagnosis ? (
                <>
                  <label>
                    Danh mục
                    <select
                      disabled={!!busy}
                      value={diagnosis.category?.id || ""}
                      onChange={(e) => {
                        setTargetId("");
                        perform("Chọn danh mục", () => confirm(e.target.value));
                      }}
                    >
                      <option value="">Chọn danh mục thực</option>
                      {diagnosis.availableCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Thiết bị
                    <select
                      disabled={!!busy}
                      value={targetId}
                      onChange={(e) => {
                        setTargetId(e.target.value);
                        setDiagnosis({ ...diagnosis, target: null });
                        setSymptoms([]);
                        setSelected([]);
                        setServices([]);
                        setMappingDone(false);
                      }}
                    >
                      <option value="">Chọn thiết bị</option>
                      {diagnosis.availableTargets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} · {t.slug}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="primary wide"
                    disabled={!!busy || !targetId || !diagnosis.category}
                    onClick={() =>
                      perform("Xác nhận thiết bị", () =>
                        confirm(diagnosis.category!.id, targetId),
                      )
                    }
                  >
                    Xác nhận thiết bị
                  </button>
                  <dl>
                    <dt>Category ID / slug</dt>
                    <dd>
                      {diagnosis.category?.id || "—"} /{" "}
                      {diagnosis.category?.slug || "—"}
                    </dd>
                    <dt>Target ID / slug</dt>
                    <dd>
                      {diagnosis.target?.id || "Chưa xác nhận"} /{" "}
                      {diagnosis.target?.slug || "—"}
                    </dd>
                    <dt>Symptom catalog flag</dt>
                    <dd>
                      {String(diagnosis.symptomCatalogEnabled ?? "unknown")}
                    </dd>
                  </dl>
                </>
              ) : (
                <p className="empty">
                  Phân tích ảnh trước để lấy catalog từ backend.
                </p>
              )}
            </section>
            <section className="panel">
              <h2>02 / Approved symptoms → services</h2>
              <p>
                Public API chỉ trả APPROVED/active theo contract; không cung cấp
                cờ duyệt trong từng item.
              </p>
              {symptoms.length ? (
                symptoms.map((s) => (
                  <label className="symptom" key={s.id}>
                    <input
                      type="checkbox"
                      disabled={!!busy}
                      checked={selected.includes(s.id)}
                      onChange={() => {
                        setSelected((prev) =>
                          prev.includes(s.id)
                            ? prev.filter((id) => id !== s.id)
                            : [...prev, s.id].slice(0, 10),
                        );
                        setServices([]);
                        setMappingDone(false);
                      }}
                    />
                    <span>
                      {s.name}
                      <small>
                        {s.code} · {s.kind} · {s.id}
                      </small>
                    </span>
                  </label>
                ))
              ) : (
                <p className="empty">
                  Chưa có triệu chứng được duyệt. Xác nhận thiết bị để kiểm tra
                  catalog; flag tắt sẽ trả 503.
                </p>
              )}
              <button
                className="primary wide"
                disabled={!selected.length || !!busy}
                onClick={() =>
                  perform("Mapping triệu chứng → dịch vụ", recommend)
                }
              >
                Lấy tối đa 3 dịch vụ
              </button>
              <div className="services">
                {services.map((s, i) => (
                  <article key={s.id}>
                    <small>
                      0{i + 1} / {s.provenance}
                    </small>
                    <h3>{s.name}</h3>
                    <p>{s.reason}</p>
                    <strong>
                      {s.basePrice == null
                        ? "Thợ báo giá sau kiểm tra"
                        : `${s.basePrice.toLocaleString("vi-VN")} đ`}
                      {s.maxPrice != null
                        ? ` – ${s.maxPrice.toLocaleString("vi-VN")} đ`
                        : ""}
                    </strong>
                    <small>
                      service: {s.id}
                      <br />
                      symptoms: {s.symptomIds?.join(", ")}
                    </small>
                  </article>
                ))}
              </div>
              {!services.length && selected.length > 0 && (
                <p className="empty">
                  {mappingDone
                    ? "NO_ACTIVE_MAPPING: API trả danh sách rỗng; không có mapping/service hợp lệ đã duyệt."
                    : "Chưa lấy kết quả mapping cho lựa chọn hiện tại."}
                </p>
              )}
            </section>
          </div>
        )}
        {tab === "Benchmark" && (
          <>
            <div className="grid">
              <section className="panel">
                <h2>Dataset & ground truth</h2>
                <p>
                  Manifest version 1. Ảnh chọn từ thư mục local; không tải URL
                  tùy ý. Mỗi sample gọi inference HTTP thật.
                </p>
                <label>
                  Nhập manifest JSON
                  <input
                    type="file"
                    accept="application/json,.json"
                    disabled={!!busy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f)
                        perform("Đọc manifest", async () =>
                          setManifest(await f.text()),
                        );
                    }}
                  />
                </label>
                <textarea
                  className="manifest"
                  value={manifest}
                  disabled={!!busy}
                  onChange={(e) => setManifest(e.target.value)}
                  placeholder={
                    '{"version":1,"provenance":"real","samples":[…]}'
                  }
                />
                <label>
                  Thư mục ảnh
                  <input
                    type="file"
                    multiple
                    {...{ webkitdirectory: "" }}
                    disabled={!!busy}
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  />
                </label>
                <small>
                  {files.length} file đã chọn · đường dẫn tính từ gốc thư mục.
                </small>
                <div className="actions">
                  <button
                    className="primary"
                    disabled={!!busy || !manifest || !files.length}
                    onClick={() => perform("Benchmark", benchmark)}
                  >
                    Chạy benchmark
                  </button>
                  <button
                    disabled={!busy.startsWith("Benchmark")}
                    onClick={() => {
                      cancel.current = true;
                    }}
                  >
                    Dừng sau sample hiện tại
                  </button>
                </div>
                <p className="footnote">
                  Symptom IDs mô phỏng lời khai người dùng, không sửa target
                  theo ground truth. Service recall@3 là macro average trên
                  sample có service ground truth. Lỗi giữ trong mẫu số accuracy;
                  abstention chỉ tính sample hoàn tất.
                </p>
              </section>
              <section className="panel">
                <h2>Run metrics</h2>
                <div className="metrics">
                  {Object.entries(stats).map(([key, value]) => (
                    <div key={key}>
                      <small>{key}</small>
                      <strong>
                        {value === null
                          ? "—"
                          : typeof value === "number" &&
                              !Number.isInteger(value)
                            ? value.toFixed(4)
                            : value}
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="actions">
                  <button
                    disabled={!rows.length}
                    onClick={() =>
                      download(
                        "recommendation-benchmark.json",
                        JSON.stringify(
                          {
                            schemaVersion: 1,
                            metrics: stats,
                            rows: redact(rows),
                          },
                          null,
                          2,
                        ),
                      )
                    }
                  >
                    Export JSON
                  </button>
                  <button
                    disabled={!rows.length}
                    onClick={() =>
                      download(
                        "recommendation-benchmark.csv",
                        toCsv(rows),
                        "text/csv;charset=utf-8",
                      )
                    }
                  >
                    Export CSV
                  </button>
                  <button disabled={!rows.length || !!busy} onClick={save}>
                    Lưu local
                  </button>
                  <button disabled={!!busy} onClick={restore}>
                    Khôi phục
                  </button>
                </div>
                <p>{saved}</p>
                <p className="footnote">
                  Synthetic provenance vẫn chạy inference thật nhưng không chứng
                  minh chất lượng trên ảnh thực. Không gộp run khác
                  provenance/model để so sánh.
                </p>
              </section>
            </div>
            <section className="panel">
              <h2>Per-sample evidence</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {[
                        "Sample",
                        "Dataset",
                        "Model",
                        "Category",
                        "Target@3",
                        "Service R@3",
                        "HTTP inference ms",
                        "Stage lỗi",
                      ].map((x) => (
                        <th key={x}>{x}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.sampleId}>
                        <td>{r.sampleId}</td>
                        <td>{r.provenance}</td>
                        <td>{r.modelVersion || "—"}</td>
                        <td>{String(r.categoryCorrect)}</td>
                        <td>{String(r.targetTop3)}</td>
                        <td>{r.serviceRecall3 ?? "N/A"}</td>
                        <td>{r.inferenceMs?.toFixed(1) || "—"}</td>
                        <td>
                          {r.failedStage || "—"}
                          {r.error && (
                            <details>
                              <summary>Lỗi</summary>
                              {r.error}
                            </details>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
        {tab === "Debug & health" && (
          <>
            <section className="panel">
              <div className="panel-heading">
                <h2>Model / catalog / DB reachability</h2>
                <button
                  className="secondary"
                  disabled={!!busy}
                  onClick={() => perform("Health checks", checkHealth)}
                >
                  Kiểm tra kết nối
                </button>
              </div>
              <p>
                DB reachability được suy từ GET catalog, không phải kiểm tra
                trực tiếp DB. Không gọi catalog sync hay ghi dữ liệu.
              </p>
              {health ? (
                <Raw value={health} />
              ) : (
                <p className="empty">Chưa kiểm tra.</p>
              )}
              <p>
                Stage lỗi gần nhất:{" "}
                <strong>{latestFailure?.stage || "Chưa ghi nhận"}</strong>
              </p>
            </section>
            <section className="panel">
              <div className="panel-heading">
                <h2>Request timeline</h2>
                <div className="actions">
                  <button
                    disabled={!traces.length}
                    onClick={() =>
                      download(
                        "recommendation-traces.json",
                        JSON.stringify(redact(traces), null, 2),
                      )
                    }
                  >
                    Export trace
                  </button>
                  <button onClick={() => setTraces([])}>Xóa trace</button>
                </div>
              </div>
              <TraceTable traces={traces} />
              {traces.map((t, i) => (
                <details key={t.clientRequestId}>
                  <summary>
                    {t.stage} · HTTP {t.status ?? "network"} ·{" "}
                    {t.durationMs.toFixed(0)} ms ·{" "}
                    {t.serverRequestId || t.clientRequestId}
                    {i === 0 ? " · latest" : ""}
                  </summary>
                  <Raw value={t} />
                </details>
              ))}
            </section>
          </>
        )}
        <footer>
          FixGo Recommendation Lab{" "}
          <span>
            V3 pipeline · local workspace · {traces.length} requests observed
          </span>
        </footer>
      </main>
    </div>
  );
}
function TraceTable({ traces }: { traces: Trace[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Stage / endpoint</th>
            <th>HTTP</th>
            <th>Client elapsed</th>
            <th>Request ID (server / client)</th>
          </tr>
        </thead>
        <tbody>
          {traces.map((t) => (
            <tr key={t.clientRequestId}>
              <td>
                {t.stage}
                <small>{t.endpoint}</small>
              </td>
              <td className={t.error ? "bad" : ""}>
                {t.status ?? "network"}
                {t.error ? " / ERROR" : ""}
              </td>
              <td>{t.durationMs.toFixed(1)} ms</td>
              <td>
                {t.serverRequestId || "not supplied"}
                <small>{t.clientRequestId}</small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!traces.length && (
        <p className="empty">Chưa có request. Không có telemetry giả lập.</p>
      )}
    </div>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);

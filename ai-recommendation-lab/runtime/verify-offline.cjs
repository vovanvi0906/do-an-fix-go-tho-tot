// Run only AFTER stopping the owned test AI server. Does not stop shared services.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const root = path.resolve(__dirname, "../..");
(async () => {
  let aiOffline = false;
  try {
    await fetch("http://127.0.0.1:8108/health", {
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    aiOffline = true;
  }
  if (!aiOffline)
    throw new Error("AI still online; stop only the owned test process first");
  const image = fs.readFileSync(
    path.join(root, "ai-service/dataset/test/lam_vuon/lam_vuon_0001.jpg"),
  );
  const id = crypto.randomUUID(),
    start = performance.now();
  const r = await fetch("http://127.0.0.1:3108/api/orders/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Request-ID": id },
    body: JSON.stringify({
      imageUrl: "data:image/jpeg;base64," + image.toString("base64"),
    }),
    signal: AbortSignal.timeout(40000),
  });
  const body = await r.json();
  body.imageUrl = "[REDACTED]";
  const evidence = {
    at: new Date().toISOString(),
    kind: "actual_connection_refused_to_owned_test_ai",
    status: r.status,
    clientRequestId: id,
    headerRequestId: r.headers.get("x-request-id"),
    elapsedMs: performance.now() - start,
    response: body,
    result:
      r.status === 201 &&
      body.status === "unavailable" &&
      body.reasonCodes?.includes("ai_unavailable")
        ? "PASS"
        : "FAIL",
  };
  fs.writeFileSync(
    path.join(
      root,
      `docs/ai-labs/runtime-${process.env.LAB_EVIDENCE_RUN || "02"}/ai-offline-evidence.json`,
    ),
    JSON.stringify(evidence, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      result: evidence.result,
      status: evidence.status,
      diagnosisStatus: body.status,
      reasonCodes: body.reasonCodes,
    }),
  );
})().catch((e) => {
  console.error(e.name, e.message);
  process.exitCode = 1;
});

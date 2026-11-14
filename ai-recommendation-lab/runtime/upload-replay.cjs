const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "../.."),
  records = [];
(async () => {
  for (let i = 0; i < 4; i++) {
    const data =
      i === 3
        ? Buffer.from("not an image")
        : fs.readFileSync(
            path.join(
              root,
              "ai-service/dataset/test/lam_vuon/lam_vuon_0001.jpg",
            ),
          );
    const form = new FormData();
    form.append(
      "image",
      new Blob([data], { type: "image/jpeg" }),
      i === 3 ? "corrupt.jpg" : "rec-lab03-valid.jpg",
    );
    const start = performance.now();
    const res = await fetch(
      "http://127.0.0.1:3108/api/orders/diagnose-upload",
      {
        method: "POST",
        body: form,
        headers: {
          "X-Request-ID": `lab03-upload-${process.env.LAB_REPLAY_PHASE || "before"}-${i}`,
        },
        signal: AbortSignal.timeout(60000),
      },
    );
    const b = await res.json();
    records.push({
      attempt: i + 1,
      valid: i !== 3,
      status: res.status,
      code: b.code || null,
      diagnosisStatus: b.status,
      elapsedMs: performance.now() - start,
      requestId: res.headers.get("x-request-id"),
    });
  }
  fs.writeFileSync(
    path.join(
      root,
      `docs/ai-labs/runtime-03/upload-${process.env.LAB_REPLAY_PHASE || "before"}.json`,
    ),
    JSON.stringify({ boundedAttempts: 4, records }, null, 2),
  );
  console.log(JSON.stringify(records));
})().catch((e) => {
  console.error(e.name);
  process.exitCode = 1;
});

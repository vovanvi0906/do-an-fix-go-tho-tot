const { chromium } = require(process.env.LAB_PLAYWRIGHT_MODULE),
  fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../.."),
  out = path.join(root, "docs/ai-labs/runtime-03"),
  f = JSON.parse(
    fs.readFileSync(
      path.join(root, "ai-recommendation-lab/.runtime/fixtures.json"),
    ),
  );
let browser;
const checks = [],
  errors = [];
const check = (name, pass, notes) => {
  checks.push({ name, result: pass ? "PASS" : "FAIL", notes });
  assert(pass, name);
};
(async () => {
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5178");
  await page.getByRole("button", { name: "⚙ Kết nối API" }).click();
  await page
    .getByLabel("Bearer token")
    .fill(
      fs
        .readFileSync(
          path.join(root, "ai-recommendation-lab/.runtime/debug-token"),
          "utf8",
        )
        .trim(),
    );
  await page
    .getByRole("checkbox", { name: /Thu model\/config telemetry/ })
    .check();
  await page.getByRole("button", { name: "⚙ Kết nối API" }).click();
  await page
    .getByLabel("Upload ảnh thiết bị")
    .setInputFiles(
      path.join(root, "ai-service/dataset/test/lam_vuon/lam_vuon_0001.jpg"),
    );
  await page.getByRole("button", { name: /Phân tích với API thật/ }).click();
  await page.getByRole("status").waitFor({ state: "hidden", timeout: 65000 });
  check(
    "real_cloudinary_model_diagnosis",
    (await page.getByRole("alert").count()) === 0,
  );
  await page
    .getByRole("button", { name: "Xác nhận thiết bị & chọn triệu chứng →" })
    .click();
  await page.getByRole("combobox").nth(1).selectOption(f.targetId);
  await page
    .getByRole("button", { name: "Xác nhận thiết bị", exact: true })
    .click();
  await page.getByRole("status").waitFor({ state: "hidden", timeout: 30000 });
  check(
    "approved_symptoms_loaded",
    (await page.getByRole("checkbox").count()) >= 5,
  );
  async function mapping(code, count) {
    for (const el of await page.getByRole("checkbox").all())
      if (await el.isChecked()) await el.uncheck();
    await page
      .locator("label.symptom")
      .filter({ hasText: `[TEST] ${code}` })
      .getByRole("checkbox")
      .check();
    await page
      .getByRole("button", { name: "Lấy tối đa 3 dịch vụ", exact: true })
      .click();
    await page.getByRole("status").waitFor({ state: "hidden", timeout: 20000 });
    check(
      "mapping_" + code,
      (await page.locator(".services article").count()) === count,
      { expected: count },
    );
  }
  await mapping("one", 1);
  check(
    "reason_and_price_from_db",
    (await page.locator(".services").innerText()).includes("110.000") &&
      (await page.locator(".services").innerText()).includes(
        "Theo triệu chứng",
      ),
  );
  await page.screenshot({
    path: path.join(out, "desktop-one-service.png"),
    fullPage: true,
  });
  await mapping("three", 3);
  await mapping("many", 3);
  await page.screenshot({
    path: path.join(out, "desktop-three-services.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  check(
    "mobile_no_overflow",
    !(await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    )),
  );
  await page.screenshot({
    path: path.join(out, "mobile-three-services.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mapping("empty", 0);
  check(
    "empty_mapping_distinct",
    (await page.getByText(/NO_ACTIVE_MAPPING/).count()) === 1 &&
      (await page.getByRole("alert").count()) === 0,
  );
  await page.screenshot({
    path: path.join(out, "empty-mapping.png"),
    fullPage: true,
  });
  await mapping("inactive-mapping", 0);
  await mapping("inactive-service", 0);
  await page.getByRole("combobox").nth(1).selectOption(f.otherTargetId);
  check(
    "target_change_resets_downstream",
    (await page.getByRole("checkbox").count()) === 0 &&
      (await page.locator(".services article").count()) === 0,
  );
  await page
    .getByRole("button", { name: "Xác nhận thiết bị", exact: true })
    .click();
  await page.getByRole("status").waitFor({ state: "hidden", timeout: 20000 });
  check(
    "other_target_scoped_symptoms",
    (await page.locator("label.symptom").count()) === 1 &&
      (await page
        .locator("label.symptom")
        .innerText()
        .then((t) => t.includes("[TEST] foreign"))),
  );
  await page
    .locator("nav")
    .getByRole("button", { name: /Debug & health/ })
    .click();
  const dp = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export trace", exact: true }).click();
  await (await dp).saveAs(path.join(out, "browser-traces.json"));
  await page.screenshot({
    path: path.join(out, "debug-timeline.png"),
    fullPage: true,
  });
  await page
    .locator("nav")
    .getByRole("button", { name: /Model inspector/ })
    .click();
  await page.getByRole("button", { name: "Đo telemetry cùng request" }).click();
  await page.getByRole("status").waitFor({ state: "hidden", timeout: 20000 });
  check(
    "authenticated_inspector_browser",
    (await page.getByText("AI category gate", { exact: true }).count()) === 1,
  );
  await page.screenshot({
    path: path.join(out, "same-request-inspector.png"),
    fullPage: true,
  });
  await page
    .locator("nav")
    .getByRole("button", { name: /Benchmark/ })
    .click();
  await page.locator("textarea.manifest").fill(
    JSON.stringify({
      version: 1,
      provenance: "synthetic",
      samples: [
        {
          id: "TEST-fixture-workflow",
          image: "lam_vuon/lam_vuon_0001.jpg",
          category: "lam-vuon",
          target: f.targetId,
          symptomIds: [f.symptoms.one],
          serviceIds: [f.services.s1],
        },
      ],
    }),
  );
  await page
    .locator("input[webkitdirectory]")
    .setInputFiles(path.join(root, "ai-service/dataset/test"));
  await page
    .getByRole("button", { name: "Chạy benchmark", exact: true })
    .click();
  await page
    .getByText("TEST-fixture-workflow", { exact: true })
    .waitFor({ timeout: 65000 });
  await page.getByRole("status").waitFor({ state: "hidden", timeout: 65000 });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  await (await download).saveAs(path.join(out, "benchmark-workflow.json"));
  const report = JSON.parse(
    fs.readFileSync(path.join(out, "benchmark-workflow.json")),
  );
  check(
    "benchmark_full_test_fixture_pipeline",
    report.metrics.completed === 1 &&
      report.metrics.errors === 0 &&
      report.metrics.serviceRecallAt3 === 1,
    { metrics: report.metrics, provenance: "SYNTHETIC TEST fixture only" },
  );
  const csv = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  await (await csv).saveAs(path.join(out, "benchmark-workflow.csv"));
  await page.screenshot({
    path: path.join(out, "benchmark-workflow.png"),
    fullPage: true,
  });
  check("console_errors", errors.length === 0, errors);
  fs.writeFileSync(
    path.join(out, "browser-e2e.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        browser: browser.version(),
        fixtures: "TEST_APPROVAL_ONLY",
        inference: "real pixels synthetic dataset",
        checks,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(checks, null, 2));
})()
  .catch((e) => {
    checks.push({ name: "execution", result: "FAIL", error: e.message });
    fs.writeFileSync(
      path.join(out, "browser-e2e.json"),
      JSON.stringify({ checks }, null, 2),
    );
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(async () => browser?.close());

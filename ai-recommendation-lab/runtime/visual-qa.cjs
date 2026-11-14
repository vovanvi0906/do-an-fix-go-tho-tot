// Browser QA against real local runtime. Timeout is an explicitly injected network fault.
// Install Playwright outside the repo; set LAB_PLAYWRIGHT_MODULE to its module directory.
const { chromium } = require(process.env.LAB_PLAYWRIGHT_MODULE);
const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "../.."),
  out = path.join(root, "docs/ai-labs/runtime-02");
const checks = [],
  consoleErrors = [];
let browser;
function check(name, pass, notes) {
  checks.push({ name, result: pass ? "PASS" : "FAIL", notes });
}
(async () => {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.on("pageerror", (e) => consoleErrors.push(e.name + ": " + e.message));
  await page.goto("http://127.0.0.1:5178/");
  await page.getByText("Sẵn sàng kiểm thử").waitFor();
  await page.screenshot({
    path: path.join(out, "desktop-empty.png"),
    fullPage: true,
  });
  check(
    "desktop_empty",
    await page
      .getByRole("button", { name: /Phân tích với API thật/ })
      .isDisabled(),
    {
      viewport: "1440x1000",
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    },
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: path.join(out, "mobile-empty.png"),
    fullPage: true,
  });
  check(
    "mobile_layout",
    !(await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    )),
    { viewport: "390x844" },
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByLabel("Upload ảnh thiết bị")
    .setInputFiles(
      path.join(root, "ai-service/dataset/test/lam_vuon/lam_vuon_0001.jpg"),
    );
  check(
    "upload_preview",
    await page.getByAltText("Ảnh thiết bị đang kiểm thử").isVisible(),
  );
  // Delay the browser's backend request before it reaches storage, to verify actual AbortController timeout.
  await page.getByRole("button", { name: "⚙ Kết nối API" }).click();
  await page.getByLabel("Timeout (ms)").fill("1000");
  await page.getByRole("button", { name: "⚙ Kết nối API" }).click();
  const pattern = "**/backend/orders/diagnose-upload";
  await page.route(pattern, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1800));
    await route.abort().catch(() => {});
  });
  await page.getByRole("button", { name: /Phân tích với API thật/ }).click();
  await page.getByRole("status").waitFor();
  await page.screenshot({
    path: path.join(out, "desktop-loading-fault-injection.png"),
    fullPage: true,
  });
  await page.getByRole("alert").waitFor({ timeout: 10000 });
  check(
    "timeout_error_stage",
    await page
      .getByRole("alert")
      .innerText()
      .then(
        (t) =>
          t.includes("API_TIMEOUT") &&
          t.includes("backend inference / catalog"),
      ),
    "Browser request held before upstream; not model inference failure.",
  );
  await page.screenshot({
    path: path.join(out, "desktop-timeout-fault-injection.png"),
    fullPage: true,
  });
  await page.unroute(pattern);
  await page.getByRole("button", { name: "⚙ Kết nối API" }).click();
  await page.getByLabel("Timeout (ms)").fill("45000");
  await page.getByRole("button", { name: "⚙ Kết nối API" }).click();
  // Retry uses current config at invocation; request is now real all the way through Cloudinary.
  await page.getByRole("button", { name: "Thử lại thao tác" }).click();
  await page.getByRole("status").waitFor({ state: "hidden", timeout: 65000 });
  const alert = page.getByRole("alert");
  check(
    "retry_real_upload",
    (await alert.count()) === 0,
    (await alert.count())
      ? await alert.innerText()
      : "Backend + V2 completed after network fault removed",
  );
  await page.screenshot({
    path: path.join(out, "desktop-real-diagnosis.png"),
    fullPage: true,
  });
  if (
    await page
      .getByRole("button", { name: "Xác nhận thiết bị & chọn triệu chứng →" })
      .count()
  ) {
    await page
      .getByRole("button", { name: "Xác nhận thiết bị & chọn triệu chứng →" })
      .click();
    const device = page.getByRole("combobox").nth(1);
    // User manually selects an active target if the AI did not suggest one; not an AI success claim.
    if (!(await device.inputValue())) {
      const value = await device.locator("option").nth(1).getAttribute("value");
      if (value) await device.selectOption(value);
    }
    const confirm = page.getByRole("button", {
      name: "Xác nhận thiết bị",
      exact: true,
    });
    if (await confirm.isEnabled()) {
      await confirm.click();
      await page
        .getByRole("status")
        .waitFor({ state: "hidden", timeout: 30000 });
      check(
        "device_confirm_then_catalog_disabled",
        await page
          .getByRole("alert")
          .innerText()
          .then((t) => t.includes("SYMPTOM_CATALOG_NOT_ENABLED")),
      );
      check(
        "no_fabricated_symptom_options",
        (await page.getByRole("checkbox").count()) === 0,
      );
      await page.screenshot({
        path: path.join(out, "desktop-confirm-catalog-disabled.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: path.join(out, "mobile-confirm-catalog-disabled.png"),
        fullPage: true,
      });
      check(
        "mobile_diagnosis_no_horizontal_overflow",
        !(await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )),
      );
    } else
      checks.push({
        name: "device_confirmation",
        result: "BLOCKED",
        notes: "No accepted category/available target from actual response",
      });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: /Debug & health/ }).click();
  await page
    .getByRole("button", { name: "Kiểm tra kết nối", exact: true })
    .click();
  await page.getByRole("status").waitFor({ state: "hidden", timeout: 15000 });
  await page.screenshot({
    path: path.join(out, "desktop-debug-health.png"),
    fullPage: true,
  });
  check(
    "debug_timeline",
    await page.getByText("Request timeline", { exact: true }).isVisible(),
  );
  await page
    .locator("nav")
    .getByRole("button", { name: /Model inspector/ })
    .click();
  await page.getByRole("button", { name: "Chạy thêm V1 inspector" }).click();
  await page.getByRole("status").waitFor({ state: "hidden", timeout: 20000 });
  check(
    "v1_clip_yolo_inspector",
    (await page.locator(".candidate").count()) > 0,
  );
  await page.screenshot({
    path: path.join(out, "desktop-model-inspector.png"),
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
          id: "synthetic-garden-category-only",
          image: "lam_vuon/lam_vuon_0001.jpg",
          category: "lam-vuon",
          target: null,
          symptomIds: [],
          serviceIds: [],
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
    .getByText("synthetic-garden-category-only", { exact: true })
    .waitFor({ timeout: 65000 });
  await page.getByRole("status").waitFor({ state: "hidden", timeout: 65000 });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const exported = await downloadPromise;
  await exported.saveAs(path.join(out, "browser-benchmark.json"));
  const benchmark = JSON.parse(
    fs.readFileSync(path.join(out, "browser-benchmark.json"), "utf8"),
  );
  check(
    "browser_real_http_synthetic_category_benchmark",
    benchmark.metrics.completed === 1 && benchmark.metrics.errors === 0,
    {
      metrics: benchmark.metrics,
      limitations:
        "One synthetic category-only smoke; target/service ground truth absent, not generalization accuracy",
    },
  );
  await page.screenshot({
    path: path.join(out, "desktop-benchmark-synthetic.png"),
    fullPage: true,
  });
  check("no_javascript_errors", consoleErrors.length === 0, consoleErrors);
  checks.push({
    name: "browser_approved_symptom_selection_and_service_success",
    result: "BLOCKED",
    notes:
      "Main DB symptom schema absent and shared flag unset. No mock success or self approval.",
  });
  fs.writeFileSync(
    path.join(out, "visual-evidence.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        browser: browser.version(),
        kind: "real_browser_actual_services_except_explicit_timeout_fault",
        checks,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify(checks, null, 2));
})()
  .catch((e) => {
    checks.push({
      name: "browser_qa_execution",
      result: "FAIL",
      notes: e.name + ": " + e.message,
    });
    fs.writeFileSync(
      path.join(out, "visual-evidence.json"),
      JSON.stringify({ checks }, null, 2) + "\n",
    );
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
  });

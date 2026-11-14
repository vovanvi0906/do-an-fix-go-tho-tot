// Test-only Nest bootstrap. Real production diagnosis/catalog controllers, no AppModule.
// Credentials are read into process memory; never copied to output/files.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const env = require("dotenv").parse(
  fs.readFileSync(process.env.LAB_CONFIG_FILE),
);
for (const key of [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "AI_CONFIDENCE_THRESHOLD",
])
  if (env[key]) process.env[key] = env[key];
const testMode = process.env.LAB_DATABASE_MODE === "isolated";
if (testMode) {
  const { TEST_URL, guardUrl } = require("./test-db.cjs");
  env.DATABASE_URL = guardUrl(TEST_URL);
  env.SYMPTOM_CATALOG_ENABLED =
    process.env.LAB_CATALOG_DISABLED === "true" ? "false" : "true";
  process.env.NODE_ENV = "test";
  process.env.RECOMMENDATION_DEBUG_ENABLED = "true";
  process.env.RECOMMENDATION_DEBUG_TOKEN = fs
    .readFileSync(
      path.join(root, "ai-recommendation-lab/.runtime/debug-token"),
      "utf8",
    )
    .trim();
}
// Test fixtures are explicitly authorized in the isolated DB; shared flag unchanged.
process.env.SYMPTOM_CATALOG_ENABLED = env.SYMPTOM_CATALOG_ENABLED || "false";
process.env.AI_SERVICE_URL = "http://127.0.0.1:8108";
require("@babel/register")({
  configFile: path.join(root, "server/.babelrc"),
  extensions: [".js"],
  ignore: [/node_modules/],
});
require("reflect-metadata");
const { NestFactory, BaseExceptionFilter } = require("@nestjs/core");
const { Module, ValidationPipe } = require("@nestjs/common");
const { PrismaClient } = require("@prisma/client");
const src = (part) => require(path.join(root, "server/src", part));
const { OrdersController } = src("modules/orders/orders.controller");
const { OrdersService } = src("modules/orders/orders.service");
const { OrderWorkflowService } = src("modules/orders/order-workflow.service");
const { ServicesController } = src("modules/services/services.controller");
const { ServicesService } = src("modules/services/services.service");
const { SymptomsController } = src("modules/symptoms/symptoms.controller");
const { SymptomsService } = src("modules/symptoms/symptoms.service");
const { PrismaService } = src("infrastructure/database/prisma.service");
const { FastApiAiClient } = src("infrastructure/external/ai/fastapi-ai.client");
const { requestLogging } = src("common/middleware/request-logging");
const db = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
const { catalogRead } = src("modules/symptoms/symptom-catalog");
const readOnly = (fn) =>
  catalogRead(() =>
    db.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
        return fn(tx);
      },
      { timeout: 60000, maxWait: 5000 },
    ),
  );
const aiClient = new FastApiAiClient({ get: (k) => process.env[k] });
// Each public catalog operation runs inside a DB-enforced read-only transaction.
const catalog = Object.fromEntries(
  [
    "getCategories",
    "getCategoryTree",
    "getTargets",
    "getServices",
    "getServiceById",
  ].map((method) => [
    method,
    (...args) => readOnly((tx) => new ServicesService(tx)[method](...args)),
  ]),
);
const symptoms = Object.fromEntries(
  ["getSymptoms", "recommend", "inspect"].map((method) => [
    method,
    (...args) => readOnly((tx) => new SymptomsService(tx)[method](...args)),
  ]),
);
class RuntimeModule {}
Module({
  controllers: [OrdersController, SymptomsController, ServicesController],
  providers: [
    {
      provide: OrdersService,
      useValue: {
        diagnose: (user, input) =>
          readOnly((tx) =>
            OrdersService.prototype.diagnose.call(
              { prisma: tx, fastApiAiClient: aiClient },
              user,
              input,
            ),
          ),
      },
    },
    { provide: ServicesService, useValue: catalog },
    { provide: SymptomsService, useValue: symptoms },
    { provide: PrismaService, useValue: db },
    {
      provide: OrderWorkflowService,
      useValue: {
        access() {
          throw new Error("NON_DIAGNOSIS_ROUTE_DISABLED");
        },
      },
    },
  ],
})(RuntimeModule);
(async () => {
  await db.$connect();
  if (testMode) {
    await require("./test-db.cjs").identity(db);
    if (
      !(await db.symptom.count({ where: { createdBy: "TEST:AI-REC-LAB-03" } }))
    )
      throw new Error("TEST_FIXTURES_NOT_READY");
  }
  const app = await NestFactory.create(RuntimeModule, { logger: false });
  const baseFilter = new BaseExceptionFilter(app.getHttpAdapter());
  app.useGlobalFilters({
    catch(error, host) {
      let message = String(error?.message || "");
      for (const value of Object.values(env))
        if (value.length > 5) message = message.split(value).join("[REDACTED]");
      message = message.replace(/https?:\/\/[^\s]+/g, "[URL REDACTED]");
      fs.appendFileSync(
        path.join(
          root,
          `docs/ai-labs/runtime-${testMode ? "03" : "02"}/runtime-errors.jsonl`,
        ),
        JSON.stringify({
          at: new Date().toISOString(),
          endpoint: host.switchToHttp().getRequest().path,
          name: error?.name || "StorageError",
          code: error?.code,
          httpCode: error?.http_code,
          message: message.slice(0, 500),
        }) + "\n",
      );
      baseFilter.catch(error, host);
    },
  });
  const allowed = new Set([
    "/api/internal/recommendation/inspect",
    "/api/orders/diagnose",
    "/api/orders/diagnose-upload",
    "/api/service-categories",
    "/api/service-categories/tree",
    "/api/service-targets",
    "/api/services",
    "/api/services/recommendations",
  ]);
  app.use((req, res, next) => {
    if (
      !allowed.has(req.path) &&
      !/^\/api\/service-targets\/[^/]+\/symptoms$/.test(req.path)
    )
      return res.status(404).json({ code: "LAB_ROUTE_DISABLED" });
    if (
      req.method !== "GET" &&
      ![
        "/api/orders/diagnose",
        "/api/orders/diagnose-upload",
        "/api/internal/recommendation/inspect",
      ].includes(req.path)
    )
      return res.status(405).end();
    next();
  });
  app.use(requestLogging);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.listen(Number(process.env.LAB_BACKEND_PORT || 3108), "127.0.0.1");
  console.log(
    `LAB_BACKEND_READY pid=${process.pid} port=${process.env.LAB_BACKEND_PORT || 3108} DB=transaction_read_only symptomFlag=` +
      process.env.SYMPTOM_CATALOG_ENABLED,
  );
  const close = async () => {
    await app.close();
    await db.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", close);
  process.on("SIGINT", close);
})().catch((e) => {
  console.error("LAB_BOOT_ERROR", e.code || e.name);
  process.exit(1);
});

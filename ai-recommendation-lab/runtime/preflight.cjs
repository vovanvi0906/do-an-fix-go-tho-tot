// Reads existing config into memory; prints no credentials. All DB work is read-only.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const root = path.resolve(__dirname, "../..");
const configPath = process.env.LAB_CONFIG_FILE;
if (!configPath) throw new Error("LAB_CONFIG_FILE required (read-only input)");
const env = dotenv.parse(fs.readFileSync(configPath));
async function catalogSnapshot(db) {
  return db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY",
    );
    const categories = await tx.serviceCategory.findMany({
      orderBy: { id: "asc" },
    });
    const targets = await tx.serviceTarget.findMany({ orderBy: { id: "asc" } });
    const services = await tx.service.findMany({ orderBy: { id: "asc" } });
    const tables = await tx.$queryRawUnsafe(
      "SELECT to_regclass('public.symptoms')::text AS symptoms, to_regclass('public.symptom_services')::text AS mappings",
    );
    return {
      catalogSha256: crypto
        .createHash("sha256")
        .update(JSON.stringify({ categories, targets, services }))
        .digest("hex"),
      counts: {
        categories: categories.length,
        targets: targets.length,
        services: services.length,
      },
      tables,
      readOnly: await tx.$queryRawUnsafe("SHOW transaction_read_only"),
    };
  });
}
(async () => {
  const db = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
  try {
    const u = new URL(env.DATABASE_URL);
    const evidence = {
      at: new Date().toISOString(),
      node: process.version,
      config: {
        database: {
          host: u.hostname,
          port: u.port || "5432",
          name: u.pathname.slice(1),
        },
        cloudinaryConfigured: [
          "CLOUDINARY_CLOUD_NAME",
          "CLOUDINARY_API_KEY",
          "CLOUDINARY_API_SECRET",
        ].every((k) => !!env[k]),
        symptomFlag: env.SYMPTOM_CATALOG_ENABLED || "unset",
        threshold: env.AI_CONFIDENCE_THRESHOLD || "default 0.6",
      },
      ...(await catalogSnapshot(db)),
    };
    const output = path.join(
      root,
      `docs/ai-labs/runtime-${process.env.LAB_EVIDENCE_RUN || "02"}`,
      process.env.LAB_SNAPSHOT_NAME || "preflight.json",
    );
    fs.writeFileSync(output, JSON.stringify(evidence, null, 2) + "\n");
    console.log(JSON.stringify(evidence));
  } finally {
    await db.$disconnect();
  }
})().catch((e) => {
  console.error("PREFLIGHT_ERROR", e.code || e.name);
  process.exitCode = 1;
});

const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  { execFileSync } = require("node:child_process"),
  crypto = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const root = path.resolve(__dirname, "../..");
const TEST_URL =
  "postgresql://fixgo_rec_lab@127.0.0.1:55448/fixgo_recommendation_lab";
function guardUrl(url) {
  const u = new URL(url);
  assert.equal(u.hostname, "127.0.0.1");
  assert.equal(u.port, "55448");
  assert.equal(u.pathname, "/fixgo_recommendation_lab");
  assert.equal(u.username, "fixgo_rec_lab");
  return url;
}
async function identity(db) {
  const [id] = await db.$queryRawUnsafe(
    "SELECT current_database() AS name, current_user AS username, inet_server_port() AS server_port",
  );
  assert.equal(id.name, "fixgo_recommendation_lab");
  assert.equal(id.username, "fixgo_rec_lab");
  console.log(
    JSON.stringify({
      guard: "TEST_DB_IDENTITY",
      host: "127.0.0.1",
      port: 55448,
      ...id,
    }),
  );
  return id;
}
module.exports = { TEST_URL, guardUrl, identity };
if (require.main === module)
  (async () => {
    const env = require("dotenv").parse(
      fs.readFileSync(process.env.LAB_CONFIG_FILE),
    );
    assert.notEqual(
      new URL(env.DATABASE_URL).pathname,
      new URL(TEST_URL).pathname,
    );
    const source = new PrismaClient({ datasourceUrl: env.DATABASE_URL }),
      db = new PrismaClient({ datasourceUrl: guardUrl(TEST_URL) });
    try {
      const snapshot = await source.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY",
        );
        return {
          categories: await tx.serviceCategory.findMany({
            orderBy: { id: "asc" },
          }),
          targets: await tx.serviceTarget.findMany({ orderBy: { id: "asc" } }),
          services: await tx.service.findMany({ orderBy: { id: "asc" } }),
          migrations: await tx.$queryRawUnsafe(
            "SELECT to_regclass('public._prisma_migrations')::text AS history_table",
          ),
        };
      });
      const sourceHash = crypto
        .createHash("sha256")
        .update(
          JSON.stringify({
            categories: snapshot.categories,
            targets: snapshot.targets,
            services: snapshot.services,
          }),
        )
        .digest("hex");
      await identity(db);
      const schema = fs.readFileSync(
        path.join(root, "server/prisma/schema.prisma"),
        "utf8",
      );
      const blocks = ["ServiceCategory", "ServiceTarget", "Service"]
        .map((name) =>
          schema
            .match(new RegExp(`model ${name} \\{[\\s\\S]*?\\n\\}`))[0]
            .split("\n")
            .filter(
              (line) =>
                !/^\s*(aiSuggestedOrders|orders|workerServices|symptoms|symptomMappings)\s/.test(
                  line,
                ) && !line.includes("services_id_target_key"),
            )
            .join("\n"),
        )
        .join("\n\n");
      const temp = path.join(root, "ai-recommendation-lab/.runtime");
      fs.mkdirSync(temp, { recursive: true, mode: 0o700 });
      const tokenPath = path.join(temp, "debug-token");
      if (!fs.existsSync(tokenPath))
        fs.writeFileSync(tokenPath, crypto.randomBytes(32).toString("hex"), {
          mode: 0o600,
          flag: "wx",
        });
      fs.writeFileSync(
        path.join(temp, "catalog-baseline.prisma"),
        'datasource db {\n provider = "postgresql"\n url = env("DATABASE_URL")\n}\n' +
          blocks,
      );
      const cli = require.resolve("prisma/build/index.js");
      const baseline = execFileSync(
        process.execPath,
        [
          cli,
          "migrate",
          "diff",
          "--from-empty",
          "--to-schema-datamodel",
          path.join(temp, "catalog-baseline.prisma"),
          "--script",
        ],
        { env: { ...process.env, DATABASE_URL: TEST_URL }, encoding: "utf8" },
      );
      const exists = await db.$queryRawUnsafe(
        "SELECT to_regclass('public.service_categories')::text AS name",
      );
      const psql = (file) =>
        execFileSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-f", file], {
          env: {
            ...process.env,
            PGHOST: "127.0.0.1",
            PGPORT: "55448",
            PGUSER: "fixgo_rec_lab",
            PGDATABASE: "fixgo_recommendation_lab",
          },
          stdio: "pipe",
        });
      if (!exists[0].name) {
        await identity(db);
        fs.writeFileSync(path.join(temp, "baseline.sql"), baseline);
        psql(path.join(temp, "baseline.sql"));
      }
      const symptoms = await db.$queryRawUnsafe(
        "SELECT to_regclass('public.symptoms')::text AS name",
      );
      if (!symptoms[0].name) {
        await identity(db);
        psql(
          path.join(
            root,
            "server/prisma/migrations/20261114000000_symptom_catalog_v3/migration.sql",
          ),
        );
      }
      await identity(db);
      for (const [model, items] of [
        ["serviceCategory", snapshot.categories],
        ["serviceTarget", snapshot.targets],
        ["service", snapshot.services],
      ]) {
        await identity(db);
        await db[model].createMany({ data: items, skipDuplicates: true });
      }
      const target = snapshot.targets.find(
        (t) => t.slug === "cay-bong-mat-cay-lon",
      );
      assert(target);
      const other = snapshot.targets.find(
        (t) => t.categoryId === target.categoryId && t.id !== target.id,
      );
      assert(other);
      const uuid = (key) => {
        const h = crypto
          .createHash("sha256")
          .update("AI-REC-LAB-03:" + key)
          .digest("hex");
        return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
      };
      const fixtures = {
        label: "TEST ONLY, NOT BUSINESS APPROVAL",
        categoryId: target.categoryId,
        targetId: target.id,
        otherTargetId: other.id,
        services: {},
        symptoms: {},
      };
      await identity(db);
      await db.$transaction(async (tx) => {
        await identity(tx);
        for (let i = 1; i <= 5; i++) {
          const id = uuid("service" + i);
          fixtures.services["s" + i] = id;
          const data = {
            categoryId: target.categoryId,
            targetId: target.id,
            name: `[TEST] Recommendation service ${i}`,
            slug: `test-rec-lab03-service-${i}`,
            basePrice: 100000 + i * 10000,
            maxPrice: null,
            unit: "TEST",
            isActive: i !== 5,
          };
          await tx.service.upsert({
            where: { id },
            create: { id, ...data },
            update: data,
          });
        }
        for (const code of [
          "one",
          "three",
          "many",
          "empty",
          "needs-review",
          "inactive",
          "foreign",
          "inactive-mapping",
          "inactive-service",
        ]) {
          const id = uuid("symptom" + code);
          fixtures.symptoms[code] = id;
          const data = {
            targetId: code === "foreign" ? other.id : target.id,
            code: "test-rec-lab03-" + code,
            name: `[TEST] ${code}`,
            kind: "USER_REPORTED",
            isActive: !["needs-review", "inactive"].includes(code),
            reviewStatus: code === "needs-review" ? "NEEDS_REVIEW" : "APPROVED",
            sortOrder: ["one", "many", "empty"].indexOf(code) + 3,
            createdBy: "TEST:AI-REC-LAB-03",
            updatedBy: "TEST:AI-REC-LAB-03",
          };
          await tx.symptom.upsert({
            where: { id },
            create: { id, ...data },
            update: data,
          });
        }
        for (const [code, services, active] of [
          ["one", [1], true],
          ["three", [1, 2, 3], true],
          ["many", [1, 2, 3, 4], true],
          ["inactive-mapping", [1], false],
          ["inactive-service", [5], true],
        ])
          for (const n of services) {
            const data = {
              targetId: target.id,
              priority: 100 - n,
              isActive: active,
              reviewStatus: "APPROVED",
              createdBy: "TEST:AI-REC-LAB-03",
              updatedBy: "TEST:AI-REC-LAB-03",
            };
            await tx.symptomService.upsert({
              where: {
                symptomId_serviceId: {
                  symptomId: fixtures.symptoms[code],
                  serviceId: fixtures.services["s" + n],
                },
              },
              create: {
                symptomId: fixtures.symptoms[code],
                serviceId: fixtures.services["s" + n],
                ...data,
              },
              update: data,
            });
          }
      });
      // Real database constraints, failed statements are rolled back by PostgreSQL.
      const checks = [];
      for (const [name, fn] of [
        [
          "category_parent_fk",
          () =>
            db.serviceTarget.create({
              data: {
                id: "TEST-invalid-parent",
                categoryId: "TEST-no-category",
                name: "TEST invalid parent",
              },
            }),
        ],
        [
          "approval_check",
          () =>
            db.symptom.update({
              where: { id: fixtures.symptoms["needs-review"] },
              data: { isActive: true },
            }),
        ],
        [
          "composite_fk_same_target",
          () =>
            db.symptomService.create({
              data: {
                symptomId: fixtures.symptoms.foreign,
                serviceId: fixtures.services.s1,
                targetId: target.id,
                createdBy: "TEST",
                updatedBy: "TEST",
              },
            }),
        ],
      ]) {
        await identity(db);
        let rejected = false;
        let rejectionCode = null;
        try {
          await fn();
        } catch (error) {
          const expected =
            name === "approval_check"
              ? error.code === "P2004" ||
                error.message.includes("symptoms_review_active_check")
              : error.code === "P2003";
          assert(
            expected,
            `Expected database constraint rejection for ${name}, got ${error.code || error.name}`,
          );
          rejectionCode = error.code || "23514_CHECK_VIOLATION";
          rejected = true;
        }
        assert(rejected, name);
        checks.push({ name, result: "PASS", rejectionCode });
      }
      const constraints = await db.$queryRawUnsafe(
        "SELECT conname, contype FROM pg_constraint WHERE conrelid IN ('symptoms'::regclass,'symptom_services'::regclass) ORDER BY conname",
      );
      assert(
        constraints.some((c) => c.conname === "symptoms_review_active_check"),
      );
      assert(constraints.filter((c) => c.contype === "f").length === 3);
      fs.writeFileSync(
        path.join(root, "ai-recommendation-lab/.runtime/fixtures.json"),
        JSON.stringify(fixtures, null, 2),
      );
      fs.writeFileSync(
        path.join(root, "docs/ai-labs/runtime-03/database.json"),
        JSON.stringify(
          {
            identity: await identity(db),
            endpoint: {
              host: "127.0.0.1",
              port: 55448,
              database: "fixgo_recommendation_lab",
            },
            sourceReadOnly: true,
            sourceHash,
            sourceCounts: {
              categories: snapshot.categories.length,
              targets: snapshot.targets.length,
              services: snapshot.services.length,
            },
            sourceMigrationHistory: snapshot.migrations,
            baseline:
              "catalog-only extracted Prisma schema; historical migrations lack service_targets",
            migration: "20261114000000_symptom_catalog_v3",
            migrationSha256: crypto
              .createHash("sha256")
              .update(
                fs.readFileSync(
                  path.join(
                    root,
                    "server/prisma/migrations/20261114000000_symptom_catalog_v3/migration.sql",
                  ),
                ),
              )
              .digest("hex"),
            fixtures,
            constraints,
            checks,
          },
          null,
          2,
        ) + "\n",
      );
      console.log("TEST_DATABASE_READY");
    } finally {
      await source.$disconnect();
      await db.$disconnect();
    }
  })().catch((e) => {
    console.error(
      "TEST_DB_ERROR",
      e.code || e.name,
      e.message?.split("\n").at(-1),
    );
    process.exitCode = 1;
  });

// Metadata only: no application rows, DDL, migration or fixture writes.
/* global process, console, URL */
require('dotenv/config');
const { PrismaClient, Prisma } = require('@prisma/client');

async function main() {
  const url = new URL(process.env.DATABASE_URL || '');
  if (!['postgres:', 'postgresql:'].includes(url.protocol))
    throw Error('POSTGRES_URL_REQUIRED');
  const ai = new URL(process.env.AI_SERVICE_URL || 'http://localhost:8000');
  if (
    !['localhost', '127.0.0.1'].includes(ai.hostname) ||
    ai.port !== '8000' ||
    ai.protocol !== 'http:'
  ) {
    throw Error('USB_AI_SERVICE_MUST_USE_LOCAL_PORT_8000');
  }
  const db = new PrismaClient();
  let result;
  try {
    result = await db.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
        const [identity] =
          await tx.$queryRaw`SELECT current_database() AS database, current_schema() AS schema, current_setting('transaction_read_only') AS read_only`;
        const columns =
          await tx.$queryRaw`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = current_schema()`;
        const known = new Set(
          columns.map((c) => `${c.table_name}.${c.column_name}`),
        );
        const missing = { application: [], face: [] };
        for (const model of Prisma.dmmf.datamodel.models) {
          const table = model.dbName || model.name;
          for (const field of model.fields.filter((f) => f.kind !== 'object')) {
            const key = `${table}.${field.dbName || field.name}`;
            if (!known.has(key))
              missing[
                table.startsWith('biometric_') ? 'face' : 'application'
              ].push(key);
          }
        }
        return {
          ...identity,
          host: url.hostname,
          port: url.port || '5432',
          missing,
        };
      },
      { timeout: 15000 },
    );
  } finally {
    await db.$disconnect();
  }
  if (result.read_only !== 'on') throw Error('READ_ONLY_PREFLIGHT_REQUIRED');
  console.log(
    `Database: ${result.host}:${result.port}/${result.database}; schema=${result.schema}; preflight=READ ONLY`,
  );
  if (result.missing.application.length) {
    console.error(
      'Missing application columns:',
      result.missing.application.join(', '),
    );
    throw Error('APPLICATION_SCHEMA_INCOMPATIBLE_NO_AUTOMATIC_MIGRATION');
  }
  const enabled = process.env.FACE_CORE_ENABLED === 'true';
  const capture = process.env.FACE_BIOMETRIC_CAPTURE_APPROVED === 'true';
  console.log(
    `Face Core enabled=${enabled}; capture approved=${capture}; missing Face columns=${result.missing.face.length}`,
  );
  if (result.missing.face.length && enabled)
    throw Error('FACE_SCHEMA_INCOMPATIBLE_NO_AUTOMATIC_MIGRATION');
  if (result.missing.face.length)
    console.log(
      'Face schema chưa sẵn sàng; giữ Face Core disabled. Nhận đơn/start vẫn fail-closed.',
    );
  console.log(
    'PAD readiness vẫn do production gateway kiểm tra; không cấp proof trong preflight.',
  );
}

main().catch((error) => {
  // Do not print Prisma errors/connection strings containing local credentials.
  const codes = [
    'POSTGRES_URL_REQUIRED',
    'USB_AI_SERVICE_MUST_USE_LOCAL_PORT_8000',
    'READ_ONLY_PREFLIGHT_REQUIRED',
    'APPLICATION_SCHEMA_INCOMPATIBLE_NO_AUTOMATIC_MIGRATION',
    'FACE_SCHEMA_INCOMPATIBLE_NO_AUTOMATIC_MIGRATION',
  ];
  console.error(
    `USB database/config preflight FAILED: ${codes.includes(error.message) ? error.message : 'CONNECTION_OR_METADATA_ERROR'}. Kiểm tra URL/schema/Face flags; không tự chạy migration hoặc seed.`,
  );
  process.exitCode = 1;
});

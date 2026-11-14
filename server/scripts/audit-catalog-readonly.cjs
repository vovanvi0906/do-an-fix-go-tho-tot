const { PrismaClient } = require('@prisma/client');
const { writeFileSync } = require('node:fs');
const db = new PrismaClient();
(async () => {
  try {
    const data = await db.$transaction(async tx => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
      return { capturedAt: new Date().toISOString(), categories: await tx.serviceCategory.findMany({ orderBy: { id: 'asc' } }), targets: await tx.serviceTarget.findMany({ orderBy: { id: 'asc' } }), services: await tx.service.findMany({ orderBy: { id: 'asc' } }) };
    });
    writeFileSync(process.argv[2] || '/tmp/fixgo-phase-c-catalog.json', JSON.stringify(data, null, 2));
    console.log(JSON.stringify({ readOnly: true, categories: data.categories.length, targets: data.targets.length, services: data.services.length }));
  } finally { await db.$disconnect(); }
})().catch(e => { console.error('Catalog audit failed:', e.code || e.name); process.exitCode = 1; });

// Runs ONLY inside run-isolated.cjs, before hardening, to preserve evidence of v2 behavior.
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const url = process.env.FACE_TEST_DATABASE_URL;
if (!url || new URL(url).hostname !== '127.0.0.1' || new URL(url).pathname !== '/fixgo_face_test') throw new Error('Isolated URL required');
const db = new PrismaClient({ datasources: { db: { url } } });
(async () => {
  try {
    const customer = await db.user.create({ data: { role: 'CUSTOMER' } });
    const user = await db.user.create({ data: { role: 'WORKER' } });
    const worker = await db.workerProfile.create({ data: { userId: user.id } });
    const category = await db.serviceCategory.create({ data: { name: 'synthetic-v2-audit' } });
    const order = await db.order.create({ data: { customerId: customer.id, workerId: worker.id, categoryId: category.id, status: 'ARRIVED', addressText: 'synthetic', lat: 0, lng: 0, estimatedPrice: 1 } });
    // Raw SQL intentionally supplies a nullable review allowed by v2, not the tightened Prisma client.
    await db.$executeRaw`INSERT INTO biometric_sessions (id,"workerId","userId",purpose,"orderId","requestKey",epoch,"templateVersion","modelVersion","nonceHash","expiresAt") VALUES (${randomUUID()},${worker.id},${user.id},'ORDER',${order.id},${randomUUID()},0,1,'synthetic',${'a'.repeat(64)},clock_timestamp()+interval '2 minutes')`;
    let blocked = false;
    try { await db.order.delete({ where: { id: order.id } }); } catch (e) { blocked = /biometric_session_policy|check constraint/.test(e.message); }
    if (!blocked || !await db.order.findUnique({ where: { id: order.id } })) throw new Error('Expected v2 SET NULL/CHECK rejection was not reproduced');
    console.log('v2 Order hard-delete: SET NULL violates purpose CHECK; delete rolled back (reproduced).');
  } finally {
    if (!process.argv.includes('--keep-invalid')) await db.$executeRawUnsafe('TRUNCATE biometric_sessions, users, service_categories CASCADE');
    await db.$disconnect();
  }
})().catch(e => { console.error(e.message); process.exitCode = 1; });

import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { JwtStrategy } from '../../src/modules/auth/strategies/jwt.strategy';
import { SymptomsController, AdminSymptomsController } from '../../src/modules/symptoms/symptoms.controller';
import { SymptomsService } from '../../src/modules/symptoms/symptoms.service';
import { ServicesController } from '../../src/modules/services/services.controller';
import { ServicesService } from '../../src/modules/services/services.service';
import { resolveDiagnosis } from '../../src/modules/orders/diagnosis/diagnosis-resolver';
import { assertDisposable } from './disposable.cjs';

describe('Phase C real disposable PostgreSQL + HTTP + JWT/RBAC', () => {
  let db, app, category, otherCategory, fridge, washer, admin, customer, symptom, foreignSymptom, services, inactive;
  const jwt = new JwtService({ secret: process.env.JWT_SECRET || 'super-secret' });
  const token = user => jwt.sign({ sub: user.id, role: 'ADMIN' }, { expiresIn: '5m' }); // Role in token must not override DB role.
  const call = (method, path, user = admin) => request(app.getHttpServer())[method](path).set('Authorization', `Bearer ${token(user)}`);
  beforeAll(async () => {
    const url = assertDisposable(process.env.DISPOSABLE_DATABASE_URL);
    db = new PrismaClient({ datasourceUrl: url });
    expect((await db.$queryRaw`SELECT current_database() AS name`)[0].name).toBe('fixgo_symptoms_disposable');
    process.env.SYMPTOM_CATALOG_ENABLED = 'true';
    category = await db.serviceCategory.create({ data: { name: 'Disposable cold', slug: 'disposable-cold' } });
    otherCategory = await db.serviceCategory.create({ data: { name: 'Disposable electric', slug: 'disposable-electric' } });
    fridge = await db.serviceTarget.create({ data: { categoryId: category.id, name: 'Fridge', slug: 'disposable-fridge' } });
    washer = await db.serviceTarget.create({ data: { categoryId: category.id, name: 'Washer', slug: 'disposable-washer' } });
    admin = await db.user.create({ data: { role: 'ADMIN', status: 'ACTIVE' } });
    customer = await db.user.create({ data: { role: 'CUSTOMER', status: 'ACTIVE' } });
    services = [];
    for (let i = 0; i < 5; i++) services.push(await db.service.create({ data: { name: `Frost ${i}`, slug: `disposable-frost-${i}`, categoryId: category.id, targetId: fridge.id, basePrice: 123000 + i, unit: 'lần' } }));
    inactive = await db.service.create({ data: { name: 'Inactive', categoryId: category.id, targetId: fridge.id, basePrice: 99000, isActive: false } });
    const module = await Test.createTestingModule({ imports: [PassportModule.register({ defaultStrategy: 'jwt' })], controllers: [SymptomsController, AdminSymptomsController, ServicesController], providers: [SymptomsService, ServicesService, JwtStrategy, { provide: PrismaService, useValue: db }] }).compile();
    app = module.createNestApplication(); await app.init();
    const svc = module.get(SymptomsService);
    symptom = await svc.create({ targetId: fridge.id, code: 'frost_buildup', name: 'Tuyết bám dày', aliases: ['đóng tuyết'], kind: 'VISUAL_OBSERVABLE', reviewStatus: 'APPROVED', isActive: true }, admin.id);
    foreignSymptom = await svc.create({ targetId: washer.id, code: 'no_spin', name: 'Không vắt', reviewStatus: 'APPROVED', isActive: true }, admin.id);
    for (let i = 0; i < services.length; i++) await svc.mapService(symptom.id, services[i].id, { priority: i, reviewStatus: 'APPROVED', isActive: true }, admin.id);
    await db.order.create({ data: { customerId: customer.id, categoryId: category.id, serviceId: services[0].id, addressText: 'Disposable fixture only', lat: 0, lng: 0, estimatedPrice: 123000 } });
  });
  afterAll(async () => { delete process.env.SYMPTOM_CATALOG_ENABLED; if (app) await app.close(); if (db) await db.$disconnect(); });
  it('rejects missing authentication and forged ADMIN role for a customer', async () => {
    await request(app.getHttpServer()).post('/admin/symptoms').send({}).expect(401);
    await call('post', '/admin/symptoms', customer).send({ targetId: fridge.id, code: 'fake', name: 'fake' }).expect(403);
    await call('put', `/admin/symptoms/${symptom.id}/services/${services[0].id}`, customer).send({ priority: 999 }).expect(403);
  });
  it('returns only approved active target symptoms and does not expose actor metadata', async () => {
    const response = await request(app.getHttpServer()).get(`/service-targets/${fridge.id}/symptoms?categoryId=${category.id}`).expect(200);
    expect(response.body.map(s => s.id)).toEqual([symptom.id]); expect(response.body[0].createdBy).toBeUndefined();
    await request(app.getHttpServer()).get(`/service-targets/${fridge.id}/symptoms?categoryId=${otherCategory.id}`).expect(400);
  });
  it('returns top three by priority with DB prices and hasMore', async () => {
    const response = await request(app.getHttpServer()).get(`/services/recommendations?targetId=${fridge.id}&symptomIds=${symptom.id}`).expect(200);
    expect(response.body.items).toHaveLength(3); expect(response.body.hasMore).toBe(true);
    expect(response.body.items.map(s => s.id)).toEqual([services[4].id, services[3].id, services[2].id]);
    expect(response.body.items[0].basePrice).toBe(123004); expect(response.body.requiresUserConfirmation).toBe(true);
  });
  it('rejects foreign symptoms, invalid limits and malformed body fields', async () => {
    await request(app.getHttpServer()).get(`/services/recommendations?targetId=${fridge.id}&symptomIds=${foreignSymptom.id}`).expect(400);
    await request(app.getHttpServer()).get(`/services/recommendations?targetId=${fridge.id}&symptomIds=${symptom.id}&limit=4`).expect(400);
    await call('post', '/admin/symptoms').send({ targetId: fridge.id, code: 'bad', name: null }).expect(400);
    await call('post', '/admin/symptoms').send({ targetId: fridge.id, code: 'bad', name: 'bad', createdBy: customer.id }).expect(400);
  });
  it('admin cannot map across targets or to an inactive service', async () => {
    await call('put', `/admin/symptoms/${foreignSymptom.id}/services/${services[0].id}`).send({ isActive: true, reviewStatus: 'APPROVED' }).expect(400);
    await call('put', `/admin/symptoms/${symptom.id}/services/${inactive.id}`).send({ isActive: true, reviewStatus: 'APPROVED' }).expect(400);
  });
  it('database composite FKs reject direct SQL/ORM cross-target mapping and target reassignment', async () => {
    await expect(db.symptomService.create({ data: { symptomId: foreignSymptom.id, serviceId: services[0].id, targetId: washer.id, createdBy: admin.id, updatedBy: admin.id } })).rejects.toThrow();
    await expect(db.service.update({ where: { id: services[4].id }, data: { targetId: washer.id } })).rejects.toThrow();
  });
  it('drafts stay inactive; duplicate code, approval and immutable target are enforced', async () => {
    const draft = (await call('post', '/admin/symptoms').send({ targetId: fridge.id, code: 'draft', name: 'Draft', aliases: ['x'] }).expect(201)).body;
    expect(draft.isActive).toBe(false); expect(draft.reviewStatus).toBe('NEEDS_REVIEW');
    await call('patch', `/admin/symptoms/${draft.id}`).send({ isActive: true }).expect(400);
    await call('post', '/admin/symptoms').send({ targetId: fridge.id, code: 'draft', name: 'Duplicate' }).expect(409);
    await call('patch', `/admin/symptoms/${draft.id}`).send({ targetId: washer.id }).expect(400);
    await expect(db.symptom.update({ where: { id: draft.id }, data: { isActive: true } })).rejects.toThrow();
  });
  it('filters inactive mapped services and archives mappings with audit history', async () => {
    await db.service.update({ where: { id: services[4].id }, data: { isActive: false } });
    let res = await request(app.getHttpServer()).get(`/services/recommendations?targetId=${fridge.id}&symptomIds=${symptom.id}`).expect(200);
    expect(res.body.items.some(s => s.id === services[4].id)).toBe(false);
    const adminRes = await call('get', `/admin/symptoms?targetId=${fridge.id}&search=frost_buildup`).expect(200);
    expect(adminRes.body.items[0].warnings.some(w => w.includes(services[4].id))).toBe(true);
    await call('delete', `/admin/symptoms/${symptom.id}/services/${services[3].id}`).expect(200);
    expect((await db.symptomService.findUnique({ where: { symptomId_serviceId: { symptomId: symptom.id, serviceId: services[3].id } } })).isActive).toBe(false);
    expect(await db.symptomCatalogAudit.count({ where: { action: 'UNMAP_SERVICE', actorId: admin.id } })).toBe(1);
    await db.service.update({ where: { id: services[4].id }, data: { isActive: true } });
  });
  it('manual services support server search/pagination and preserve legacy array shape', async () => {
    const first = await request(app.getHttpServer()).get(`/services?categoryId=${category.id}&targetId=${fridge.id}&search=Frost&page=1&limit=2`).expect(200);
    const second = await request(app.getHttpServer()).get(`/services?categoryId=${category.id}&targetId=${fridge.id}&search=Frost&page=2&limit=2`).expect(200);
    expect(first.body.items).toHaveLength(2); expect(first.body.hasMore).toBe(true);
    expect(first.body.items.some(a => second.body.items.some(b => a.id === b.id))).toBe(false);
    const legacy = await request(app.getHttpServer()).get(`/services?targetId=${fridge.id}`).expect(200); expect(Array.isArray(legacy.body)).toBe(true);
    await request(app.getHttpServer()).get(`/services?targetId=${fridge.id}&page=0`).expect(400);
  });
  it('diagnosis uses IDs, requires explicit service selection and never creates an order', async () => {
    const before = await db.order.count(); const input = { imageUrl: 'https://example.test/disposable-only.jpg', answers: { categoryId: category.id, targetId: fridge.id } };
    const confirmed = await resolveDiagnosis(db, {}, input);
    expect(confirmed.questions[0].id).toBe('symptomId');
    const recommended = await resolveDiagnosis(db, {}, { ...input, answers: { ...input.answers, symptomId: symptom.id } });
    expect(recommended.status).toBe('needs_more_info'); expect(recommended.suggestedServiceId).toBeNull(); expect(recommended.suggestedServices.length).toBeLessThanOrEqual(3);
    const booked = await resolveDiagnosis(db, {}, { ...input, answers: { ...input.answers, symptomIds: [symptom.id], serviceId: recommended.suggestedServices[0].id } });
    expect(booked.status).toBe('suggested'); expect(booked.estimatedPriceMin).toBe(Number(booked.service.basePrice));
    await expect(resolveDiagnosis(db, {}, { ...input, answers: { ...input.answers, symptomIds: [foreignSymptom.id], serviceId: services[0].id } })).rejects.toThrow();
    expect(await db.order.count()).toBe(before);
  });
  it('no mapping returns empty results; feature off keeps manual/legacy booking working', async () => {
    const result = await request(app.getHttpServer()).get(`/services/recommendations?targetId=${washer.id}&symptomIds=${foreignSymptom.id}`).expect(200); expect(result.body.items).toEqual([]);
    process.env.SYMPTOM_CATALOG_ENABLED = 'false';
    try {
      await request(app.getHttpServer()).get(`/service-targets/${fridge.id}/symptoms`).expect(503);
      const legacy = await resolveDiagnosis(db, {}, { imageUrl: 'https://example.test/disposable-only.jpg', answers: { categoryId: category.id, targetId: fridge.id, serviceId: services[0].id } }); expect(legacy.status).toBe('suggested');
    } finally { process.env.SYMPTOM_CATALOG_ENABLED = 'true'; }
  });
});

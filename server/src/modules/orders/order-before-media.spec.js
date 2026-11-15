import { OrderAccessGuard } from './order-access.guard';
import { Writable } from 'stream';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { OrderBeforeMediaService } from './order-before-media.service';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { cloudinary } from '../../config/cloudinary.config';

jest.mock('../../config/cloudinary.config', () => ({ cloudinary: {
  config: jest.fn(), api: { resource: jest.fn() }, uploader: { upload_stream: jest.fn() },
} }));
let media, core, tx, assets;
const file = { buffer: Buffer.from([255, 216, 255, 0]), mimetype: 'image/jpeg' };
beforeEach(() => {
  jest.clearAllMocks(); assets = new Map();
  tx = { orderStatusHistory: { findFirst: jest.fn(async () => ({ id: 'arrival' })) },
    orderImage: { findFirst: jest.fn(async () => null), create: jest.fn(async ({ data }) => ({ id: 'image', ...data })) } };
  core = { workerTx: jest.fn(async (user, fn) => fn(tx, { id: 'worker' })),
    requireOrderProof: jest.fn(async () => ({})), now: jest.fn(async () => new Date()) };
  media = new OrderBeforeMediaService(core);
  cloudinary.config.mockReturnValue({ cloud_name: 'fixture', api_key: 'fixture', api_secret: 'fixture' });
  cloudinary.uploader.upload_stream.mockImplementation((options, callback) => new Writable({
    write(_chunk, _encoding, done) { done(); },
    final(done) {
      const asset = assets.get(options.public_id) || { public_id: options.public_id, bytes: 4,
        secure_url: `https://res.cloudinary.com/fixture/image/upload/v1/${options.public_id}.jpg`,
        resource_type: 'image', type: 'upload' };
      assets.set(options.public_id, asset); callback(null, asset); done();
    },
  }));
  cloudinary.api.resource.mockImplementation(async id => assets.get(id));
});
test('AC-07 upload bytes to scoped storage, then JSON persistence rechecks proof without consume', async () => {
  const first = await media.upload('user', 'order', file);
  const second = await media.upload('user', 'order', file);
  expect(second.url).toBe(first.url); expect(assets.size).toBe(1);
  const service = new OrdersService({}, {}, {}, {}, {}, {}, {}, {}, media);
  const saved = await service.uploadImage('order', { type: 'BEFORE', url: first.url }, 'user');
  expect(saved.image).toMatchObject({ orderId: 'order', type: 'BEFORE', url: first.url });
  expect(core.requireOrderProof).toHaveBeenCalled();
  expect(tx.orderImage.create).toHaveBeenCalledTimes(1);
});
test('AC-06 missing/invalid scoped proof stops storage and BEFORE persistence', async () => {
  core.requireOrderProof.mockRejectedValue(new Error('ORDER_FACE_PROOF_REQUIRED'));
  await expect(media.upload('user', 'order', file)).rejects.toThrow('ORDER_FACE_PROOF_REQUIRED');
  const service = new OrdersService({}, {}, {}, {}, {}, {}, {}, {}, media);
  await expect(service.uploadImage('order', { type: 'BEFORE', url: 'https://fake.invalid/x.jpg' }, 'user')).rejects.toThrow('ORDER_FACE_PROOF_REQUIRED');
  expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
  expect(tx.orderImage.create).not.toHaveBeenCalled();
});
test.each(['https://fake.invalid/x.jpg', 'file:///local.jpg', 'data:image/jpeg;base64,x',
  'https://res.cloudinary.com/fixture/image/upload/v1/fixgo/order-before/other/order/arrival/' + 'a'.repeat(64) + '.jpg'])
('AC-12 rejects fabricated/foreign URL before calling storage API', async url => {
  await expect(media.verify(url, { workerId: 'worker', orderId: 'order', arrivalId: 'arrival' })).rejects.toThrow();
  expect(cloudinary.api.resource).not.toHaveBeenCalled();
});
test('AC-09 storage error never records BEFORE or consumes proof', async () => {
  cloudinary.uploader.upload_stream.mockImplementation(() => { throw Error('storage failed'); });
  await expect(media.upload('user', 'order', file)).rejects.toThrow();
  expect(tx.orderImage.create).not.toHaveBeenCalled();
});
test('AC-12 revoke during upload fails the post-storage authorization', async () => {
  core.requireOrderProof.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('ORDER_FACE_PROOF_REQUIRED'));
  await expect(media.upload('user', 'order', file)).rejects.toThrow('ORDER_FACE_PROOF_REQUIRED');
  expect(tx.orderImage.create).not.toHaveBeenCalled();
});
test('AC-11 JSON retry reuses existing row and does not create duplicates', async () => {
  const uploaded = await media.upload('user', 'order', file);
  tx.orderImage.findFirst.mockResolvedValue({ id: 'existing', type: 'BEFORE' });
  const service = new OrdersService({}, {}, {}, {}, {}, {}, {}, {}, media);
  await service.uploadImage('order', { type: 'BEFORE', url: uploaded.url }, 'user');
  expect(tx.orderImage.create).not.toHaveBeenCalled();
});
test('disguised/empty images and missing storage configuration fail closed', async () => {
  await expect(media.upload('user', 'order', { ...file, buffer: Buffer.from('not jpeg') })).rejects.toThrow();
  cloudinary.config.mockReturnValue({});
  await expect(media.upload('user', 'order', file)).rejects.toThrow('STORAGE_NOT_CONFIGURED');
  expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
});
test('multipart proof guard runs before uploader; successful HTTP request carries actual bytes', async () => {
  const module = await Test.createTestingModule({ controllers: [OrdersController], providers: [
    { provide: OrdersService, useValue: { beforeMedia: media } },
    { provide: OrderBeforeMediaService, useValue: media },
  ] }).overrideGuard(OrderAccessGuard).useValue({ canActivate: () => false }).overrideGuard(JwtAuthGuard).useValue({ canActivate(ctx) { ctx.switchToHttp().getRequest().user = { userId: 'user' }; return true; } })
    .overrideGuard(RolesGuard).useValue({ canActivate: () => true }).compile();
  const app = module.createNestApplication({ logger: false }); await app.init();
  try {
    core.requireOrderProof.mockRejectedValueOnce(new Error('ORDER_FACE_PROOF_REQUIRED'));
    const denied = await request(app.getHttpServer()).post('/orders/order/before-media').attach('image', file.buffer, 'before.jpg');
    expect(denied.status).toBeGreaterThanOrEqual(400); expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
    const ok = await request(app.getHttpServer()).post('/orders/order/before-media').attach('image', file.buffer, 'before.jpg');
    expect(ok.status).toBe(201); expect(ok.body.data.url).toMatch(/^https:/);
  } finally { await app.close(); }
});

test('fabricated scoped asset missing from storage is explicitly rejected', async () => {
  const uploaded = await media.upload('user', 'order', file);
  cloudinary.api.resource.mockRejectedValueOnce({ http_code: 404 });
  await expect(media.verify(uploaded.url, { workerId: 'worker', orderId: 'order', arrivalId: 'arrival' }))
    .rejects.toThrow('BEFORE_MEDIA_NOT_VERIFIED');
});
test('AC-13 customer ISSUE and worker AFTER keep their existing URL/stage authorization', async () => {
  const db = { $transaction: fn => fn({ $queryRaw: async () => [],
    order: { findUnique: async () => ({ status: 'IN_PROGRESS' }) }, orderImage: tx.orderImage }) };
  const flow = { actor: async () => ({ role: 'WORKER' }), authorize: jest.fn() };
  const service = new OrdersService({}, flow, {}, db, {}, {}, {}, {}, media);
  await service.uploadImage('order', { type: 'AFTER', url: 'https://existing.invalid/after.jpg' }, 'user');
  expect(core.requireOrderProof).not.toHaveBeenCalled(); expect(cloudinary.api.resource).not.toHaveBeenCalled();
  db.$transaction = fn => fn({ $queryRaw: async () => [],
    order: { findUnique: async () => ({ status: 'CREATED' }) }, orderImage: tx.orderImage });
  flow.actor = async () => ({ role: 'CUSTOMER' });
  await service.uploadImage('order', { type: 'ISSUE', url: 'https://existing.invalid/issue.jpg' }, 'customer');
  expect(tx.orderImage.create).toHaveBeenCalledTimes(2);
});

import { FaceIdentityController } from './face-identity.controller';
import { FaceIdentityService } from './face-identity.service';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { WorkersController } from '../workers.controller';
import { WorkersService } from '../workers.service';
import { OrdersController } from '../../orders/orders.controller';
import { OrdersService } from '../../orders/orders.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { OrderAccessGuard } from '../../orders/order-access.guard';
import { FaceCaptureBlockedGuard } from './face-capture-blocked.guard';
import { workerFaceStorage } from '../../../config/cloudinary.config';

jest.mock('../../../config/cloudinary.config', () => ({ workerFaceStorage: { _handleFile: jest.fn(), _removeFile: jest.fn() } }));

describe('Nest capture gate before multipart persistence', () => {
  let app;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [WorkersController, OrdersController, FaceIdentityController],
      providers: [{ provide: FaceIdentityService, useValue: new FaceIdentityService({ workerProfile: { findUnique: async () => ({ user: { role: 'WORKER', status: 'ACTIVE' }, approvalStatus: 'APPROVED' }) } }) }, FaceCaptureBlockedGuard, { provide: WorkersService, useValue: {} }, { provide: OrdersService, useValue: {} }],
    }).overrideGuard(JwtAuthGuard).useValue({ canActivate: ctx => { ctx.switchToHttp().getRequest().user = { userId: 'synthetic-u' }; return true; } })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .overrideGuard(OrderAccessGuard).useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication(); await app.init();
  });
  afterAll(async () => { await app?.close(); });
  test.each(['/workers/verify-face-daily', '/orders/synthetic-order/face-verify-upload'])('rejects %s before storing capture', async path => {
    const response = await request(app.getHttpServer()).post(path).attach('image', Buffer.from('synthetic bytes'), 'synthetic.jpg');
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('FACE_CAPTURE_UNAVAILABLE');
    expect(workerFaceStorage._handleFile).not.toHaveBeenCalled();
  });
  test('JSON reference cannot bypass capture gate', async () => {
    const response = await request(app.getHttpServer()).post('/orders/synthetic-order/face-verify').send({ photoUrl: 'untrusted' });
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('FACE_CAPTURE_UNAVAILABLE');
  });
  test('status response is metadata and matches worker envelope', async () => {
    const response = await request(app.getHttpServer()).get('/workers/me/face/status');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: { canEnroll: false, dailyProof: null } });
    expect(JSON.stringify(response.body)).not.toContain('faceEmbedding');
  });
  test('preflight validates at runtime despite JS decorator metadata limits', async () => {
    const response = await request(app.getHttpServer()).post('/workers/me/face/enrollment/preflight').send({ consent: 'true', workerId: 'other' });
    expect(response.status).toBe(400);
  });
  test('preflight response never claims registration accepted', async () => {
    const response = await request(app.getHttpServer()).post('/workers/me/face/enrollment/preflight').send({ consent: true });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ success: true, data: { accepted: false, reviewRequestSubmitted: false } });
  });

});

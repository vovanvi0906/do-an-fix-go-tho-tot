import { Test } from '@nestjs/testing';
import request from 'supertest';
import { UnauthorizedException } from '@nestjs/common';
import { FaceLabController } from './face-lab.controller';
import { FaceLabDebugGuard } from './face-lab.guard';
import { FaceLabInspectorService } from './face-lab-inspector.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

// Real Nest routing + guard chain; JWT verification replaced by a header-driven stub.
async function app(env) {
  const inspect = jest.fn(async (userId, orderId) => ({ labOnly: true, userId, orderId: orderId ?? null }));
  const moduleRef = await Test.createTestingModule({
    controllers: [FaceLabController],
    providers: [RolesGuard, { provide: FaceLabInspectorService, useValue: { inspect } }],
  }).overrideGuard(FaceLabDebugGuard).useValue(new FaceLabDebugGuard(env)).overrideGuard(JwtAuthGuard).useValue({ canActivate: ctx => {
    const req = ctx.switchToHttp().getRequest();
    if (!req.headers['x-test-role']) throw new UnauthorizedException();
    req.user = { userId: 'jwt-user', role: req.headers['x-test-role'] };
    return true;
  } }).compile();
  const nest = moduleRef.createNestApplication();
  await nest.init();
  return { nest, inspect };
}

describe('FaceID Lab inspect route', () => {
  let ctx;
  afterEach(async () => { await ctx?.nest.close(); ctx = null; });
  test('production: 404 before authentication, inspector never called', async () => {
    ctx = await app({ FACE_LAB_DEBUG_ENABLED: 'true', NODE_ENV: 'production' });
    await request(ctx.nest.getHttpServer()).get('/workers/me/face/lab/inspect').set('x-test-role', 'WORKER').expect(404);
    expect(ctx.inspect).not.toHaveBeenCalled();
  });
  test('flag absent in development: 404', async () => {
    ctx = await app({ NODE_ENV: 'development' });
    await request(ctx.nest.getHttpServer()).get('/workers/me/face/lab/inspect').expect(404);
  });
  test('enabled: still requires JWT and WORKER role', async () => {
    ctx = await app({ FACE_LAB_DEBUG_ENABLED: 'true', NODE_ENV: 'development' });
    await request(ctx.nest.getHttpServer()).get('/workers/me/face/lab/inspect').expect(401);
    await request(ctx.nest.getHttpServer()).get('/workers/me/face/lab/inspect').set('x-test-role', 'CUSTOMER').expect(403);
    expect(ctx.inspect).not.toHaveBeenCalled();
  });
  test('enabled worker: identity from JWT, workerId query ignored', async () => {
    ctx = await app({ FACE_LAB_DEBUG_ENABLED: 'true', NODE_ENV: 'staging' });
    const r = await request(ctx.nest.getHttpServer()).get('/workers/me/face/lab/inspect?orderId=o1&workerId=victim&userId=victim').set('x-test-role', 'WORKER').expect(200);
    expect(ctx.inspect).toHaveBeenCalledWith('jwt-user', 'o1');
    expect(r.body).toEqual({ success: true, data: { labOnly: true, userId: 'jwt-user', orderId: 'o1' } });
  });
});

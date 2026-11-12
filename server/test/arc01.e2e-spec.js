import { ConfigModule } from '@nestjs/config';
import { AdminModule } from '../src/modules/admin/admin.module';
import { OrderQueueService } from '../src/modules/orders/order-queue.service';
import { AdminController } from '../src/modules/admin/admin.controller';
import { AdminService } from '../src/modules/admin/admin.service';
import { RedisService } from '../src/infrastructure/redis/redis.service';
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { io } from 'socket.io-client';
import { OrdersController } from '../src/modules/orders/orders.controller';
import { OrdersService } from '../src/modules/orders/orders.service';
import { OrdersRepository } from '../src/modules/orders/orders.repository';
import { OrderWorkflowService } from '../src/modules/orders/order-workflow.service';
import { OrderGateway } from '../src/modules/orders/orders.gateway';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { OrderAccessGuard } from '../src/modules/orders/order-access.guard';

// Never fall back to DATABASE_URL or load fixtures into the developer's database.
const url = process.env.ARC01_TEST_DATABASE_URL;
const run = url ? describe : describe.skip;
run(
  'ARC-01 real PostgreSQL + HTTP + Socket.IO (Redis pubsub not exercised)',
  () => {
    let db, app, gateway, workflow, category, customer, stranger, w1, w2, admin;
    const orders = [],
      users = [],
      sockets = [];
    const jwt = new JwtService({
      secret: process.env.JWT_SECRET || 'super-secret',
    });
    const token = (user) =>
      jwt.sign({ sub: user.id, role: user.role }, { expiresIn: '5m' });
    const call = (user, path, body = {}, method = 'patch') =>
      request(app.getHttpServer())
        [method](path)
        .set('Authorization', `Bearer ${token(user)}`)
        .send(body);
    const makeOrder = async (
      status = 'MATCHED',
      workerId = w1.workerProfile.id,
    ) => {
      const row = await db.order.create({
        data: {
          customerId: customer.id,
          categoryId: category.id,
          workerId,
          status,
          addressText: 'ARC01 test fixture',
          lat: 10.8,
          lng: 106.7,
          estimatedPrice: 100000,
        },
      });
      orders.push(row.id);
      return row;
    };
    const connect = async (user) => {
      const address = app.getHttpServer().address();
      const socket = io(`http://127.0.0.1:${address.port}/orders`, {
        transports: ['websocket'],
        auth: { token: token(user) },
        reconnection: false,
      });
      sockets.push(socket);
      await new Promise((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('connect_error', reject);
      });
      return socket;
    };
    const join = (socket, id) =>
      new Promise((resolve) =>
        socket.emit('order:join', { orderId: id }, resolve),
      );
    beforeAll(async () => {
      const parsed = new URL(url);
      if (
        !['localhost', '127.0.0.1'].includes(parsed.hostname) ||
        !parsed.pathname.endsWith('_test')
      ) {
        throw new Error(
          'ARC01_TEST_DATABASE_URL must name a local isolated *_test database',
        );
      }
      db = new PrismaClient({ datasources: { db: { url } } });
      const module = await Test.createTestingModule({
        imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
        controllers: [OrdersController, AdminController],
        providers: [
          JwtStrategy,
          OrderAccessGuard,
          OrderGateway,
          {
            provide: AdminService,
            inject: [OrderWorkflowService],
            useFactory: (flow) => new AdminService(db, {}, flow),
          },
          { provide: PrismaService, useValue: db },
          { provide: RedisService, useValue: {} },
          {
            provide: OrderWorkflowService,
            inject: [OrderGateway],
            useFactory: (gw) => new OrderWorkflowService(db, gw),
          },
          {
            provide: OrdersService,
            inject: [OrderWorkflowService, OrderGateway],
            useFactory: (flow, gw) =>
              new OrdersService(
                new OrdersRepository(db, flow),
                flow,
                {},
                db,
                gw,
                {},
                {},
                {},
              ),
          },
        ],
      }).compile();
      gateway = module.get(OrderGateway);
      workflow = module.get(OrderWorkflowService);
      app = module.createNestApplication({ logger: false });
      app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
      );
      await app.listen(0, '127.0.0.1');
      category = await db.serviceCategory.create({
        data: { name: 'ARC01 isolated fixture' },
      });
      const createUser = async (role) => {
        const user = await db.user.create({
          data: {
            role,
            ...(role === 'WORKER'
              ? {
                  workerProfile: {
                    create: {
                      isOnline: true,
                      approvalStatus: 'APPROVED',
                      faceVerifiedAt: new Date(),
                    },
                  },
                }
              : {}),
          },
          include: { workerProfile: true },
        });
        users.push(user.id);
        return user;
      };
      customer = await createUser('CUSTOMER');
      stranger = await createUser('CUSTOMER');
      w1 = await createUser('WORKER');
      w2 = await createUser('WORKER');
      admin = await createUser('ADMIN');
    }, 20000);
    afterAll(async () => {
      sockets.forEach((socket) => socket.disconnect());
      if (app) await app.close();
      if (db) {
        await db.order.deleteMany({ where: { id: { in: orders } } });
        await db.user.deleteMany({ where: { id: { in: users } } });
        if (category)
          await db.serviceCategory.delete({ where: { id: category.id } });
        await db.$disconnect();
      }
    });
    it('valid legacy alias persists canonical travel state and history', async () => {
      const order = await makeOrder('ASSIGNED');
      const response = await call(w1, `/orders/${order.id}/status`, {
        status: 'WORKER_ARRIVING',
      });
      expect(response.status).toBe(200);
      expect(response.body.order.status).toBe('WORKER_EN_ROUTE');
      expect(
        (await db.order.findUnique({ where: { id: order.id } })).status,
      ).toBe('WORKER_EN_ROUTE');
      expect(
        await db.orderStatusHistory.count({ where: { orderId: order.id } }),
      ).toBe(1);
    });
    it('rejects invalid transition, wrong worker, foreign customer, wrong role and unauthenticated request', async () => {
      const order = await makeOrder();
      expect((await call(w1, `/orders/${order.id}/finish`)).status).toBe(409);
      expect((await call(w2, `/orders/${order.id}/arriving`)).status).toBe(403);
      expect(
        (
          await call(
            stranger,
            `/orders/${order.id}/accept-completion`,
            {},
            'post',
          )
        ).status,
      ).toBe(403);
      expect(
        (await call(customer, `/orders/${order.id}/arriving`)).status,
      ).toBe(403);
      expect(
        (
          await request(app.getHttpServer()).patch(
            `/orders/${order.id}/arriving`,
          )
        ).status,
      ).toBe(401);
      expect(
        await db.orderStatusHistory.count({ where: { orderId: order.id } }),
      ).toBe(0);
    });
    it('two real concurrent HTTP accepts have exactly one winner', async () => {
      // Previous fixtures are terminal so both workers are eligible for this isolated race.
      await db.order.updateMany({
        where: { id: { in: orders } },
        data: { status: 'CANCELLED' },
      });
      const order = await makeOrder('SEARCHING_WORKER', null);
      const responses = await Promise.all(
        [w1, w2].map((user) =>
          call(user, `/orders/${order.id}/accept`, {}, 'post'),
        ),
      );
      expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(
        await db.orderStatusHistory.count({
          where: { orderId: order.id, status: 'MATCHED' },
        }),
      ).toBe(1);
    });
    it('concurrent duplicate mutations create one history row and one socket event only after commit', async () => {
      const order = await makeOrder();
      const socket = await connect(customer);
      expect((await join(socket, order.id)).status).toBe('joined');
      const packets = [];
      socket.on('order:status_changed', (packet) => packets.push(packet));
      const responses = await Promise.all(
        [1, 2].map(() => call(w1, `/orders/${order.id}/arriving`)),
      );
      expect(responses.map((r) => r.status)).toEqual([200, 200]);
      expect(responses.map((r) => r.body.changed).sort()).toEqual([
        false,
        true,
      ]);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(packets).toHaveLength(1);
      expect(packets[0].status).toBe('WORKER_EN_ROUTE');
      expect(
        (await db.order.findUnique({ where: { id: order.id } })).status,
      ).toBe(packets[0].status);
      expect(
        await db.orderStatusHistory.count({ where: { orderId: order.id } }),
      ).toBe(1);
      await call(w1, `/orders/${order.id}/finish`);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(packets).toHaveLength(1);
    });
    it('competing arrive/finish requests cannot skip start or evidence', async () => {
      const order = await makeOrder('WORKER_EN_ROUTE');
      const responses = await Promise.all([
        call(w1, `/orders/${order.id}/arrived`),
        call(w1, `/orders/${order.id}/finish`),
      ]);
      expect(responses.map((r) => r.status)).toEqual([200, 409]);
      expect(
        (await db.order.findUnique({ where: { id: order.id } })).status,
      ).toBe('ARRIVED');
    });
    it('BEFORE, pending quote, AFTER and settlement are server preconditions', async () => {
      const order = await makeOrder('ARRIVED');
      expect((await call(w1, `/orders/${order.id}/start`)).status).toBe(400);
      await db.orderStatusHistory.create({
        data: { orderId: order.id, status: 'ARRIVED' },
      });
      expect(
        (
          await call(
            w1,
            `/orders/${order.id}/images`,
            { type: 'BEFORE', url: 'https://example.test/before.jpg' },
            'post',
          )
        ).status,
      ).toBe(201);
      await db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'ARRIVED',
          note: '[YÊU CẦU ĐIỀU CHỈNH GIÁ] test pending',
        },
      });
      expect((await call(w1, `/orders/${order.id}/start`)).body.message).toBe(
        'QUOTE_NOT_APPROVED',
      );
      await db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'ARRIVED',
          note: '[ĐÃ DUYỆT ĐIỀU CHỈNH GIÁ] test approved',
        },
      });
      expect((await call(w1, `/orders/${order.id}/start`)).status).toBe(200);
      expect((await call(w1, `/orders/${order.id}/finish`)).body.message).toBe(
        'MISSING_AFTER_PHOTO',
      );
      await call(
        w1,
        `/orders/${order.id}/images`,
        { type: 'AFTER', url: 'https://example.test/after.jpg' },
        'post',
      );
      expect((await call(w1, `/orders/${order.id}/finish`)).status).toBe(200);
      expect(
        (
          await call(
            customer,
            `/orders/${order.id}/accept-completion`,
            {},
            'post',
          )
        ).body.order.status,
      ).toBe('AWAITING_PAYMENT');
      expect(
        (await call(customer, `/orders/${order.id}/pay`, {}, 'post')).body
          .message,
      ).toBe('PAYMENT_NOT_SETTLED');
      await expect(
        workflow.transition(order.id, admin.id, 'COMPLETED'),
      ).rejects.toThrow('PAYMENT_NOT_SETTLED');
      expect(
        (await db.order.findUnique({ where: { id: order.id } })).completedAt,
      ).toBeNull();
    });
    it('socket rejects cross-owner order room and forged profile identity', async () => {
      const order = await makeOrder();
      const socket = await connect(stranger);
      const failure = new Promise((resolve) =>
        socket.once('exception', resolve),
      );
      socket.emit('order:join', { orderId: order.id });
      expect((await failure).message).toBe('ORDER_ACCESS_DENIED');
      const ack = await new Promise((resolve) =>
        socket.emit(
          'join_room',
          { role: 'ADMIN', profileId: w1.workerProfile.id },
          resolve,
        ),
      );
      expect(ack.status).toBe('joined');
      const serverSocket = gateway.server.sockets.get(socket.id);
      expect(serverSocket.rooms.has(`worker:${w1.workerProfile.id}`)).toBe(
        false,
      );
      expect(serverSocket.rooms.has('admin_orders_room')).toBe(false);
    });
    it('refresh JWT and socket without token are rejected', async () => {
      const refresh = jwt.sign({
        sub: customer.id,
        role: 'CUSTOMER',
        type: 'refresh',
      });
      expect(
        (
          await request(app.getHttpServer())
            .get('/orders')
            .set('Authorization', `Bearer ${refresh}`)
        ).status,
      ).toBe(401);
      const address = app.getHttpServer().address();
      const socket = io(`http://127.0.0.1:${address.port}/orders`, {
        transports: ['websocket'],
        reconnection: false,
      });
      sockets.push(socket);
      expect(
        (await new Promise((resolve) => socket.once('connect_error', resolve)))
          .message,
      ).toBe('UNAUTHORIZED');
    });
    it('Admin REST uses the same FSM; generic status cannot fake acceptance or settlement', async () => {
      const order = await makeOrder();
      expect(
        (
          await call(w1, `/admin/orders/${order.id}/status`, {
            status: 'ARRIVED',
          })
        ).status,
      ).toBe(403);
      expect(
        (
          await call(admin, `/admin/orders/${order.id}/status`, {
            status: 'COMPLETED',
          })
        ).status,
      ).toBe(400);
      expect(
        (
          await call(admin, `/admin/orders/${order.id}/status`, {
            status: 'AWAITING_PAYMENT',
          })
        ).status,
      ).toBe(403);
      expect(
        (
          await call(admin, `/admin/orders/${order.id}/status`, {
            status: 'WORKER_ARRIVING',
          })
        ).body.order.status,
      ).toBe('WORKER_EN_ROUTE');
      expect(
        (
          await call(admin, `/admin/orders/${order.id}/status`, {
            status: 'NOT_A_STATE',
          })
        ).status,
      ).toBe(400);
      const socket = await connect(admin);
      const ack = await new Promise((resolve) =>
        socket.emit('admin:join', {}, resolve),
      );
      expect(ack.status).toBe('joined');
      expect(
        gateway.server.sockets.get(socket.id).rooms.has('admin_orders_room'),
      ).toBe(true);
    });
    it('a rolled-back PostgreSQL transaction sends no event or history', async () => {
      const order = await makeOrder();
      const socket = await connect(customer);
      await join(socket, order.id);
      const packets = [];
      socket.on('order:status_changed', (packet) => packets.push(packet));
      await db.$executeRawUnsafe(`CREATE FUNCTION arc01_reject_history() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.note = 'ARC01_FORCE_ROLLBACK' THEN RAISE EXCEPTION 'ARC01 test rollback'; END IF; RETURN NEW; END; $$`);
      await db.$executeRawUnsafe(
        `CREATE TRIGGER arc01_history_failure BEFORE INSERT ON order_status_histories FOR EACH ROW EXECUTE FUNCTION arc01_reject_history()`,
      );
      try {
        expect(
          (
            await call(w1, `/orders/${order.id}/status`, {
              status: 'WORKER_EN_ROUTE',
              note: 'ARC01_FORCE_ROLLBACK',
            })
          ).status,
        ).toBe(500);
        expect(
          (await db.order.findUnique({ where: { id: order.id } })).status,
        ).toBe('MATCHED');
        expect(
          await db.orderStatusHistory.count({ where: { orderId: order.id } }),
        ).toBe(0);
        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(packets).toHaveLength(0);
      } finally {
        await db.$executeRawUnsafe(
          'DROP TRIGGER arc01_history_failure ON order_status_histories',
        );
        await db.$executeRawUnsafe('DROP FUNCTION arc01_reject_history()');
      }
    });
    it('only existing matching payment and payout permit completion; duplicate does not write again', async () => {
      const order = await makeOrder('AWAITING_PAYMENT');
      const wallet = await db.workerWallet.upsert({
        where: { workerId: w1.workerProfile.id },
        create: { workerId: w1.workerProfile.id },
        update: {},
      });
      // Explicit test fixtures, not a simulated provider integration or production payout.
      await db.payment.create({
        data: {
          orderId: order.id,
          amount: 100000,
          workerPayoutAmount: 85000,
          commissionAmount: 15000,
          status: 'PAID',
          paidAt: new Date(),
        },
      });
      await db.walletTransaction.create({
        data: {
          walletId: wallet.id,
          orderId: order.id,
          amount: 85000,
          type: 'PAYOUT',
        },
      });
      const responses = await Promise.all(
        [1, 2].map(() => call(customer, `/orders/${order.id}/pay`, {}, 'post')),
      );
      expect(responses.map((r) => r.status)).toEqual([201, 201]);
      expect(responses.map((r) => r.body.changed).sort()).toEqual([
        false,
        true,
      ]);
      expect(
        await db.orderStatusHistory.count({
          where: { orderId: order.id, status: 'COMPLETED' },
        }),
      ).toBe(1);
      expect(
        await db.walletTransaction.count({ where: { orderId: order.id } }),
      ).toBe(1);
    });
    it('one worker cannot accept two orders concurrently', async () => {
      await db.order.updateMany({
        where: { id: { in: orders } },
        data: { status: 'CANCELLED' },
      });
      const a = await makeOrder('SEARCHING_WORKER', null);
      const b = await makeOrder('SEARCHING_WORKER', null);
      const responses = await Promise.all(
        [a, b].map((order) =>
          call(w1, `/orders/${order.id}/accept`, {}, 'post'),
        ),
      );
      expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(
        await db.order.count({
          where: { id: { in: [a.id, b.id] }, workerId: w1.workerProfile.id },
        }),
      ).toBe(1);
    });
    it('current/detail reload return persisted canonical states and reject outsider reads/writes', async () => {
      const order = await makeOrder('AWAITING_PAYMENT');
      expect(
        (await call(w1, `/orders/${order.id}`, {}, 'get')).body.status,
      ).toBe('AWAITING_PAYMENT');
      const current = await call(w1, '/orders/worker/current', {}, 'get');
      expect(current.status).toBe(200);
      expect(current.body.id).toBe(order.id);
      expect(
        (await call(stranger, `/orders/${order.id}`, {}, 'get')).status,
      ).toBe(403);
      expect(
        (
          await call(
            stranger,
            `/orders/${order.id}/images`,
            { type: 'ISSUE', url: 'https://example.test/x' },
            'post',
          )
        ).status,
      ).toBe(403);
      expect(
        (
          await call(stranger, `/orders/${order.id}/schedule`, {
            scheduledAt: new Date(Date.now() + 60000).toISOString(),
          })
        ).status,
      ).toBe(403);
    });

    it('Admin/Orders module graph resolves shared workflow dependencies without starting external workers', async () => {
      const graph = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
          AdminModule,
        ],
      })
        .overrideProvider(PrismaService)
        .useValue(db)
        .overrideProvider(RedisService)
        .useValue({})
        .overrideProvider(OrderQueueService)
        .useValue({})
        .compile();
      expect(graph.get(OrderWorkflowService)).toBeDefined();
      expect(graph.get(AdminService)).toBeDefined();
      await graph.close();
    });

    it('socket GPS derives the assigned profile instead of trusting workerId', async () => {
      const order = await makeOrder('WORKER_EN_ROUTE');
      const socket = await connect(w1);
      const ack = await new Promise((resolve) =>
        socket.emit(
          'worker:update_location',
          {
            orderId: order.id,
            lat: 10.8,
            lng: 106.7,
            workerId: w2.workerProfile.id,
          },
          resolve,
        ),
      );
      expect(ack.status).toBe('ok');
      expect(
        (
          await db.workerProfile.findUnique({
            where: { id: w1.workerProfile.id },
          })
        ).currentLat,
      ).toBe(10.8);
      expect(
        (
          await db.workerProfile.findUnique({
            where: { id: w2.workerProfile.id },
          })
        ).currentLat,
      ).toBeNull();
      const outsider = await connect(stranger);
      const failure = new Promise((resolve) =>
        outsider.once('exception', resolve),
      );
      outsider.emit('worker:update_location', {
        orderId: order.id,
        lat: 0,
        lng: 0,
        workerId: w1.workerProfile.id,
      });
      expect((await failure).message).toBe('ORDER_ACCESS_DENIED');
    });
    it('a stale or forged role claim cannot authorize the Admin order endpoint', async () => {
      const order = await makeOrder();
      const wrongRole = jwt.sign(
        { sub: customer.id, role: 'ADMIN' },
        { expiresIn: '5m' },
      );
      const response = await request(app.getHttpServer())
        .patch(`/admin/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${wrongRole}`)
        .send({ status: 'WORKER_EN_ROUTE' });
      expect(response.status).toBe(403);
      expect(
        (await db.order.findUnique({ where: { id: order.id } })).status,
      ).toBe('MATCHED');
    });
    it('dispute evidence and history are persisted once with the state change', async () => {
      const order = await makeOrder('AWAITING_ACCEPTANCE');
      const body = { reason: 'ARC01 customer evidence', evidenceImages: ['https://example.test/evidence.jpg'] };
      const first = await call(customer, `/orders/${order.id}/dispute`, body, 'post');
      const second = await call(customer, `/orders/${order.id}/dispute`, body, 'post');
      expect(first.body.order.status).toBe('DISPUTED');
      expect(second.body.changed).toBe(false);
      expect(await db.orderStatusHistory.count({ where: { orderId: order.id } })).toBe(1);
      expect(await db.orderImage.count({ where: { orderId: order.id } })).toBe(1);
    });

  },
);

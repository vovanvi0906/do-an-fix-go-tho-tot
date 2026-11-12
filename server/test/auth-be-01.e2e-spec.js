import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import request from 'supertest';
import { createHash } from 'crypto';
import { AuthService } from '../src/modules/auth/auth.service';
import { AuthController } from '../src/modules/auth/auth.controller';
import { OtpController } from '../src/modules/auth/otp.controller';
import { OtpService } from '../src/modules/auth/otp.service';
import { RegistrationProofService } from '../src/modules/auth/registration-proof.service';
import { EsmsService } from '../src/modules/auth/esms.service';
import { EmailService } from '../src/modules/auth/email.service';
import { UsersService } from '../src/modules/users/users.service';
import { UsersRepository } from '../src/modules/users/users.repository';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { RedisService } from '../src/infrastructure/redis/redis.service';
import { AdminGateway } from '../src/modules/admin/admin.gateway';
import * as firebase from '../src/config/firebase.config';

jest.mock('../src/config/firebase.config', () => ({
  getFirebaseAuth: jest.fn(),
  getFirebaseAdmin: jest.fn(),
}));

// Explicit isolated endpoints only. Missing configuration fails instead of silently skipping.
const databaseUrl = process.env.AUTH_BE_01_TEST_DATABASE_URL;
const redisUrl = process.env.AUTH_BE_01_TEST_REDIS_URL;
const hash = (token) => createHash('sha256').update(token).digest('hex');

describe('AUTH-BE-01 HTTP + real PostgreSQL + real Redis', () => {
  let db, redis, app, otp, proofs, auth, sms;
  let sequence = Math.floor(Math.random() * 10000000);
  const phone = () => `09${String(++sequence).padStart(8, '0')}`;
  const email = () => `auth-be-01-${++sequence}@example.test`;
  const payload = (number, registrationProof) => ({
    phone: number,
    registrationProof,
    email: email(),
    password: 'Test-password-123',
    fullName: 'Test Customer',
  });
  const post = (path, body) =>
    request(app.getHttpServer()).post(`/api/auth/${path}`).send(body);
  const issue = async (number, purpose = '') => {
    await post('send-phone-otp', { phone: number }).expect(201);
    const code = sms.sendOtpSms.mock.calls.at(-1)[1];
    const response = await post(`verify-phone-otp${purpose}`, {
      phone: number,
      code,
    }).expect(201);
    return response.body;
  };

  beforeAll(async () => {
    if (
      !databaseUrl ||
      !redisUrl ||
      !new URL(databaseUrl).pathname.includes('auth_be_01_test')
    ) {
      throw new Error(
        'Set AUTH_BE_01_TEST_DATABASE_URL (dedicated auth_be_01_test DB) and AUTH_BE_01_TEST_REDIS_URL',
      );
    }
    process.env.OTP_HASH_SECRET = 'auth-be-01-test-secret-32-characters-only';
    db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    redis = new Redis(redisUrl);
    sms = new EsmsService();
    jest.spyOn(sms, 'sendOtpSms').mockResolvedValue({ success: true });
    const module = await Test.createTestingModule({
      controllers: [AuthController, OtpController],
      providers: [
        AuthService,
        OtpService,
        RegistrationProofService,
        UsersService,
        UsersRepository,
        { provide: PrismaService, useValue: db },
        { provide: RedisService, useValue: { getClient: () => redis } },
        { provide: EsmsService, useValue: sms },
        { provide: EmailService, useValue: { sendOtpEmail: jest.fn() } },
        {
          provide: JwtService,
          useValue: new JwtService({
            secret: 'auth-be-01-jwt-secret-for-tests-only',
          }),
        },
        {
          provide: AdminGateway,
          useValue: { emitWorkerRegistered: jest.fn() },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    otp = module.get(OtpService);
    proofs = module.get(RegistrationProofService);
    auth = module.get(AuthService);
  });

  afterAll(async () => {
    if (db) {
      await db.user.deleteMany({
        where: { email: { startsWith: 'auth-be-01-' } },
      });
      await db.registrationProof.deleteMany({
        where: { phone: { startsWith: '0900' } },
      });
    }
    if (app) await app.close();
    if (redis) await redis.quit();
    if (db) await db.$disconnect();
  });

  test('valid OTP issues short-lived opaque proof, hashed at rest; registration succeeds', async () => {
    const number = phone();
    const verified = await issue(number);
    expect(verified).toMatchObject({
      verified: true,
      registrationProofExpiresIn: 300,
    });
    expect(verified.registrationProof).toMatch(/^[a-f0-9]{64}$/);
    const stored = await db.registrationProof.findUnique({
      where: { tokenHash: hash(verified.registrationProof) },
    });
    expect(stored).toMatchObject({
      phone: number,
      purpose: 'customer-registration',
      consumedAt: null,
    });
    const res = await post(
      'register/customer',
      payload(number, verified.registrationProof),
    ).expect(201);
    expect(res.body.user).toMatchObject({ role: 'CUSTOMER', phone: number });
    expect(res.body.user.customerProfile).toBeTruthy();
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(
      (
        await db.registrationProof.findUnique({
          where: { tokenHash: stored.tokenHash },
        })
      ).consumedAt,
    ).toBeTruthy();
  });

  test.each(['register/customer', 'register'])(
    '%s refuses missing or forged proof',
    async (route) => {
      const number = phone();
      for (const proof of [undefined, 'forged', 'a'.repeat(64)]) {
        const res = await post(route, payload(number, proof)).expect(400);
        expect(res.body.code).toBe('REGISTRATION_PROOF_INVALID');
      }
      expect(await db.user.count({ where: { phone: number } })).toBe(0);
    },
  );

  test.each(['expired', 'wrong-phone', 'wrong-purpose', 'used'])(
    'rejects %s proof without creating Customer',
    async (scenario) => {
      const number = phone();
      const { registrationProof } = await issue(number);
      const where = { tokenHash: hash(registrationProof) };
      if (scenario === 'expired')
        await db.registrationProof.update({
          where,
          data: { expiresAt: new Date(Date.now() - 1000) },
        });
      if (scenario === 'wrong-purpose')
        await db.registrationProof.update({
          where,
          data: { purpose: 'reset-password' },
        });
      if (scenario === 'used') {
        await post(
          'register/customer',
          payload(number, registrationProof),
        ).expect(201);
        // Replay is still denied after the account's phone changes.
        await db.user.update({
          where: { phone: number },
          data: { phone: phone() },
        });
      }
      const target = scenario === 'wrong-phone' ? phone() : number;
      const res = await post(
        'register/customer',
        payload(target, registrationProof),
      ).expect(400);
      expect(res.body.code).toBe('REGISTRATION_PROOF_INVALID');
      expect(await db.user.count({ where: { phone: target } })).toBe(0);
    },
  );

  test('generic register dispatch also requires and consumes valid proof', async () => {
    const number = phone();
    const { registrationProof } = await issue(number);
    await post('register', payload(number, registrationProof)).expect(201);
  });

  test('two simultaneous HTTP registrations using same proof: exactly one commit', async () => {
    const number = phone();
    const { registrationProof } = await issue(number);
    const results = await Promise.all([
      post('register/customer', payload(number, registrationProof)),
      post('register', payload(number, registrationProof)),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 400]);
    expect(await db.user.count({ where: { phone: number } })).toBe(1);
    expect(
      await db.customerProfile.count({ where: { user: { phone: number } } }),
    ).toBe(1);
  });

  test('row lock serializes contenders at the database, expiry uses database clock after waiting', async () => {
    const number = phone();
    const { registrationProof } = await issue(number);
    const tokenHash = hash(registrationProof);
    await db.registrationProof.update({
      where: { tokenHash },
      data: { expiresAt: new Date(Date.now() + 500) },
    });
    let locked;
    const ready = new Promise((resolve) => {
      locked = resolve;
    });
    const blocker = db.$transaction(async (tx) => {
      await tx.$executeRaw`UPDATE registration_proofs SET "phone" = ${number} WHERE "tokenHash" = ${tokenHash}`;
      locked();
      await tx.$executeRaw`SELECT pg_sleep(0.8)`;
    });
    await ready;
    await expect(
      proofs.createCustomer(
        { email: email(), phone: number, customerProfile: { create: {} } },
        registrationProof,
      ),
    ).rejects.toMatchObject({ status: 400 });
    await blocker;
    expect(await db.user.count({ where: { phone: number } })).toBe(0);
  });

  test('two DB consumers blocked on the same row commit exactly one Customer', async () => {
    const number = phone();
    const { registrationProof } = await issue(number);
    const tokenHash = hash(registrationProof);
    let locked, release;
    const ready = new Promise((resolve) => {
      locked = resolve;
    });
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const blocker = db.$transaction(async (tx) => {
      await tx.$executeRaw`UPDATE registration_proofs SET "phone" = ${number} WHERE "tokenHash" = ${tokenHash}`;
      locked();
      await gate;
    });
    await ready;
    const outcomes = Promise.allSettled(
      Array.from({ length: 2 }, () =>
        proofs.createCustomer(
          {
            email: email(),
            phone: number,
            customerProfile: { create: {} },
          },
          registrationProof,
        ),
      ),
    );
    try {
      // Wait until both real PostgreSQL sessions are blocked on the held lock.
      let waiting = 0;
      for (let i = 0; i < 100; i++) {
        const rows =
          await db.$queryRaw`SELECT count(*)::int AS count FROM pg_stat_activity
          WHERE datname = current_database() AND wait_event_type = 'Lock'
            AND query LIKE '%registration_proofs%'`;
        waiting = rows[0].count;
        if (waiting >= 2) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(waiting).toBeGreaterThanOrEqual(2);
    } finally {
      release();
      await blocker;
    }
    const results = await outcomes;
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect(await db.user.count({ where: { phone: number } })).toBe(1);
  });

  test('DTO validation rejects invalid email/password without consuming proof', async () => {
    const number = phone();
    const { registrationProof } = await issue(number);
    for (const invalid of [
      { email: 'bad' },
      { password: '123' },
      { password: null },
    ]) {
      await post('register/customer', {
        ...payload(number, registrationProof),
        ...invalid,
      }).expect(400);
    }
    expect(
      (
        await db.registrationProof.findUnique({
          where: { tokenHash: hash(registrationProof) },
        })
      ).consumedAt,
    ).toBeNull();
    await post('register/customer', payload(number, registrationProof)).expect(
      201,
    );
  });

  test('DB creation failure rolls back consumption; proof remains usable', async () => {
    const number = phone();
    const { registrationProof } = await issue(number);
    const existing = await db.user.create({
      data: { email: email(), role: 'WORKER' },
    });
    const body = {
      ...payload(number, registrationProof),
      email: existing.email,
    };
    await post('register/customer', body).expect(400);
    expect(
      (
        await db.registrationProof.findUnique({
          where: { tokenHash: hash(registrationProof) },
        })
      ).consumedAt,
    ).toBeNull();
    await post('register/customer', payload(number, registrationProof)).expect(
      201,
    );
  });

  test('wrong OTP, five-attempt lockout, correct OTP after lockout rejected', async () => {
    const number = phone();
    await post('send-phone-otp', { phone: number }).expect(201);
    const code = sms.sendOtpSms.mock.calls.at(-1)[1];
    expect(await redis.get(`otp:phone:${number}`)).not.toBe(code);
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++)
      await post('verify-phone-otp', { phone: number, code: wrong }).expect(
        400,
      );
    await post('verify-phone-otp', { phone: number, code }).expect(400);
    expect(await db.registrationProof.count({ where: { phone: number } })).toBe(
      0,
    );
  });

  test('concurrent OTP verification issues only one proof', async () => {
    const number = phone();
    await post('send-phone-otp', { phone: number }).expect(201);
    const code = sms.sendOtpSms.mock.calls.at(-1)[1];
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        post('verify-phone-otp', { phone: number, code }),
      ),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(results.filter((r) => r.status === 400)).toHaveLength(4);
    expect(await db.registrationProof.count({ where: { phone: number } })).toBe(
      1,
    );
  });

  test('concurrent send requests honor cooldown; expired OTP rejected', async () => {
    const number = phone();
    const results = await Promise.all([
      post('send-phone-otp', { phone: number }),
      post('send-phone-otp', { phone: number }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 400]);
    const code = sms.sendOtpSms.mock.calls.at(-1)[1];
    await redis.pexpire(`otp:phone:${number}`, 1);
    await new Promise((resolve) => setTimeout(resolve, 10));
    await post('verify-phone-otp', { phone: number, code }).expect(400);
  });

  test('reset-password purpose returns resetToken only; cannot register with it', async () => {
    const number = phone();
    const verified = await issue(number, '?purpose=reset-password');
    expect(verified.resetToken).toBeTruthy();
    expect(verified.registrationProof).toBeUndefined();
    await post(
      'register/customer',
      payload(number, verified.resetToken),
    ).expect(400);
    expect(await otp.validateResetToken(verified.resetToken)).toBe(number);
  });

  test('unknown purpose rejected without consuming OTP', async () => {
    const number = phone();
    await post('send-phone-otp', { phone: number }).expect(201);
    const code = sms.sendOtpSms.mock.calls.at(-1)[1];
    await post('verify-phone-otp?purpose=other', {
      phone: number,
      code,
    }).expect(400);
    await post('verify-phone-otp', { phone: number, code }).expect(201);
  });

  test('normalized phone is bound to proof and persisted canonically', async () => {
    const number = phone();
    const { registrationProof } = await issue(`84${number.slice(1)}`);
    const response = await post(
      'register/customer',
      payload(number, registrationProof),
    ).expect(201);
    expect(response.body.user.phone).toBe(number);
  });

  test.each(['register/worker', 'register'])(
    'Worker registration/login regression via %s',
    async (route) => {
      const body = {
        ...payload(phone()),
        role: 'WORKER',
        cccdNumber: '012345678901',
        skills: ['repair'],
      };
      const created = await post(route, body).expect(201);
      expect(created.body.user.role).toBe('WORKER');
      expect(created.body.user.workerProfile.approvalStatus).toBe('DRAFT');
      expect(created.body.user.customerProfile).toBeNull();
      const login = await post('login', {
        email: body.email,
        password: body.password,
      }).expect(201);
      expect(login.body.user.role).toBe('WORKER');
      expect(login.body.accessToken).toBeTruthy();
      await post('login', { phone: body.phone, password: 'wrong' }).expect(401);
    },
  );

  test.each(['google-login', 'firebase-google-login'])(
    '%s cannot create Customer without proof; existing Worker login remains supported',
    async (route) => {
      // Only provider identity verification is stubbed. HTTP/auth/persistence are real.
      const identity = {
        email: email(),
        sub: `google-${++sequence}`,
        uid: `firebase-${sequence}`,
        name: 'Test',
      };
      if (route === 'google-login') {
        jest
          .spyOn(auth.googleClient, 'verifyIdToken')
          .mockResolvedValue({ getPayload: () => identity });
      } else {
        jest.spyOn(firebase, 'getFirebaseAuth').mockReturnValue({
          verifyIdToken: jest.fn().mockResolvedValue(identity),
        });
      }
      await post(route, { idToken: 'test-provider-token' }).expect(400);
      expect(await db.user.count({ where: { email: identity.email } })).toBe(0);
      const number = phone();
      const { registrationProof } = await issue(number);
      const created = await post(route, {
        idToken: 'test-provider-token',
        phone: number,
        registrationProof,
      }).expect(201);
      expect(created.body.data.user).toMatchObject({
        role: 'CUSTOMER',
        phone: number,
      });
      await db.user.update({
        where: { email: identity.email },
        data: { role: 'WORKER' },
      });
      const login = await post(route, {
        idToken: 'test-provider-token',
      }).expect(201);
      expect(login.body.data.user.role).toBe('WORKER');
      jest.restoreAllMocks();
      jest.spyOn(sms, 'sendOtpSms').mockResolvedValue({ success: true });
    },
  );
});

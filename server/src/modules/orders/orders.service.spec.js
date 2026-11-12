import { OrdersGateway } from './orders.gateway';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { FastApiAiClient } from '../../infrastructure/external/ai/fastapi-ai.client';
import { OrderQueueService } from './order-queue.service';
import { Test } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrderWorkflowService } from './order-workflow.service';
import { UsersRepository } from '../users/users.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

describe('OrdersService', () => {
  let service;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        ...[OrdersGateway, RedisService, FastApiAiClient, OrderQueueService].map((provide) => ({ provide, useValue: {} })),
        {
          provide: OrdersRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            findByCustomerId: jest.fn(),
            findByWorkerId: jest.fn(),
            findCurrentOrderForWorker: jest.fn(),
          },
        },
        {
          provide: OrderWorkflowService,
          useValue: {
            assignWorker: jest.fn(),
            markWorkerArriving: jest.fn(),
            markArrived: jest.fn(),
            startWork: jest.fn(),
            finishWork: jest.fn(),
            confirmCompletion: jest.fn(),
            markPaidAndComplete: jest.fn(),
            cancel: jest.fn(),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            service: {
              findUnique: jest.fn(),
            },
            address: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

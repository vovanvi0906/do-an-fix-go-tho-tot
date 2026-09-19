import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrderWorkflowService } from './order-workflow.service';
import { OrderGateway, OrdersGateway } from './orders.gateway';
import { OrderQueueService } from './order-queue.service';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { RedisModule } from '../../infrastructure/redis/redis.module';

@Module({
  imports: [PrismaModule, UsersModule, RedisModule, AiModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
    OrderWorkflowService,
    OrderGateway,
    OrdersGateway,
    OrderQueueService,
  ],
  exports: [
    OrdersService,
    OrdersRepository,
    OrderWorkflowService,
    OrderGateway,
    OrdersGateway,
    OrderQueueService,
  ],
})
export class OrdersModule {}

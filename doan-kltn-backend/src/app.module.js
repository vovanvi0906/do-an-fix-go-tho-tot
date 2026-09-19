import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ServicesModule } from './modules/services/services.module';
import { AdminModule } from './modules/admin/admin.module';
import { WorkersModule } from './modules/workers/workers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CustomerHomeModule } from './modules/customer-home/customer-home.module';
import { AiModule } from './modules/ai/ai.module';
import { LogsModule } from './modules/logs/logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    PrismaModule,
    RedisModule,
    UsersModule,
    AuthModule,
    CustomersModule,
    CustomerHomeModule,
    ServicesModule,
    AdminModule,
    WorkersModule,
    OrdersModule,
    AiModule,
    LogsModule,
  ],
})
export class AppModule {}
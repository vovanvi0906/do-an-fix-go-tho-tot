import { Module } from '@nestjs/common';
import { CustomerHomeController } from './customer-home.controller';
import { CustomerOrdersController } from './customer-orders.controller';
import { CustomerHomeService } from './customer-home.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';

/**
 * CustomerHomeModule
 * Module quản lý các chức năng dữ liệu trang chủ cổng khách hàng (Customer Portal Home).
 */
@Module({
  imports: [PrismaModule],
  controllers: [CustomerHomeController, CustomerOrdersController],
  providers: [CustomerHomeService],
  exports: [CustomerHomeService],
})
export class CustomerHomeModule {}

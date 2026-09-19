import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AdminController } from './admin.controller';
import { DashboardV1Controller } from './dashboard-v1.controller';
import { AdminServicesV1Controller } from './admin-services-v1.controller';
import { AdminCategoriesV1Controller } from './admin-categories-v1.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminController,
    DashboardV1Controller,
    AdminServicesV1Controller,
    AdminCategoriesV1Controller,
  ],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}




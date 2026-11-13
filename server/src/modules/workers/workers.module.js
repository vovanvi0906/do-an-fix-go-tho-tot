import { FaceIdentityService } from './face/face-identity.service';
import { FaceIdentityController } from './face/face-identity.controller';
import { AiModule } from '../ai/ai.module';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AdminModule } from '../admin/admin.module';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';

@Module({
  imports: [PrismaModule, AdminModule, AiModule],
  controllers: [WorkersController, FaceIdentityController],
  providers: [WorkersService, FaceIdentityService],
  exports: [WorkersService],
})
export class WorkersModule {}

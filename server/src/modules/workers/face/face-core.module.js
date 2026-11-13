import { FaceReadyGuard } from './face-ready.guard';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../infrastructure/database/prisma.module';
import { AiModule } from '../../ai/ai.module';
import { FaceCoreService } from './face-core.service';
import { FaceEvidenceGateway } from './face-evidence.gateway';
import { FaceCoreController, FaceReviewController } from './face-core.controller';
@Module({ imports: [PrismaModule, AiModule], controllers: [FaceCoreController, FaceReviewController],
  providers: [FaceCoreService, FaceEvidenceGateway, FaceReadyGuard], exports: [FaceCoreService] })
export class FaceCoreModule {}
